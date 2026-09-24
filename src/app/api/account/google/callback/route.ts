import { NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import {
  CUSTOMER_COOKIE_OPTIONS,
  CUSTOMER_SESSION_COOKIE,
  createCustomerSessionToken,
} from '@/lib/auth';
import { findOrCreateGoogleCustomer } from '@/lib/customers';
import {
  GOOGLE_STATE_COOKIE,
  exchangeGoogleCode,
  googleRedirectUri,
  isGoogleConfigured,
} from '@/lib/google-oauth';

export const dynamic = 'force-dynamic';

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Where the shopper lands, with a message they can actually act on. */
function back(request: NextRequest, error?: string) {
  const url = new URL('/account', request.url);
  if (error) {
    url.pathname = '/';
    url.searchParams.set('signin_error', error);
  }
  return Response.redirect(url, 302);
}

export async function GET(request: NextRequest) {
  if (!isGoogleConfigured()) return back(request, 'Google sign-in is not available.');

  const params = request.nextUrl.searchParams;
  const store = await cookies();

  // Clear the one-time state whatever happens next, so a code cannot be replayed.
  const expected = store.get(GOOGLE_STATE_COOKIE)?.value;
  store.set(GOOGLE_STATE_COOKIE, '', { ...CUSTOMER_COOKIE_OPTIONS, maxAge: 0 });

  // The person pressed "Cancel" on Google's screen. Not an error worth shouting about.
  if (params.get('error')) return back(request, 'Sign-in was cancelled.');

  const state = params.get('state') ?? '';
  if (!expected || !state || !safeEqual(state, expected)) {
    // Someone else started this flow, or the cookie expired. Either way the
    // response cannot be trusted to belong to whoever is holding this browser.
    return back(request, 'That sign-in link has expired. Please try again.');
  }

  const code = params.get('code');
  if (!code) return back(request, 'Google did not return a sign-in code.');

  const result = await exchangeGoogleCode(code, googleRedirectUri(request.url));
  if (!result.ok) return back(request, result.error);

  const customer = await findOrCreateGoogleCustomer(result.profile);

  // The same session every other sign-in uses — no second mechanism to keep safe.
  store.set(
    CUSTOMER_SESSION_COOKIE,
    createCustomerSessionToken(customer.id),
    CUSTOMER_COOKIE_OPTIONS
  );

  return back(request);
}
