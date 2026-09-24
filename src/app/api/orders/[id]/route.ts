import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { forbidden, getCustomerId, isAuthenticated, unauthorized } from '@/lib/auth';
import { getOrder, setOrderStatus } from '@/lib/orders';
import { OrderStatus, ORDER_STATUSES } from '@/types/account';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

/** Readable by the admin, or by the customer who placed it. */
export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;

  const order = await getOrder(id);
  if (!order) return Response.json({ error: 'Order not found.' }, { status: 404 });

  if (await isAuthenticated()) return Response.json({ order });

  const customerId = await getCustomerId();
  if (!customerId) return unauthorized();
  if (order.customerId !== customerId) return forbidden();

  return Response.json({ order });
}

/** Status changes are admin-only; the proxy rejects everyone else first. */
export async function PATCH(request: NextRequest, { params }: Context) {
  if (!(await isAuthenticated())) return unauthorized();

  const { id } = await params;

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const status = String(body.status ?? '') as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) {
    return Response.json(
      { error: `Status must be one of: ${ORDER_STATUSES.join(', ')}.` },
      { status: 400 }
    );
  }

  const order = await setOrderStatus(id, status);
  if (!order) return Response.json({ error: 'Order not found.' }, { status: 404 });

  // Cancelling returns stock, so catalogue pages may be stale.
  revalidatePath('/', 'layout');

  return Response.json({ order });
}
