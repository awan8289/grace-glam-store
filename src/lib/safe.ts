/**
 * Runs a query for a prerendered storefront page, falling back rather than
 * throwing.
 *
 * Two reasons this exists:
 *  - A build must not fail because the database was briefly unreachable, or
 *    because a first deploy has no credentials yet.
 *  - A visitor should see an empty collection, not a 500, if the database is
 *    down at request time.
 *
 * The failure is logged loudly so a genuine misconfiguration is still obvious
 * in the server logs. Admin routes and API handlers deliberately do NOT use
 * this — there, an error must surface to the operator.
 */
export async function safeQuery<T>(
  query: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error(
      `[storefront] ${context} failed, rendering fallback:`,
      error instanceof Error ? error.message : error
    );
    return fallback;
  }
}
