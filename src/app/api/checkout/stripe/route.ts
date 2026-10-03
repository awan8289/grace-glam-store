import { NextRequest } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getCustomerId } from '@/lib/auth';
import { getCustomer } from '@/lib/customers';
import { getProduct } from '@/lib/products';
import {
  FLAT_SHIPPING_AUD,
  FREE_SHIPPING_THRESHOLD_AUD,
  resolveVariant,
  sanitizeCustomImageUrl,
  unitPriceFor,
} from '@/lib/pricing';
import { chunkForMetadata } from '@/lib/stripe-metadata';

export const dynamic = 'force-dynamic';

interface CartLine {
  productId: string;
  variantId?: string;
  size?: string;
  quantity?: number;
  customText?: string;
  secondaryCustomText?: string;
  customImage?: string;
  script?: 'English' | 'Arabic';
  chainLength?: string;
  giftBox?: boolean;
  isBundle?: boolean;
  selectedColor?: string;
}

interface ShippingInput {
  label?: string;
  fullName?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/**
 * Creates a real Stripe Checkout Session in AUD for the customer's cart.
 */
export async function POST(request: NextRequest) {
  try {
    const customerId = await getCustomerId();
    const customer = customerId ? await getCustomer(customerId) : null;

    let body: {
      items?: CartLine[];
      addressId?: string;
      shippingDetails?: ShippingInput;
    };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const lines = Array.isArray(body.items) ? body.items : [];
    if (lines.length === 0) {
      return Response.json({ error: 'Your bag is empty.' }, { status: 400 });
    }

    // Determine delivery address
    let shippingDetails = body.shippingDetails;
    if (!shippingDetails && customer && customer.addresses?.length > 0) {
      const match =
        customer.addresses.find((a) => a.id === body.addressId) ||
        customer.addresses.find((a) => a.isDefault) ||
        customer.addresses[0];
      if (match) {
        shippingDetails = {
          label: match.label,
          fullName: match.fullName,
          phone: match.phone,
          street: match.street,
          city: match.city,
          state: match.state,
          zipCode: match.zipCode,
          country: match.country || 'Australia',
        };
      }
    }

    // Origin resolution for redirect callbacks
    const headerOrigin = request.headers.get('origin');
    const baseUrl = headerOrigin || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const stripeLineItems = [];
    let subtotalCents = 0;
    const validatedItems = [];

    for (const line of lines) {
      const product = await getProduct(String(line.productId ?? ''));
      if (!product || product.status !== 'active') {
        return Response.json(
          { error: 'A product in your bag is no longer available.' },
          { status: 409 }
        );
      }

      const quantity = Math.max(1, Math.min(99, Math.floor(Number(line.quantity) || 1)));
      const isBundle = Boolean(line.isBundle);
      const giftBox = Boolean(line.giftBox);
      // Charge the selected variant's price (e.g. a larger canvas size), not
      // the product's base price.
      const variant = resolveVariant(product, line.variantId, line.size);
      // Same rules reserveStock applies after payment; checking them here stops
      // a shopper being charged for an order that cannot then be created.
      if (product.variants.length > 0 && !variant) {
        return Response.json({ error: `Please choose a colour for "${product.name}".` }, { status: 400 });
      }
      const available = variant ? variant.stock : product.stock;
      if (available < quantity) {
        return Response.json(
          { error: available > 0 ? `Only ${available} left of "${product.name}".` : `"${product.name}" is out of stock.` },
          { status: 409 }
        );
      }
      const unitPrice = unitPriceFor(product, variant, { isBundle, giftBox });
      const customImage = sanitizeCustomImageUrl(line.customImage);
      if (product.requiresPhotoUpload && !customImage) {
        return Response.json(
          { error: `Please upload your photo for "${product.name}" before checking out.` },
          { status: 400 }
        );
      }
      const unitAmountCents = Math.round(unitPrice * 100);

      subtotalCents += unitAmountCents * quantity;

      // Build descriptive details for the Stripe invoice
      const descParts: string[] = [];
      if (line.customText) descParts.push(`Inscription: "${line.customText.slice(0, 30)}"`);
      if (line.secondaryCustomText) descParts.push(`2nd Name: "${line.secondaryCustomText.slice(0, 30)}"`);
      if (line.script) descParts.push(`Script: ${line.script}`);
      if (line.chainLength) descParts.push(`Length: ${line.chainLength}`);
      if (line.size) descParts.push(`Size: ${line.size}`);
      if (customImage) descParts.push('📷 Your photo attached');
      if (line.selectedColor) descParts.push(`Finish: ${line.selectedColor}`);
      if (giftBox) descParts.push('🎁 Luxury Gift Box Included');

      stripeLineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: `${product.name}${isBundle ? ' (Matching Bundle Set)' : ''}`,
            description: descParts.length > 0 ? descParts.join(' • ') : undefined,
          },
          unit_amount: unitAmountCents,
        },
        quantity,
      });

      validatedItems.push({
        productId: product.id,
        variantId: variant?.id || '',
        quantity,
        size: line.size || product.sizes[0] || 'One Size',
        color: line.selectedColor || 'Default',
        customText: line.customText ? String(line.customText).trim().slice(0, 50) : undefined,
        secondaryCustomText: line.secondaryCustomText
          ? String(line.secondaryCustomText).trim().slice(0, 50)
          : undefined,
        customImage,
        script: line.script === 'Arabic' ? 'Arabic' : 'English',
        chainLength: line.chainLength ? String(line.chainLength) : undefined,
        giftBox,
        isBundle,
      });
    }

    if (subtotalCents <= 0) {
      return Response.json({ error: 'Unable to calculate order total.' }, { status: 400 });
    }

    // Shipping rule lives in src/lib/pricing.ts (currently free on every order).
    const isFreeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD_AUD * 100;
    const shippingCents = isFreeShipping ? 0 : Math.round(FLAT_SHIPPING_AUD * 100);
    const shippingOptions = [
      {
        shipping_rate_data: {
          type: 'fixed_amount' as const,
          fixed_amount: {
            amount: shippingCents,
            currency: 'aud',
          },
          display_name: isFreeShipping
            ? 'Free Tracked Delivery Australia-Wide'
            : 'Australia Post Tracked Delivery',
          delivery_estimate: {
            minimum: { unit: 'business_day' as const, value: 3 },
            maximum: { unit: 'business_day' as const, value: 7 },
          },
        },
      },
    ];

    const primaryCustomText = validatedItems.find((it) => it.customText)?.customText;

    // Serialize items into safe JSON chunks if needed (Stripe metadata has 500-char per field limit)
    const itemsJson = JSON.stringify(validatedItems);
    const shippingJson = shippingDetails ? JSON.stringify(shippingDetails) : '';

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card', 'link'],
      mode: 'payment',
      customer_email: customer?.email || undefined,
      line_items: stripeLineItems,
      shipping_options: shippingOptions,
      shipping_address_collection: {
        allowed_countries: ['AU'],
      },
      success_url: `${baseUrl}/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?canceled=true`,
      metadata: {
        customerId: customerId || 'guest',
        customerName: customer?.name || shippingDetails?.fullName || 'Valued Customer',
        customerEmail: customer?.email || '',
        addressId: body.addressId || '',
        shippingDetails: shippingJson.slice(0, 500),
        ...chunkForMetadata(itemsJson),
        primaryCustomText: primaryCustomText ? primaryCustomText.slice(0, 100) : '',
      },
    });

    if (!session.url) {
      throw new Error('Stripe failed to return a checkout URL.');
    }

    return Response.json({
      url: session.url,
      sessionId: session.id,
      amountCents: subtotalCents + shippingCents,
      currency: 'aud',
    });
  } catch (error) {
    console.error('Stripe Checkout Session error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Unable to initialize Stripe payment.',
      },
      { status: 500 }
    );
  }
}
