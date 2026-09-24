'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, getDiscountPercent, getVariantImages } from '@/types';
import { formatPrice } from '@/lib/format';
import { useCartStore } from '@/store/useCartStore';
import { useFavoriteStore, formatFavItem } from '@/store/useFavoriteStore';
import { useAuthStore } from '@/store/useAuthStore';

const MARQUEE_FEATURES = [
  { title: 'Free Shipping Over A$150', desc: 'Australia and New Zealand.' },
  { title: '30-Day Returns', desc: 'Unworn, with tags still attached.' },
  { title: 'Online Support', desc: '24 hours a day, 7 days a week.' },
  {
    title: 'Premium Online Payment',
    desc: 'Secure online prepayment required to confirm your exclusive order. (No COD)',
  },
  { title: 'Premium Fabric', desc: 'Elegance that stays with you. Crafted with the finest materials.' },
  { title: 'Secure Payment', desc: 'Shop with confidence. Our secure gateway ensures protection.' },
  { title: 'Style Suggestion', desc: 'Not sure which fabric suits you? WhatsApp +61 494 794 408 or email sales@graceglam.com.au.' },
  { title: 'Careful Packaging', desc: 'Folded and wrapped so it arrives crease-free.' },
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

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? null;
  const gallery = useMemo(
    () => getVariantImages(product, selectedVariantId),
    [product, selectedVariantId]
  );

  const image = gallery[Math.min(activeImage, gallery.length - 1)] ?? '/products/placeholder.webp';
  const discount = getDiscountPercent(product);

  // Stock reflects the chosen colour when the product has variants.
  const availableStock = selectedVariant ? selectedVariant.stock : product.stock;
  const soldOut = availableStock <= 0;

  const selectVariant = (variantId: string) => {
    setSelectedVariantId(variantId);
    setActiveImage(0);
    setShowVideo(false);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - left) / width) * 100;
    const y = ((event.clientY - top) / height) * 100;
    setZoomPosition({ x: `${x}%`, y: `${y}%` });
  };

  const handleAddToCart = () => {
    if (soldOut) return;
    addItem(
      product,
      selectedSize,
      selectedVariant?.colorName ?? 'Default',
      Math.min(quantity, availableStock)
    );
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1600);
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
                      // 1.75x is about as far as the source photography holds up;
                      // the previous 2.4x magnified interpolation artefacts.
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
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-black mb-2">{product.name}</h1>
            {product.subtitle && <p className="text-gray-500 mb-4">{product.subtitle}</p>}

            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl text-[#d3a95d] font-bold">{formatPrice(product.price)}</span>
              {product.compareAtPrice ? (
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              ) : null}
            </div>

            <p className="text-gray-600 mb-8 leading-relaxed font-light">{product.description}</p>

            {/* Colour variants */}
            {product.variants.length > 0 && (
              <div className="mb-6">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-xs uppercase tracking-[0.15em] font-bold text-gray-500">
                    Colour
                  </span>
                  <span className="text-sm text-black font-semibold">
                    {selectedVariant?.colorName}
                  </span>
                </div>
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
                          active ? 'border-[#d3a95d] scale-110' : 'border-gray-200 hover:border-gray-400'
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
              </div>
            )}

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div className="mb-6">
                <span className="block text-xs uppercase tracking-[0.15em] font-bold text-gray-500 mb-3">
                  Size
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      aria-pressed={selectedSize === size}
                      className={`border px-4 py-3 min-w-11 text-xs font-bold rounded-lg transition-all ${
                        selectedSize === size
                          ? 'border-[#d3a95d] bg-black text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-[#d3a95d] hover:text-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            <div className="flex items-center gap-2 mb-6">
              <span className={`h-2.5 w-2.5 rounded-full ${soldOut ? 'bg-red-500' : 'bg-green-500'}`} />
              <span className="text-sm font-semibold text-gray-700">
                {soldOut
                  ? 'Sold out in this colour'
                  : availableStock <= product.lowStockThreshold
                    ? `Only ${availableStock} left in stock`
                    : 'In stock, ready to ship'}
              </span>
            </div>

            {/* Delivery */}
            <div className="border border-gray-200 bg-gray-50 rounded-lg p-5 mb-8">
              <div className="flex items-center gap-3 text-black font-semibold mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-[#d3a95d]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
                Free Shipping Over A$150
              </div>
              <p className="text-gray-500 text-sm ml-8">To Australia and New Zealand. A$9.95 flat below that.</p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-4">
              {/*
                The tap area is the button, not the glyph. A bare "−" is roughly
                12px of hittable width; padding it out to 44px is the difference
                between changing the quantity and mis-tapping the one beside it.
              */}
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

            {/* Details list */}
            {product.details.length > 0 && (
              <ul className="mb-8 space-y-2 text-sm text-gray-600">
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
                    {soldOut ? 'Out of stock' : 'In stock'}
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
      <div className="w-full bg-gray-50 border-y border-gray-200 py-6 overflow-hidden flex whitespace-nowrap mb-24">
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
