import type { Metadata } from 'next';

import TheMaisonPortal from '@/components/maison/TheMaisonPortal';

export const metadata: Metadata = {
  title: 'The Maison — Bespoke Keepsakes & Personalized Jewelry',
  description:
    'Grace & Glam is an Australian bespoke atelier crafting personalized 18K gold name necklaces, custom photo pet diamond paintings, and handcrafted keepsake gifts.',
  alternates: { canonical: '/maison' },
};

export default function MaisonPage() {
  return <TheMaisonPortal initialTab="about" />;
}
