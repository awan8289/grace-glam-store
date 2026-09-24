import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCustomerId, isAuthenticated, unauthorized } from '@/lib/auth';
import { getCustomer } from '@/lib/customers';
import { listOrders, placeOrder } from '@/lib/orders';
import { getProduct } from '@/lib/products';
import { formatPrice } from '@/lib/format';
import { getVariantImages } from '@/types';
import { OrderItem, OrderStatus } from '@/types/account';

export const dynamic = 'force-dynamic';

/** Admin only — the proxy already rejects unauthenticated GETs. */
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) return unauthorized();

  const params = request.nextUrl.searchParams;
  const orders = await listOrders({
    status: (params.get('status') as OrderStatus | 'all' | 'open') ?? 'all',
    search: params.get('search') ?? undefined,
  });

  return Response.json({ orders, count: orders.length });
}

interface CartLine {
  productId: string;
  variantId?: string;
  size?: string;
  quantity?: number;
}

/**
 * Places an order for the signed-in customer.
 *
 * Prices, names and images are read from the catalogue on the server — the
 * client only says *what* it wants, never what it costs. Trusting a
 * client-supplied price would let anyone buy at any amount.
 */
export async function POST(request: NextRequest) {
  const customerId = await getCustomerId();
  if (!customerId) return unauthorized();

  const customer = await getCustomer(customerId);
  if (!customer) return unauthorized();

  let body: { items?: CartLine[]; addressId?: string; paymentMethod?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const lines = Array.isArray(body.items) ? body.items : [];
  if (lines.length === 0) {
    return Response.json({ error: 'Your bag is empty.' }, { status: 400 });
  }

  const items: OrderItem[] = [];

  for (const line of lines) {
    const product = await getProduct(String(line.productId ?? ''));
    if (!product || product.status !== 'active') {
      return Response.json(
        { error: `A product in your bag is no longer available.` },
        { status: 409 }
      );
    }

    // Floor, never round: a fractional quantity must not bill for more than asked.
    const quantity = Math.max(1, Math.min(99, Math.floor(Number(line.quantity) || 1)));
    const variant = product.variants.find((entry) => entry.id === line.variantId);

    // Stock is NOT checked here on purpose. `reserveStock` inside placeOrder is
    // the single authoritative check-and-take; a check at this point would be
    // stale by the time the stock is actually taken.
    items.push({
      productId: product.id,
      variantId: variant?.id,
      name: product.name,
      price: formatPrice(product.price),
      unitPrice: product.price,
      quantity,
      image: getVariantImages(product, variant?.id)[0] ?? '/products/placeholder.webp',
      size: String(line.size ?? product.sizes[0] ?? 'One Size'),
      color: variant?.colorName ?? 'Default',
    });
  }

  const address =
    customer.addresses.find((entry) => entry.id === body.addressId) ??
    customer.addresses.find((entry) => entry.isDefault) ??
    customer.addresses[0];

  if (!address) {
    return Response.json({ error: 'Add a delivery address first.' }, { status: 400 });
  }

  const result = await placeOrder({
    customer,
    items,
    shippingAddress: `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`,
    // Copied field by field, not referenced: the shopper may edit or delete this
    // address later, and a dispatched parcel's destination must not change with it.
    shippingDetails: {
      label: address.label ?? '',
      fullName: address.fullName ?? customer.name,
      phone: address.phone ?? customer.phone ?? '',
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
    },
    paymentMethod: String(body.paymentMethod ?? 'Card').slice(0, 60),
  });

  if (!result.ok) {
    // Sold out, colour gone, product unpublished — all recoverable by the
    // shopper, so 409 rather than a server error.
    return Response.json({ error: result.error }, { status: 409 });
  }

  // Stock changed, so the storefront's cached pages are now stale.
  revalidatePath('/', 'layout');

  return Response.json({ order: result.order }, { status: 201 });
}
