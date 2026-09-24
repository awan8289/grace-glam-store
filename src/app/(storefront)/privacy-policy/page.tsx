import type { Metadata } from 'next';

import TheMaisonPortal from '@/components/maison/TheMaisonPortal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Grace & Glam collects, uses and protects your personal information under Australian privacy law.',
  alternates: { canonical: '/privacy-policy' },
};

export default function PrivacyPage() {
  return <TheMaisonPortal initialTab="privacy" />;
}
