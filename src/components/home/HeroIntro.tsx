import Link from 'next/link';
import { FREE_SHIPPING_THRESHOLD_AUD } from '@/lib/pricing';
import { formatPrice } from '@/lib/format';

/**
 * The first thing a visitor from an ad sees: what the shop sells, and one
 * obvious next step. Server-rendered and static, so it paints immediately —
 * before the animated carousel below it has finished its intro.
 */
export default function HeroIntro() {
  return (
    <section
      aria-labelledby="hero-intro-heading"
      className="relative overflow-hidden bg-[#0a0a0c] px-5 pt-10 pb-12 md:pt-16 md:pb-16 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(211,169,93,0.22) 0%, rgba(10,10,12,0) 65%)',
        }}
      />
      <div className="relative mx-auto max-w-2xl">
        <p className="mb-3 text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] text-[#d3a95d]">
          Personalised gifts · Australia-wide
        </p>
        <h1
          id="hero-intro-heading"
          className="font-serif text-[2.1rem] leading-[1.1] md:text-6xl text-white tracking-wide"
        >
          Gifts made from
          <br className="md:hidden" /> the people &amp; pets you love
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm md:text-base font-light leading-relaxed text-gray-300">
          Turn a favourite photo into a canvas painting, or pick a necklace with meaning.
          Free tracked delivery on orders over {formatPrice(FREE_SHIPPING_THRESHOLD_AUD)}.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#d3a95d] px-8 text-xs font-bold uppercase tracking-[0.2em] text-black shadow-[0_8px_24px_rgba(211,169,93,0.35)] transition-colors hover:bg-[#e2bb72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d3a95d]"
          >
            Shop Now
          </Link>
          <Link
            href="/product/house-number-wall-art-photo-digital-oil-painting"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 px-8 text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:border-[#d3a95d] hover:text-[#d3a95d]"
          >
            Upload a Photo
          </Link>
        </div>
      </div>
    </section>
  );
}
