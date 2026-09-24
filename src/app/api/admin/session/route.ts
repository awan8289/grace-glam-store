import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  checkCredentials,
  createSessionToken,
} from '@/lib/auth';
import { clientIp, createLoginThrottle, tooManyAttempts } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const limiter = createLoginThrottle({
  windowMs: 15 * 60 * 1000,
  maxPerIp: 8,
  // The ceiling an attacker cannot dodge by rotating X-Forwarded-For. Far above
  // anything a real operator does, far below anything that threatens a password.
  maxFailuresGlobal: 40,
});

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const { allowed, retryAfter } = limiter.check(ip);
  if (!allowed) return tooManyAttempts(retryAfter);

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (!checkCredentials(String(body.password ?? ''))) {
    limiter.fail(ip);
    // Deliberately vague — never reveal whether the account is configured.
    return Response.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  limiter.reset(ip);

  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, createSessionToken('admin'), SESSION_COOKIE_OPTIONS);

  return Response.json({ ok: true });
}

/** Sign out. */
export async function DELETE() {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, '', { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return Response.json({ ok: true });
}
