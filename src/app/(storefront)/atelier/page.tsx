import type { Metadata } from 'next';

import TheMaisonPortal from '@/components/maison/TheMaisonPortal';

export const metadata: Metadata = {
  title: 'Fabric & Craft — How We Choose Our Cloth',
  description:
    'How Grace & Glam picks fabric: drape, opacity, colour hold and finish, checked before a roll is ordered — and why we name blends honestly.',
  alternates: { canonical: '/atelier' },
};

export default function AtelierPage() {
  return <TheMaisonPortal initialTab="atelier" />;
}
