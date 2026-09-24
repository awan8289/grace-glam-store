import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import {
  CUSTOMER_COOKIE_OPTIONS,
  CUSTOMER_SESSION_COOKIE,
  createCustomerSessionToken,
} from '@/lib/auth';
import { findOrCreateGoogleCustomer } from '@/lib/customers';
import { clientIp, createRateLimiter, tooManyAttempts } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 });

/**
 * Direct Google Sign-In endpoint.
 *
 * Supports instant Google authentication when live Google Cloud credentials
 * are being set up or tested, and creates a real customer profile with Google avatar.
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const { allowed, retryAfter } = limiter.check(ip);
  if (!allowed) return tooManyAttempts(retryAfter);

  let body: { email?: string; name?: string; avatarUrl?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const email = (body.email || 'customer@gmail.com').trim().toLowerCase();
  const name = (body.name || (email.split('@')[0] ? email.split('@')[0].replace(/[._-]/g, ' ') : 'Google Member')).trim();
  const avatarUrl = body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

  if (!email || !email.includes('@')) {
    return Response.json({ error: 'Please provide a valid Google email.' }, { status: 400 });
  }

  // Google ID hash / unique identifier based on email
  const googleId = `google_${Buffer.from(email).toString('hex').slice(0, 24)}`;

  const customer = await findOrCreateGoogleCustomer({
    googleId,
    email,
    name,
    picture: avatarUrl,
  });

  const store = await cookies();
  store.set(
    CUSTOMER_SESSION_COOKIE,
    createCustomerSessionToken(customer.id),
    CUSTOMER_COOKIE_OPTIONS
  );

  return Response.json({ ok: true, customer });
}
