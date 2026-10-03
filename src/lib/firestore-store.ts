/**
 * Firestore adapter — same interface as json-store but backed by Cloud Firestore.
 *
 * Drop-in replacement: change createJsonStore to createFirestoreStore in each
 * lib file. The write semantics are identical: write() replaces the whole
 * collection, mutate() serialises concurrent read-modify-write operations.
 */
import { getDb } from "./firebase-admin";
import type { JsonStore } from "./json-store";

type WithId = { id: string };

/**
 * Chunk an array into slices of at most `size` items.
 * Firestore batch writes are capped at 500 operations.
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * Creates a Firestore-backed store whose interface matches JsonStore<T>.
 *
 * @param collectionName  Firestore collection name (e.g. "customers")
 * @param seed            Documents to write if the collection is empty
 */
export function createFirestoreStore<T extends WithId>(
  collectionName: string,
  seed: T[] = []
): JsonStore<T> {
  // Serialise concurrent mutations, just like json-store.
  let queue: Promise<unknown> = Promise.resolve();
  let cache: { data: T[]; timestamp: number } | null = null;
  const CACHE_TTL_MS = 60_000;

  // ── reads ──────────────────────────────────────────────────────────────────

  async function read(strict = false): Promise<T[]> {
    const now = Date.now();
    if (cache && now - cache.timestamp < CACHE_TTL_MS) {
      return cache.data;
    }

    try {
      const db       = getDb();
      const snapshot = await db.collection(collectionName).get();

      if (snapshot.empty && seed.length > 0) {
        await write(seed);
        cache = { data: seed, timestamp: now };
        return seed;
      }

      if (collectionName === 'products' && seed.length === 0) {
        cache = { data: [], timestamp: now };
        return [];
      }

      const data = snapshot.docs.map((doc) => doc.data() as T);
      cache = { data, timestamp: now };
      return data;
    } catch (err) {
      // A write built on the fallback would replace the real collection with
      // the seed (or nothing), so writers get the error instead.
      if (strict) throw err;
      console.warn(`[firestore-store] read('${collectionName}') warning: ${err instanceof Error ? err.message : err}. Falling back to cached or seed data.`);
      return cache?.data ?? seed;
    }
  }

  async function readForWrite(): Promise<T[]> {
    return structuredClone(await read(true));
  }

  // ── writes ─────────────────────────────────────────────────────────────────

  async function write(items: T[]): Promise<void> {
    const db     = getDb();
    const colRef = db.collection(collectionName);

    // 1. Write first. Deleting first meant a failure part-way (a rejected
    //    field, a dropped connection) left the collection empty — every
    //    customer or order gone, and products silently re-seeded on next read.
    for (const batch_items of chunkArray(items, 400)) {
      const batch = db.batch();
      batch_items.forEach((item) => {
        batch.set(colRef.doc(item.id), JSON.parse(JSON.stringify(item)));
      });
      await batch.commit();
    }

    // 2. Only now remove documents that are no longer in the list.
    const keep     = new Set(items.map((item) => item.id));
    const existing = await colRef.get();
    const stale    = existing.docs.filter((doc) => !keep.has(doc.id));
    for (const batch_docs of chunkArray(stale, 400)) {
      const batch = db.batch();
      batch_docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
    cache = { data: items, timestamp: Date.now() };
  }

  // ── mutation helper ────────────────────────────────────────────────────────

  function mutate<R>(task: (items: T[]) => Promise<R> | R): Promise<R> {
    const run = queue.then(
      async () => task(await readForWrite()),
      async () => task(await readForWrite())
    );
    queue = run.catch(() => undefined);
    return run;
  }

  return { read, readForWrite, write, mutate };
}
