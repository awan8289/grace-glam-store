import type { Metadata } from 'next';

import TheMaisonPortal from '@/components/maison/TheMaisonPortal';

export const metadata: Metadata = {
  title: 'Shipping Policy — Australia-Wide Tracked Delivery',
  description:
    'Free tracked delivery on every Grace & Glam order across Australia — no minimum spend.',
  alternates: { canonical: '/shipping-returns' },
};

export default function ShippingPage() {
  return <TheMaisonPortal initialTab="shipping" />;
}
