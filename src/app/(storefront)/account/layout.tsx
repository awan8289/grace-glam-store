import type { Metadata } from 'next';

/**
 * `account/page.tsx` is a client component and cannot export metadata,
 * so it lives here. This page is private and must stay out of the index.
 */
export const metadata: Metadata = {
  title: 'My Account',
  robots: { index: false, follow: false },
};

export default function MyAccountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
