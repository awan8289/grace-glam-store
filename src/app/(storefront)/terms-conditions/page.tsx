import type { Metadata } from 'next';

import TheMaisonPortal from '@/components/maison/TheMaisonPortal';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Terms of sale and service for Grace & Glam customers in Australia.',
  alternates: { canonical: '/terms-conditions' },
};

export default function TermsPage() {
  return <TheMaisonPortal initialTab="terms" />;
}
