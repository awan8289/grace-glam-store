import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import {
  CUSTOMER_COOKIE_OPTIONS,
  CUSTOMER_SESSION_COOKIE,
  createCustomerSessionToken,
} from '@/lib/auth';
import { registerCustomer } from '@/lib/customers';
import { clientIp, createRateLimiter, tooManyAttempts } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const limiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 });

/**
 * The per-IP cap above is keyed on a header the caller controls, so on its own
 * it does not stop a script from rotating it and filling the customer file with
 * junk accounts. This second cap counts every signup regardless of who claims
 * to be asking — a real store does not open 120 accounts in an hour.
 */
const ceiling = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 120 });

export async function POST(request: NextRequest) {
  const ip = clientIp(request);

  const overall = ceiling.check('all');
  if (!overall.allowed) return tooManyAttempts(overall.retryAfter);

  const { allowed, retryAfter } = limiter.check(ip);
  if (!allowed) return tooManyAttempts(retryAfter);

  let body: { name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const result = await registerCustomer({
    name: String(body.name ?? ''),
    email: String(body.email ?? ''),
    password: String(body.password ?? ''),
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const store = await cookies();
  store.set(
    CUSTOMER_SESSION_COOKIE,
    createCustomerSessionToken(result.customer.id),
    CUSTOMER_COOKIE_OPTIONS
  );

  return Response.json({ customer: result.customer }, { status: 201 });
}
