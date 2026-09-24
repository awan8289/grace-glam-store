import { createJsonStore } from '@/lib/json-store';
import { PRODUCT_CATEGORIES } from '@/lib/seed';
import { productStore } from '@/lib/products';

/**
 * The admin's editable list of categories.
 *
 * Seeded once from `PRODUCT_CATEGORIES` and authoritative from then on — the
 * constant in `seed.ts` is never consulted again, exactly like the product seed.
 */
const categoryStore = createJsonStore<string>('categories.json', [...PRODUCT_CATEGORIES]);

const MAX_LENGTH = 60;

/** Trims and collapses whitespace. Names are compared case-insensitively. */
function clean(name: string): string {
  return name.trim().replace(/\s+/g, ' ').slice(0, MAX_LENGTH);
}

function sameName(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** Just the stored list — what the admin manages. */
export async function listManagedCategories(): Promise<string[]> {
  const categories = await categoryStore.read();
  return [...categories].sort((a, b) => a.localeCompare(b));
}

/**
 * The stored list plus any category a product still carries.
 *
 * A product's own category must never vanish from a filter or a dropdown just
 * because it is missing from the managed list — that is how a product becomes
 * unreachable in the shop while still being on sale.
 */
export async function listAllCategories(): Promise<string[]> {
  const [managed, products] = await Promise.all([categoryStore.read(), productStore.read()]);
  const inUse = products.map((product) => product.category).filter(Boolean);
  return [...new Set([...managed, ...inUse])].sort((a, b) => a.localeCompare(b));
}

export type CategoryResult = { ok: true; categories: string[] } | { ok: false; error: string };

export async function addCategory(rawName: string): Promise<CategoryResult> {
  const name = clean(rawName);
  if (name.length < 2) return { ok: false, error: 'Category name is too short.' };

  return categoryStore.mutate(async (categories) => {
    if (categories.some((existing) => sameName(existing, name))) {
      return { ok: false as const, error: `"${name}" already exists.` };
    }

    const next = [...categories, name];
    await categoryStore.write(next);
    return { ok: true as const, categories: next.sort((a, b) => a.localeCompare(b)) };
  });
}

/**
 * Removes a category, but refuses while products still sit in it.
 *
 * Deleting anyway would leave those products pointing at a category that no
 * longer appears in any picker — they stay on sale but drop out of the shop's
 * category filter, and the next admin to edit one silently reassigns it.
 */
export async function deleteCategory(rawName: string): Promise<CategoryResult> {
  const name = clean(rawName);
  const products = await productStore.read();
  const inUse = products.filter((product) => sameName(product.category, name));

  if (inUse.length > 0) {
    const count = `${inUse.length} product${inUse.length === 1 ? '' : 's'}`;
    return {
      ok: false,
      error: `${count} still in "${name}". Move ${inUse.length === 1 ? 'it' : 'them'} to another category first.`,
    };
  }

  return categoryStore.mutate(async (categories) => {
    const next = categories.filter((existing) => !sameName(existing, name));
    if (next.length === categories.length) {
      return { ok: false as const, error: `"${name}" was not found.` };
    }

    await categoryStore.write(next);
    return { ok: true as const, categories: next.sort((a, b) => a.localeCompare(b)) };
  });
}
