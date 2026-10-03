import type { Metadata } from 'next';

import TheMaisonPortal from '@/components/maison/TheMaisonPortal';

export const metadata: Metadata = {
  title: 'Refund & Returns Policy',
  description:
    'Our transparent return and remake policy for bespoke personalized keepsakes under the Australian Consumer Law.',
  alternates: { canonical: '/refund-policy' },
};

export default function RefundPolicyPage() {
  return <TheMaisonPortal initialTab="returns" />;
}
