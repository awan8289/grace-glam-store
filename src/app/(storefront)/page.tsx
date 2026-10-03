import type { Metadata } from 'next';
import { listStorefrontProducts } from '@/lib/products';
import { safeQuery } from '@/lib/safe';
import { Product } from '@/types';
import { organizationSchema, webSiteSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import HeroSection from '@/components/home/HeroSection';
import CatalogSection from '@/components/home/CatalogSection';
import BrandStoryReviews from '@/components/home/BrandStoryReviews';

// Rendered once and served from the cache. Admin mutations call
// `revalidatePath('/', 'layout')`, so edits still appear immediately.

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/** Falls back to a slice of the catalogue so a section is never empty. */
function byTag(products: Product[], tag: string, fallback: Product[]) {
  const tagged = products.filter((product) => product.tags.includes(tag));
  return tagged.length > 0 ? tagged : fallback;
}

/**
 * Hero line-up — hand-picked, in this order. Each has a transparent cut-out
 * (`/products/hero-<slug>.webp`, background removed) so the pieces float over
 * the hero instead of sitting in photo boxes. The product pages keep their
 * normal photos; only the hero uses the cut-outs.
 *
 * To change the hero: edit this list and add a matching cut-out file.
 */
const HERO_PICKS = [
  'mothers-day-custom-name-birthstone-mom-necklace',
  'eternal-preserved-rose-flower-teddy-bear-gift-dome-with-led-lights',
  'heart-shaped-rose-soap-flower-gift-box',
  'sparkling-zircon-winter-snowflake-pendant-necklace',
  'rotating-soap-flower-rose-gift-box',
  'celtic-filigree-luminous-glow-heart-pendant-necklace',
  'flared-skirt-silhouette-pearl-drop-earrings',
  'glowing-pendant-necklaces-silver-plated-chain-necklaces',
  '12-constellation-moon-star-luminous-glowing-necklace',
  'mens-fashion-gun-and-rose-bullet-pendant-necklace',
];

function heroLineUp(products: Product[]) {
  const picked = HERO_PICKS.map((slug) => products.find((p) => p.slug === slug)).filter(
    (p): p is Product => Boolean(p)
  );
  // If products are missing (e.g. unpublished), fall back so the hero is never empty.
  const lineUp = picked.length >= 5 ? picked : [...picked, ...products.filter((p) => !picked.includes(p))].slice(0, 10);
  const heroImages = Object.fromEntries(
    picked.map((p) => [p.id, `/products/hero-${p.slug}.webp`])
  );
  return { lineUp, heroImages };
}

/**
 * New arrivals: anything tagged `new-arrivals` first, then the most recently
 * added products, so the grid always shows a full two rows of eight.
 */
const NEW_ARRIVALS_COUNT = 8;

function newArrivals(products: Product[]) {
  const tagged = products.filter((p) => p.tags.includes('new-arrivals'));
  const newest = [...products]
    .filter((p) => !tagged.includes(p))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  return [...tagged, ...newest].slice(0, NEW_ARRIVALS_COUNT);
}

export default async function Home() {
  const products = await safeQuery(() => listStorefrontProducts(), [], 'home catalogue');
  const hero = heroLineUp(products);

  return (
    <>
      {/* Identifies the store and enables the sitelinks search box. */}
      <JsonLd data={[organizationSchema(), webSiteSchema()]} />

      {/* Hero carousel + thumbnail strip: the hand-picked HERO_PICKS above. */}
      <HeroSection products={hero.lineUp} heroImages={hero.heroImages} />
      <CatalogSection
        trending={byTag(products, 'trending', products.slice(0, 5))}
        newArrivals={newArrivals(products)}
      />
      <BrandStoryReviews />
    </>
  );
}
