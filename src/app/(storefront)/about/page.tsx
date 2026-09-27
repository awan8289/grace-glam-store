import type { Metadata } from 'next';

import TheMaisonPortal from '@/components/maison/TheMaisonPortal';

export const metadata: Metadata = {
  title: 'About Grace & Glam',
  description:
    'The heritage and craft behind Grace & Glam, Australia’s premier bespoke personalized jewelry and custom pet art atelier.',
  alternates: { canonical: '/maison' },
};

export default function AboutPage() {
  return <TheMaisonPortal initialTab="about" />;
}
