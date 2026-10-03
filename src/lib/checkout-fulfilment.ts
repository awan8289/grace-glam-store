/**
 * Turns a paid Stripe Checkout Session into an order — exactly once.
 *
 * Two callers reach this for the same payment:
 *   - the Stripe webhook (`/api/webhooks/stripe`), which fires even if the
 *     shopper closes the tab after paying, and
 *   - the success page (`/api/checkout/verify`), which fires when they return.
 *
 * Whichever arrives first creates the order; the other gets that same order
 * back. The guard is a Firestore document keyed by the session id and created
 * with `create()`, which fails if it already exists — so even two requests at
 * the same instant, on different servers, cannot both place the order, take
 * the stock twice, or send CJ two orders.
 */
import type Stripe from 'stripe';
import { revalidatePath } from 'next/cache';
import { getDb } from '@/lib/firebase-admin';
import { getCustomer } from '@/lib/customers';
import { getOrder, placeOrder } from '@/lib/orders';
import { getProduct } from '@/lib/products';
import { formatPrice } from '@/lib/format';
import { getVariantImages } from '@/types';
import { Order, OrderItem, PublicCustomer, ShippingDetails } from '@/types/account';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { pushOrderToCjDropshipping } from '@/lib/cj-dropshipping';
import { resolveVariant, sanitizeCustomImageUrl, unitPriceFor } from '@/lib/pricing';
import { joinFromMetadata } from '@/lib/stripe-metadata';

const CLAIMS = 'stripe_sessions';

export type FulfilResult =
  | { ok: true; order: Order; alreadyProcessed: boolean }
  | { ok: false; pending: true }
  | { ok: false; pending?: false; error: string; status: number };

interface ClaimDoc {
  status: 'processing' | 'done' | 'failed';
  orderId?: string;
  error?: string;
  claimedAt: string;
}

/** Firestore's ALREADY_EXISTS gRPC code. */
const ALREADY_EXISTS = 6;

async function claimSession(sessionId: string): Promise<'claimed' | ClaimDoc> {
  const ref = getDb().collection(CLAIMS).doc(sessionId);
  try {
    await ref.create({ status: 'processing', claimedAt: new Date().toISOString() } satisfies ClaimDoc);
    return 'claimed';
  } catch (error) {
    if ((error as { code?: number }).code !== ALREADY_EXISTS) throw error;
    const snap = await ref.get();
    return (snap.data() as ClaimDoc) ?? { status: 'processing', claimedAt: '' };
  }
}

/** Waits for another request that is mid-way through creating this order. */
async function waitForOrder(sessionId: string, timeoutMs = 10_000): Promise<Order | null> {
  const ref = getDb().collection(CLAIMS).doc(sessionId);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    const claim = (await ref.get()).data() as ClaimDoc | undefined;
    if (claim?.status === 'done' && claim.orderId) return getOrder(claim.orderId);
    if (!claim || claim.status === 'failed') return null;
  }
  return null;
}

interface RawMetadataItem {
  productId: string;
  variantId?: string;
  quantity?: number | string;
  size?: string;
  color?: string;
  customText?: string;
  secondaryCustomText?: string;
  customImage?: string;
  script?: string;
  chainLength?: string;
  giftBox?: boolean;
  isBundle?: boolean;
}

async function buildItems(session: Stripe.Checkout.Session): Promise<OrderItem[]> {
  const raw = joinFromMetadata(session.metadata);
  if (!raw) return [];

  let parsed: RawMetadataItem[] = [];
  try {
    parsed = JSON.parse(raw) as RawMetadataItem[];
  } catch (e) {
    console.error('[fulfilment] Could not parse cart from session metadata:', e);
    return [];
  }

  const items: OrderItem[] = [];
  for (const line of parsed) {
    const product = await getProduct(line.productId);
    if (!product) continue;

    const isBundle = Boolean(line.isBundle);
    const giftBox = Boolean(line.giftBox);
    const variant = resolveVariant(product, line.variantId, line.size);
    const unitPrice = unitPriceFor(product, variant, { isBundle, giftBox });

    items.push({
      productId: product.id,
      variantId: variant?.id ?? '',
      name: product.name,
      price: formatPrice(unitPrice),
      unitPrice,
      quantity: Math.max(1, Math.floor(Number(line.quantity) || 1)),
      image: getVariantImages(product, variant?.id)[0] ?? '/products/placeholder.webp',
      size: String(line.size ?? product.sizes[0] ?? 'One Size'),
      color: variant?.colorName ?? line.color ?? 'Default',
      customText: line.customText,
      secondaryCustomText: line.secondaryCustomText,
      customImage: sanitizeCustomImageUrl(line.customImage),
      unitCost:
        product.baseCost != null || product.shippingCost != null
          ? Number(((product.baseCost ?? 0) + (product.shippingCost ?? 0)).toFixed(2))
          : undefined,
      script: line.script === 'Arabic' ? 'Arabic' : 'English',
      chainLength: line.chainLength ? String(line.chainLength) : undefined,
      giftBox,
      isBundle,
    });
  }
  return items;
}

