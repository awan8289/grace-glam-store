import Link from 'next/link';
import { getSalesReport, type MonthRow } from '@/lib/reports';
import { formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reports' };

type Props = { searchParams: Promise<{ year?: string }> };

const THIS_YEAR = '#2a78d6'; // categorical slot 1 (validated pair)
const LAST_YEAR = '#eb6834'; // categorical slot 2

function change(now: number, before: number): { text: string; tone: string } | null {
  if (!before) return null;
  const pct = ((now - before) / Math.abs(before)) * 100;
  const sign = pct > 0 ? '+' : '';
  return {
    text: `${sign}${pct.toFixed(0)}% vs last year`,
    tone: pct >= 0 ? 'text-[#1f6b3c]' : 'text-[#a4272a]',
  };
}

function niceMax(value: number) {
  if (value <= 0) return 100;
  const pow = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((s) => s * pow >= value) ?? 10;
  return step * pow;
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const nowYear = new Date().getFullYear();
  const year = Number(params.year) || nowYear;
  const { current, previous, years } = await getSalesReport(year);

  const t = current.totals;
  const p = previous.totals;
  const margin = t.revenue > 0 ? (t.profit / t.revenue) * 100 : 0;

  const tiles = [
    { label: 'Revenue', value: formatPrice(t.revenue), delta: change(t.revenue, p.revenue) },
    { label: 'Profit', value: formatPrice(t.profit), delta: change(t.profit, p.profit), hint: `${margin.toFixed(0)}% margin` },
    { label: 'Orders', value: t.orders.toLocaleString('en-AU'), delta: change(t.orders, p.orders) },
    { label: 'Items sold', value: t.units.toLocaleString('en-AU'), delta: change(t.units, p.units) },
    { label: 'Product cost', value: formatPrice(t.cost), hint: 'Supplier price + supplier shipping' },
    { label: 'Refunds', value: formatPrice(t.refunds), hint: t.refunds ? 'Counted in the month refunded' : 'None this year' },
  ];

  const max = niceMax(Math.max(...current.months.map((m) => m.revenue), ...previous.months.map((m) => m.revenue)));
  const gridLines = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Reports {year}</h1>
          <p className="mt-1 text-[13px] text-[#6b6b73]">
            Sales and profit by month, compared with {year - 1}. Profit is before Stripe fees and ad spend.
          </p>
        </div>
        <nav aria-label="Choose year" className="flex flex-wrap gap-1.5">
          {years.map((y) => (
            <Link
              key={y}
              href={`/admin/reports?year=${y}`}
              className={`rounded-md border px-3 py-1.5 text-[13px] tabular-nums ${
                y === year
                  ? 'border-[#16161a] bg-[#16161a] text-white'
                  : 'border-[#e2e2df] bg-white text-[#16161a] hover:border-[#16161a]'
              }`}
            >
              {y}
            </Link>
          ))}
        </nav>
      </header>

      {current.costEstimated && (
        <p className="rounded-md border border-[#f1dfb8] bg-[#fdf8ec] px-4 py-2.5 text-[12px] text-[#8a5a12]">
          Some orders were placed before costs were saved on orders, so their cost uses today&apos;s
          supplier prices. Profit for those orders is an estimate.
        </p>
      )}

      {/* ---------------- KPI tiles ---------------- */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#ececea] bg-[#ececea] lg:grid-cols-3 xl:grid-cols-6">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-white px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8a93]">{tile.label}</p>
            <p className="mt-2 text-[20px] font-semibold tracking-tight tabular-nums text-[#16161a]">{tile.value}</p>
            {tile.delta ? (
              <p className={`mt-1 text-[12px] ${tile.delta.tone}`}>{tile.delta.text}</p>
            ) : (
              tile.hint && <p className="mt-1 text-[12px] text-[#8a8a93]">{tile.hint}</p>
            )}
          </div>
        ))}
      </section>

      {/* ---------------- Monthly revenue chart ---------------- */}
      <section className="rounded-lg border border-[#ececea] bg-white p-5">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight">Revenue by month</h2>
          <ul className="flex items-center gap-4 text-[12px] text-[#6b6b73]" aria-label="Legend">
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: THIS_YEAR }} /> {year}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: LAST_YEAR }} /> {year - 1}
            </li>
          </ul>
        </div>

        <div className="flex gap-2">
          {/* y-axis */}
          <div className="relative h-56 w-14 shrink-0 text-right text-[11px] tabular-nums text-[#8a8a93]">
            {gridLines.map((g) => (
              <span key={g} className="absolute right-1 -translate-y-1/2" style={{ top: `${(1 - g) * 100}%` }}>
                {g === 0 ? '0' : `$${Math.round(max * g).toLocaleString('en-AU')}`}
              </span>
            ))}
          </div>

          <div className="relative flex-1">
            {/* recessive grid */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-56">
              {gridLines.map((g) => (
                <div
                  key={g}
                  className={`absolute inset-x-0 border-t ${g === 0 ? 'border-[#d6d6d2]' : 'border-[#f0f0ee]'}`}
                  style={{ top: `${(1 - g) * 100}%` }}
                />
              ))}
            </div>

            <div className="relative grid h-56 grid-cols-12 items-end gap-1 sm:gap-2">
              {current.months.map((m: MonthRow, i) => {
                const last = previous.months[i];
                return (
                  <div key={m.month} className="group relative flex h-full items-end justify-center gap-[2px]">
                    <div
                      className="w-full max-w-[16px] rounded-t-[4px]"
                      style={{ height: `${(m.revenue / max) * 100}%`, background: THIS_YEAR, minHeight: m.revenue ? 2 : 0 }}
                    />
                    <div
                      className="w-full max-w-[16px] rounded-t-[4px]"
                      style={{ height: `${(last.revenue / max) * 100}%`, background: LAST_YEAR, minHeight: last.revenue ? 2 : 0 }}
                    />
                    {/* hover target is the whole month column; tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-44 -translate-x-1/2 rounded-md border border-[#ececea] bg-white p-2.5 text-[12px] shadow-lg group-hover:block">
                      <p className="mb-1 font-medium text-[#16161a]">{m.label}</p>
                      <p className="flex justify-between gap-2 text-[#6b6b73]">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-sm" style={{ background: THIS_YEAR }} />
                          {year}
                        </span>
                        <span className="tabular-nums text-[#16161a]">{formatPrice(m.revenue)}</span>
                      </p>
                      <p className="flex justify-between gap-2 text-[#6b6b73]">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-sm" style={{ background: LAST_YEAR }} />
                          {year - 1}
                        </span>
                        <span className="tabular-nums text-[#16161a]">{formatPrice(last.revenue)}</span>
                      </p>
                      <p className="mt-1 flex justify-between gap-2 border-t border-[#f2f2f0] pt-1 text-[#6b6b73]">
                        <span>Profit {year}</span>
                        <span className="tabular-nums text-[#16161a]">{formatPrice(m.profit)}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-12 gap-1 text-center text-[11px] text-[#8a8a93] sm:gap-2">
              {current.months.map((m) => (
                <span key={m.month}>{m.label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Monthly table ---------------- */}
      <section className="overflow-x-auto rounded-lg border border-[#ececea] bg-white">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <thead className="border-b border-[#ececea] text-[11px] uppercase tracking-[0.06em] text-[#8a8a93]">
            <tr>
              <th className="px-4 py-2.5 font-medium">Month</th>
              <th className="px-4 py-2.5 text-right font-medium">Orders</th>
              <th className="px-4 py-2.5 text-right font-medium">Items sold</th>
              <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
              <th className="px-4 py-2.5 text-right font-medium">Cost</th>
              <th className="px-4 py-2.5 text-right font-medium">Refunds</th>
              <th className="px-4 py-2.5 text-right font-medium">Profit</th>
              <th className="px-4 py-2.5 text-right font-medium">Items {year - 1}</th>
              <th className="px-4 py-2.5 text-right font-medium">Profit {year - 1}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f2f0] tabular-nums">
            {current.months.map((m, i) => {
              const last = previous.months[i];
              return (
                <tr key={m.month} className="hover:bg-[#fafafa]">
                  <td className="px-4 py-2.5 font-medium">{m.label}</td>
                  <td className="px-4 py-2.5 text-right">{m.orders}</td>
                  <td className="px-4 py-2.5 text-right">{m.units}</td>
                  <td className="px-4 py-2.5 text-right">{formatPrice(m.revenue)}</td>
                  <td className="px-4 py-2.5 text-right text-[#6b6b73]">{formatPrice(m.cost)}</td>
                  <td className="px-4 py-2.5 text-right text-[#6b6b73]">{m.refunds ? `−${formatPrice(m.refunds)}` : '—'}</td>
                  <td className={`px-4 py-2.5 text-right font-medium ${m.profit < 0 ? 'text-[#a4272a]' : ''}`}>
                    {formatPrice(m.profit)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#8a8a93]">{last.units}</td>
                  <td className="px-4 py-2.5 text-right text-[#8a8a93]">{formatPrice(last.profit)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t border-[#d6d6d2] font-semibold tabular-nums">
            <tr>
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3 text-right">{t.orders}</td>
              <td className="px-4 py-3 text-right">{t.units}</td>
              <td className="px-4 py-3 text-right">{formatPrice(t.revenue)}</td>
              <td className="px-4 py-3 text-right">{formatPrice(t.cost)}</td>
              <td className="px-4 py-3 text-right">{t.refunds ? `−${formatPrice(t.refunds)}` : '—'}</td>
              <td className={`px-4 py-3 text-right ${t.profit < 0 ? 'text-[#a4272a]' : ''}`}>{formatPrice(t.profit)}</td>
              <td className="px-4 py-3 text-right text-[#8a8a93]">{p.units}</td>
              <td className="px-4 py-3 text-right text-[#8a8a93]">{formatPrice(p.profit)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* ---------------- Top products ---------------- */}
      <section>
        <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Best sellers in {year}</h2>
        {current.topProducts.length === 0 ? (
          <p className="rounded-lg border border-[#ececea] bg-white px-5 py-8 text-center text-[13px] text-[#8a8a93]">
            No sales recorded for {year} yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#ececea] bg-white">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-[#ececea] text-[11px] uppercase tracking-[0.06em] text-[#8a8a93]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Product</th>
                  <th className="px-4 py-2.5 text-right font-medium">Items sold</th>
                  <th className="px-4 py-2.5 text-right font-medium">Revenue</th>
                  <th className="px-4 py-2.5 text-right font-medium">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f0] tabular-nums">
                {current.topProducts.map((row) => (
                  <tr key={row.productId} className="hover:bg-[#fafafa]">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/products/${row.productId}`} className="font-medium hover:underline">
                        {row.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right">{row.units}</td>
                    <td className="px-4 py-2.5 text-right">{formatPrice(row.revenue)}</td>
                    <td className={`px-4 py-2.5 text-right ${row.profit < 0 ? 'text-[#a4272a]' : ''}`}>
                      {formatPrice(row.profit)}
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
