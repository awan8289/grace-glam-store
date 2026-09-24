'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Product, getPrimaryImage } from '@/types';
import { formatPrice } from '@/lib/format';
import { useFavoriteStore, formatFavItem } from '@/store/useFavoriteStore';

const THUMB_BACKGROUNDS = [
  'radial-gradient(circle, #4a5568 0%, #2d3748 100%)',
  'radial-gradient(circle, #bfa08e 0%, #8a7366 100%)',
  'radial-gradient(circle, #d1d5db 0%, #9ca3af 100%)',
  'radial-gradient(circle, #374151 0%, #111827 100%)',
  'radial-gradient(circle, #9ca3af 0%, #6b7280 100%)',
];

/** How many pieces the composition shows at once. */
const MOBILE_VISIBLE = 3;
const DESKTOP_VISIBLE = 5;

const MOBILE_SPACING = 110;
const DESKTOP_SPACING = 240;

/**
 * Places the nth of `count` pieces, always symmetrically about the centre.
 *
 * Fixed slot positions looked wrong whenever fewer pieces were shown than there
 * were slots — two products landed in the two left-hand slots and the right half
 * of the hero sat empty. Deriving the offset from the middle keeps any number
 * of pieces balanced.
 */
function slotFor(index: number, count: number, isMobile: boolean) {
  const offset = index - (count - 1) / 2;
  const distance = Math.abs(offset);

  const scale = isMobile
    ? distance < 0.5
      ? 1.08
      : 0.86
    : distance < 0.5
      ? 1.12
      : distance < 1.5
        ? 0.9
        : 0.76;

  return {
    x: offset * (isMobile ? MOBILE_SPACING : DESKTOP_SPACING),
    y: 0,
    scale,
    // Nearer the middle sits in front.
    zIndex: 30 - Math.round(distance * 8),
    initialDelay: 0.1 + distance * 0.3,
  };
}

