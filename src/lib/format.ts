import { BRAND_CONFIG } from '@/constants/config';

/**
 * The single place prices are turned into strings. The store trades in AUD, so
 * every surface — storefront, cart, checkout, admin — must read from here.
 */
export function formatPrice(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${BRAND_CONFIG.currencySymbol}${safe.toFixed(2)}`;
}

/** Compact form for dense tables: `A$1,240` instead of `A$1240.00`. */
export function formatPriceCompact(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${BRAND_CONFIG.currencySymbol}${safe.toLocaleString('en-AU', {
    maximumFractionDigits: 0,
  })}`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** URL-safe slug used for product routes and generated SKUs. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
