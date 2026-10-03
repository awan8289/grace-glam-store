'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, getDiscountPercent, getVariantImages } from '@/types';
import { formatPrice } from '@/lib/format';
import { useCartStore } from '@/store/useCartStore';
import { useFavoriteStore, formatFavItem } from '@/store/useFavoriteStore';
import { useAuthStore } from '@/store/useAuthStore';
import NecklaceCustomizer from '@/components/product/NecklaceCustomizer';
import { ChevronDown, ShieldCheck, Droplets, Clock, Truck, Upload, Camera, CheckCircle2 } from 'lucide-react';

// Store-wide promises only. Material claims (gold, drills, gift boxes) belong
// in each product's own details, never in a banner shown on every product.
const MARQUEE_FEATURES = [
  { title: 'Free Tracked Delivery', desc: 'Free on every order, Australia-wide — no minimum spend.' },
  { title: '12-Hour Modification Window', desc: 'Check your photo or custom text after ordering.' },
  { title: 'Online Support', desc: '24 hours a day, 7 days a week.' },
  {
    title: 'Secure Online Payment',
    desc: 'Encrypted checkout protects your custom commission.',
  },
  { title: 'Custom Proof Verification', desc: 'Every custom name and photo is checked before production.' },
  { title: 'Bespoke Guidance', desc: 'Questions on sizing or photo resolution? WhatsApp +61 494 794 408.' },
];

const DUPLICATED_MARQUEE = [...MARQUEE_FEATURES, ...MARQUEE_FEATURES];

