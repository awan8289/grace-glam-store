'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ORDER_STATUSES, Order, OrderStatus } from '@/types/account';

export const STATUS_TONE: Record<OrderStatus, string> = {
  Processing: 'bg-[#fdf3e2] text-[#8a5a12]',
  'In Transit': 'bg-[#eef1fb] text-[#33409c]',
  'Out for Delivery': 'bg-[#eaf1fb] text-[#1f4f8a]',
  Delivered: 'bg-[#eaf5ed] text-[#1f6b3c]',
  Cancelled: 'bg-[#fdeaea] text-[#a4272a]',
};

/**
 * Changing the status here appends a step to the order's tracking timeline,
 * which is what the customer sees on their account page.
 */
export default function OrderStatusControl({
  order,
  compact = false,
}: {
  order: Order;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = async (status: OrderStatus) => {
    if (status === order.status) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).error ?? 'Could not update the status.');
      }
      startTransition(() => router.refresh());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the status.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <select
        value={order.status}
        disabled={busy || isPending}
        onChange={(event) => change(event.target.value as OrderStatus)}
        aria-label={`Status for order ${order.id}`}
        className={`cursor-pointer rounded border-0 py-1 text-[12px] font-medium outline-none disabled:opacity-50 ${
          STATUS_TONE[order.status]
        } ${compact ? 'px-1.5' : 'px-2'}`}
      >
        {ORDER_STATUSES.map((status) => (
          <option key={status} value={status} className="bg-white text-[#16161a]">
            {status}
          </option>
        ))}
      </select>

      {error && (
        <span role="alert" className="text-[11px] text-[#a4272a]">
          {error}
        </span>
      )}
    </span>
  );
}
