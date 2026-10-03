import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import { SITE, SITE_URL } from '@/lib/seo';
import '@/app/globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

const DESCRIPTION =
  'Necklaces, earrings and keepsake gift boxes in Australia. Pendants, heart and pearl necklaces, rose gift sets and more. Free delivery on every order, Australia-wide.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE.name} | Necklaces, Earrings & Keepsake Gifts Australia`,
    template: `%s | ${SITE.name}`,
  },
  description: DESCRIPTION,
  keywords: [
    'Necklaces Australia',
    'Pendant Necklaces Australia',
    'Heart Necklaces Australia',
    'Pearl Necklaces Australia',
    'Keepsake Gift Boxes Australia',
    'Jewellery Gifts Australia',
  ],
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE_URL }],
  creator: SITE.name,
  publisher: SITE.legalName,
  category: 'shopping',

  // Every page overrides this with its own path.
  alternates: {
    canonical: '/',
  },

  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE_URL,
    title: `${SITE.name} | Necklaces, Earrings & Keepsake Gifts`,
    description: DESCRIPTION,
    images: [{ url: '/brand/og-default.jpg', width: 1200, height: 630, alt: 'Grace & Glam' }],
  },

  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} | Necklaces, Earrings & Keepsake Gifts`,
    description: DESCRIPTION,
    images: ['/brand/og-default.jpg'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  formatDetection: {
    telephone: false,
    address: false,
  },

  other: {
    // Regional signals for the Australian market.
    'geo.region': 'AU-NSW',
    'geo.placename': 'Sydney',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Root layout owns only the document shell. Storefront chrome lives in
 * `(storefront)/layout.tsx` and the admin shell in `(admin)/layout.tsx`, so the
 * admin panel never pays for the loading screen, navbar or footer.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={SITE.language}
      // Acknowledges the smooth scroll set in globals.css so route transitions jump instantly.
      data-scroll-behavior="smooth"
      className={`${cormorant.variable} ${inter.variable} dark`}
    >
      <body className="bg-[#0a0a0a] text-[#E5E4E2] antialiased selection:bg-[#D4AF37] selection:text-[#0a0a0a]">
        {children}
      </body>
    </html>
  );
}
