import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrder } from '@/lib/orders';
import { getCustomer } from '@/lib/customers';
import { formatDate, formatPrice } from '@/lib/format';
import OrderStatusControl from '@/components/admin/OrderStatusControl';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Order ${id}` };
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) notFound();

  const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

  // The order carries the address as entered at checkout. The customer record is
  // only consulted for a contact number when the address itself has none —
  // whoever packs this parcel should not have to open a second screen for it.
  const ship = order.shippingDetails;
  const customer = await getCustomer(order.customerId);
  const contactPhone = ship?.phone || customer?.phone || '';

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="text-[13px] text-[#6b6b73] hover:text-[#16161a]">
            ← Orders
          </Link>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight">{order.id}</h1>
          <p className="mt-1 text-[13px] text-[#6b6b73]">
            Placed {formatDate(order.createdAt)} · {units} {units === 1 ? 'item' : 'items'} ·{' '}
            {order.total}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8a93]">
            Status
          </span>
          <OrderStatusControl order={order} />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ---------------- Items ---------------- */}
        <section className="rounded-lg border border-[#ececea] bg-white lg:col-span-2">
          <h2 className="border-b border-[#ececea] px-5 py-3 text-[15px] font-semibold tracking-tight">
            Items
          </h2>
          <ul className="divide-y divide-[#f2f2f0]">
            {order.items.map((item, index) => (
              <li
                key={`${item.productId}-${item.variantId ?? 'base'}-${index}`}
                className="flex items-center gap-4 px-5 py-3"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-[#ececea] bg-[#f7f7f6]">
                  <Image src={item.image} alt="" fill sizes="56px" className="object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/products/${item.productId}`}
                    className="text-[13px] font-medium hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-[12px] text-[#8a8a93]">
                    {item.color} · Size {item.size}
                  </p>
                </div>
                <span className="text-[12px] tabular-nums text-[#8a8a93]">×{item.quantity}</span>
                <span className="w-20 text-right text-[13px] font-medium tabular-nums">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-[#ececea] px-5 py-3">
            <span className="text-[13px] text-[#6b6b73]">Total</span>
            <span className="text-[15px] font-semibold tabular-nums">{order.total}</span>
          </div>
        </section>

        {/* ---------------- Meta ---------------- */}
        <div className="space-y-6">
          <section className="rounded-lg border border-[#ececea] bg-white p-5">
            <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Customer</h2>
            <Link
              href={`/admin/customers/${order.customerId}`}
              className="text-[13px] font-medium hover:underline"
            >
              {order.customerName}
            </Link>
            <p className="mt-0.5 text-[13px] text-[#6b6b73]">
              <a href={`mailto:${order.customerEmail}`} className="hover:underline">
                {order.customerEmail}
              </a>
            </p>
            {contactPhone && (
              <p className="mt-0.5 text-[13px] text-[#6b6b73]">
                {/* Tappable, so the packer can call about a failed delivery. */}
                <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="hover:underline">
                  {contactPhone}
                </a>
              </p>
            )}

            <h3 className="mt-4 text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8a93]">
              Ship to
            </h3>

            {ship ? (
              <address className="mt-1 space-y-0.5 text-[13px] not-italic leading-relaxed text-[#16161a]">
                <span className="block font-medium">{ship.fullName}</span>
                {ship.phone && <span className="block text-[#6b6b73]">{ship.phone}</span>}
                <span className="block">{ship.street}</span>
                <span className="block">
                  {ship.city}, {ship.state} {ship.zipCode}
                </span>
                <span className="block">{ship.country}</span>
                {ship.label && (
                  <span className="mt-1.5 inline-block rounded border border-[#e2e2df] px-1.5 py-0.5 text-[11px] text-[#6b6b73]">
                    {ship.label}
                  </span>
                )}
              </address>
            ) : (
              // Orders placed before the structured address existed. Not a bug —
              // there is nothing finer-grained to show for them.
              <p className="mt-1 text-[13px] leading-relaxed text-[#16161a]">
                {order.shippingAddress}
              </p>
            )}
          </section>

          <section className="rounded-lg border border-[#ececea] bg-white p-5">
            <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Fulfilment</h2>
            <dl className="space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-[#6b6b73]">Carrier</dt>
                <dd className="text-right">{order.carrier}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#6b6b73]">Tracking</dt>
                <dd className="text-right font-mono text-[12px]">{order.trackingNumber}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#6b6b73]">Estimated</dt>
                <dd className="text-right">{order.estimatedDelivery}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[#6b6b73]">Payment</dt>
                <dd className="text-right">{order.paymentMethod}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      {/* ---------------- Timeline ---------------- */}
      <section className="rounded-lg border border-[#ececea] bg-white p-5">
        <h2 className="mb-1 text-[15px] font-semibold tracking-tight">Tracking timeline</h2>
        <p className="mb-4 text-[12px] text-[#8a8a93]">
          This is exactly what the customer sees on their account page. Changing the status above
          adds a step here.
        </p>
        <ol className="space-y-3">
          {order.trackingSteps.map((step, index) => (
            <li key={`${step.title}-${index}`} className="flex gap-3">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
                  step.status === 'completed'
                    ? 'bg-[#eaf5ed] text-[#1f6b3c]'
                    : step.status === 'current'
                      ? 'bg-[#16161a] text-white'
                      : 'bg-[#f2f2f0] text-[#a5a5ad]'
                }`}
              >
                {index + 1}
              </span>
              <div>
                <p className="text-[13px] font-medium">{step.title}</p>
                <p className="text-[12px] text-[#6b6b73]">{step.description}</p>
                <p className="mt-0.5 text-[11px] text-[#a5a5ad]">
                  {step.location} · {step.timestamp}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
