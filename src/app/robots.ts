import type { MetadataRoute } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/account',
          '/checkout',
          // Sort permutations are pure duplicates of /shop. Search results are
          // deliberately NOT blocked here — they carry `noindex, follow`, which
          // Google can only act on if it is allowed to fetch the page.
          '/shop?*sort=',
        ],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
