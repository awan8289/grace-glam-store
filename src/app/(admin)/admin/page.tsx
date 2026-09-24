import Link from 'next/link';
import { getInventoryStats, listProducts } from '@/lib/products';
import { countCustomers } from '@/lib/customers';
import { getOrderStats, listOrders } from '@/lib/orders';
import { formatPrice, formatPriceCompact, formatDate } from '@/lib/format';
import { getTotalStock } from '@/types';
import StockPill from '@/components/admin/StockPill';
import OrderStatusControl from '@/components/admin/OrderStatusControl';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Overview' };

export default async function AdminOverviewPage() {
  const [stats, products, orderStats, customerCount, openOrders] = await Promise.all([
    getInventoryStats(),
    listProducts({ sort: 'stock-asc' }),
    getOrderStats(),
    countCustomers(),
    listOrders({ status: 'open' }),
  ]);

  const needsAttention = products
    .filter((p) => getTotalStock(p) <= p.lowStockThreshold)
    .slice(0, 8);

  const recent = [...products]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  const tiles = [
    { label: 'Orders to action', value: String(orderStats.open), hint: `${orderStats.total} orders all time` },
    { label: 'Revenue', value: formatPriceCompact(orderStats.revenue), hint: 'Excludes cancelled orders' },
    { label: 'Customers', value: String(customerCount), hint: 'Registered accounts' },
    { label: 'Products', value: String(stats.totalProducts), hint: `${stats.activeProducts} active · ${stats.draftProducts} draft` },
    { label: 'Units on hand', value: stats.totalUnits.toLocaleString('en-AU'), hint: `${stats.variantCount} colour variants` },
    { label: 'Inventory value', value: formatPriceCompact(stats.inventoryValue), hint: 'Stock × selling price' },
    { label: 'Needs attention', value: String(stats.lowStockCount + stats.outOfStockCount), hint: `${stats.outOfStockCount} out of stock · ${stats.lowStockCount} low` },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-[13px] text-[#6b6b73]">
            {stats.productsWithVideo} of {stats.totalProducts} products have a video attached.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-[#16161a] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#2c2c33]"
        >
          Add product
        </Link>
      </header>

      {/* ---------------- KPI tiles ---------------- */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#ececea] bg-[#ececea] lg:grid-cols-4 xl:grid-cols-7">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-white px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8a93]">
              {tile.label}
            </p>
            <p className="mt-2 text-[26px] font-semibold leading-none tracking-tight tabular-nums">
              {tile.value}
            </p>
            <p className="mt-2 text-[12px] text-[#8a8a93]">{tile.hint}</p>
          </div>
        ))}
      </section>

      {/* ---------------- Orders needing action ---------------- */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight">Orders to action</h2>
          <Link href="/admin/orders" className="text-[13px] text-[#6b6b73] hover:text-[#16161a]">
            View all
          </Link>
        </div>

        {openOrders.length === 0 ? (
          <p className="rounded-lg border border-[#ececea] bg-white px-5 py-8 text-center text-[13px] text-[#8a8a93]">
            Nothing waiting — every order is delivered or cancelled.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#ececea] bg-white">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="border-b border-[#ececea] text-[11px] uppercase tracking-[0.06em] text-[#8a8a93]">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Order</th>
                  <th className="px-5 py-2.5 font-medium">Customer</th>
                  <th className="px-5 py-2.5 text-right font-medium">Total</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f0]">
                {openOrders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="hover:bg-[#fafafa]">
                    <td className="px-5 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                        {order.id}
                      </Link>
                      <span className="ml-2 text-[12px] text-[#8a8a93]">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-5 py-3 text-[#6b6b73]">{order.customerName}</td>
                    <td className="px-5 py-3 text-right font-medium tabular-nums">{order.total}</td>
                    <td className="px-5 py-3">
                      <OrderStatusControl order={order} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------------- Restock queue ---------------- */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold tracking-tight">Restock queue</h2>
          <Link href="/admin/products?lowStock=true" className="text-[13px] text-[#6b6b73] hover:text-[#16161a]">
            View all
          </Link>
        </div>

        {needsAttention.length === 0 ? (
          <p className="rounded-lg border border-[#ececea] bg-white px-5 py-8 text-center text-[13px] text-[#8a8a93]">
            Every product is above its low-stock threshold.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#ececea] bg-white">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-[#ececea] text-[11px] uppercase tracking-[0.06em] text-[#8a8a93]">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Product</th>
                  <th className="px-5 py-2.5 font-medium">Category</th>
                  <th className="px-5 py-2.5 text-right font-medium">Threshold</th>
                  <th className="px-5 py-2.5 text-right font-medium">On hand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f0]">
                {needsAttention.map((product) => (
                  <tr key={product.id} className="hover:bg-[#fafafa]">
                    <td className="px-5 py-3">
                      <Link href={`/admin/products/${product.id}`} className="font-medium hover:underline">
                        {product.name}
                      </Link>
                      <span className="ml-2 text-[12px] text-[#8a8a93]">{formatPrice(product.price)}</span>
                    </td>
                    <td className="px-5 py-3 text-[#6b6b73]">{product.category}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-[#8a8a93]">
                      {product.lowStockThreshold}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <StockPill product={product} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------------- Recently updated ---------------- */}
      <section>
        <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Recently updated</h2>
        <ul className="overflow-hidden rounded-lg border border-[#ececea] bg-white divide-y divide-[#f2f2f0]">
          {recent.map((product) => (
            <li key={product.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#fafafa]">
              <div className="min-w-0">
                <Link href={`/admin/products/${product.id}`} className="text-[13px] font-medium hover:underline">
                  {product.name}
                </Link>
                <p className="mt-0.5 text-[12px] text-[#8a8a93]">
                  {product.variants.length} variant{product.variants.length === 1 ? '' : 's'}
                  {product.video ? ' · video attached' : ''}
                </p>
              </div>
              <span className="shrink-0 text-[12px] tabular-nums text-[#8a8a93]">
                {formatDate(product.updatedAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
