import { getDb } from '@/lib/firebase-admin';
import { PRODUCT_CATEGORIES } from '@/lib/seed';
import { productStore } from '@/lib/products';

/**
 * Categories are stored in Firestore as documents: { id: "hijabs", name: "Hijabs" }
 * The admin's editable list — seeded once from PRODUCT_CATEGORIES.
 */
interface CategoryDoc { id: string; name: string; }

function nameToId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function readCategories(): Promise<string[]> {
  const db = getDb();
  const snap = await db.collection('categories').orderBy('name').get();
  if (!snap.empty) return snap.docs.map(d => (d.data() as CategoryDoc).name);

  // First run — seed from constants
  const batch = db.batch();
  const colRef = db.collection('categories');
  PRODUCT_CATEGORIES.forEach(name => {
    const id = nameToId(name);
    batch.set(colRef.doc(id), { id, name });
  });
  await batch.commit();
  return [...PRODUCT_CATEGORIES];
}

// Simple in-memory mutex so concurrent category mutations stay safe.
let _queue: Promise<unknown> = Promise.resolve();

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
  return readCategories();
}

/**
 * The stored list plus any category a product still carries.
 */
export async function listAllCategories(): Promise<string[]> {
  const [managed, products] = await Promise.all([readCategories(), productStore.read()]);
  const inUse = products.map((product) => product.category).filter(Boolean);
  return [...new Set([...managed, ...inUse])].sort((a, b) => a.localeCompare(b));
}

export type CategoryResult = { ok: true; categories: string[] } | { ok: false; error: string };

export async function addCategory(rawName: string): Promise<CategoryResult> {
  const name = clean(rawName);
  if (name.length < 2) return { ok: false, error: 'Category name is too short.' };

  const result = await new Promise<CategoryResult>((resolve, reject) => {
    _queue = _queue.then(async () => {
      try {
        const categories = await readCategories();
        if (categories.some((existing) => sameName(existing, name))) {
          resolve({ ok: false, error: `"${name}" already exists.` }); return;
        }
        const db = getDb();
        const id = nameToId(name);
        await db.collection('categories').doc(id).set({ id, name });
        const next = [...categories, name].sort((a, b) => a.localeCompare(b));
        resolve({ ok: true, categories: next });
      } catch (e) { reject(e); }
    }, async () => { resolve({ ok: false, error: 'Server error.' }); });
  });
  return result;
}

/**
 * Removes a category, but refuses while products still sit in it.
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

  const result = await new Promise<CategoryResult>((resolve, reject) => {
    _queue = _queue.then(async () => {
      try {
        const categories = await readCategories();
        const found = categories.find((existing) => sameName(existing, name));
        if (!found) { resolve({ ok: false, error: `"${name}" was not found.` }); return; }
        const db = getDb();
        await db.collection('categories').doc(nameToId(found)).delete();
        const next = categories.filter((c) => !sameName(c, name)).sort((a, b) => a.localeCompare(b));
        resolve({ ok: true, categories: next });
      } catch (e) { reject(e); }
    }, async () => { resolve({ ok: false, error: 'Server error.' }); });
  });
  return result;
}
