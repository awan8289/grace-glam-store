/**
 * Stripe metadata values are capped at 500 characters (50 keys per object).
 * Cart JSON can be longer than that — especially with photo URLs — so it is
 * split across itemsPart1..itemsPartN and joined back in the verify route.
 */
const CHUNK = 500;
const MAX_PARTS = 40;

export function chunkForMetadata(json: string): Record<string, string> {
  const parts: Record<string, string> = {};
  const count = Math.ceil(json.length / CHUNK);
  if (count > MAX_PARTS) {
    throw new Error('Your bag has too many personalised items for one order. Please split it into two orders.');
  }
  for (let i = 0; i < count; i++) {
    parts[`itemsPart${i + 1}`] = json.slice(i * CHUNK, (i + 1) * CHUNK);
  }
  return parts;
}

export function joinFromMetadata(metadata: Record<string, string> | null | undefined): string {
  if (!metadata) return '';
  let out = '';
  for (let i = 1; i <= MAX_PARTS; i++) {
    const part = metadata[`itemsPart${i}`];
    if (!part) break;
    out += part;
  }
  return out;
}
