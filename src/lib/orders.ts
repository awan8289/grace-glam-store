import { randomInt } from 'node:crypto';
import { createFirestoreStore } from '@/lib/firestore-store';
import { applyStockMovements, reserveStock, StockMovement } from '@/lib/products';
import { formatPrice } from '@/lib/format';
import {
  OPEN_STATUSES,
  ORDER_STATUSES,
  Order,
  OrderItem,
  OrderStatus,
  PublicCustomer,
  ShippingDetails,
  TrackingStep,
} from '@/types/account';

const orderStore = createFirestoreStore<Order>('orders');

const CARRIER = 'Australia Post';

// ---------------------------------------------------------------------------
// Tracking timeline
// ---------------------------------------------------------------------------

/**
 * Copy shown to the customer for each status. Changing a status appends the
 * matching step, which is what drives the timeline on the account page.
 */
const STATUS_STEP: Record<OrderStatus, { title: string; description: string }> = {
  Processing: {
    title: 'Order Placed & Payment Verified',
    description: 'Payment authorised. Your order is being picked and packed.',
  },
  'In Transit': {
    title: 'Dispatched & In Transit',
    description: 'Handed to the carrier and on its way to you.',
  },
  'Out for Delivery': {
    title: 'Out for Delivery',
    description: 'With the local courier for delivery today.',
  },
  Delivered: {
    title: 'Delivered',
    description: 'Package delivered. We hope you love it.',
  },
  Cancelled: {
    title: 'Order Cancelled',
    description: 'This order was cancelled and the items returned to stock.',
  },
};

function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Rebuilds the timeline for a status change: everything already recorded is
 * marked complete and the new status becomes the current step.
 */
function appendStep(steps: TrackingStep[], status: OrderStatus, location: string): TrackingStep[] {
  const completed = steps
    .filter((step) => step.status !== 'pending')
    .map((step) => ({ ...step, status: 'completed' as const }));

  const copy = STATUS_STEP[status];
  return [
    ...completed,
    {
      title: copy.title,
      description: copy.description,
      timestamp: formatTimestamp(new Date()),
      location,
      status: 'current' as const,
    },
  ];
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export interface OrderQuery {
  status?: OrderStatus | 'all' | 'open';
  search?: string;
}

export async function listOrders(query: OrderQuery = {}): Promise<Order[]> {
  let orders = [...(await orderStore.read())];

  if (query.status === 'open') {
    orders = orders.filter((order) => OPEN_STATUSES.includes(order.status));
  } else if (query.status && query.status !== 'all') {
    orders = orders.filter((order) => order.status === query.status);
  }

  if (query.search?.trim()) {
    const needle = query.search.trim().toLowerCase();
    orders = orders.filter((order) =>
      [order.id, order.customerName, order.customerEmail, order.trackingNumber]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }

  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listOrdersForCustomer(customerId: string): Promise<Order[]> {
  const orders = await orderStore.read();
  return orders
    .filter((order) => order.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(id: string): Promise<Order | null> {
  const orders = await orderStore.read();
  return orders.find((order) => order.id === id) ?? null;
}

export async function getOrderStats() {
  const orders = await orderStore.read();
  return {
    total: orders.length,
    open: orders.filter((order) => OPEN_STATUSES.includes(order.status)).length,
    revenue: orders
      .filter((order) => order.status !== 'Cancelled')
      .reduce((sum, order) => sum + order.subtotal, 0),
  };
}

// ---------------------------------------------------------------------------
// Placing an order
// ---------------------------------------------------------------------------

export interface PlaceOrderInput {
  customer: PublicCustomer;
  items: OrderItem[];
  shippingAddress: string;
  shippingDetails?: ShippingDetails;
  paymentMethod: string;
}

function movementsFor(items: OrderItem[]): StockMovement[] {
  return items.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    quantity: item.quantity,
  }));
}

export type PlaceOrderResult = { ok: true; order: Order } | { ok: false; error: string };

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const now = new Date();
  const estimated = new Date(now);
  estimated.setDate(estimated.getDate() + 4);

  const estimatedDelivery = estimated.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const order: Order = {
    id: `GM-${randomInt(10000, 99999)}`,
    customerId: input.customer.id,
    customerName: input.customer.name,
    customerEmail: input.customer.email,
    date: now.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
    total: formatPrice(subtotal),
    subtotal,
    status: 'Processing',
    paymentMethod: input.paymentMethod,
    shippingAddress: input.shippingAddress,
    shippingDetails: input.shippingDetails,
    destinationCountry: input.shippingDetails?.country || 'Australia',
    trackingNumber: `GG${randomInt(10000000, 99999999)}AU`,
    carrier: CARRIER,
    estimatedDelivery,
    items: input.items,
    trackingSteps: appendStep([], 'Processing', 'Online Store'),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  // Reserve first: this is the authoritative check-and-take, done atomically so
  // two shoppers cannot both claim the last unit.
  const movements = movementsFor(order.items);
  const reserved = await reserveStock(movements);
  if (!reserved.ok) return { ok: false, error: reserved.error };

  try {
    await orderStore.mutate(async (orders) => {
      await orderStore.write([...orders, order]);
    });
  } catch (cause) {
    // The stock is already gone but the order was not recorded. Put it back,
    // otherwise the units would be lost with nothing to show for them.
    await applyStockMovements(movements, 1);
    throw cause;
  }

  return { ok: true, order };
}

// ---------------------------------------------------------------------------
// Status changes (admin)
// ---------------------------------------------------------------------------

export async function setOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  if (!ORDER_STATUSES.includes(status)) return null;

  // Decided inside the lock, applied outside it, so the catalogue and order
  // queues are never held at the same time.
  let restore: StockMovement[] = [];
  let take: StockMovement[] = [];

  const updated = await orderStore.mutate(async (orders) => {
    const index = orders.findIndex((order) => order.id === id);
    if (index === -1) return null;

    const order = orders[index];
    if (order.status === status) return order;

    const wasCancelled = order.status === 'Cancelled';

    if (status === 'Cancelled' && !order.stockRestored) {
      restore = movementsFor(order.items);
      order.stockRestored = true;
    } else if (wasCancelled && order.stockRestored) {
      // Reopening a cancelled order takes the stock back out.
      take = movementsFor(order.items);
      order.stockRestored = false;
    }

    const location =
      status === 'Delivered' || status === 'Out for Delivery'
        ? order.shippingAddress
        : 'Grace & Glam, Australia';

    order.status = status;
    order.trackingSteps = appendStep(order.trackingSteps, status, location);
    order.updatedAt = new Date().toISOString();

    orders[index] = order;
    await orderStore.write(orders);
    return order;
  });

  if (restore.length > 0) await applyStockMovements(restore, 1);
  if (take.length > 0) await applyStockMovements(take, -1);

  return updated;
}
