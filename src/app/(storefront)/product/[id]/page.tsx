import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct, listStorefrontProducts } from '@/lib/products';
import { getTotalStock } from '@/types';
import {
  absoluteUrl,
  breadcrumbSchema,
  productDescription,
  productSchema,
  SITE,
} from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import ProductDetailPage from '@/components/product/ProductDetailPage';
import { safeQuery } from '@/lib/safe';

// Rendered once and served from the cache. Admin mutations call
// `revalidatePath('/', 'layout')`, so edits still appear immediately.

type Props = { params: Promise<{ id: string }> };

/**
 * Prerenders every active product at build time; new slugs render on demand.
 *
 * Deliberately fail-soft: if the database is unreachable during a build (or the
 * environment has no credentials yet, as on a first deploy) every product simply
 * renders on first request instead of the whole build failing.
 */
export async function generateStaticParams() {
  try {
    const products = await listStorefrontProducts();
    return products.map((product) => ({ id: product.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: 'Product not found', robots: { index: false, follow: true } };
  }

  const description = productDescription(product);
  // The slug is canonical — a product reached by numeric id points back here.
  const canonical = `/product/${product.slug}`;

  // `images` is deliberately omitted from openGraph/twitter: setting it here
  // would suppress the generated card in `opengraph-image.tsx`, which shows the
  // product shot with its name and price instead of a bare cut-out.
  return {
    title: `${product.name} | ${product.category}`,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title: product.name,
      description,
      url: absoluteUrl(canonical),
      siteName: SITE.name,
      locale: SITE.locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
    },
    other: {
      // Read by Pinterest and several shopping aggregators.
      'product:price:amount': product.price.toFixed(2),
      'product:price:currency': SITE.currency,
      'product:availability': getTotalStock(product) > 0 ? 'in stock' : 'out of stock',
    },
  };
}

export default async function DynamicProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product || product.status !== 'active') notFound();

  const all = await safeQuery(() => listStorefrontProducts(), [], 'related products');
  const related = all.filter((item) => item.id !== product.id).slice(0, 4);

  return (
    <>
      {/* Price, currency and stock in the search result itself. */}
      <JsonLd
        data={[
          productSchema(product),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/shop' },
            { name: product.category, path: `/shop?category=${encodeURIComponent(product.category)}` },
            { name: product.name, path: `/product/${product.slug}` },
          ]),
        ]}
      />
      <ProductDetailPage product={product} related={related} />
    </>
  );
}
