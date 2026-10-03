import { NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import {
  GOOGLE_STATE_COOKIE,
  googleAuthUrl,
  googleRedirectUri,
  isGoogleConfigured,
} from '@/lib/google-oauth';

import {
  CUSTOMER_COOKIE_OPTIONS,
  CUSTOMER_SESSION_COOKIE,
  createCustomerSessionToken,
} from '@/lib/auth';
import { findOrCreateGoogleCustomer } from '@/lib/customers';

export const dynamic = 'force-dynamic';

/** Starts the Google flow. A browser navigation, so GET. */
export async function GET(request: NextRequest) {
  if (!isGoogleConfigured()) {
    return Response.redirect(new URL('/account?signin_error=Google+sign-in+is+not+configured', request.url), 302);
  }

  const state = randomBytes(24).toString('base64url');

  const store = await cookies();
  store.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    // Google redirects back as a cross-site top-level navigation, which a
    // `strict` cookie would not be sent on — the callback would then see no
    // state at all and reject every legitimate sign-in.
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60,
  });

  return Response.redirect(googleAuthUrl(state, googleRedirectUri(request.url)), 302);
}
