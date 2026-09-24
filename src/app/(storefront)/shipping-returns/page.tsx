import type { Metadata } from 'next';

import TheMaisonPortal from '@/components/maison/TheMaisonPortal';

export const metadata: Metadata = {
  title: 'Shipping Policy — Australia & New Zealand',
  description:
    'Free standard shipping on Grace & Glam orders over A$150 to Australia and New Zealand. Orders processed in 1–2 business days, with tracking on every parcel.',
  alternates: { canonical: '/shipping-returns' },
};

export default function ShippingPage() {
  return <TheMaisonPortal initialTab="shipping" />;
}