async function resolveCustomer(session: Stripe.Checkout.Session): Promise<PublicCustomer> {
  const customerId = session.metadata?.customerId;
  const customer = customerId && customerId !== 'guest' ? await getCustomer(customerId) : null;
  if (customer) return customer;

  const now = new Date().toISOString();
  return {
    id: customerId || 'guest',
    name: session.customer_details?.name || session.metadata?.customerName || 'Valued Customer',
    email:
      session.customer_details?.email ||
      session.metadata?.customerEmail ||
      session.customer_email ||
      'customer@graceandglam.com.au',
    avatar: 'GG',
    addresses: [],
    savedCards: [],
    createdAt: now,
    updatedAt: now,
  };
}

interface StripeAddressBlock {
  name?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
}

function resolveShipping(session: Stripe.Checkout.Session, fallbackName: string): ShippingDetails {
  let shipping: ShippingDetails = {
    label: 'Home',
    fullName: fallbackName,
    phone: session.customer_details?.phone || '',
    street: '',
    city: '',
    state: 'NSW',
    zipCode: '2000',
    country: 'Australia',
  };

  if (session.metadata?.shippingDetails) {
    try {
      shipping = { ...shipping, ...(JSON.parse(session.metadata.shippingDetails) as Partial<ShippingDetails>) };
    } catch (e) {
      console.error('[fulfilment] Could not parse shipping metadata:', e);
    }
  }

  // The address the shopper typed on Stripe's page wins. Newer API versions
  // put it under collected_information; older ones under shipping_details.
  const s = session as unknown as {
    shipping_details?: StripeAddressBlock | null;
    collected_information?: { shipping_details?: StripeAddressBlock | null } | null;
  };
  const collected = s.collected_information?.shipping_details ?? s.shipping_details;
  const a = collected?.address;
  if (a) {
    shipping.fullName = collected?.name || shipping.fullName;
    shipping.street = [a.line1, a.line2].filter(Boolean).join(', ') || shipping.street;
    shipping.city = a.city || shipping.city;
    shipping.state = a.state || shipping.state;
    shipping.zipCode = a.postal_code || shipping.zipCode;
    shipping.country = a.country === 'AU' ? 'Australia' : a.country || 'Australia';
  }
  return shipping;
}

/**
 * Creates the order for a paid session, or returns the one already created.
 * Throws only on infrastructure errors (Firestore down), so a webhook caller
 * can answer 500 and let Stripe retry.
 */
export async function fulfilCheckoutSession(session: Stripe.Checkout.Session): Promise<FulfilResult> {
  if (session.payment_status !== 'paid') {
    return { ok: false, status: 400, error: `Payment status is '${session.payment_status}'.` };
  }

  const claim = await claimSession(session.id);
  if (claim !== 'claimed') {
    if (claim.status === 'done' && claim.orderId) {
      const existing = await getOrder(claim.orderId);
      if (existing) return { ok: true, order: existing, alreadyProcessed: true };
    }
    if (claim.status === 'failed') {
      return { ok: false, status: 409, error: claim.error || 'This payment could not be turned into an order.' };
    }
    const order = await waitForOrder(session.id);
    return order ? { ok: true, order, alreadyProcessed: true } : { ok: false, pending: true };
  }

  const claimRef = getDb().collection(CLAIMS).doc(session.id);

  try {
    const customer = await resolveCustomer(session);
    const items = await buildItems(session);
    if (items.length === 0) {
      await claimRef.set({ status: 'failed', error: 'No items found on the paid session.' }, { merge: true });
      console.error(`[fulfilment] PAID session ${session.id} has no readable items — refund or create the order by hand.`);
      return { ok: false, status: 422, error: 'Your payment went through but we could not read your bag. We will contact you.' };
    }

    const shippingDetails = resolveShipping(session, customer.name);
    const shippingAddress = `${shippingDetails.street}, ${shippingDetails.city}, ${shippingDetails.state} ${shippingDetails.zipCode}, ${shippingDetails.country}`;
    const primaryCustomText = session.metadata?.primaryCustomText || items.find((i) => i.customText)?.customText;
    const paymentIntentId =
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

    const result = await placeOrder({
      customer,
      items,
      shippingAddress,
      shippingDetails,
      paymentMethod: 'Stripe (Card / Apple Pay / Google Pay)',
      customText: primaryCustomText,
      stripePaymentId: paymentIntentId,
      stripeSessionId: session.id,
    });

    if (!result.ok) {
      await claimRef.set({ status: 'failed', error: result.error }, { merge: true });
      console.error(`[fulfilment] PAID session ${session.id} could not be placed: ${result.error}`);
      return { ok: false, status: 409, error: result.error };
    }

    await claimRef.set({ status: 'done', orderId: result.order.id }, { merge: true });

    // Side effects after the order is safely recorded. Awaited (not
    // fire-and-forget) so they finish before a serverless runtime freezes.
    await Promise.allSettled([
      sendOrderConfirmationEmail({ to: customer.email, order: result.order, customText: primaryCustomText }).catch(
        (err) => console.error('[fulfilment] Order email failed:', err)
      ),
      pushOrderToCjDropshipping(result.order, primaryCustomText).catch((err) =>
        console.error('[fulfilment] CJ push failed:', err)
      ),
    ]);

    try {
      revalidatePath('/', 'layout');
    } catch {
      // Not available outside a request scope; harmless.
    }

    return { ok: true, order: result.order, alreadyProcessed: false };
  } catch (error) {
    // Release the claim so Stripe's retry (or the success page) can try again.
    await claimRef.delete().catch(() => undefined);
    throw error;
  }
}
