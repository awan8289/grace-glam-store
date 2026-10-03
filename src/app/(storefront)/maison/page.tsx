import type { Metadata } from 'next';

import TheMaisonPortal from '@/components/maison/TheMaisonPortal';

export const metadata: Metadata = {
  title: 'The Maison — Bespoke Keepsakes & Personalized Jewelry',
  description:
    'Grace & Glam is an Australian bespoke atelier crafting necklaces, custom photo paintings and keepsake gifts.',
  alternates: { canonical: '/maison' },
};

export default function MaisonPage() {
  return <TheMaisonPortal initialTab="about" />;
}
