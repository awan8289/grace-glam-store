import { NextRequest } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { fulfilCheckoutSession } from '@/lib/checkout-fulfilment';

export const dynamic = 'force-dynamic';

/**
 * Called by the success page after Stripe redirects back. The order may
 * already exist (the webhook got there first) — either way the shopper gets
 * the same order back. All order-creation logic lives in
 * `src/lib/checkout-fulfilment.ts`, shared with `/api/webhooks/stripe`.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('session_id');
    if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
      return Response.json({ error: 'Missing or invalid session_id.' }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const result = await fulfilCheckoutSession(session);

    if (result.ok) {
      return Response.json({ ok: true, order: result.order, alreadyProcessed: result.alreadyProcessed });
    }
    if (result.pending) {
      return Response.json(
        { ok: false, pending: true, error: 'Your payment is confirmed and your order is being created. Refresh in a moment.' },
        { status: 202 }
      );
    }
    return Response.json({ error: result.error }, { status: result.status });
  } catch (error) {
    console.error('Stripe verification error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not verify your payment.' },
      { status: 500 }
    );
  }
}
