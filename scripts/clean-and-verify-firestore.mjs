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

function loadEnv() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
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

async function cleanAndVerify() {
  console.log("=== FIRESTORE CLEANUP & VERIFICATION ===");
  const localProducts = JSON.parse(readFileSync(join(DATA, "products.json"), "utf8"));
  const validIds = new Set(localProducts.map(p => String(p.id)));
  console.log(`Local products in data/products.json: ${localProducts.length}`);

  // 1. Clean Products collection
  const prodSnap = await db.collection("products").get();
  console.log(`Current Firestore products count: ${prodSnap.size}`);

  const toDelete = [];
  const existingCats = {};

  prodSnap.docs.forEach(doc => {
    const data = doc.data();
    existingCats[data.category] = (existingCats[data.category] || 0) + 1;
    if (!validIds.has(doc.id)) {
      toDelete.push(doc);
    }
  });

  console.log("Categories found among current Firestore products:", existingCats);
  console.log(`Found ${toDelete.length} obsolete products to delete.`);

  if (toDelete.length > 0) {
    const batchSize = 400;
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = db.batch();
      const chunk = toDelete.slice(i, i + batchSize);
      chunk.forEach(d => {
        batch.delete(d.ref);
        console.log(`  Deleting obsolete doc: ID ${d.id} - "${d.data().name?.slice(0, 30)}" (Category: ${d.data().category})`);
      });
      await batch.commit();
      console.log(`  Committed batch deletion of ${chunk.length} products.`);
    }
  }

  // 2. Clean Categories collection
  const catSnap = await db.collection("categories").get();
  console.log(`Current Firestore categories count: ${catSnap.size}`);
  const validCatSlugs = new Set([
    "womens-necklaces",
    "heart-necklaces",
    "pearl-earrings",
    "mens-necklaces",
    "gift-keepsakes",
    "diamond-paintings",
    "custom-photo-art"
  ]);

  for (const cDoc of catSnap.docs) {
    if (!validCatSlugs.has(cDoc.id)) {
      console.log(`  Deleting obsolete category doc: ${cDoc.id} (${cDoc.data().name})`);
      await cDoc.ref.delete();
    }
  }

  // 3. Final verification
  const finalProdSnap = await db.collection("products").get();
  const finalCatSnap = await db.collection("categories").get();
  console.log(`\n=== FINAL STATUS ===`);
  console.log(`Firestore products count: ${finalProdSnap.size} (Expected: ${localProducts.length})`);
  console.log(`Firestore categories count: ${finalCatSnap.size} (Expected: 7)`);

  const finalCats = {};
  finalProdSnap.docs.forEach(doc => {
    const cat = doc.data().category;
    finalCats[cat] = (finalCats[cat] || 0) + 1;
  });
  console.log("Final Firestore products per category:", finalCats);
  console.log("Final Firestore categories collection:", finalCatSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
}

cleanAndVerify()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Error:", err);
    process.exit(1);
  });
