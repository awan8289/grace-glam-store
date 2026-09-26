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

  // ── reads ──────────────────────────────────────────────────────────────────

  async function read(): Promise<T[]> {
    const db       = getDb();
    const snapshot = await db.collection(collectionName).get();

    if (snapshot.empty && seed.length > 0) {
      await write(seed);
      return seed;
    }

    return snapshot.docs.map((doc) => doc.data() as T);
  }

  async function readForWrite(): Promise<T[]> {
    return structuredClone(await read());
  }

  // ── writes ─────────────────────────────────────────────────────────────────

  async function write(items: T[]): Promise<void> {
    const db     = getDb();
    const colRef = db.collection(collectionName);

    // 1. Delete every existing document (chunked to stay under 500-op limit).
    const existing = await colRef.get();
    for (const batch_docs of chunkArray(existing.docs, 400)) {
      const batch = db.batch();
      batch_docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // 2. Write new documents (use item.id as the Firestore doc ID).
    for (const batch_items of chunkArray(items, 400)) {
      const batch = db.batch();
      batch_items.forEach((item) => {
        const docRef = colRef.doc(item.id);
        batch.set(docRef, item);
      });
      await batch.commit();
    }
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
