// Server-only: the `node:fs` import keeps this out of client bundles.
import { promises as fs } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * A tiny JSON-file collection store.
 *
 * Three properties matter and are easy to get wrong, so they live here once
 * rather than being re-implemented per collection:
 *
 *  - **Cached reads.** Re-reading and re-parsing the file on every render was
 *    the dominant server cost. Entries are cached and invalidated by mtime, so
 *    an edit made directly to the file on disk is still picked up.
 *  - **Serialised writes.** Route handlers run concurrently; an unguarded
 *    read-modify-write on one file loses updates.
 *  - **Atomic writes.** Write to a temp file and rename, so a crash mid-write
 *    cannot leave a truncated file behind.
 */
export interface JsonStore<T> {
  /** Cached array. Treat as read-only — see `readForWrite`. */
  read(): Promise<T[]>;
  /** A deep copy safe to mutate before handing back to `write`. */
  readForWrite(): Promise<T[]>;
  /** Replaces the file contents and refreshes the cache. */
  write(items: T[]): Promise<void>;
  /**
   * Runs `task` with exclusive access to this store. Use for every
   * read-modify-write so concurrent requests cannot interleave.
   */
  mutate<R>(task: (items: T[]) => Promise<R> | R): Promise<R>;
}

export function createJsonStore<T>(filename: string, seed: T[] = []): JsonStore<T> {
  const file = path.join(DATA_DIR, filename);

  let cache: { mtimeMs: number; items: T[] } | null = null;
  let queue: Promise<unknown> = Promise.resolve();

  async function write(items: T[]): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(items, null, 2), 'utf8');
    await fs.rename(tmp, file);

    // Refresh from what we just wrote rather than dropping the cache, so the
    // next read is served without touching the disk again.
    const { mtimeMs } = await fs.stat(file);
    cache = { mtimeMs, items };
  }

  async function read(): Promise<T[]> {
    try {
      const { mtimeMs } = await fs.stat(file);
      if (cache && cache.mtimeMs === mtimeMs) return cache.items;

      const raw = await fs.readFile(file, 'utf8');
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? (parsed as T[]) : [];

      cache = { mtimeMs, items };
      return items;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await write(seed);
        return seed;
      }
      throw error;
    }
  }

  async function readForWrite(): Promise<T[]> {
    return structuredClone(await read());
  }

  function mutate<R>(task: (items: T[]) => Promise<R> | R): Promise<R> {
    const run = queue.then(
      async () => task(await readForWrite()),
      async () => task(await readForWrite())
    );
    // Keep the chain alive even if a task rejects.
    queue = run.catch(() => undefined);
    return run;
  }

  return { read, readForWrite, write, mutate };
}
