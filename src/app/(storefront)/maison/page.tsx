import type { Metadata } from 'next';

import TheMaisonPortal from '@/components/maison/TheMaisonPortal';

export const metadata: Metadata = {
  title: 'The Maison — Our Story',
  description:
    'Grace & Glam is an Australian modest-fashion label: everyday jersey and georgette hijabs, printed and silk scarves, pashminas, stoles and the accessories that hold them in place.',
  alternates: { canonical: '/maison' },
};

export default function MaisonPage() {
  return <TheMaisonPortal initialTab="about" />;
}
