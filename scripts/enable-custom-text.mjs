/**
 * Turns the custom-name field ON (or OFF) for one product.
 *
 *   node scripts/enable-custom-text.mjs <product-slug>          # ON
 *   node scripts/enable-custom-text.mjs <product-slug> --off    # OFF
 *   node scripts/enable-custom-text.mjs --list                  # show necklaces + current state
 *
 * Updates both places the catalogue lives:
 *   1. Firestore `products` (what the running site reads — local AND live,
 *      they share one database)
 *   2. data/products.json, then regenerates src/lib/seed.ts so a fresh
 *      deploy does not come up with the old value.
 *
 * Only switch this on for a product your supplier can actually engrave or
 * cut with a customer's name. Taking a name for an item that ships plain is
 * a misdescribed product under Australian Consumer Law.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const envPath = join(ROOT, '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[match[1].trim()] = val.replace(/\\n/g, '\n');
  }
}
loadEnv();

const args = process.argv.slice(2);
const listOnly = args.includes('--list');
const turnOff = args.includes('--off');
const slug = args.find((a) => !a.startsWith('--'));

if (!listOnly && !slug) {
  console.error('Usage: node scripts/enable-custom-text.mjs <product-slug> [--off] | --list');
  process.exit(1);
}

const db = getFirestore(
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  })
);

async function main() {
  const snap = await db.collection('products').get();
  const products = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));

  if (listOnly) {
    for (const p of products.filter((p) => /necklace|pendant|name|initial|letter/i.test(p.name))) {
      console.log(`${p.requiresCustomText ? 'ON ' : 'off'}  ${p.slug}  —  ${p.name}`);
    }
    return;
  }

  const target = products.find((p) => p.slug === slug || p.id === slug);
  if (!target) {
    console.error(`No product with slug "${slug}". Run with --list to see the options.`);
    process.exit(1);
  }

  const value = !turnOff;
  const now = new Date().toISOString();
  await db.collection('products').doc(target.docId).update({ requiresCustomText: value, updatedAt: now });
  console.log(`Firestore: "${target.name}" requiresCustomText = ${value}`);

  const jsonPath = join(ROOT, 'data', 'products.json');
  const local = JSON.parse(readFileSync(jsonPath, 'utf8'));
  const entry = local.find((p) => p.id === target.id || p.slug === target.slug);
  if (entry) {
    entry.requiresCustomText = value;
    entry.updatedAt = now;
    writeFileSync(jsonPath, JSON.stringify(local, null, 2) + '\n', 'utf8');
    execFileSync(process.execPath, [join(ROOT, 'scripts', 'sync-seed.mjs')], { cwd: ROOT, stdio: 'inherit' });
  } else {
    console.warn('Not found in data/products.json — Firestore updated only.');
  }

  console.log('The site caches products for 60 seconds; reload the product page after that.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
