#!/usr/bin/env node
/**
 * One-time migration: pushes all existing JSON data into Firestore.
 * Run ONCE: node scripts/migrate-to-firestore.mjs
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const DATA = join(ROOT, "data");

// Load env from .env.local manually
function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) throw new Error(".env.local not found");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[match[1].trim()] = val.replace(/\\n/g, "\n");
    }
  }
}

loadEnv();

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
  }),
});

const db = getFirestore(app);

// ── Helpers ──────────────────────────────────────────────────────────────────

function readJson(filename) {
  const path = join(DATA, filename);
  if (!existsSync(path)) { console.log(`  (skipping ${filename} — file not found)`); return null; }
  const raw = readFileSync(path, "utf8").trim();
  if (!raw || raw === "[]") { console.log(`  (skipping ${filename} — empty)`); return null; }
  return JSON.parse(raw);
}

async function batchWrite(colName, docs) {
  if (!docs || docs.length === 0) { console.log(`  ${colName}: nothing to migrate`); return; }
  const colRef = db.collection(colName);

  // Write in chunks of 400 (Firestore batch limit is 500)
  const chunks = [];
  for (let i = 0; i < docs.length; i += 400) chunks.push(docs.slice(i, i + 400));

  for (const chunk of chunks) {
    const batch = db.batch();
    chunk.forEach(doc => {
      const docRef = colRef.doc(String(doc.id));
      batch.set(docRef, doc);
    });
    await batch.commit();
  }
  console.log(`  ${colName}: migrated ${docs.length} documents ✅`);
}

// ── Migrate ───────────────────────────────────────────────────────────────────

console.log("\n🔥 Grace & Glam — Firestore Migration\n");

// Products
const products = readJson("products.json");
await batchWrite("products", products);

// Customers
const customers = readJson("customers.json");
await batchWrite("customers", customers);

// Orders
const orders = readJson("orders.json");
await batchWrite("orders", orders);

// Categories (stored as strings — convert to { id, name } docs)
const categoriesRaw = readJson("categories.json");
if (categoriesRaw && Array.isArray(categoriesRaw)) {
  const catDocs = categoriesRaw.map(name => ({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name,
  }));
  await batchWrite("categories", catDocs);
}

console.log("\n✅ Migration complete! Data is now in Firestore.\n");
process.exit(0);
