'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const inputClass =
  'h-9 w-full rounded-md border border-[#e2e2df] bg-white px-3 text-[13px] text-[#16161a] outline-none transition-colors focus:border-[#16161a]';

export interface CategoryUsage {
  name: string;
  productCount: number;
}

export default function CategoryManager({ categories }: { categories: CategoryUsage[] }) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setBusy('add');
    setError(null);

    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    setBusy(null);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? 'Could not add that category.');
      return;
    }

    setName('');
    router.refresh();
  };

  const remove = async (category: CategoryUsage) => {
    setBusy(category.name);
    setError(null);

    const response = await fetch(`/api/categories/${encodeURIComponent(category.name)}`, {
      method: 'DELETE',
    });

    setBusy(null);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? 'Could not delete that category.');
      return;
    }

    router.refresh();
  };

  return (
    <div className="space-y-5">
      <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New category name"
          maxLength={60}
          aria-label="New category name"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy === 'add' || !name.trim()}
          className="h-9 shrink-0 rounded-md bg-[#16161a] px-4 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto"
        >
          {busy === 'add' ? 'Adding…' : 'Add category'}
        </button>
      </form>

      {error && (
        <p className="rounded-md border border-[#e8c9ca] bg-[#fdf5f5] px-3 py-2 text-[13px] text-[#a4272a]">
          {error}
        </p>
      )}

      <ul className="divide-y divide-[#ececea] rounded-lg border border-[#ececea] bg-white">
        {categories.length === 0 && (
          <li className="px-5 py-8 text-center text-[13px] text-[#6b6b73]">
            No categories yet. Add the first one above.
          </li>
        )}

        {categories.map((category) => {
          // Deleting is blocked server-side while products remain, so the button
          // says so up front instead of letting the click fail.
          const blocked = category.productCount > 0;

          return (
            <li
              key={category.name}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium">{category.name}</p>
                <p className="mt-0.5 text-[12px] text-[#8a8a93]">
                  {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => remove(category)}
                disabled={busy === category.name || blocked}
                title={blocked ? 'Move its products to another category first' : undefined}
                className="shrink-0 rounded-md border border-[#e2e2df] px-3 py-1.5 text-[13px] text-[#6b6b73] transition-colors hover:border-[#e8c9ca] hover:text-[#a4272a] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#e2e2df] disabled:hover:text-[#6b6b73]"
              >
                {busy === category.name ? 'Deleting…' : 'Delete'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
