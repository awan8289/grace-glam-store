import type { Metadata } from 'next';

import TheMaisonPortal from '@/components/maison/TheMaisonPortal';

export const metadata: Metadata = {
  title: 'The Atelier — Precision Laser Engraving & 5D Diamond Art',
  description:
    'Discover the Grace & Glam bespoke process: how custom photo paintings and personalised gifts are made to order.',
  alternates: { canonical: '/atelier' },
};

export default function AtelierPage() {
  return <TheMaisonPortal initialTab="atelier" />;
}
