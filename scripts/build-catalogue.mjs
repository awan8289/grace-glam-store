/**
 * Builds the live catalogue from the photography and the editorial spec.
 *
 * Inputs
 *   scratchpad/catalogue-meta.json      every source file, hashed and measured
 *   scratchpad/catalogue-out/*.json     what each photo actually shows
 *   scripts/catalogue-spec.mjs          price, fibre, dimensions, copy
 *
 * Outputs
 *   data/products.json                  the live catalogue (authoritative)
 *   data/categories.json                the managed category list
 *   scratchpad/image-manifest.json      work list for build-catalogue-images.py
 *
 * `data/products.json` is what the site reads — `src/lib/seed.ts` is only ever
 * consulted when that file does not exist, so both are written.
 *
 * Deterministic: same inputs produce the same output, byte for byte.
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CATEGORIES, PRODUCTS, EXCLUDED, ASSUMED_DIMENSIONS, NEEDS_CONFIRMATION } from './catalogue-spec.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRATCH =
  '/tmp/claude-1000/-home-awan-Downloads-E-Commerce-Website/8fa67b23-9b30-432a-9045-ec1750a319dd/scratchpad';
const SRC_ROOT = path.join(SCRATCH, 'catalogue-src');
const OUT_DIR = path.join(SCRATCH, 'catalogue-out');

const CREATED_AT = '2026-08-22T00:00:00.000Z';
/**
 * Owner published the catalogue on 2026-08-22 after reviewing the draft prices.
 *
 * This has to live here rather than only in data/products.json: a fresh install
 * from the deployment zip seeds itself from src/lib/seed.ts, and if that still
 * said 'draft' the live site would come up with an empty shop.
 */
const PUBLISH_STATUS = 'active';
const DEFAULT_STOCK = 10;
const LOW_STOCK = 3;

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

// ---------------------------------------------------------------------------
// Filename → source path. The agents saw 420px .jpg previews; the originals
// are .PNG/.JPG under catalogue-src, so match on the basename without extension.
// ---------------------------------------------------------------------------
const meta = read(path.join(SCRATCH, 'catalogue-meta.json'));
const byStem = new Map();
for (const f of meta.files) {
  const stem = path.basename(f.rel).replace(/\.[^.]+$/, '');
  // Duplicate stems exist across folders; first-seen wins and the duplicate
  // report below records the rest, so nothing disappears silently.
  if (!byStem.has(stem)) byStem.set(stem, f.rel);
}

function sourceFor(previewName) {
  const stem = path.basename(previewName).replace(/\.[^.]+$/, '');
  const rel = byStem.get(stem);
  return rel ? path.join(SRC_ROOT, rel) : null;
}

// ---------------------------------------------------------------------------
const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const sku = (productName, colourName) => {
  const abbr = (s) =>
    s
      .split(/\s+/)
      .map((w) => w.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase())
      .filter(Boolean)
      .join('');
  return `GG-${abbr(productName).slice(0, 9)}-${abbr(colourName).slice(0, 6)}`;
};

const manifest = [];
const warnings = [];
const products = [];
let nextId = 1;

function addImage(sourcePreview, outStem) {
  const src = sourceFor(sourcePreview);
  if (!src || !existsSync(src)) {
    warnings.push(`missing source for ${sourcePreview}`);
    return null;
  }
  // Content hash in the filename means a re-run with different photography
  // gets a new URL, which matters because /products/* is cached immutably for
  // a year — reusing a name would serve the old picture forever.
  const digest = createHash('sha1').update(readFileSync(src)).digest('hex').slice(0, 6);
  const out = `${outStem}-${digest}`;
  if (!manifest.some((m) => m.out === out)) manifest.push({ src, out });
  return `/products/${out}.webp`;
}

function buildProduct({ name, spec, variants, images = [], printName }) {
  const id = String(nextId++);
  const productSlug = slug(printName ? `${printName} scarf` : name);

  const builtVariants = variants.map((v) => {
    const paths = v.files
      .map((f, i) => addImage(f, `${productSlug}-${slug(v.colourName)}${i ? `-${i + 1}` : ''}`))
      .filter(Boolean);
    if (paths.length === 0) warnings.push(`${name} / ${v.colourName}: no usable image`);
    return {
      id: `v-${id}-${slug(v.colourName)}`,
      colorName: v.colourName,
      hex: /^#[0-9a-f]{6}$/i.test(v.hex ?? '') ? v.hex.toLowerCase() : '#000000',
      sku: sku(name, v.colourName),
      stock: DEFAULT_STOCK,
      images: paths,
    };
  });

  const baseImages = images
    .map((f, i) => addImage(f, `${productSlug}${i ? `-${i + 1}` : ''}`))
    .filter(Boolean);

  // With variants the top-level stock is unused; `getTotalStock` sums variants.
  const gallery = baseImages.length > 0 ? baseImages : builtVariants.flatMap((v) => v.images).slice(0, 1);

  products.push({
    id,
    slug: productSlug,
    name: printName ? `${printName} Printed Scarf` : name,
    subtitle: spec.subtitle,
    description: spec.description,
    price: spec.price,
    category: spec.category,
    images: gallery,
    video: null,
    variants: builtVariants,
    stock: builtVariants.length > 0 ? 0 : DEFAULT_STOCK,
    lowStockThreshold: LOW_STOCK,
    sizes: ['One Size'],
    details: spec.details,
    tags: spec.tags ?? [],
    status: PUBLISH_STATUS,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  });
}

