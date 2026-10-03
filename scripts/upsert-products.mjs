#!/usr/bin/env node
/**
 * Copies chosen products from data/products.json into the live Firestore catalogue.
 *
 *   node scripts/upsert-products.mjs 60 61          # dry run: shows what would change
 *   node scripts/upsert-products.mjs 60 61 --apply  # writes them
 *
 * Never deletes anything. For a product already live, the live stock counts are
 * kept (orders change them; the JSON copy is stale). To hide a product, set its
 * status to "draft" in the admin panel or here and upsert it.
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const ids = args.filter((a) => !a.startsWith("--"));

if (ids.length === 0) {
  console.error("Usage: node scripts/upsert-products.mjs <id> [<id> ...] [--apply]");
  process.exit(1);
}

const envPath = process.env.ENV_FILE || join(ROOT, ".env.local");
if (!existsSync(envPath)) throw new Error(`${envPath} not found — it needs FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.`);
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^(?:export\s+)?([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const catalogue = JSON.parse(readFileSync(join(ROOT, "data", "products.json"), "utf8"));
const problems = [];
const chosen = ids.map((id) => {
  const p = catalogue.find((x) => x.id === id);
  if (!p) problems.push(`id ${id} is not in data/products.json`);
  return p;
}).filter(Boolean);

for (const p of chosen) {
  for (const field of ["id", "slug", "name", "price", "category", "images", "status"]) {
    if (p[field] === undefined || p[field] === "") problems.push(`${p.id}: missing ${field}`);
  }
  if (!Array.isArray(p.images) || p.images.length === 0) problems.push(`${p.id}: needs at least one image`);
  const local = [...(p.images ?? []), ...(p.variants ?? []).flatMap((v) => v.images ?? [])].filter((i) => i.startsWith("/"));
  for (const img of local) if (!existsSync(join(ROOT, "public", img))) problems.push(`${p.id}: image not in public/: ${img}`);
  const slugClash = catalogue.find((x) => x.slug === p.slug && x.id !== p.id);
  if (slugClash) problems.push(`${p.id}: slug "${p.slug}" also used by id ${slugClash.id}`);
}
if (problems.length) {
  console.error("Nothing written:\n  " + problems.join("\n  "));
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
const col = getFirestore().collection("products");

for (const p of chosen) {
  const ref = col.doc(p.id);
  const live = await ref.get();
  const next = JSON.parse(JSON.stringify({ ...p, updatedAt: new Date().toISOString() }));
  if (live.exists) {
    const cur = live.data();
    next.stock = cur.stock ?? next.stock;
    next.variants = (next.variants ?? []).map((v) => {
      const lv = (cur.variants ?? []).find((x) => x.id === v.id);
      return lv ? { ...v, stock: lv.stock } : v;
    });
    next.createdAt = cur.createdAt ?? next.createdAt;
  }
  console.log(`${live.exists ? "UPDATE" : "ADD   "} ${p.id}  ${p.name}  (status: ${p.status})`);
  if (apply) await ref.set(next);
}
console.log(apply ? "Done. The site picks it up within a few minutes." : "Dry run only. Re-run with --apply to write.");
