import type { Metadata } from 'next';

import TheMaisonPortal from '@/components/maison/TheMaisonPortal';

export const metadata: Metadata = {
  title: 'The Atelier — Precision Laser Engraving & 5D Diamond Art',
  description:
    'Discover the Grace & Glam bespoke process: precision laser-cut 18K gold name pendants and custom photo pet diamond paintings crafted with museum-grade brilliance.',
  alternates: { canonical: '/atelier' },
};

export default function AtelierPage() {
  return <TheMaisonPortal initialTab="atelier" />;
}
