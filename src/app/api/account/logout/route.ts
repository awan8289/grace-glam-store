import { cookies } from 'next/headers';
import { CUSTOMER_COOKIE_OPTIONS, CUSTOMER_SESSION_COOKIE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const store = await cookies();
  store.set(CUSTOMER_SESSION_COOKIE, '', { ...CUSTOMER_COOKIE_OPTIONS, maxAge: 0 });
  return Response.json({ ok: true });
}
