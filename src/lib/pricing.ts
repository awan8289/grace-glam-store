import type { Product } from '@/types';

/**
 * Calculate the recommended retail price from CJ base cost + shipping.
 * Falls back to the product's defined price if costs are not set.
 */
export function calculateDynamicPrice(product: Product): number {
  if (product.baseCost != null && product.shippingCost != null) {
    return Number((product.baseCost + product.shippingCost).toFixed(2));
  }
  return product.price;
}

export function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
}

// ---------------------------------------------------------------------------
// Checkout pricing — shared by the checkout page and the Stripe routes so the
// total a shopper sees is the total Stripe charges.
// ---------------------------------------------------------------------------

export const GIFT_BOX_PRICE_AUD = 9.95;
// Delivery is free on every order, Australia-wide. Change FLAT_SHIPPING_AUD
// (and the copy that says "free delivery") if that ever changes.
export const FLAT_SHIPPING_AUD = 0;
export const FREE_SHIPPING_THRESHOLD_AUD = 0;

/** Shipping for a merchandise subtotal in AUD. */
export function shippingForSubtotal(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD_AUD ? 0 : FLAT_SHIPPING_AUD; // always 0 today
}

/** The variant a cart line refers to: by id first, then by size. */
export function resolveVariant(product: Product, variantId?: string, size?: string) {
  const byId = variantId ? product.variants.find((v) => v.id === variantId) : undefined;
  if (byId) return byId;
  return size ? product.variants.find((v) => v.size === size) : undefined;
}

/** Server-side unit price for a line: variant price wins over the base price. */
export function unitPriceFor(
  product: Product,
  variant: { price?: number } | undefined,
  options: { isBundle?: boolean; giftBox?: boolean } = {}
): number {
  const base = variant?.price ?? product.price;
  const withBundle = options.isBundle ? base * 1.8 : base;
  return withBundle + (options.giftBox ? GIFT_BOX_PRICE_AUD : 0);
}

/** Only accept photo URLs this site issued (local uploads or Firebase Storage). */
export function sanitizeCustomImageUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 800) return undefined;
  if (/^\/uploads\/customer-photos\/[\w.-]+$/.test(value)) return value;
  if (value.startsWith('https://firebasestorage.googleapis.com/')) return value;
  return undefined;
}
