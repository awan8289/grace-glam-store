'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/orders', label: 'Orders', exact: false },
  { href: '/admin/products', label: 'Products', exact: false },
  { href: '/admin/categories', label: 'Categories', exact: false },
  { href: '/admin/customers', label: 'Customers', exact: false },
  { href: '/admin/products/new', label: 'Add product', exact: true },
];

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.replace('/admin/login');
    router.refresh();
  };

  // The login screen is inside /admin but must render without the shell.
  if (pathname === '/admin/login') {
    return <div className="admin-root min-h-screen bg-[#fbfbfa] text-[#16161a]">{children}</div>;
  }

  return (
    <div className="admin-root min-h-screen bg-[#fbfbfa] text-[#16161a]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
        {/* ---------------- Sidebar ---------------- */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r border-[#ececea] bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            navOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col px-4 py-5">
            <Link href="/admin" className="mb-8 flex items-center gap-2.5 px-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#16161a] text-[10px] font-semibold tracking-tight text-white">
                G&amp;G
              </span>
              <span className="text-sm font-semibold tracking-tight">Inventory</span>
            </Link>

            <nav className="flex flex-col gap-0.5">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setNavOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-md px-3 py-2 text-[13px] transition-colors ${
                      active
                        ? 'bg-[#f2f2f0] font-medium text-[#16161a]'
                        : 'text-[#6b6b73] hover:bg-[#f7f7f6] hover:text-[#16161a]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto space-y-0.5 border-t border-[#ececea] pt-4">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] text-[#6b6b73] transition-colors hover:bg-[#f7f7f6] hover:text-[#16161a]"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M6.5 3.5 11 8l-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                View storefront
              </Link>
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-[#6b6b73] transition-colors hover:bg-[#f7f7f6] hover:text-[#a4272a] disabled:opacity-50"
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M10 11.5 13.5 8 10 4.5M13.5 8H6M6.5 13.5h-3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </aside>

        {navOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          />
        )}

        {/* ---------------- Content ---------------- */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#ececea] bg-[#fbfbfa]/90 px-4 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e2e2df] bg-white"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M2.5 4h11M2.5 8h11M2.5 12h11" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-sm font-semibold tracking-tight">Inventory</span>
          </header>

          <div className="px-4 py-6 sm:px-8 sm:py-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
