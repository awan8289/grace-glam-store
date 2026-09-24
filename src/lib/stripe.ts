import Stripe from 'stripe';

/**
 * Server-side Stripe client.
 *
 * The key is read from the environment and nowhere else. A live `sk_live_…` key
 * used to sit here as a literal fallback, which put full account access —
 * charges, refunds, customer records, payouts — into every copy of the source,
 * including the archives passed around by hand. Treat that key as burned and
 * roll it in the Stripe dashboard; a rotated key also makes any stale copy inert.
 *
 * Missing configuration throws on first use rather than falling back, because a
 * payment path that quietly works with the wrong credentials is worse than one
 * that refuses to start and says why.
 */
function requireSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Add it to .env.local locally, and to the ' +
        'environment variables on the host before deploying.'
    );
  }
  return key;
}

let client: Stripe | null = null;

/** Lazily built, so an unconfigured environment fails at checkout, not at boot. */
export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(requireSecretKey(), {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
      typescript: true,
      appInfo: {
        name: 'Grace & Glam Australia',
        version: '1.0.0',
      },
    });
  }
  return client;
}

/** Publishable keys are public by design; this one is safe in the browser. */
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
