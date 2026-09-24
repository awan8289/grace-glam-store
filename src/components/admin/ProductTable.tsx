'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Product, getPrimaryImage, getTotalStock } from '@/types';
import { formatPrice } from '@/lib/format';

const STATUS_TONE: Record<Product['status'], string> = {
  active: 'bg-[#eaf5ed] text-[#1f6b3c]',
  draft: 'bg-[#f2f2f0] text-[#6b6b73]',
  archived: 'bg-[#fdeaea] text-[#a4272a]',
};

function stockTone(product: Product) {
  const stock = getTotalStock(product);
  if (stock === 0) return 'text-[#a4272a]';
  if (stock <= product.lowStockThreshold) return 'text-[#8a5a12]';
  return 'text-[#16161a]';
}

export default function ProductTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  /** Inline stock edit — only valid for products without colour variants. */
  const saveStock = async (product: Product, value: number) => {
    if (value === product.stock) return;
    setBusyId(product.id);
    setError(null);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: value }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? 'Update failed.');
      startTransition(() => router.refresh());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Update failed.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleStatus = async (product: Product) => {
    setBusyId(product.id);
    setError(null);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: product.status === 'active' ? 'draft' : 'active' }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? 'Update failed.');
      startTransition(() => router.refresh());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Update failed.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (product: Product) => {
    setBusyId(product.id);
    setError(null);
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json()).error ?? 'Delete failed.');
      setConfirmId(null);
      startTransition(() => router.refresh());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Delete failed.');
    } finally {
      setBusyId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-[#ececea] bg-white px-5 py-16 text-center">
        <p className="text-[14px] font-medium">No products match these filters.</p>
        <Link href="/admin/products" className="mt-2 inline-block text-[13px] text-[#6b6b73] hover:text-[#16161a]">
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-md bg-[#fdeaea] px-3 py-2 text-[13px] text-[#a4272a]">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-[#ececea] bg-white">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead className="border-b border-[#ececea] text-[11px] uppercase tracking-[0.06em] text-[#8a8a93]">
            <tr>
              <th className="px-4 py-2.5 font-medium">Product</th>
              <th className="px-4 py-2.5 font-medium">Colours</th>
              <th className="px-4 py-2.5 font-medium">Media</th>
              <th className="px-4 py-2.5 text-right font-medium">Price</th>
              <th className="px-4 py-2.5 text-right font-medium">Stock</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f2f0]">
            {products.map((product) => {
              const busy = busyId === product.id || isPending;
              const stock = getTotalStock(product);
              const hasVariants = product.variants.length > 0;

              return (
                <tr key={product.id} className={`hover:bg-[#fafafa] ${busy ? 'opacity-60' : ''}`}>
                  {/* Product */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-[#ececea] bg-[#f7f7f6]">
                        <Image
                          src={getPrimaryImage(product)}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {product.name}
                        </Link>
                        <span className="text-[12px] text-[#8a8a93]">{product.category}</span>
                      </div>
                    </div>
                  </td>

                  {/* Colour variants */}
                  <td className="px-4 py-3">
                    {hasVariants ? (
                      <div className="flex items-center gap-1.5">
                        <span className="flex -space-x-1">
                          {product.variants.slice(0, 5).map((variant) => (
                            <span
                              key={variant.id}
                              title={`${variant.colorName} · ${variant.stock} in stock`}
                              className="h-4 w-4 rounded-full border border-white ring-1 ring-[#e2e2df]"
                              style={{ backgroundColor: variant.hex }}
                            />
                          ))}
                        </span>
                        <span className="text-[12px] text-[#8a8a93]">{product.variants.length}</span>
                      </div>
                    ) : (
                      <span className="text-[12px] text-[#a5a5ad]">—</span>
                    )}
                  </td>

                  {/* Media */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[12px] text-[#8a8a93]">
                      <span>{product.images.length} img</span>
                      {product.video ? (
                        <span className="inline-flex items-center gap-1 rounded bg-[#eef1fb] px-1.5 py-0.5 font-medium text-[#33409c]">
                          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor">
                            <path d="M3 2.2v7.6l6.2-3.8z" />
                          </svg>
                          Video
                        </span>
                      ) : null}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3 text-right tabular-nums">{formatPrice(product.price)}</td>

                  {/* Stock */}
                  <td className="px-4 py-3 text-right">
                    {hasVariants ? (
                      <span className={`tabular-nums font-medium ${stockTone(product)}`}>{stock}</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        defaultValue={product.stock}
                        disabled={busy}
                        aria-label={`Stock for ${product.name}`}
                        onBlur={(event) => saveStock(product, Number(event.target.value))}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.currentTarget.blur();
                        }}
                        className={`h-7 w-16 rounded border border-[#e2e2df] bg-white px-2 text-right text-[13px] tabular-nums outline-none focus:border-[#16161a] ${stockTone(
                          product
                        )}`}
                      />
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleStatus(product)}
                      disabled={busy}
                      title="Toggle active / draft"
                      className={`rounded px-2 py-0.5 text-[12px] font-medium capitalize transition-opacity hover:opacity-75 ${
                        STATUS_TONE[product.status]
                      }`}
                    >
                      {product.status}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    {confirmId === product.id ? (
                      <span className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => remove(product)}
                          disabled={busy}
                          className="rounded bg-[#a4272a] px-2 py-1 text-[12px] font-medium text-white"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="text-[12px] text-[#6b6b73] hover:text-[#16161a]"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-3">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-[12px] text-[#6b6b73] hover:text-[#16161a]"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setConfirmId(product.id)}
                          className="text-[12px] text-[#6b6b73] hover:text-[#a4272a]"
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
