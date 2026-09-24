import Link from 'next/link';
import { listOrders } from '@/lib/orders';
import { formatDate } from '@/lib/format';
import { ORDER_STATUSES, OrderStatus } from '@/types/account';
import AdminSearchFilters from '@/components/admin/AdminSearchFilters';
import OrderStatusControl from '@/components/admin/OrderStatusControl';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Orders' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const orders = await listOrders({
    status: (one(params.status) as OrderStatus | 'all' | 'open') ?? 'all',
    search: one(params.search),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-[13px] text-[#6b6b73]">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
        </p>
      </header>

      <AdminSearchFilters
        placeholder="Search order #, customer or tracking"
        selects={[
          {
            param: 'status',
            label: 'Filter by status',
            options: [
              { value: 'all', label: 'All statuses' },
              { value: 'open', label: 'Needs action' },
              ...ORDER_STATUSES.map((status) => ({ value: status, label: status })),
            ],
          },
        ]}
      />

      {orders.length === 0 ? (
        <div className="rounded-lg border border-[#ececea] bg-white px-5 py-16 text-center">
          <p className="text-[14px] font-medium">No orders match these filters.</p>
          <Link href="/admin/orders" className="mt-2 inline-block text-[13px] text-[#6b6b73] hover:text-[#16161a]">
            Clear filters
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#ececea] bg-white">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead className="border-b border-[#ececea] text-[11px] uppercase tracking-[0.06em] text-[#8a8a93]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Order</th>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Placed</th>
                <th className="px-4 py-2.5 text-right font-medium">Items</th>
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
                    <p className="mt-0.5 font-mono text-[11px] text-[#8a8a93]">{order.trackingNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${order.customerId}`}
                      className="block truncate hover:underline"
                    >
                      {order.customerName}
                    </Link>
                    <span className="text-[12px] text-[#8a8a93]">{order.customerEmail}</span>
                  </td>
                  <td className="px-4 py-3 text-[#6b6b73]">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#6b6b73]">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{order.total}</td>
                  <td className="px-4 py-3">
                    <OrderStatusControl order={order} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
