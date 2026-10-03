/**
 * Sales & profit reports for the admin panel.
 *
 * Definitions (kept deliberately simple and stated on the page):
 *   revenue  = what customers paid for orders that were not cancelled
 *   cost     = supplier price + supplier shipping for each unit sold
 *              (captured on the order when it was placed; older orders fall back
 *              to the product's current cost and are flagged as estimated)
 *   refunds  = refunds issued from the admin panel, counted in the month they were made
 *   profit   = revenue − cost − refunds   (before Stripe fees and ad spend)
 *
 * Months are Australian (Sydney) calendar months, because that is where the shop trades.
 */
import { listOrders } from '@/lib/orders';
import { listProducts } from '@/lib/products';
import type { Order } from '@/types/account';

const TZ = 'Australia/Sydney';

export interface MonthRow {
  month: number; // 1–12
  label: string; // "Jan"
  orders: number;
  units: number;
  revenue: number;
  cost: number;
  refunds: number;
  profit: number;
}

export interface YearReport {
  year: number;
  months: MonthRow[];
  totals: Omit<MonthRow, 'month' | 'label'>;
  /** True when some cost had to be taken from today's product prices. */
  costEstimated: boolean;
  topProducts: { productId: string; name: string; units: number; revenue: number; profit: number }[];
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function yearMonth(iso: string): { year: number; month: number } | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-AU', { timeZone: TZ, year: 'numeric', month: 'numeric' }).formatToParts(date);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  return year && month ? { year, month } : null;
}

const round = (n: number) => Math.round(n * 100) / 100;

function emptyMonths(): MonthRow[] {
  return MONTH_LABELS.map((label, i) => ({
    month: i + 1,
    label,
    orders: 0,
    units: 0,
    revenue: 0,
    cost: 0,
    refunds: 0,
    profit: 0,
  }));
}

function buildYear(year: number, orders: Order[], productCost: Map<string, number>): YearReport {
  const months = emptyMonths();
  let costEstimated = false;
  const byProduct = new Map<string, { name: string; units: number; revenue: number; cost: number }>();

  for (const order of orders) {
    if (order.status === 'Cancelled') continue;

    const placed = yearMonth(order.createdAt);
    if (placed && placed.year === year) {
      const row = months[placed.month - 1];
      row.orders += 1;
      row.revenue += order.subtotal;

      for (const item of order.items) {
        let unitCost = item.unitCost;
        if (unitCost == null) {
          unitCost = productCost.get(item.productId) ?? 0;
          costEstimated = true;
        }
        row.units += item.quantity;
        row.cost += unitCost * item.quantity;

        const entry = byProduct.get(item.productId) ?? { name: item.name, units: 0, revenue: 0, cost: 0 };
        entry.units += item.quantity;
        entry.revenue += item.unitPrice * item.quantity;
        entry.cost += unitCost * item.quantity;
        byProduct.set(item.productId, entry);
      }
    }

    for (const refund of order.refunds ?? []) {
      const when = yearMonth(refund.createdAt);
      if (when && when.year === year) months[when.month - 1].refunds += refund.amount;
    }
  }

  for (const row of months) {
    row.revenue = round(row.revenue);
    row.cost = round(row.cost);
    row.refunds = round(row.refunds);
    row.profit = round(row.revenue - row.cost - row.refunds);
  }

  const totals = months.reduce(
    (t, m) => ({
      orders: t.orders + m.orders,
      units: t.units + m.units,
      revenue: round(t.revenue + m.revenue),
      cost: round(t.cost + m.cost),
      refunds: round(t.refunds + m.refunds),
      profit: round(t.profit + m.profit),
    }),
    { orders: 0, units: 0, revenue: 0, cost: 0, refunds: 0, profit: 0 }
  );

  const topProducts = [...byProduct.entries()]
    .map(([productId, p]) => ({
      productId,
      name: p.name,
      units: p.units,
      revenue: round(p.revenue),
      profit: round(p.revenue - p.cost),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return { year, months, totals, costEstimated, topProducts };
}

/** The selected year, the year before it, and every year that has orders. */
export async function getSalesReport(year: number) {
  const [orders, products] = await Promise.all([listOrders(), listProducts()]);

  const productCost = new Map<string, number>();
  for (const p of products) {
    if (p.baseCost != null || p.shippingCost != null) {
      productCost.set(p.id, (p.baseCost ?? 0) + (p.shippingCost ?? 0));
    }
  }

  const years = new Set<number>([new Date().getFullYear()]);
  for (const order of orders) {
    const ym = yearMonth(order.createdAt);
    if (ym) years.add(ym.year);
  }

  return {
    current: buildYear(year, orders, productCost),
    previous: buildYear(year - 1, orders, productCost),
    years: [...years].sort((a, b) => b - a),
  };
}
