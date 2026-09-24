'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, getDiscountPercent, getPrimaryImage, getTotalStock } from '@/types';
import { formatPrice } from '@/lib/format';
import { useCartStore } from '@/store/useCartStore';
import { useFavoriteStore, formatFavItem } from '@/store/useFavoriteStore';

const TAG_LABELS: Record<string, string> = {
  trending: 'Trending Now',
  'new-arrivals': 'New Arrivals',
};

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'name', label: 'Name, A to Z' },
];

export default function ShopBrowser({
  products,
  categories,
  activeTag,
  initialCategory,
  searchTerm = null,
}: {
  products: Product[];
  categories: string[];
  activeTag: string | null;
  initialCategory: string | null;
  /** Server-side search term; the product list is already filtered by it. */
  searchTerm?: string | null;
}) {
  // Identifies the current URL view; a manual category pick only applies inside it.
  const viewKey = `${activeTag ?? ''}|${initialCategory ?? ''}`;

  const maxProductPrice = Math.max(100, ...products.map((p) => Math.ceil(p.price / 50) * 50));

  // `null` means "no explicit choice yet", which lets the ceiling follow the
  // catalogue without an effect that resets state after render.
  const [maxPriceChoice, setMaxPriceChoice] = useState<number | null>(null);
  const maxPrice = maxPriceChoice ?? maxProductPrice;
  const setMaxPrice = setMaxPriceChoice;

  const [categoryChoice, setCategoryChoice] = useState<{ view: string; value: string | null } | null>(null);
  const selectedCategory =
    categoryChoice && categoryChoice.view === viewKey ? categoryChoice.value : initialCategory;
  const setSelectedCategory = (value: string | null) => setCategoryChoice({ view: viewKey, value });
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sort, setSort] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { addItem } = useCartStore();
  const { toggleFavorite, isFavorite } = useFavoriteStore();

  useEffect(() => {
    if (!isFilterOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFilterOpen]);

  const allSizes = [...new Set(products.flatMap((product) => product.sizes))];

  const filtered = (() => {
    const result = products.filter((product) => {
      if (product.price > maxPrice) return false;
      if (selectedCategory && product.category !== selectedCategory) return false;
      if (activeTag && !product.tags.includes(activeTag)) return false;
      if (selectedSize && !product.sizes.includes(selectedSize)) return false;
      return true;
    });

    switch (sort) {
      case 'price-asc':
        return [...result].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...result].sort((a, b) => b.price - a.price);
      case 'name':
        return [...result].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return result;
    }
  })();

  const handleAddToCart = (product: Product) => {
    const firstAvailable = product.variants.find((variant) => variant.stock > 0);
    addItem(
      product,
      selectedSize ?? product.sizes[0] ?? 'One Size',
      firstAvailable?.colorName ?? product.variants[0]?.colorName ?? 'Default',
      1
    );
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSize(null);
    setMaxPrice(null);
  };

  // Rendered in both the drawer and the desktop sidebar. Declared as a plain
  // function returning JSX rather than a nested component so React keeps the
  // same element type across renders — a nested component would remount on
  // every keystroke and drop focus.
  const filterPanel = (
    <div className="flex flex-col gap-8">
      {/* Price */}
      <div>
        <h2 className="text-[#d3a95d] font-bold text-base mb-4">Price</h2>
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-black shadow-sm text-center font-medium">
            {formatPrice(0)}
          </div>
          <div className="flex items-center text-gray-300 font-bold">—</div>
          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-sm text-black shadow-sm text-center font-medium">
            {formatPrice(maxPrice)}
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={maxProductPrice}
          step={5}
          value={maxPrice}
          onChange={(event) => setMaxPrice(Number(event.target.value))}
          aria-label="Maximum price"
          className="w-full accent-[#d3a95d] cursor-pointer h-1.5 bg-gray-200 rounded-full appearance-none"
        />
      </div>

      <div className="border-t border-gray-100" />

      {/* Category */}
      <div>
        <h2 className="text-[#d3a95d] font-bold text-base mb-4">Category</h2>
        <ul className="flex flex-col gap-2.5 text-sm">
          {[{ label: 'All Categories', value: null }, ...categories.map((c) => ({ label: c, value: c }))].map(
            (category) => (
              <li key={category.label}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category.value);
                    setIsFilterOpen(false);
                  }}
                  aria-pressed={selectedCategory === category.value}
                  className={`flex items-center gap-2 py-1 transition-colors ${
                    selectedCategory === category.value
                      ? 'text-black font-bold'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                      selectedCategory === category.value ? 'bg-[#d3a95d]' : 'bg-gray-300'
                    }`}
                  />
                  {category.label}
                </button>
              </li>
            )
          )}
        </ul>

        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-bold">Browse by</p>
          <div className="flex flex-col gap-2">
            {Object.entries(TAG_LABELS).map(([value, label]) => (
              <Link
                key={value}
                href={`/shop?tag=${value}`}
                onClick={() => setIsFilterOpen(false)}
                className={`text-sm transition-colors flex items-center gap-2 ${
                  activeTag === value ? 'font-bold text-black' : 'text-gray-500 hover:text-black'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#d3a95d] flex-shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Size */}
      <div>
        <h2 className="text-[#d3a95d] font-bold text-base mb-4">Size</h2>
        <div className="flex gap-2.5 flex-wrap">
          {allSizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedSize(selectedSize === size ? null : size)}
              aria-pressed={selectedSize === size}
              className={`border px-4 py-2 text-xs rounded-lg font-bold transition-all shadow-sm ${
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
    </div>
  );

  return (
    <div className="bg-white min-h-dvh text-black pt-8 md:pt-28 pb-20 font-sans relative">
      {/* Mobile filter drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-[300] flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
              className="relative w-[300px] bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h2 className="font-bold text-black text-base tracking-wide">Filter</h2>
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="Close filters"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="px-5 py-6 flex-1">{filterPanel}</div>
              <div className="px-5 pb-6 pt-4 border-t border-gray-100 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full bg-black text-white font-bold py-3.5 rounded-xl text-sm uppercase tracking-widest hover:bg-[#d3a95d] hover:text-black transition-colors shadow-lg"
                >
                  Show {filtered.length} results
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto px-6 md:px-8 relative z-10">
        {/* Title */}
        <div className="text-center mb-16">
          <p className="text-[#d3a95d] text-sm mb-2 font-medium">
            Home • Shop
            {searchTerm ? ` • Search` : activeTag ? ` • ${TAG_LABELS[activeTag] ?? activeTag}` : ''}
          </p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-black tracking-wide">
            {searchTerm ? `“${searchTerm}”` : activeTag ? (TAG_LABELS[activeTag] ?? 'Shop') : 'Shop'}
          </h1>

          {searchTerm && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <span className="bg-black text-[#d3a95d] text-xs font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">
                {filtered.length} {filtered.length === 1 ? 'match' : 'matches'}
              </span>
              <Link
                href="/shop"
                className="text-xs text-gray-400 hover:text-black border border-gray-300 hover:border-black px-3 py-1.5 rounded-full transition-colors"
              >
                Clear search ✕
              </Link>
            </div>
          )}

          {activeTag && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <span className="bg-black text-[#d3a95d] text-xs font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">
                {TAG_LABELS[activeTag] ?? activeTag}
              </span>
              <Link
                href="/shop"
                className="text-xs text-gray-400 hover:text-black border border-gray-300 hover:border-black px-3 py-1.5 rounded-full transition-colors"
              >
                Clear filter ✕
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="hidden lg:flex w-full lg:w-1/4 flex-col gap-10">{filterPanel}</aside>

          <div className="w-full lg:w-3/4">
            {/* Toolbar */}
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4 border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen(true)}
                  className="flex lg:hidden items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-bold text-black hover:border-[#d3a95d] transition-colors"
                >
                  Filter
                </button>
                <p className="text-sm text-gray-600 font-medium">
                  {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Sort by:</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="bg-transparent text-[#d3a95d] font-bold focus:outline-none cursor-pointer text-sm"
                >
                  {SORTS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-white text-black">
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Active filter pills */}
            {(selectedCategory || selectedSize) && (
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="bg-black text-[#d3a95d] text-xs font-bold px-3 py-1 rounded-full"
                  >
                    {selectedCategory} ✕
                  </button>
                )}
                {selectedSize && (
                  <button
                    type="button"
                    onClick={() => setSelectedSize(null)}
                    className="bg-black text-[#d3a95d] text-xs font-bold px-3 py-1 rounded-full"
                  >
                    Size {selectedSize} ✕
                  </button>
                )}
              </div>
            )}

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                <p className="text-lg font-serif mb-4">No products found.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-[#d3a95d] underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filtered.map((product, index) => {
                  const image = getPrimaryImage(product);
                  const discount = getDiscountPercent(product);
                  const soldOut = getTotalStock(product) === 0;
                  const favourite = isFavorite(product.id);

                  return (
                    <div key={product.id} className="flex flex-col group relative">
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
                        aria-label={`${favourite ? 'Remove' : 'Add'} ${product.name} ${
                          favourite ? 'from' : 'to'
                        } wishlist`}
                        className={`absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm transition-all ${
                          favourite
                            ? 'text-red-500 opacity-100'
                            : 'text-gray-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:text-red-500'
                        }`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          fill={favourite ? 'currentColor' : 'none'}
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

                      <Link href={`/product/${product.slug}`} className="flex flex-col">
                        <div className="w-full h-[260px] md:h-[380px] bg-gray-50 rounded-2xl overflow-hidden relative border border-gray-100">
                          {discount !== null && (
                            <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 shadow-sm">
                              -{discount}%
                            </span>
                          )}
                          {soldOut && (
                            <span className="absolute top-3 left-3 bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20">
                              Sold out
                            </span>
                          )}

                          <Image
                            src={image}
                            alt={product.name}
                            fill
                            // The first row is above the fold and drives LCP.
                            priority={index < 3}
                            quality={90}
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-contain p-3 md:p-4 transition-transform duration-700 group-hover:scale-110"
                          />

                          {/* Colour swatches */}
                          {product.variants.length > 1 && (
                            <div className="absolute bottom-3 left-3 flex -space-x-1 z-20">
                              {product.variants.slice(0, 4).map((variant) => (
                                <span
                                  key={variant.id}
                                  title={variant.colorName}
                                  className="h-3.5 w-3.5 rounded-full border border-white shadow-sm"
                                  style={{ backgroundColor: variant.hex }}
                                />
                              ))}
                            </div>
                          )}

                          {product.video && (
                            <span className="absolute bottom-3 right-3 z-20 rounded-full bg-black/70 p-1.5 text-white">
                              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor">
                                <path d="M3 2.2v7.6l6.2-3.8z" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </Link>

                      <div className="mt-3 text-center px-1">
                        <Link href={`/product/${product.slug}`}>
                          <h3 className="text-black font-serif font-bold text-sm md:text-lg leading-tight hover:text-[#d3a95d] transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="mt-1 flex justify-center items-center gap-2">
                          <span className="text-[#d3a95d] font-bold text-sm">
                            {formatPrice(product.price)}
                          </span>
                          {product.compareAtPrice ? (
                            <span className="text-gray-400 line-through text-xs">
                              {formatPrice(product.compareAtPrice)}
                            </span>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          disabled={soldOut}
                          className="mt-3 w-full bg-black text-white font-bold py-3.5 rounded-full text-xs uppercase tracking-widest hover:bg-[#d3a95d] hover:text-black transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {soldOut ? 'Sold out' : 'Add to cart'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
