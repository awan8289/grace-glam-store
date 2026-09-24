'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'stock-asc', label: 'Lowest stock' },
  { value: 'price-desc', label: 'Highest price' },
  { value: 'price-asc', label: 'Lowest price' },
];

const inputClass =
  'h-8 rounded-md border border-[#e2e2df] bg-white px-2.5 text-[13px] text-[#16161a] outline-none transition-colors focus:border-[#16161a]';

export default function ProductFilters({ categories }: { categories: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const searchRef = useRef<HTMLInputElement>(null);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all' && value !== 'false') next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  // Debounce free-text search so each keystroke isn't a navigation.
  useEffect(() => {
    const current = searchParams.get('search') ?? '';
    if (search === current) return;

    const timer = setTimeout(() => setParam('search', search), 250);
    return () => clearTimeout(timer);
    // `setParam` closes over the current params, which is exactly what we want
    // on each keystroke; re-running on `searchParams` would fight the debounce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // `/` focuses search, the way it works in most admin tools.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement;
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const lowStockOnly = searchParams.get('lowStock') === 'true';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, colour or SKU"
          aria-label="Search products"
          className={`${inputClass} w-64 pr-7`}
        />
        <kbd className="pointer-events-none absolute right-2 top-1.5 rounded border border-[#e2e2df] px-1 text-[10px] text-[#a5a5ad]">
          /
        </kbd>
      </div>

      <select
        value={searchParams.get('category') ?? 'all'}
        onChange={(event) => setParam('category', event.target.value)}
        aria-label="Filter by category"
        className={inputClass}
      >
        <option value="all">All categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('status') ?? 'all'}
        onChange={(event) => setParam('status', event.target.value)}
        aria-label="Filter by status"
        className={inputClass}
      >
        {STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {status.label}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get('sort') ?? 'newest'}
        onChange={(event) => setParam('sort', event.target.value)}
        aria-label="Sort products"
        className={inputClass}
      >
        {SORTS.map((sort) => (
          <option key={sort.value} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setParam('lowStock', lowStockOnly ? 'false' : 'true')}
        aria-pressed={lowStockOnly}
        className={`h-8 rounded-md border px-2.5 text-[13px] transition-colors ${
          lowStockOnly
            ? 'border-[#16161a] bg-[#16161a] text-white'
            : 'border-[#e2e2df] bg-white text-[#6b6b73] hover:text-[#16161a]'
        }`}
      >
        Low stock only
      </button>
    </div>
  );
}
