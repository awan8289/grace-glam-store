import Link from 'next/link';
import { listCustomers } from '@/lib/customers';
import { listOrders } from '@/lib/orders';
import { formatDate, formatPrice } from '@/lib/format';
import AdminSearchFilters from '@/components/admin/AdminSearchFilters';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Customers' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminCustomersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = Array.isArray(params.search) ? params.search[0] : params.search;

  const [customers, orders] = await Promise.all([listCustomers(search), listOrders()]);

  // One pass over the orders instead of a query per customer.
  const totals = new Map<string, { count: number; spent: number }>();
  for (const order of orders) {
    if (order.status === 'Cancelled') continue;
    const entry = totals.get(order.customerId) ?? { count: 0, spent: 0 };
    entry.count += 1;
    entry.spent += order.subtotal;
    totals.set(order.customerId, entry);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Customers</h1>
        <p className="mt-1 text-[13px] text-[#6b6b73]">
          {customers.length} {customers.length === 1 ? 'account' : 'accounts'}
          {search ? ` matching “${search}”` : ''}
        </p>
      </header>

      <AdminSearchFilters placeholder="Search name, email or phone" />

      {customers.length === 0 ? (
        <div className="rounded-lg border border-[#ececea] bg-white px-5 py-16 text-center">
          <p className="text-[14px] font-medium">
            {search ? 'No customers match that search.' : 'No accounts yet.'}
          </p>
          <p className="mt-1 text-[13px] text-[#8a8a93]">
            Accounts appear here as soon as shoppers register on the storefront.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#ececea] bg-white">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="border-b border-[#ececea] text-[11px] uppercase tracking-[0.06em] text-[#8a8a93]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Customer</th>
                <th className="px-4 py-2.5 font-medium">Phone</th>
                <th className="px-4 py-2.5 font-medium">Location</th>
                <th className="px-4 py-2.5 text-right font-medium">Orders</th>
                <th className="px-4 py-2.5 text-right font-medium">Spent</th>
                <th className="px-4 py-2.5 text-right font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f2f0]">
              {customers.map((customer) => {
                const stats = totals.get(customer.id) ?? { count: 0, spent: 0 };
                const primary =
                  customer.addresses.find((address) => address.isDefault) ?? customer.addresses[0];

                return (
                  <tr key={customer.id} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f2f2f0] text-[11px] font-medium text-[#6b6b73]">
                          {customer.avatar}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="block truncate font-medium hover:underline"
                          >
                            {customer.name}
                          </Link>
                          <span className="text-[12px] text-[#8a8a93]">{customer.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6b6b73]">{customer.phone || '—'}</td>
                    <td className="px-4 py-3 text-[#6b6b73]">
                      {primary ? `${primary.city}, ${primary.state}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{stats.count}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatPrice(stats.spent)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#8a8a93]">
                      {formatDate(customer.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
