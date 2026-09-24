import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

/**
 * Gate for the admin panel and for every privileged API call.
 *
 * Next 16 renamed `middleware` to `proxy`; the file must live at `src/proxy.ts`
 * and export a default function.
 *
 * Per-customer ownership checks are NOT done here — the proxy only knows
 * whether a cookie is well-formed, not whose order is being requested. Those
 * checks live in the route handlers, which can read the data.
 */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdmin = verifySessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  const isMutation = !SAFE_METHODS.has(request.method);

  // ---- Admin UI ----
  if (pathname.startsWith('/admin')) {
    // The login page itself must stay reachable, or this redirects forever.
    if (pathname === '/admin/login') {
      return isAdmin ? NextResponse.redirect(new URL('/admin', request.url)) : NextResponse.next();
    }

    if (isAdmin) return NextResponse.next();

    const login = new URL('/admin/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }

  // ---- Admin-only APIs ----
  // Catalogue reads stay public (the storefront search uses them); writes do not.
  // Listing all orders is admin-only; a customer reads their own via /api/account.
  const adminOnly =
    pathname.startsWith('/api/upload') ||
    (pathname.startsWith('/api/products') && isMutation) ||
    (pathname.startsWith('/api/categories') && isMutation) ||
    (pathname === '/api/orders' && !isMutation) ||
    (pathname.startsWith('/api/orders/') && isMutation) ||
    pathname.startsWith('/api/customers');

  if (adminOnly && !isAdmin) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // ---- CSRF: a cookie-authenticated mutation must originate from this site ----
  if (isMutation) {
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== request.headers.get('host')) {
      return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    // The login endpoint is unauthenticated by necessity, but it still needs
    // the cross-origin check below — otherwise another site could sign the
    // operator out, or log them in, from a page they merely visited.
    '/api/admin/:path*',
    '/api/products/:path*',
    '/api/categories/:path*',
    '/api/upload/:path*',
    '/api/orders/:path*',
    '/api/customers/:path*',
    '/api/account/:path*',
  ],
};
