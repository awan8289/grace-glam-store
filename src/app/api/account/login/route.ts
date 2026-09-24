import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import {
  CUSTOMER_COOKIE_OPTIONS,
  CUSTOMER_SESSION_COOKIE,
  createCustomerSessionToken,
} from '@/lib/auth';
import { authenticateCustomer } from '@/lib/customers';
import { clientIp, createLoginThrottle, tooManyAttempts } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Higher ceiling than the admin door: many shoppers share this one, and a
// forgotten password is common where an admin mistyping their own is not.
const limiter = createLoginThrottle({
  windowMs: 15 * 60 * 1000,
  maxPerIp: 10,
  maxFailuresGlobal: 200,
});

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const { allowed, retryAfter } = limiter.check(ip);
  if (!allowed) return tooManyAttempts(retryAfter);

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const customer = await authenticateCustomer(
    String(body.email ?? ''),
    String(body.password ?? '')
  );

  if (!customer) {
    limiter.fail(ip);
    // One message for both cases, so the response cannot be used to discover
    // which email addresses have accounts.
    return Response.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  limiter.reset(ip);

  const store = await cookies();
  store.set(
    CUSTOMER_SESSION_COOKIE,
    createCustomerSessionToken(customer.id),
    CUSTOMER_COOKIE_OPTIONS
  );

  return Response.json({ customer });
}
