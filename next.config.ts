import type { NextConfig } from 'next';

/**
 * Security headers applied to every response. The storefront loads no
 * third-party scripts, so the CSP can stay tight; `'unsafe-inline'` is required
 * for styles because Tailwind and framer-motion both emit inline style
 * attributes, and for scripts because Next inlines its bootstrap payload.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CSP },
  // Two years, subdomains included. Browsers ignore this over plain HTTP, so it
  // is safe locally and pins the live site to HTTPS from the first visit on.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  images: {
    // Product photography is fine-detail fabric; 75 was visibly soft.
    qualities: [75, 90],
    formats: ['image/avif', 'image/webp'],
    // Product art is portrait, so the widths that matter are the narrow ones.
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
      {
        // Admin-uploaded media is content-addressed, so it can be cached hard.
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Defence in depth: never let an uploaded file execute in our origin.
          { key: 'Content-Security-Policy', value: "default-src 'none'; sandbox" },
        ],
      },
      {
        source: '/products/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