export default function ProductDetailPage({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const { addItem } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoriteStore();
  const { requireAuth } = useAuthStore();

  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id ?? '');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] ?? 'One Size');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: '50%', y: '50%' });
  const [addedFlash, setAddedFlash] = useState(false);

  // Photo Upload State for Custom Photo Art & Digital Paintings
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const distinctColors = useMemo(
    () => Array.from(new Set(product.variants.map((v) => v.colorName).filter(Boolean))),
    [product.variants]
  );

  const distinctStyles = useMemo(() => {
    const map = new Map<string, (typeof product.variants)[0]>();
    for (const v of product.variants) {
      const key = v.style || v.colorName;
      if (key && !map.has(key)) {
        map.set(key, v);
      }
    }
    return Array.from(map.values());
  }, [product.variants]);

  const isPurelySizeVariants =
    product.variants.length > 0 &&
    product.sizes.length > 0 &&
    (distinctColors.length <= 1 || distinctColors.every((c) => c === 'Standard'));

  const isStyleOrSetProduct =
    product.variants.some(
      (v) =>
        Boolean(v.style) ||
        v.colorName.length > 15 ||
        /style|box|set|necklace|door|kit|pair|tassel|feather|leaf|cross|crown|wings|angel|pendant|bundle/i.test(v.colorName)
    );

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? null;
  const currentPrice = selectedVariant?.price ?? product.price;
  const currentCompareAtPrice = selectedVariant?.compareAtPrice ?? product.compareAtPrice;

  const gallery = useMemo(
    () => getVariantImages(product, selectedVariantId),
    [product, selectedVariantId]
  );

  const image = gallery[Math.min(activeImage, gallery.length - 1)] ?? '/products/placeholder.webp';
  const discount = currentCompareAtPrice
    ? Math.round(((currentCompareAtPrice - currentPrice) / currentCompareAtPrice) * 100)
    : getDiscountPercent(product);

  // Stock reflects the chosen colour when the product has variants.
  const availableStock = selectedVariant ? selectedVariant.stock : product.stock;
  const soldOut = availableStock <= 0;

  const selectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    const v = product.variants.find((item) => item.id === variantId);
    if (v?.size && product.sizes.includes(v.size)) {
      setSelectedSize(v.size);
    }
    setActiveImage(0);
    setShowVideo(false);
  };

  const handleSelectStyle = (styleName: string) => {
    const matching =
      product.variants.find(
        (v) =>
          (v.style === styleName || v.colorName === styleName) &&
          (product.sizes.length > 0 ? v.size === selectedSize : true)
      ) ??
      product.variants.find(
        (v) => v.style === styleName || v.colorName === styleName
      );

    if (matching) {
      setSelectedVariantId(matching.id);
      setActiveImage(0);
      setShowVideo(false);
    }
  };

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    const currentStyle = selectedVariant?.style || selectedVariant?.colorName;
    const matchingVariant =
      product.variants.find(
        (v) =>
          v.size === size &&
          (currentStyle ? (v.style === currentStyle || v.colorName === currentStyle) : true)
      ) ?? product.variants.find((v) => v.size === size);

    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const picked = input.files?.[0];
    // Reset so choosing the same file again still fires onChange.
    input.value = '';
    if (!picked) return;

    if (!picked.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (picked.size > 40 * 1024 * 1024) {
      setPhotoError('That photo is too large. Please choose one under 40MB.');
      return;
    }

    setPhotoError(null);
    setIsUploadingPhoto(true);

    try {
      // Phone photos are often 8-15MB or HEIC. Re-encode anything that is not
      // a small JPG/PNG/WEBP into a JPEG of at most 4000px on the long side —
      // plenty for a canvas print, and it keeps uploads fast on mobile data.
      const file = await preparePhotoForUpload(picked);

      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/api/customer-photo', {
        method: 'POST',
        body: formData,
      });

      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to upload image. Please try again.');
      }
      setUploadedPhotoUrl(data.url);
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : 'Error uploading photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - left) / width) * 100;
    const y = ((event.clientY - top) / height) * 100;
    setZoomPosition({ x: `${x}%`, y: `${y}%` });
  };

  const handleAddToCart = () => {
    if (soldOut) return;
    if (product.requiresPhotoUpload && !uploadedPhotoUrl) {
      setPhotoError('Please upload your photo before adding to cart.');
      return;
    }
    setPhotoError(null);
    addItem(
      product,
      selectedSize,
      selectedVariant?.colorName ?? 'Default',
      Math.min(quantity, availableStock),
      {
        customPrice: currentPrice,
        customImage: uploadedPhotoUrl ?? undefined,
      }
    );
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1600);
  };

  // Only bespoke custom pieces (e.g. laser-cut name necklaces) render the inscription customizer
  const isCustomBespoke =
    product.requiresCustomText === true ||
    (Boolean(product.details) &&
      product.details.some((d) =>
        /custom name|custom text|bespoke engraving|laser-cut typography with hand-polished/i.test(d)
      ) &&
      !product.details.some((d) => /not custom-made|ships as pictured/i.test(d)));

  // Care copy depends on what the product is. Jewellery wording (18K gold,
  // waterproof) must never appear on a canvas or a gift box.
  const productKind: 'art' | 'jewellery' | 'gift' =
    product.requiresPhotoUpload || /photo art|painting|canvas|wall art/i.test(`${product.category} ${product.name}`)
      ? 'art'
      : /necklace|earring|pendant|ring|bracelet|jewel|chain/i.test(`${product.category} ${product.name}`)
        ? 'jewellery'
        : 'gift';

  const [openAccordion, setOpenAccordion] = useState<string | null>('care');
  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white min-h-dvh text-black pt-8 md:pt-28 pb-20 font-sans">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-8 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/shop" className="hover:text-black transition-colors">
            {product.category}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[#d3a95d] font-semibold">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 mb-24">
          {/* ================= Media ================= */}
          <div className="w-full lg:w-1/2">
            <div className="relative bg-gray-50 border border-gray-100 rounded-2xl p-8 flex items-center justify-center overflow-hidden">
              {discount !== null && (
                <span className="absolute top-6 left-6 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-20">
                  -{discount}%
                </span>
              )}

              <button
                type="button"
                onClick={() =>
                  toggleFavorite(
                    formatFavItem({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      image,
                      category: product.category,
                    })
                  )
                }
                className={`absolute top-6 right-6 bg-white shadow-md p-2 rounded-full z-20 transition-colors ${
                  isFavorite(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                }`}
                aria-label={isFavorite(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill={isFavorite(product.id) ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>

              {showVideo && product.video ? (
                <video
                  key={product.video.url}
                  src={product.video.url}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="w-full h-[70vw] max-h-[500px] sm:h-[500px] rounded-lg bg-black object-contain"
                />
              ) : (
                <div
                  className="w-full h-[95vw] max-h-[500px] sm:h-[500px] relative cursor-crosshair overflow-hidden"
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  onMouseMove={handleMouseMove}
                >
                  <Image
                    src={image}
                    alt={`${product.name}${selectedVariant ? ` in ${selectedVariant.colorName}` : ''}`}
                    fill
                    priority
                    quality={90}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain transition-transform duration-200"
                    style={{
                      transform: isZoomed ? 'scale(1.75)' : 'scale(1)',
                      transformOrigin: `${zoomPosition.x} ${zoomPosition.y}`,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Thumbnails + video toggle */}
            {(gallery.length > 1 || product.video) && (
              <div className="mt-4 flex gap-3 flex-wrap">
                {gallery.map((thumb, index) => (
                  <button
                    key={`${thumb}-${index}`}
                    type="button"
                    onClick={() => {
                      setActiveImage(index);
                      setShowVideo(false);
                    }}
                    aria-label={`View image ${index + 1}`}
                    aria-pressed={!showVideo && activeImage === index}
                    className={`relative h-20 w-20 rounded-lg border bg-gray-50 overflow-hidden transition-colors ${
                      !showVideo && activeImage === index
                        ? 'border-[#d3a95d]'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <Image src={thumb} alt="" fill sizes="80px" className="object-contain p-1" />
                  </button>
                ))}

                {product.video && (
                  <button
                    type="button"
                    onClick={() => setShowVideo(true)}
                    aria-pressed={showVideo}
                    className={`h-20 w-20 rounded-lg border flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      showVideo
                        ? 'border-[#d3a95d] text-[#d3a95d] bg-[#fdf8ee]'
                        : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
                      <path d="M6 4.2v11.6L16 10z" />
                    </svg>
                    Video
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ================= Details ================= */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-black mb-2">{product.name}</h1>
            {product.subtitle && <p className="text-gray-500 mb-4">{product.subtitle}</p>}

            <div className="flex items-center gap-4 mb-3">
              <span className="text-3xl text-[#d3a95d] font-bold">{formatPrice(currentPrice)}</span>
              {currentCompareAtPrice ? (
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(currentCompareAtPrice)}
                </span>
              ) : null}
            </div>

            {/* Static Free Tracked Delivery Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free tracked delivery on every order</span>
            </div>

            {/* Subtitle */}
            {product.subtitle && (
              <p className="text-sm font-medium text-gray-700 mb-2">{product.subtitle}</p>
            )}

            {/* Customizer for bespoke custom name commissions OR Dynamic controls for catalog items */}
            {isCustomBespoke ? (
              <div className="mb-8">
                <NecklaceCustomizer product={product} />
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-8 leading-relaxed font-light">{product.description}</p>

                {/* Variant Selector: Style / Set or Colour / Finish */}
                {!isPurelySizeVariants && product.variants.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500">
                        {isStyleOrSetProduct
                          ? (product.name.toLowerCase().includes('rotating') ? 'Colour / Edition Option' : 'Select Style / Option')
                          : 'Finish / Colour'}
                      </span>
                      <span className="text-sm text-black font-semibold">
                        {selectedVariant?.colorName}
                      </span>
                    </div>

                    {isStyleOrSetProduct ? (
                      /* Style / Package / Set Buttons with pricing and optional swatch */
                      <div className="flex flex-wrap gap-2.5">
                        {distinctStyles.map((variant) => {
                          const variantStyleName = variant.style || variant.colorName;
                          const active =
                            (selectedVariant?.style || selectedVariant?.colorName) === variantStyleName;
                          const unavailable = variant.stock <= 0;
                          return (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => handleSelectStyle(variantStyleName)}
                              aria-pressed={active}
                              disabled={unavailable}
                              className={`flex items-center gap-2 border px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                active
                                  ? 'border-black bg-black text-white shadow-sm ring-1 ring-black'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:text-black'
                              } ${unavailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                            >
                              {variant.images?.[0] ? (
                                <img
                                  src={variant.images[0]}
                                  alt={variantStyleName}
                                  className="w-5 h-5 rounded-md object-cover border border-black/10 flex-shrink-0"
                                />
                              ) : variant.hex && !variant.style ? (
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                                  style={{ backgroundColor: variant.hex }}
                                />
                              ) : null}
                              <span>{variantStyleName}</span>
                              {product.sizes.length === 0 && variant.price && variant.price !== product.price && (
                                <span
                                  className={`text-[11px] font-normal ${
                                    active ? 'text-[#d3a95d]' : 'text-gray-500'
                                  }`}
                                >
                                  ({formatPrice(variant.price)})
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* Traditional colour / finish swatches */
                      <div className="flex flex-wrap gap-3">
                        {product.variants.map((variant) => {
                          const active = variant.id === selectedVariantId;
                          const unavailable = variant.stock <= 0;
                          return (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => selectVariant(variant.id)}
                              title={`${variant.colorName}${unavailable ? ' — sold out' : ''}`}
                              aria-label={`${variant.colorName}${unavailable ? ', sold out' : ''}`}
                              aria-pressed={active}
                              className={`relative h-11 w-11 rounded-full border-2 transition-all ${
                                active
                                  ? 'border-[#d3a95d] scale-110 shadow-md'
                                  : 'border-gray-200 hover:border-gray-400'
                              } ${unavailable ? 'opacity-40' : ''}`}
                            >
                              <span
                                className="absolute inset-1 rounded-full"
                                style={{ backgroundColor: variant.hex }}
                              />
                              {unavailable && (
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-red-600">
                                  ✕
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Sizes or A-Z Alphabet Letter Selector */}
                {product.sizes.length > 0 && (
                  <div className="mb-6">
                    {product.sizes.length >= 20 && product.sizes.includes('A') && product.sizes.includes('Z') ? (
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xs uppercase tracking-[0.15em] font-bold text-gray-700">
                            Select Initial Letter
                          </span>
                          <span className="text-xs font-bold text-[#b8860b]">
                            Selected: Letter {selectedSize || 'A'}
                          </span>
                        </div>
                        <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5">
                          {product.sizes.map((letter) => (
                            <button
                              key={letter}
                              type="button"
                              onClick={() => handleSelectSize(letter)}
                              className={`h-9 w-9 text-xs font-bold rounded-lg border transition-all ${
                                selectedSize === letter
                                  ? 'bg-black text-white border-black shadow-sm scale-105'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              {letter}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="block text-xs uppercase tracking-[0.15em] font-bold text-gray-500 mb-3">
                          {product.category.includes('Painting') || product.category.includes('Photo') ? 'Canvas Size' : 'Length / Option'}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {product.sizes.map((size) => {
                            const currentStyle = selectedVariant?.style || selectedVariant?.colorName;
                            const matchingVariant =
                              product.variants.find(
                                (v) =>
                                  v.size === size &&
                                  (currentStyle ? (v.style === currentStyle || v.colorName === currentStyle) : true)
                              ) ?? product.variants.find((v) => v.size === size);
                            const sizePrice = matchingVariant?.price;
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => handleSelectSize(size)}
                                aria-pressed={selectedSize === size}
                                className={`flex items-center gap-2 border px-4 py-3 min-w-11 text-xs font-bold rounded-lg transition-all ${
                                  selectedSize === size
                                    ? 'border-[#d3a95d] bg-black text-white shadow-sm'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-[#d3a95d] hover:text-black'
                                }`}
                              >
                                <span>{size}</span>
                                {sizePrice && (
                                  <span className={selectedSize === size ? 'text-[#d3a95d]' : 'text-gray-400 font-normal'}>
                                    ({formatPrice(sizePrice)})
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Availability */}
                <div className="flex items-center gap-2 mb-6">
                  <span className={`h-2.5 w-2.5 rounded-full ${soldOut ? 'bg-red-500' : 'bg-green-500'}`} />
                  <span className="text-sm font-semibold text-gray-700">
                    {soldOut
                      ? 'Sold out in this style'
                      : availableStock <= product.lowStockThreshold
                        ? `Only ${availableStock} left in stock`
                        : 'In stock, ready to dispatch'}
                  </span>
                </div>

                {/* Custom Photo Upload for Custom Photo Art & Digital Oil Paintings */}
                {product.requiresPhotoUpload && (
                  <div className="mb-6 p-5 border-2 border-dashed border-[#d3a95d]/60 rounded-2xl bg-[#fdfbf7]">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera className="w-5 h-5 text-[#d3a95d]" />
                      <span className="text-xs font-bold text-black uppercase tracking-wider">
                        Upload Your Photo for Custom Painting
                      </span>
                      <span className="text-xs text-red-500 font-semibold">*Required</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Upload the picture you want transformed into a digital oil painting. (High resolution JPG, PNG, WEBP)
                    </p>

                    {uploadedPhotoUrl ? (
                      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                          <Image
                            src={uploadedPhotoUrl}
                            alt="Uploaded Custom Photo"
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-black truncate">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Photo attached successfully
                          </span>
                          <span className="block text-[11px] text-emerald-600 font-medium">
                            Ready for digital oil painting commission
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadedPhotoUrl(null)}
                          className="text-xs text-red-500 hover:text-red-700 underline font-medium px-2 py-1"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label className={`flex flex-col items-center justify-center p-6 border border-gray-200 rounded-xl bg-white cursor-pointer hover:border-[#d3a95d] transition-all group ${isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                          <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#d3a95d] mb-2 transition-colors" />
                          <span className="text-xs font-bold text-gray-700 group-hover:text-black">
                            {isUploadingPhoto ? 'Uploading your photo...' : 'Tap to choose your photo'}
                          </span>
                          <span className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP or HEIC — large photos are resized automatically</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={isUploadingPhoto}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    {photoError && (
                      <p className="text-xs text-red-600 font-medium mt-2">
                        {photoError}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center border border-gray-300 rounded-full w-32 justify-between">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      aria-label="Decrease quantity"
                      className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 hover:text-black text-xl select-none"
                    >
                      −
                    </button>
                    <span className="font-bold text-sm select-none tabular-nums">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(Math.max(availableStock, 1), quantity + 1))}
                      aria-label="Increase quantity"
                      className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 hover:text-black text-xl select-none"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={soldOut}
                    className="flex-1 bg-black text-white font-bold py-4 rounded-full hover:bg-[#d3a95d] hover:text-black transition-colors shadow-lg uppercase text-sm tracking-widest disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    {soldOut ? 'Sold out' : addedFlash ? 'Added ✓' : 'Add to cart'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => requireAuth(handleAddToCart)}
                  disabled={soldOut}
                  className="w-full bg-[#d3a95d] text-black font-bold py-4 rounded-full hover:bg-black hover:text-white transition-colors shadow-md mb-8 uppercase text-sm tracking-widest disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Buy it now
                </button>
              </>
            )}

            {/* Product description for bespoke customizer */}
            {isCustomBespoke && (
              <p className="text-gray-600 mb-6 leading-relaxed font-light text-sm">
                {product.description}
              </p>
            )}

            {/* ================= TRUST ACCORDIONS ================= */}
            <div className="border-t border-gray-200 pt-6 space-y-3 mb-8">
              {/* 1. Care Guide */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-[#fcfbfa]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('care')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-semibold text-black cursor-pointer hover:bg-gray-100/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-[#b8860b]" />
                    {productKind === 'art' ? 'Canvas & Care' : 'Materials & Care'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      openAccordion === 'care' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'care' && (
                  <div className="px-5 pb-5 pt-1 text-xs text-gray-600 leading-relaxed space-y-2 border-t border-gray-100 bg-white">
                    {productKind === 'art' && (
                      <>
                        <p>
                          <strong>What you receive:</strong> your photo reproduced on canvas, shipped rolled in a protective tube. Sizes listed are unframed.
                        </p>
                        <p>
                          <strong>Care:</strong> keep out of direct sunlight and damp rooms; dust gently with a dry, soft cloth. Do not wet or use cleaning sprays.
                        </p>
                      </>
                    )}
                    {productKind === 'jewellery' && (
                      <>
                        <p>
                          <strong>Materials:</strong> as listed in the product details below for this piece and finish.
                        </p>
                        <p>
                          <strong>Care:</strong> take off before swimming, showering or exercise, and keep away from perfume and lotions. Wipe with a soft dry cloth and store in a closed pouch.
                        </p>
                      </>
                    )}
                    {productKind === 'gift' && (
                      <p>
                        <strong>Care:</strong> keep dry and out of direct sunlight. See the product details below for materials.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 2. 100% Free Remake Guarantee */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-[#fcfbfa]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('guarantee')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-semibold text-black cursor-pointer hover:bg-gray-100/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    100% Customer Satisfaction Guarantee
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      openAccordion === 'guarantee' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'guarantee' && (
                  <div className="px-5 pb-5 pt-1 text-xs text-gray-600 leading-relaxed space-y-2 border-t border-gray-100 bg-white">
                    <p>
                      <strong>Australian Consumer Law Guarantee:</strong> We stand fully behind every item. If your parcel arrives damaged, with a transit defect, or not as described, we will immediately rush a free replacement or issue a full refund.
                    </p>
                    <p>
                      Simply message our team on WhatsApp (+61 494 794 408) or email (graceandglame.au@gmail.com) with a photo.
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Delivery Timeline */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-[#fcfbfa]">
                <button
                  type="button"
                  onClick={() => toggleAccordion('delivery')}
                  className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-semibold text-black cursor-pointer hover:bg-gray-100/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#b8860b]" />
                    Free Delivery &amp; Timeline
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      openAccordion === 'delivery' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openAccordion === 'delivery' && (
                  <div className="px-5 pb-5 pt-1 text-xs text-gray-600 leading-relaxed space-y-2 border-t border-gray-100 bg-white">
                    <p>
                      <strong>Free Tracked Delivery:</strong> free on every order, Australia-wide — no minimum spend, no delivery charges. Your tracking number is emailed as soon as your parcel is on its way.
                    </p>
                    <p>
                      <strong>Order Processing:</strong> Standard catalog items are prepared and dispatched within 1–3 business days. Custom engraved pieces take 4–6 business days for atelier precision crafting.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Details list */}
            {product.details.length > 0 && (
              <ul className="mb-6 space-y-2 text-sm text-gray-600">
                {product.details.map((detail) => (
                  <li key={detail} className="flex gap-2">
                    <span className="text-[#d3a95d]">•</span>
                    {detail}
                  </li>
                ))}
              </ul>
            )}

            {/* Meta */}
            <dl className="text-sm text-gray-500 flex flex-col gap-2">
              <div>
                <dt className="font-bold text-black w-24 inline-block">SKU</dt>
                <dd className="inline">{selectedVariant?.sku ?? `GG-${product.id}`}</dd>
              </div>
              <div>
                <dt className="font-bold text-black w-24 inline-block">Availability</dt>
                <dd className="inline">
                  <span className={soldOut ? 'text-red-500' : 'text-[#d3a95d]'}>
                    {soldOut ? 'Out of stock' : 'In stock (Made to order)'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-bold text-black w-24 inline-block">Category</dt>
                <dd className="inline">{product.category}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* ================= Marquee ================= */}
      <div className="w-full bg-gray-50 border-y border-gray-200 py-6 overflow-hidden flex whitespace-nowrap mb-12">
        <div
          className="marquee-track items-center gap-16 px-4"
          style={{ '--marquee-duration': '40s' } as React.CSSProperties}
        >
          {DUPLICATED_MARQUEE.map((item, index) => (
            <div key={index} className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[#d3a95d] font-serif font-bold text-lg">{item.title}</span>
                <span className="text-gray-500 text-sm font-light tracking-wide">{item.desc}</span>
              </div>
              <div className="w-2 h-2 bg-[#d3a95d] rotate-45 ml-8 opacity-50" />
            </div>
          ))}
        </div>
      </div>

      {/* ================= Related ================= */}
      {related.length > 0 && (
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-black mb-4">Related products</h2>
            <p className="text-gray-500 text-sm">
              Explore our related products and find more styles you&apos;ll love.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((item) => {
              const itemImage = getVariantImages(item)[0] ?? '/products/placeholder.webp';
              const itemDiscount = getDiscountPercent(item);

              return (
                <div key={item.id} className="flex flex-col group relative">
                  <button
                    type="button"
                    onClick={() =>
                      toggleFavorite(
                        formatFavItem({
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          image: itemImage,
                          category: item.category,
                        })
                      )
                    }
                    className={`absolute top-4 right-4 z-20 bg-white border border-gray-200 p-2 rounded-full shadow-sm transition-all duration-300 ${
                      isFavorite(item.id)
                        ? 'text-red-500 opacity-100'
                        : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500'
                    }`}
                    aria-label={`Add ${item.name} to wishlist`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill={isFavorite(item.id) ? 'currentColor' : 'none'}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>

                  <Link href={`/product/${item.slug}`} className="flex flex-col">
                    <div className="w-full h-[52vw] sm:h-[320px] bg-gray-50 rounded-2xl overflow-hidden relative border border-gray-100 p-4">
                      {itemDiscount !== null && (
                        <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-20 shadow-sm">
                          -{itemDiscount}%
                        </span>
                      )}
                      <Image
                        src={itemImage}
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-contain p-4 transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>

                    <div className="mt-4 text-center px-2">
                      <h3 className="text-black font-serif font-bold text-md">{item.name}</h3>
                      <span className="mt-1 block text-[#d3a95d] font-bold">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const UPLOAD_READY_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_EDGE_PX = 4000;

/**
 * Returns a file the server will accept: small JPG/PNG/WEBP files pass through
 * untouched; anything else is decoded in the browser and re-encoded as JPEG.
 */
async function preparePhotoForUpload(file: File): Promise<File> {
  if (UPLOAD_READY_TYPES.has(file.type) && file.size <= MAX_UPLOAD_BYTES) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This photo format could not be read. Please upload a JPG or PNG.');
  }

  const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process this photo. Please try another one.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new Error('Could not process this photo. Please try another one.');
  const stem = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${stem}.jpg`, { type: 'image/jpeg' });
}
