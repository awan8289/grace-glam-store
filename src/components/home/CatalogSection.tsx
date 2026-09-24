'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Product, getPrimaryImage } from '@/types';
import { formatPrice } from '@/lib/format';
import { useFavoriteStore, formatFavItem } from '@/store/useFavoriteStore';

function FavouriteButton({ product }: { product: Product }) {
  const { toggleFavorite, isFavorite } = useFavoriteStore();
  const favourite = isFavorite(product.id);

  return (
    <button
      type="button"
      onClick={() =>
        toggleFavorite(
          formatFavItem({
            id: product.id,
            name: product.name,
            price: product.price,
            image: getPrimaryImage(product),
            category: product.category,
          })
        )
      }
      aria-label={`${favourite ? 'Remove' : 'Add'} ${product.name} ${favourite ? 'from' : 'to'} wishlist`}
      className={`absolute top-3 right-3 z-30 p-2.5 rounded-full bg-white/90 backdrop-blur-sm shadow-md transition-all duration-300 ${
        favourite
          ? 'text-red-500 opacity-100 scale-110'
          : 'text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill={favourite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={favourite ? 0 : 2}
        viewBox="0 0 24 24"
        className="w-5 h-5"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  );
}

export default function CatalogSection({
  trending,
  newArrivals,
}: {
  trending: Product[];
  newArrivals: Product[];
}) {
  // Duplicated so the marquee loops seamlessly at -50%.
  const marquee = [...trending, ...trending];

  return (
    <section className="bg-white min-h-screen py-24 text-gray-900 pt-32 overflow-hidden">
      {/* ================= Trending ================= */}
      <div className="w-full mb-32">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-gray-200 pb-4 gap-4"
          >
            <div>
              <p className="text-[#d3a95d] tracking-[0.3em] text-xs font-bold mb-2 uppercase">Most Loved</p>
              <h2 className="text-3xl md:text-5xl font-serif tracking-wide text-black">Trending Now</h2>
            </div>
            <Link
              href="/shop?tag=trending"
              className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-[#d3a95d] transition-colors"
            >
              View All →
            </Link>
          </motion.div>
        </div>

        <div className="w-full overflow-hidden flex relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-r from-white to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-l from-white to-transparent z-20 pointer-events-none" />

          <div
            className="marquee-track gap-6 px-6 md:px-12"
            style={{ '--marquee-duration': '35s' } as React.CSSProperties}
          >
            {marquee.map((product, index) => (
              <div
                key={`trending-${product.id}-${index}`}
                className="w-[280px] sm:w-[320px] flex-shrink-0 relative group"
              >
                <FavouriteButton product={product} />

                <Link href={`/product/${product.slug}`} className="flex flex-col">
                  <div className="overflow-hidden relative h-[45vh] bg-gray-50 mb-4 rounded-sm">
                    <Image
                      src={getPrimaryImage(product)}
                      alt={product.name}
                      fill
                      quality={90}
                      sizes="320px"
                      className="object-contain p-4 transition-transform duration-[1.5s] group-hover:scale-105"
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <h3 className="font-serif text-[15px] font-bold text-gray-800">{product.name}</h3>
                    <span className="text-[#d3a95d] font-bold">{formatPrice(product.price)}</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= New arrivals ================= */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-gray-200 pb-4 gap-4"
        >
          <div>
            <p className="text-[#d3a95d] tracking-[0.3em] text-xs font-bold mb-2 uppercase">Just Dropped</p>
            <h2 className="text-3xl md:text-5xl font-serif tracking-wide text-black">New Arrivals</h2>
          </div>
          <Link
            href="/shop?tag=new-arrivals"
            className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 hover:text-[#d3a95d] transition-colors"
          >
            Discover →
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {newArrivals.map((product, index) => (
            <motion.div
              key={`new-${product.id}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12 }}
              className="relative group"
            >
              <FavouriteButton product={product} />

              <Link href={`/product/${product.slug}`} className="flex flex-col">
                <div className="overflow-hidden relative h-[45vh] bg-gray-50 mb-4 rounded-sm">
                  <Image
                    src={getPrimaryImage(product)}
                    alt={product.name}
                    fill
                    priority={index === 0}
                    quality={90}
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-contain p-4 transition-transform duration-[1.5s] group-hover:scale-105"
                  />
                </div>
                <div className="px-1 flex flex-col gap-1">
                  <h3 className="font-serif text-[15px] font-bold text-gray-800">{product.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[#d3a95d] font-bold">{formatPrice(product.price)}</span>
                    <span className="border-b border-transparent text-xs font-bold uppercase tracking-[0.1em] text-gray-400 group-hover:text-black group-hover:border-black transition-all">
                      Shop Now
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
