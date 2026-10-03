import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { getOrder, recordRefund } from '@/lib/orders';
import { getStripe } from '@/lib/stripe';
import { getPaymentSummary } from '@/lib/stripe-payment';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

const REASONS = ['requested_by_customer', 'duplicate', 'fraudulent'] as const;

/**
 * Admin-only. Refunds part or all of an order through Stripe, back to the card
 * (or wallet) the customer paid with. Money goes back through Stripe, so no card
 * details are ever needed or stored here.
 *
 * Body: { amount?: number (AUD, omit for everything still refundable), reason?, note? }
 */
export async function POST(request: NextRequest, { params }: Context) {
  // The proxy already blocks non-admins on /api/orders/* mutations; check again here.
  if (!(await isAuthenticated())) return unauthorized();

  const { id } = await params;
  const order = await getOrder(id);
  if (!order) return Response.json({ error: 'Order not found.' }, { status: 404 });
  if (!order.stripePaymentId) {
    return Response.json(
      { error: 'This order has no Stripe payment attached, so it cannot be refunded from here.' },
      { status: 400 }
    );
  }

  let body: { amount?: number | string; reason?: string; note?: string } = {};
  try {
    body = await request.json();
  } catch {
    // empty body = full refund
  }

  // Stripe is the source of truth for what is still refundable — it also knows
  // about refunds someone made directly in the Stripe dashboard.
  const payment = await getPaymentSummary(order.stripePaymentId);
  if (!payment) {
    return Response.json({ error: 'Could not reach Stripe. Try again in a moment.' }, { status: 502 });
  }
  const remaining = Number((payment.paid - payment.refunded).toFixed(2));
  if (remaining <= 0) {
    return Response.json({ error: 'This order has already been fully refunded.' }, { status: 409 });
  }

  const requested = body.amount === undefined || body.amount === '' ? remaining : Number(body.amount);
  if (!Number.isFinite(requested) || requested <= 0) {
    return Response.json({ error: 'Enter a refund amount greater than zero.' }, { status: 400 });
  }
  if (requested > remaining + 0.001) {
    return Response.json(
      { error: `You can refund at most A$${remaining.toFixed(2)} on this order.` },
      { status: 400 }
    );
  }

  const cents = Math.round(requested * 100);
  const reason = (REASONS as readonly string[]).includes(String(body.reason))
    ? (body.reason as (typeof REASONS)[number])
    : 'requested_by_customer';
  const note = String(body.note ?? '').trim().slice(0, 200);

  try {
    const refund = await getStripe().refunds.create(
      {
        payment_intent: order.stripePaymentId,
        amount: cents,
        reason,
        metadata: { orderId: order.id, note },
      },
      // Same order + same running count + same amount = same refund, so a
      // double-click or a retried request cannot pay the customer twice.
      { idempotencyKey: `refund-${order.id}-${order.refunds?.length ?? 0}-${cents}` }
    );

    const updated = await recordRefund(order.id, {
      id: refund.id,
      amount: refund.amount / 100,
      reason: note || reason.replace(/_/g, ' '),
      status: refund.status ?? 'pending',
      createdAt: new Date().toISOString(),
    });

    revalidatePath('/admin', 'layout');
    return Response.json({ ok: true, refund: { id: refund.id, amount: refund.amount / 100, status: refund.status }, order: updated });
  } catch (error) {
    console.error('[refund] Stripe refund failed for', order.id, error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Stripe could not process the refund.' },
      { status: 502 }
    );
  }
}
