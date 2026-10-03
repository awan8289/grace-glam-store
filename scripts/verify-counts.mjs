import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

function loadEnv() {
  const envPath = join(ROOT, '.env.local');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      let val = match[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[match[1].trim()] = val.replace(/\\n/g, '\n');
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

async function verify() {
  const pSnap = await db.collection('products').get();
  const cSnap = await db.collection('categories').get();
  console.log('Total Products in Firestore:', pSnap.size);
  console.log('Categories Docs in Firestore:', cSnap.docs.map(d => ({ id: d.id, name: d.data().name })));
  const counts = {};
  pSnap.docs.forEach(d => {
    const c = d.data().category;
    counts[c] = (counts[c] || 0) + 1;
  });
  console.log('Product count per category in Firestore:', counts);
}
verify().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