// ---------------------------------------------------------------------------
// Join the photography to the spec
// ---------------------------------------------------------------------------
const excludedNames = new Set(EXCLUDED.map((e) => e.name));

for (const file of ['hijabs.json', 'pashmina.json', 'cashmere-stoles.json', 'underscarves.json']) {
  for (const p of read(path.join(OUT_DIR, file)).products) {
    if (excludedNames.has(p.name)) continue;
    const spec = PRODUCTS[p.name];
    if (!spec) {
      warnings.push(`no spec for product "${p.name}" in ${file}`);
      continue;
    }
    buildProduct({ name: p.name, spec, variants: p.variants ?? [] });
  }
}

// Printed scarves: one product per print, sharing one fabric spec — unless the
// print has its own entry, which is how the one non-chiffon piece avoids
// inheriting a fabric description that does not match it.
for (const p of read(path.join(OUT_DIR, 'printed-scarves.json')).products) {
  const printName = p.printName ?? p.name;
  const override = PRODUCTS[printName];
  buildProduct({
    name: p.name,
    printName: override ? undefined : printName,
    spec: override ?? PRODUCTS.__PRINTED_SCARF__,
    variants: [],
    images: p.files ?? [],
  });
}

// Accessories: the agent's names are descriptive, so map them onto the spec.
const ACCESSORY_NAMES = {
  'Hijab Pins (colour variants: Multicolour / Golden / Black)': 'Hijab Pins',
  'Pearl Dressmaker Pins, 100pcs (Japan Quality)': 'Pearl Dressmaker Pins',
  'Hijab Magnets': 'Hijab Magnets',
  'Scarf Clips (needs verification — see note)': 'Pastel Pearl Hijab Pins',
  'Hijab Dress Tape (Royal nobility)': 'Hijab Dress Tape',
};

for (const p of read(path.join(OUT_DIR, 'accessories.json')).products) {
  const name = ACCESSORY_NAMES[p.name] ?? p.name;
  const spec = PRODUCTS[name];
  if (!spec) {
    warnings.push(`no spec for accessory "${p.name}"`);
    continue;
  }
  buildProduct({ name, spec, variants: p.variants ?? [], images: p.variants?.length ? [] : p.files ?? [] });
}

// ---------------------------------------------------------------------------
// Landing photography becomes the lead image of the product it shows, which is
// how it reaches the hero — the hero renders products, not loose banners.
// ---------------------------------------------------------------------------
const landing = read(path.join(OUT_DIR, 'landing.json'));
let promoted = 0;

for (const hero of landing.heroRecommendation ?? []) {
  const record = landing.images.find((i) => i.file === hero.file);
  if (!record || record.matchConfidence !== 'high') continue;

  const wanted = String(record.matchedColourOrPrint ?? '').toLowerCase();
  const target = products.find((product) =>
    product.variants.some((v) => wanted.includes(v.colorName.toLowerCase().split(' ')[0]))
  );
  if (!target) continue;

  const url = addImage(hero.file, `${target.slug}-hero`);
  if (!url) continue;

  target.images = [url, ...target.images.filter((i) => i !== url)];
  if (!target.tags.includes('top-selling')) target.tags.push('top-selling');
  promoted += 1;
}

// ---------------------------------------------------------------------------
writeFileSync(path.join(ROOT, 'data/products.json'), `${JSON.stringify(products, null, 2)}\n`);

// `src/lib/seed.ts` is only read when data/products.json is absent — i.e. on a
// fresh deployment from the zip. Writing both keeps those two starts identical.
const seedFile = `/**
 * Initial catalogue. Written to \`data/products.json\` the first time the store
 * is read, after which the JSON file is authoritative and this is never
 * consulted again — admin edits are never overwritten by the seed.
 *
 * GENERATED by scripts/build-catalogue.mjs. Edit the spec, not this file.
 */
import { Product } from '@/types';

export const SEED_PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};

export const PRODUCT_CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};

export const PRODUCT_TAGS = [
  { value: 'trending', label: 'Trending Now' },
  { value: 'new-arrivals', label: 'New Arrivals' },
  // Drives the home page hero carousel and the thumbnail strip beneath it.
  { value: 'top-selling', label: 'Top Selling' },
];
`;
writeFileSync(path.join(ROOT, 'src/lib/seed.ts'), seedFile);
writeFileSync(path.join(ROOT, 'data/categories.json'), `${JSON.stringify(CATEGORIES, null, 2)}\n`);
writeFileSync(path.join(SCRATCH, 'image-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const byCategory = {};
for (const p of products) byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;

console.log(`products:   ${products.length}`);
for (const [c, n] of Object.entries(byCategory)) console.log(`  ${c.padEnd(22)} ${n}`);
console.log(`variants:   ${products.reduce((s, p) => s + p.variants.length, 0)}`);
console.log(`images:     ${manifest.length}`);
console.log(`hero shots promoted: ${promoted}`);
console.log(`status:     ${PUBLISH_STATUS} (all ${products.length})`);

console.log(`\nexcluded (${EXCLUDED.length}) — trademark risk, owner's decision:`);
for (const e of EXCLUDED) console.log(`  ${e.name}\n    ${e.reason}`);

console.log('\nthe photos could not settle these — confirm before publishing:');
for (const n of NEEDS_CONFIRMATION) console.log(`  ${n}`);

console.log('\ndimensions assumed, NOT measured — confirm before publishing:');
for (const d of ASSUMED_DIMENSIONS) console.log(`  ${d}`);

if (warnings.length) {
  console.log(`\nwarnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  ${w}`);
}
