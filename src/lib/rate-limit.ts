import { NextRequest } from 'next/server';

/**
 * Fixed-window throttles held in process memory.
 *
 * Enough to make online password guessing impractical on a single-instance
 * deployment. A multi-instance setup would move the counters to Redis.
 */
export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets. Zero when allowed. */
  retryAfter: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Spoofed keys must not be able to grow the map without bound, so expired
 * buckets are swept whenever the map gets large. Sweeping on a size trigger
 * rather than a timer keeps this free in the normal case.
 */
const MAX_TRACKED_KEYS = 20_000;

function sweep(hits: Map<string, Bucket>, now: number) {
  if (hits.size < MAX_TRACKED_KEYS) return;
  for (const [key, bucket] of hits) {
    if (now > bucket.resetAt) hits.delete(key);
  }
  // Still full of live buckets: this is an attack, not traffic. Drop the lot
  // rather than grow — the global ceiling below is what actually holds the line.
  if (hits.size >= MAX_TRACKED_KEYS) hits.clear();
}

export function createRateLimiter(options: { windowMs: number; max: number }) {
  const hits = new Map<string, Bucket>();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      sweep(hits, now);
      const entry = hits.get(key);

      if (!entry || now > entry.resetAt) {
        hits.set(key, { count: 1, resetAt: now + options.windowMs });
        return { allowed: true, retryAfter: 0 };
      }

      entry.count += 1;
      if (entry.count > options.max) {
        return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
      }
      return { allowed: true, retryAfter: 0 };
    },

    /** Call after a successful attempt so a legitimate user isn't penalised. */
    reset(key: string) {
      hits.delete(key);
    },
  };
}

/**
 * Throttle for password endpoints, limited two ways at once.
 *
 * The per-IP limit is the useful one, but its key comes from `X-Forwarded-For`,
 * which the client sends and can therefore invent. Rotating that header gives an
 * attacker a fresh bucket on every request, so a per-IP limit ALONE is not a
 * limit at all — verified against this app before the ceiling was added.
 *
 * The ceiling is what cannot be dodged: a count of failures across every caller.
 * It is set high enough that ordinary mistyping never reaches it, so the only
 * thing that trips it is a real guessing run — and while it is tripped the
 * storefront carries on untouched; only sign-in pauses.
 */
export function createLoginThrottle(options: {
  windowMs: number;
  maxPerIp: number;
  maxFailuresGlobal: number;
}) {
  const perIp = new Map<string, Bucket>();
  let ceiling: Bucket = { count: 0, resetAt: 0 };

  return {
    /** Read-only: does not count anything. Call `fail()` on a rejected attempt. */
    check(key: string): RateLimitResult {
      const now = Date.now();
      sweep(perIp, now);

      if (now <= ceiling.resetAt && ceiling.count >= options.maxFailuresGlobal) {
        return { allowed: false, retryAfter: Math.ceil((ceiling.resetAt - now) / 1000) };
      }

      const entry = perIp.get(key);
      if (entry && now <= entry.resetAt && entry.count >= options.maxPerIp) {
        return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
      }

      return { allowed: true, retryAfter: 0 };
    },

    /** Record a wrong password. Only failures count, so honest use never adds up. */
    fail(key: string) {
      const now = Date.now();

      const entry = perIp.get(key);
      if (!entry || now > entry.resetAt) {
        perIp.set(key, { count: 1, resetAt: now + options.windowMs });
      } else {
        entry.count += 1;
      }

      if (now > ceiling.resetAt) {
        ceiling = { count: 1, resetAt: now + options.windowMs };
      } else {
        ceiling.count += 1;
      }
    },

    /**
     * Clears this caller after a correct password. The global ceiling is
     * deliberately left alone — otherwise anyone holding one valid login could
     * wipe it between guesses and the ceiling would never be reached.
     */
    reset(key: string) {
      perIp.delete(key);
    },
  };
}

/**
 * Best-effort caller identity.
 *
 * `X-Forwarded-For` is set by the hosting proxy in production, but nothing stops
 * a direct caller from sending their own. Treat what this returns as a hint for
 * spreading load fairly, never as proof of who is calling.
 */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}

export function tooManyAttempts(retryAfter: number) {
  return Response.json(
    { error: `Too many attempts. Try again in ${Math.max(1, Math.ceil(retryAfter / 60))} minutes.` },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  );
}
