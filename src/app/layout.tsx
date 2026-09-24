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
  'Australian modest fashion. Jersey and georgette hijabs, printed and silk scarves, pashminas, stoles and hijab accessories. Free shipping over A$150 to Australia and New Zealand.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE.name} | Hijabs, Scarves & Modest Fashion Australia`,
    template: `%s | ${SITE.name}`,
  },
  description: DESCRIPTION,
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
    title: `${SITE.name} | Hijabs, Scarves & Modest Fashion Australia`,
    description: DESCRIPTION,
  },

  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} | Hijabs, Scarves & Modest Fashion Australia`,
    description: DESCRIPTION,
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
