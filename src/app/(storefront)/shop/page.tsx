import type { Metadata } from 'next';
import { listCategories, listStorefrontProducts } from '@/lib/products';
import { breadcrumbSchema, itemListSchema, SITE } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import ShopBrowser from '@/components/shop/ShopBrowser';
import { safeQuery } from '@/lib/safe';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : null;
}

const TAG_LABELS: Record<string, string> = {
  trending: 'Trending Now',
  'new-arrivals': 'New Arrivals',
  'top-selling': 'Top Selling',
};

/** Title, description and canonical all follow the active filter. */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const tag = one(params.tag);
  const category = one(params.category);
  const search = one(params.search);

  // Search result pages stay crawlable (the sitelinks searchbox needs the URL
  // to resolve) but must not be indexed — they are thin and near-duplicate.
  if (search) {
    return {
      title: `Search: ${search}`,
      description: `Results for “${search}” at ${SITE.name}.`,
      robots: { index: false, follow: true },
      alternates: { canonical: '/shop' },
    };
  }

  if (category) {
    return {
      title: `${category} — Buy Online in Australia`,
      description: `Shop ${category.toLowerCase()} from ${SITE.name}. Free shipping over A$150 to Australia and New Zealand, with 30-day returns.`,
      alternates: { canonical: `/shop?category=${encodeURIComponent(category)}` },
    };
  }

  if (tag) {
    const label = TAG_LABELS[tag] ?? 'Shop';
    return {
      title: `${label} — Modest Luxury Fashion Australia`,
      description: `${label} at ${SITE.name}: hijabs, scarves, pashminas and stoles. Free shipping over A$150 to Australia and New Zealand.`,
      alternates: { canonical: `/shop?tag=${tag}` },
    };
  }

  return {
    title: 'Shop Hijabs, Scarves & Pashminas',
    description:
      'Browse the full Grace & Glam collection: jersey and georgette hijabs, printed and silk scarves, pashminas, stoles and hijab accessories. Free shipping over A$150.',
    alternates: { canonical: '/shop' },
  };
}

/**
 * Reads `?tag=` / `?category=` on the server and hands them down as props.
 *
 * Doing this with `useSearchParams()` in the client component forced its whole
 * subtree out of prerendering, so the shipped HTML contained only a "Loading
 * catalogue" fallback — nothing for search engines and a visible pop-in for
 * users. Reading them here makes the route dynamic, but the catalogue is served
 * from an in-memory cache so the render cost is negligible, and the grid now
 * arrives as real markup.
 */
export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = one(params.search);

  const [products, categories] = await Promise.all([
    // The catalogue's own matcher covers name, category and variant colours.
    safeQuery(() => listStorefrontProducts(search ? { search } : {}), [], 'shop catalogue'),
    safeQuery(() => listCategories(), [], 'shop categories'),
  ]);

  const tag = one(params.tag);
  const category = one(params.category);

  const visible = products.filter((product) => {
    if (tag && !product.tags.includes(tag)) return false;
    if (category && product.category !== category) return false;
    return true;
  });

  const listName = search
    ? `Search: ${search}`
    : (category ?? (tag ? (TAG_LABELS[tag] ?? 'Shop') : 'All products'));
  const path = category
    ? `/shop?category=${encodeURIComponent(category)}`
    : tag
      ? `/shop?tag=${tag}`
      : '/shop';

  return (
    <>
      <JsonLd
        data={[
          itemListSchema(visible, path, listName),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/shop' },
            ...(category || tag ? [{ name: listName, path }] : []),
          ]),
        ]}
      />
      <ShopBrowser
        products={products}
        categories={categories}
        activeTag={tag}
        initialCategory={category}
        searchTerm={search}
      />
    </>
  );
}