export default function HeroSection({ products }: { products: Product[] }) {
  const [startIndex, setStartIndex] = useState(0);
  const [showWhiteBg, setShowWhiteBg] = useState(false);
  const [hasIntroPlayed, setHasIntroPlayed] = useState(false);
  const [showBottomSection, setShowBottomSection] = useState(false);
  // `null` until measured on the client — avoids committing to a desktop
  // layout during SSR and then snapping to mobile after hydration.
  const [windowWidth, setWindowWidth] = useState<number | null>(null);

  const { toggleFavorite, isFavorite } = useFavoriteStore();

  const dragStartX = useRef(0);
  const isDragging = useRef(false);
  const DRAG_THRESHOLD = 60;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Intro choreography — kept short so the hero is interactive quickly.
  useEffect(() => {
    const timers = [
      setTimeout(() => setShowWhiteBg(true), 900),
      setTimeout(() => setHasIntroPlayed(true), 1400),
      setTimeout(() => setShowBottomSection(true), 1900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!showBottomSection || products.length === 0) return;
    const timer = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [showBottomSection, products.length]);

  if (products.length === 0) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center bg-[#0a0a0c] text-[#d3a95d]">
        <p className="font-serif text-xl">The collection is being prepared.</p>
      </div>
    );
  }

  const isMobile = windowWidth !== null && windowWidth < 768;
  const visibleCount = Math.min(isMobile ? MOBILE_VISIBLE : DESKTOP_VISIBLE, products.length);
  const centerIndex = Math.floor(visibleCount / 2);

  const currentProducts = Array.from(
    { length: visibleCount },
    (_, i) => products[(startIndex + i) % products.length]
  );

  const handleNext = () => setStartIndex((prev) => (prev + 1) % products.length);
  const handlePrev = () => setStartIndex((prev) => (prev - 1 + products.length) % products.length);

  const handleDragStart = (event: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    dragStartX.current = 'touches' in event ? event.touches[0].clientX : event.clientX;
  };

  const handleDragEnd = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const clientX = 'changedTouches' in event ? event.changedTouches[0].clientX : event.clientX;
    const diff = clientX - dragStartX.current;
    if (Math.abs(diff) > DRAG_THRESHOLD) {
      if (diff < 0) handleNext();
      else handlePrev();
    }
  };

  const responsiveX = (baseX: number) =>
    !isMobile && windowWidth !== null && windowWidth < 1280 ? baseX * (windowWidth / 1350) : baseX;

  return (
    <div className="relative w-full h-[calc(100dvh-64px)] md:h-[100dvh] overflow-hidden bg-[#0a0a0c] flex flex-col items-center justify-center">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute inset-0 opacity-80"
          animate={{
            background: [
              'radial-gradient(circle at 50% 45%, rgba(211, 169, 93, 0.20) 0%, rgba(15, 15, 18, 0.95) 55%, rgba(10, 10, 12, 1) 100%)',
              'radial-gradient(circle at 50% 45%, rgba(211, 169, 93, 0.32) 0%, rgba(15, 15, 18, 0.92) 50%, rgba(10, 10, 12, 1) 100%)',
              'radial-gradient(circle at 50% 45%, rgba(211, 169, 93, 0.20) 0%, rgba(15, 15, 18, 0.95) 55%, rgba(10, 10, 12, 1) 100%)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          className="absolute inset-0 flex items-center justify-center select-none"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1.05, opacity: 0.06 }}
          transition={{ duration: 3, ease: 'easeOut' }}
        >
          <span className="font-serif text-[13vw] tracking-[0.25em] text-[#d4af37] font-light">
            GRACE
          </span>
        </motion.div>

        <motion.div
          className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#d3a95d]/10 blur-3xl"
          animate={{ y: [-25, 25, -25], x: [-15, 15, -15] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#d3a95d]/10 blur-3xl"
          animate={{ y: [25, -25, 25], x: [20, -20, 20] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* White reveal */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-white z-0 overflow-hidden"
        initial={{ height: '0%' }}
        animate={{ height: showWhiteBg ? '100%' : '0%' }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d3a95d] to-transparent shadow-[0_0_15px_#d3a95d]" />
      </motion.div>

      {/* Heading */}
      <motion.div
        className="absolute left-4 md:left-10 top-[90px] md:top-[110px] z-20"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: showWhiteBg ? 1 : 0, x: showWhiteBg ? 0 : -50 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <p className="text-gray-400 tracking-[0.3em] text-xs font-semibold mb-2">DISCOVER OUR</p>
        <h1 className="text-3xl md:text-5xl font-serif text-black tracking-wide leading-tight">
          Top
          <br />
          Selling
        </h1>
        <div className="w-16 h-[2px] bg-[#d3a95d] mt-4" />
      </motion.div>

      {/* Carousel */}
      <motion.div
        className="absolute top-[85px] bottom-[150px] md:top-[110px] md:bottom-[200px] z-10 flex items-center justify-center w-full max-w-[1400px] cursor-grab active:cursor-grabbing select-none"
        animate={{ y: showBottomSection ? '-2vh' : '0vh' }}
        transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onMouseLeave={(event) => {
          if (isDragging.current) handleDragEnd(event);
        }}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        {/*
          Layout lives on a plain div, the entrance fade on a motion.div inside
          it. The two must not be the same element: framer-motion owns the
          `transform` property, so a `style={{ transform }}` handed to a
          motion.div is overwritten — which left every piece at the same spot
          whenever its animations had not run (background tab, reduced motion,
          busy main thread). Positioning with CSS keeps the composition correct
          even if no animation ever plays.
        */}
        {currentProducts.map((product, i) => {
          const slot = slotFor(i, visibleCount, isMobile);
          const targetX = responsiveX(slot.x);
          const isCenter = i === centerIndex;

          return (
            <div
              key={`top-${product.id}`}
              className="absolute"
              style={{
                zIndex: slot.zIndex,
                transform: `translate3d(${targetX}px, 0, 0) scale(${slot.scale})`,
                transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: hasIntroPlayed ? 1 : 0, y: hasIntroPlayed ? 0 : 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: hasIntroPlayed ? 0.35 : 0.9,
                delay: hasIntroPlayed ? 0 : slot.initialDelay,
                ease: [0.25, 1, 0.5, 1],
              }}
            >
                <Link
                  href={`/product/${product.slug}`}
                  className={`relative flex items-center justify-center ${
                    isCenter
                      ? 'w-[190px] h-[300px] sm:w-[230px] sm:h-[340px] md:w-[250px] md:h-[370px]'
                      : 'w-[135px] h-[240px] sm:w-[170px] sm:h-[280px] md:w-[180px] md:h-[300px]'
                  }`}
                  onClick={(event) => {
                    // Suppress the click that ends a drag.
                    if (Math.abs(dragStartX.current - event.clientX) > 5) event.preventDefault();
                  }}
                  draggable={false}
                >
                  <Image
                    src={getPrimaryImage(product)}
                    alt={product.name}
                    fill
                    priority={isCenter}
                    quality={90}
                    sizes="250px"
                    draggable={false}
                    className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)] transition-transform duration-500 hover:scale-105 pointer-events-none"
                  />
                </Link>

                <motion.p
                  className={`mt-2 text-center font-serif ${
                    showWhiteBg ? 'text-gray-900 font-semibold' : 'text-white'
                  } ${isCenter ? 'text-xl font-bold' : 'text-lg'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hasIntroPlayed && !showBottomSection ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {product.name}
                </motion.p>
            </motion.div>
            </div>
          );
        })}
      </motion.div>

      {/* Arrows */}
      <motion.div
        className="absolute right-6 md:right-12 bottom-[156px] md:bottom-[208px] flex gap-3 z-20"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: showBottomSection ? 1 : 0, x: showBottomSection ? 0 : 50 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <button
          type="button"
          onClick={handlePrev}
          className="w-11 h-11 flex items-center justify-center rounded-full border border-gray-300 bg-white shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Previous product"
        >
          <span className="text-gray-800 font-bold text-lg">←</span>
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="w-11 h-11 flex items-center justify-center rounded-full border border-gray-300 bg-white shadow-lg hover:bg-gray-100 transition-colors"
          aria-label="Next product"
        >
          <span className="text-gray-800 font-bold text-lg">→</span>
        </button>
      </motion.div>

      {/* Thumbnail strip */}
      <motion.div
        className="absolute bottom-0 left-0 w-full h-[150px] md:h-[200px] bg-white border-t border-gray-200 z-40 overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.08)]"
        initial={{ y: '100%' }}
        animate={{ y: showBottomSection ? '0%' : '100%' }}
        transition={{ duration: 1, ease: [0.25, 1, 0.5, 1] }}
      >
        <div className="flex w-full h-full">
          {/* Widths come from flex, not from an animation, for the same reason
              as the carousel above: the strip must be laid out correctly even
              if no animation ever runs. */}
          {currentProducts.map((product, index) => {
              const isCenter = index === centerIndex;
              const favourite = isFavorite(product.id);

              return (
                <motion.div
                  key={`thumb-${product.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  style={{ width: `${100 / visibleCount}%` }}
                  className={`relative h-full border-r border-gray-200 group ${
                    isCenter ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <Link
                    href={`/product/${product.slug}`}
                    className="absolute top-0 left-0 right-0 bottom-[44px] flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:brightness-90"
                    style={{
                      background: THUMB_BACKGROUNDS[(startIndex + index) % THUMB_BACKGROUNDS.length],
                    }}
                  >
                    <Image
                      src={getPrimaryImage(product)}
                      alt={product.name}
                      fill
                      sizes="20vw"
                      className="object-contain p-2 drop-shadow-md transition-transform duration-500 group-hover:scale-110"
                    />
                  </Link>

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
                    aria-label={`${favourite ? 'Remove' : 'Add'} ${product.name} ${
                      favourite ? 'from' : 'to'
                    } wishlist`}
                    className={`absolute top-3 left-3 z-30 transition-all duration-300 ${
                      favourite ? 'text-red-500 scale-110' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill={favourite ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth={favourite ? 0 : 1.5}
                      viewBox="0 0 24 24"
                      className="w-4 h-4"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>

                  <Link
                    href={`/product/${product.slug}`}
                    className="absolute bottom-0 left-0 right-0 h-[44px] md:h-[52px] px-2 md:px-3 flex justify-between items-center bg-white border-t border-gray-200 z-30 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col justify-center min-w-0 pr-1">
                      <p className="font-bold tracking-tight truncate max-w-[80px] sm:max-w-[100px] md:max-w-[120px] text-xs md:text-sm leading-tight text-gray-900">
                        {product.name}
                      </p>
                      <span className="flex items-center text-amber-500 text-[11px] mt-0.5 font-medium">
                        ★ <span className="ml-1 text-gray-600 font-semibold">4.8</span>
                      </span>
                    </div>
                    <span className="font-extrabold text-xs md:text-sm text-gray-900 bg-gray-100 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md border border-gray-300/80 whitespace-nowrap shadow-sm">
                      {formatPrice(product.price)}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
        </div>
      </motion.div>
    </div>
  );
}
