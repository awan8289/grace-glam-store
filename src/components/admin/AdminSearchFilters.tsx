'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const inputClass =
  'h-8 rounded-md border border-[#e2e2df] bg-white px-2.5 text-[13px] text-[#16161a] outline-none transition-colors focus:border-[#16161a]';

export interface FilterSelect {
  /** Query-string key this select writes to. */
  param: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}

/**
 * Debounced search plus any number of dropdowns, all driven through the URL so
 * the server component re-renders with the new filter. Same pattern as
 * `ProductFilters`, generalised for the orders and customers tables.
 */
export default function AdminSearchFilters({
  placeholder,
  selects = [],
}: {
  placeholder: string;
  selects?: FilterSelect[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const searchRef = useRef<HTMLInputElement>(null);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  // Debounce so each keystroke isn't a navigation.
  useEffect(() => {
    const current = searchParams.get('search') ?? '';
    if (search === current) return;

    const timer = setTimeout(() => setParam('search', search), 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-running on searchParams would fight the debounce
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`${inputClass} w-72 pr-7`}
        />
        <kbd className="pointer-events-none absolute right-2 top-1.5 rounded border border-[#e2e2df] px-1 text-[10px] text-[#a5a5ad]">
          /
        </kbd>
      </div>

      {selects.map((select) => (
        <select
          key={select.param}
          value={searchParams.get(select.param) ?? select.defaultValue ?? 'all'}
          onChange={(event) => setParam(select.param, event.target.value)}
          aria-label={select.label}
          className={inputClass}
        >
          {select.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
