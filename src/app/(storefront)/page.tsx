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
 * Hero line-up.
 *
 * The hero floats each piece over the page background, so a cut-out with a
 * transparent surround and a photograph with its own grey studio wall cannot sit
 * in the same row — the photographs read as boxes parked next to the cut-outs.
 * So the line-up is drawn from cut-outs alone (named `hero-*`) whenever there
 * are enough of them to fill the five visible slots.
 *
 * Below that threshold it falls back to the old behaviour — tagged first, then
 * the rest of the catalogue — because a half-empty hero looks worse than a
 * mixed one.
 */
const HERO_SLOTS = 5;

function isCutOut(product: Product) {
  return product.images[0]?.includes('/products/hero-') ?? false;
}

function heroLineUp(products: Product[], minimum = 10) {
  const cutOuts = products.filter(isCutOut);
  if (cutOuts.length >= HERO_SLOTS) return cutOuts;

  const tagged = products.filter((product) => product.tags.includes('top-selling'));
  const rest = products.filter((product) => !product.tags.includes('top-selling'));
  return [...tagged, ...rest].slice(0, Math.max(minimum, tagged.length));
}

export default async function Home() {
  const products = await safeQuery(() => listStorefrontProducts(), [], 'home catalogue');

  return (
    <>
      {/* Identifies the store and enables the sitelinks search box. */}
      <JsonLd data={[organizationSchema(), webSiteSchema()]} />

      {/*
        The hero leads with whatever the admin tags "Top Selling". Its carousel
        and the thumbnail strip below it both read this one array, so tagging a
        product puts it in both places.
      */}
      <HeroSection products={heroLineUp(products)} />
      <CatalogSection
        trending={byTag(products, 'trending', products.slice(0, 5))}
        newArrivals={byTag(products, 'new-arrivals', products.slice(-4))}
      />
      <BrandStoryReviews />
    </>
  );
}
