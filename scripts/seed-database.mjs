// scripts/seed-database.mjs
import { readFileSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Load service account
const serviceAccount = JSON.parse(
  readFileSync(new URL('../graceandglame-50185-firebase-adminsdk-fbsvc-3655194f44.json', import.meta.url), 'utf-8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const products = JSON.parse(
  readFileSync(new URL('../data/products.json', import.meta.url), 'utf-8')
);

async function seedDatabase() {
  console.log('Clearing existing products...');
  const existing = await db.collection('products').get();
  const deleteOps = [];
  for (const doc of existing.docs) {
    deleteOps.push(doc.ref.delete());
  }
  await Promise.all(deleteOps);
  console.log(`Deleted ${existing.docs.length} existing products`);

  console.log('Seeding', products.length, 'products...');
  const BATCH_SIZE = 400;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = products.slice(i, i + BATCH_SIZE);
    for (const product of chunk) {
      const ref = db.collection('products').doc(product.id);
      batch.set(ref, product);
    }
    await batch.commit();
    console.log(`Committed batch ${Math.floor(i / BATCH_SIZE) + 1}`);
  }
  console.log('Database seeding complete!');
}

seedDatabase().catch(console.error);
