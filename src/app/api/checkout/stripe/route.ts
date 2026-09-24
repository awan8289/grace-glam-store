import { NextRequest } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getCustomerId } from '@/lib/auth';
import { getCustomer } from '@/lib/customers';
import { getProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

interface CartLine {
  productId: string;
  variantId?: string;
  size?: string;
  quantity?: number;
}

/**
 * Creates a Stripe PaymentIntent in AUD for the customer's cart.
 */
export async function POST(request: NextRequest) {
  try {
    const customerId = await getCustomerId();
    const customer = customerId ? await getCustomer(customerId) : null;

    let body: { items?: CartLine[] };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const lines = Array.isArray(body.items) ? body.items : [];
    if (lines.length === 0) {
      return Response.json({ error: 'Your bag is empty.' }, { status: 400 });
    }

    // Calculate total on the server by fetching active products from DB
    let totalCents = 0;
    for (const line of lines) {
      const product = await getProduct(String(line.productId ?? ''));
      if (product && product.status === 'active') {
        const quantity = Math.max(1, Math.min(99, Math.floor(Number(line.quantity) || 1)));
        totalCents += Math.round(product.price * 100) * quantity;
      }
    }

    if (totalCents <= 0) {
      return Response.json({ error: 'Unable to calculate order total.' }, { status: 400 });
    }

    // Free shipping over A$150 (15000 cents), otherwise flat standard shipping of A$9.95 (995 cents)
    const shippingCents = totalCents >= 15000 ? 0 : 995;
    const finalAmountCents = totalCents + shippingCents;

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: finalAmountCents,
      currency: 'aud',
      automatic_payment_methods: { enabled: true },
      description: `Grace & Glam Boutique Order (${lines.length} items)`,
      metadata: {
        customerId: customerId || 'guest',
        customerEmail: customer?.email || '',
        customerName: customer?.name || '',
      },
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      amountCents: finalAmountCents,
      currency: 'aud',
    });
  } catch (error) {
    console.error('Stripe PaymentIntent error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to initialize Stripe payment.',
      },
      { status: 500 }
    );
  }
}
