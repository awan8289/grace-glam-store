import { createHmac, randomBytes, timingSafeEqual, scryptSync } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Two entirely separate cookies. A customer session can never be mistaken for
 * an admin one, even though both are signed with the same secret — the subject
 * inside the token is what distinguishes them.
 */
export const ADMIN_SESSION_COOKIE = 'gg_admin_session';
export const CUSTOMER_SESSION_COOKIE = 'gg_customer_session';

const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const CUSTOMER_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'ADMIN_SESSION_SECRET must be set to a random string of at least 32 characters. See .env.example.'
    );
  }
  return secret;
}

function getPasswordHash(): string {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    throw new Error('ADMIN_PASSWORD_HASH is not set. Run `npm run admin:password` to generate one.');
  }
  return hash;
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt — memory-hard, unlike a bare SHA)
// ---------------------------------------------------------------------------

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')): string {
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;

  const derived = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');

  // Length check first: timingSafeEqual throws on a mismatch.
  if (derived.length !== expectedBuffer.length) return false;
  return timingSafeEqual(derived, expectedBuffer);
}

// ---------------------------------------------------------------------------
// Stateless signed sessions
// ---------------------------------------------------------------------------

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * `<subject>.<expiry>.<signature>` — tamper-evident without server-side
 * storage. The subject is `admin` for the operator, or a customer id.
 */
export function createSessionToken(subject: string, ttlSeconds = SESSION_TTL_SECONDS): string {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  // The separator must not appear in the subject, or the token could be forged
  // by shifting the boundary between fields.
  const safeSubject = encodeURIComponent(subject);
  const payload = `${safeSubject}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function createCustomerSessionToken(customerId: string): string {
  return createSessionToken(customerId, CUSTOMER_TTL_SECONDS);
}

/** Returns the subject when the token is valid and unexpired, else null. */
export function readSessionToken(token: string | undefined): string | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [subject, expiry, signature] = parts;
  if (!safeEqual(signature, sign(`${subject}.${expiry}`))) return null;

  const expiresAt = Number(expiry);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  return decodeURIComponent(subject);
}

export function verifySessionToken(token: string | undefined): boolean {
  return readSessionToken(token) === 'admin';
}

export function checkCredentials(password: string): boolean {
  try {
    return verifyPassword(password, getPasswordHash());
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Request-time helpers
// ---------------------------------------------------------------------------

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
}

/** The signed-in customer's id, or null. */
export async function getCustomerId(): Promise<string | null> {
  const store = await cookies();
  const subject = readSessionToken(store.get(CUSTOMER_SESSION_COOKIE)?.value);
  // `admin` is a reserved subject and must never resolve to a customer.
  return subject && subject !== 'admin' ? subject : null;
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};

export const CUSTOMER_COOKIE_OPTIONS = {
  ...SESSION_COOKIE_OPTIONS,
  maxAge: CUSTOMER_TTL_SECONDS,
};

/** 401 helper for route handlers. */
export function unauthorized() {
  return Response.json({ error: 'Authentication required.' }, { status: 401 });
}

export function forbidden() {
  return Response.json({ error: 'Not allowed.' }, { status: 403 });
}
