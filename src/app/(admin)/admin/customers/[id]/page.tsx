import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCustomer } from '@/lib/customers';
import { listOrdersForCustomer } from '@/lib/orders';
import { formatDate, formatPrice } from '@/lib/format';
import { STATUS_TONE } from '@/components/admin/OrderStatusControl';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const customer = await getCustomer(id);
  return { title: customer ? customer.name : 'Customer not found' };
}

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const customer = await getCustomer(id);

  if (!customer) notFound();

  const orders = await listOrdersForCustomer(id);
  const spent = orders
    .filter((order) => order.status !== 'Cancelled')
    .reduce((sum, order) => sum + order.subtotal, 0);

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin/customers" className="text-[13px] text-[#6b6b73] hover:text-[#16161a]">
          ← Customers
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f2f2f0] text-[13px] font-medium text-[#6b6b73]">
            {customer.avatar}
          </span>
          <div>
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight">{customer.name}</h1>
            <p className="text-[13px] text-[#6b6b73]">
              {customer.email}
              {customer.phone ? ` · ${customer.phone}` : ''}
            </p>
          </div>
        </div>
      </header>

      {/* ---------------- Summary ---------------- */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#ececea] bg-[#ececea] lg:grid-cols-4">
        {[
          { label: 'Orders', value: String(orders.length) },
          { label: 'Lifetime spend', value: formatPrice(spent) },
          { label: 'Addresses', value: String(customer.addresses.length) },
          { label: 'Joined', value: formatDate(customer.createdAt) },
        ].map((tile) => (
          <div key={tile.label} className="bg-white px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8a93]">
              {tile.label}
            </p>
            <p className="mt-2 text-[18px] font-semibold tracking-tight tabular-nums">{tile.value}</p>
          </div>
        ))}
      </section>

      {/* ---------------- Addresses ---------------- */}
      <section>
        <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Address book</h2>
        {customer.addresses.length === 0 ? (
          <p className="rounded-lg border border-[#ececea] bg-white px-5 py-8 text-center text-[13px] text-[#8a8a93]">
            This customer has not saved an address yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {customer.addresses.map((address) => (
              <div key={address.id} className="rounded-lg border border-[#ececea] bg-white p-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-[13px] font-medium">{address.label}</span>
                  {address.isDefault && (
                    <span className="rounded bg-[#f2f2f0] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#6b6b73]">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-[13px] leading-relaxed text-[#6b6b73]">
                  {address.fullName}
                  {address.phone ? ` · ${address.phone}` : ''}
                  <br />
                  {address.street}
                  <br />
                  {address.city}, {address.state} {address.zipCode}
                  <br />
                  {address.country}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- Orders ---------------- */}
      <section>
        <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Orders</h2>
        {orders.length === 0 ? (
          <p className="rounded-lg border border-[#ececea] bg-white px-5 py-8 text-center text-[13px] text-[#8a8a93]">
            No orders from this customer yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#ececea] bg-white">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-[#ececea] text-[11px] uppercase tracking-[0.06em] text-[#8a8a93]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Order</th>
                  <th className="px-4 py-2.5 font-medium">Placed</th>
                  <th className="px-4 py-2.5 text-right font-medium">Total</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f0]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#6b6b73]">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">{order.total}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[12px] font-medium ${STATUS_TONE[order.status]}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
