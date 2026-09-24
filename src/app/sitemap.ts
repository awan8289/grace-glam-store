import type { MetadataRoute } from 'next';
import { listStorefrontProducts, listCategories } from '@/lib/products';
import { absoluteUrl } from '@/lib/seo';
import { safeQuery } from '@/lib/safe';

/** Regenerated hourly so newly published products get discovered quickly. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    safeQuery(() => listStorefrontProducts(), [], 'sitemap products'),
    safeQuery(() => listCategories(), [], 'sitemap categories'),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/shop'), changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/shop?tag=new-arrivals'), changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/shop?tag=trending'), changeFrequency: 'daily', priority: 0.8 },
    // /about renders the same content as /maison and canonicals to it, so it
    // is deliberately not listed here.
    { url: absoluteUrl('/maison'), changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/atelier'), changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/shipping-returns'), changeFrequency: 'monthly', priority: 0.4 },
    { url: absoluteUrl('/refund-policy'), changeFrequency: 'monthly', priority: 0.4 },
    { url: absoluteUrl('/privacy-policy'), changeFrequency: 'yearly', priority: 0.2 },
    { url: absoluteUrl('/terms-conditions'), changeFrequency: 'yearly', priority: 0.2 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/shop?category=${encodeURIComponent(category)}`),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: absoluteUrl(`/product/${product.slug}`),
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // /account, /checkout and /admin are intentionally absent — they are private
  // or transactional and are blocked in robots.ts too.
  return [...staticPages, ...categoryPages, ...productPages];
}
