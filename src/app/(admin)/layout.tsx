import type { Metadata } from 'next';
import AdminShell from '@/components/admin/AdminShell';

export const metadata: Metadata = {
  title: {
    default: 'Inventory',
    template: '%s · Grace & Glam Admin',
  },
  description: 'Inventory management for the Grace & Glam catalogue.',
  robots: { index: false, follow: false },
};

/**
 * The admin panel deliberately opts out of the storefront chrome: no intro
 * animation, no marketing navbar, no footer. Light, dense and fast.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
