import type { Metadata } from 'next';

import TheMaisonPortal from '@/components/maison/TheMaisonPortal';

export const metadata: Metadata = {
  title: 'Refund & Returns Policy',
  description:
    '30 days to return an unworn Grace & Glam piece. How to start a return, when the refund lands, and your rights under the Australian Consumer Law.',
  alternates: { canonical: '/refund-policy' },
};

export default function RefundPolicyPage() {
  return <TheMaisonPortal initialTab="returns" />;
}
