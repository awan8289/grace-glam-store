import { NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { fulfilCheckoutSession } from '@/lib/checkout-fulfilment';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Stripe webhook — the reliable path to an order.
 *
 * Stripe calls this for every completed checkout, whether or not the shopper
 * ever comes back to the success page. It retries for up to three days on any
 * non-2xx answer, so infrastructure errors return 500 on purpose.
 *
 * Setup (Stripe dashboard → Developers → Webhooks → Add endpoint):
 *   URL:    https://graceandglam.com.au/api/webhooks/stripe
 *   Events: checkout.session.completed
 *           checkout.session.async_payment_succeeded
 * Copy the endpoint's signing secret (whsec_…) into STRIPE_WEBHOOK_SECRET.
 *
 * Local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
 * prints a whsec_… for your .env.local, then `stripe trigger checkout.session.completed`
 * or pay on the test checkout with card 4242 4242 4242 4242.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set — refusing unsigned events.');
    return Response.json({ error: 'Webhook not configured.' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return Response.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }

  // The signature covers the exact bytes Stripe sent, so read the raw body —
  // never request.json() here.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.warn('[webhook] Signature check failed:', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  if (
    event.type !== 'checkout.session.completed' &&
    event.type !== 'checkout.session.async_payment_succeeded'
  ) {
    // Acknowledge everything else so Stripe stops sending it.
    return Response.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Bank-debit style methods complete first and pay later; the
  // async_payment_succeeded event brings those back once they are paid.
  if (session.payment_status !== 'paid') {
    return Response.json({ received: true, waitingForPayment: session.id });
  }

  try {
    const result = await fulfilCheckoutSession(session);
    if (result.ok) {
      console.log(
        `[webhook] ${session.id} → order ${result.order.id}${result.alreadyProcessed ? ' (already created)' : ''}`
      );
      return Response.json({ received: true, orderId: result.order.id });
    }
    if (result.pending) {
      // Another request is creating it right now; a retry will find it.
      return Response.json({ error: 'Order creation in progress.' }, { status: 409 });
    }
    // A business failure (e.g. out of stock, unreadable cart). Retrying will
    // not fix it, so acknowledge and leave it for a human — the claim record
    // in Firestore `stripe_sessions/<id>` keeps the reason.
    console.error(`[webhook] PAID session ${session.id} needs manual attention: ${result.error}`);
    return Response.json({ received: true, needsAttention: result.error });
  } catch (error) {
    console.error('[webhook] Fulfilment error (Stripe will retry):', error);
    return Response.json({ error: 'Temporary failure.' }, { status: 500 });
  }
}
