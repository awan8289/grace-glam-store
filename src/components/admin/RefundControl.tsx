'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatPrice } from '@/lib/format';

/**
 * Refund form on the admin order page. Sends money back through Stripe to the
 * card the customer paid with — full by default, or any smaller amount.
 */
export default function RefundControl({
  orderId,
  refundable,
}: {
  orderId: string;
  /** AUD still refundable, according to Stripe. */
  refundable: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(refundable.toFixed(2));
  const [reason, setReason] = useState('requested_by_customer');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (refundable <= 0) {
    return <p className="text-[13px] text-[#6b6b73]">Fully refunded.</p>;
  }

  const submit = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || value > refundable + 0.001) {
      setError(`Enter an amount between A$0.01 and ${formatPrice(refundable)}.`);
      return;
    }
    // A real-money action: one explicit confirmation.
    if (!window.confirm(`Refund ${formatPrice(value)} to the customer's card? This cannot be undone.`)) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value, reason, note }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Refund failed.');
      setDone(`Refunded ${formatPrice(data.refund.amount)} (${data.refund.status}). It usually reaches the card in 5–10 business days.`);
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Refund failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {done && <p className="rounded bg-[#eaf5ed] px-3 py-2 text-[12px] text-[#1f6b3c]">{done}</p>}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-md border border-[#e3c7c7] bg-white px-3 py-2 text-[13px] font-medium text-[#a4272a] hover:bg-[#fdf4f4]"
        >
          Refund customer…
        </button>
      ) : (
        <div className="space-y-3 rounded-md border border-[#ececea] bg-[#fafafa] p-3">
          <label className="block text-[12px] text-[#6b6b73]">
            Amount (AUD) — up to {formatPrice(refundable)}
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              max={refundable}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded border border-[#dcdcd8] bg-white px-2.5 py-1.5 text-[13px] tabular-nums text-[#16161a]"
            />
          </label>
          <label className="block text-[12px] text-[#6b6b73]">
            Reason
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded border border-[#dcdcd8] bg-white px-2.5 py-1.5 text-[13px] text-[#16161a]"
            >
              <option value="requested_by_customer">Customer asked / item problem</option>
              <option value="duplicate">Duplicate payment</option>
              <option value="fraudulent">Fraudulent order</option>
            </select>
          </label>
          <label className="block text-[12px] text-[#6b6b73]">
            Note for your records (optional)
            <input
              type="text"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. arrived damaged"
              className="mt-1 w-full rounded border border-[#dcdcd8] bg-white px-2.5 py-1.5 text-[13px] text-[#16161a]"
            />
          </label>
          {error && <p className="text-[12px] text-[#a4272a]">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={submit}
              className="flex-1 rounded-md bg-[#a4272a] px-3 py-2 text-[13px] font-medium text-white hover:bg-[#8c2023] disabled:opacity-60"
            >
              {busy ? 'Refunding…' : `Refund ${Number(amount) > 0 ? formatPrice(Number(amount)) : ''}`}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="rounded-md border border-[#dcdcd8] bg-white px-3 py-2 text-[13px] text-[#6b6b73]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
