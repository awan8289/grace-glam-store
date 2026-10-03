import fs from 'fs';
import path from 'path';

const token = "API@CJ5869406@CJ:eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI1MjkwNiIsInR5cGUiOiJBQ0NFU1NfVE9LRU4iLCJzdWIiOiJicUxvYnFRMGxtTm55UXB4UFdMWnlvY3Q5bklaTGtpNDV2Q3MwWUNZV2dNZ2tMNW9NVUpjNEJRSjF0V2tEdEYxcE42QmRybUI3VWNuaXRaZkZrNHNuOHZ4TUwyK3BmOEJ2YjBGRXR3NUMxYWZFOUFhTjJIVUx1S1RUTVFhR2NadVZuVkpZWkNvMlNkRGRLcTN4L1RwQkpWM2R0UlUwazBpcFcyYVpqYzJ1TTBybUxVODhnU2RzSFhZVm9TKy95aVE1K3VXNDI0UlhUK2JHZlc3TDNqZ3czQ096WlM5ZG1qSzE3MzVYV0pmLytEc0F0aE9qa0FvSWl4NlZCNDkyK0JXbmNRaHMrNXIrUmQ3YVEzcGhteVpEU01WMmE2ZU9pT3hLZ2poalduRWJGRGRDbCtER3RmNjNXSUFTOHVrK2M2eiIsImlhdCI6MTc5MDc4Nzg5NX0.kUbKgvPiAYgCF6aJkFkfog5F85OadFHDSyMICHohkvQ";
const CJ_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";

const ROOT = 'c:/Users/raheel/Desktop/herbs work/Grace-Glam-FULL';
const productsPath = path.join(ROOT, 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// 1. Populate multi-color variants for products explicitly showing/stating multiple finishes
const multiColorDefinitions = {
  '40': [
    { id: 'v-40-gold', colorName: 'Gold Tone', hex: '#D4AF37', sku: 'CJLX109353102BY', stock: 50, images: ['/products/cj-mother-s-day-circle-pendant-necklace.webp'] },
    { id: 'v-40-silver', colorName: 'Silver Tone', hex: '#C0C0C0', sku: 'CJLX109353101AZ', stock: 50, images: ['/products/cj-mother-s-day-circle-pendant-necklace.webp'] },
    { id: 'v-40-rose', colorName: 'Rose Gold Tone', hex: '#B76E79', sku: 'CJLX109353103CX', stock: 50, images: ['/products/cj-mother-s-day-circle-pendant-necklace.webp'] },
  ],
  '47': [
    { id: 'v-47-silver', colorName: 'Silver Tone', hex: '#C0C0C0', sku: 'GG-47-SLVR', stock: 50, images: ['/products/cj-lucky-compass-pendant-necklace.webp'] },
    { id: 'v-47-gold', colorName: 'Gold Tone', hex: '#D4AF37', sku: 'GG-47-GOLD', stock: 50, images: ['/products/cj-lucky-compass-pendant-necklace.webp'] },
  ],
  '50': [
    { id: 'v-50-silver', colorName: 'Silver Tone', hex: '#C0C0C0', sku: 'GG-50-SLVR', stock: 50, images: ['/products/cj-double-heart-zircon-necklace.webp'] },
    { id: 'v-50-rose', colorName: 'Rose Gold Tone', hex: '#B76E79', sku: 'GG-50-ROSE', stock: 50, images: ['/products/cj-double-heart-zircon-necklace.webp'] },
  ],
  '84': [
    { id: 'v-84-gold', colorName: 'Gold Tone', hex: '#D4AF37', sku: 'GG-84-GOLD', stock: 50, images: ['/products/cj-double-butterfly-layered-necklace.webp'] },
    { id: 'v-84-silver', colorName: 'Silver Tone', hex: '#C0C0C0', sku: 'GG-84-SLVR', stock: 50, images: ['/products/cj-double-butterfly-layered-necklace.webp'] },
  ],
  '85': [
    { id: 'v-85-gold', colorName: 'Gold Tone', hex: '#D4AF37', sku: 'GG-85-GOLD', stock: 50, images: ['/products/cj-stainless-steel-square-initial-necklace.webp'] },
    { id: 'v-85-silver', colorName: 'Silver Tone', hex: '#C0C0C0', sku: 'GG-85-SLVR', stock: 50, images: ['/products/cj-stainless-steel-square-initial-necklace.webp'] },
  ],
  '88': [
    { id: 'v-88-gold', colorName: '18K Gold Plated', hex: '#D4AF37', sku: 'GG-88-GOLD', stock: 50, images: ['/products/cj-bubble-letter-necklace-gold-tone.webp'] },
  ],
  '42': [
    { id: 'v-42-gold', colorName: '18K Gold Plated', hex: '#D4AF37', sku: 'CJLX199710801AZ', stock: 50, images: ['/products/cj-crystal-initial-necklace-gold-tone.webp'] },
    { id: 'v-42-silver', colorName: 'Polished Silver Finish', hex: '#C0C0C0', sku: 'CJLX199710802BY', stock: 50, images: ['/products/cj-crystal-initial-necklace-gold-tone.webp'] },
  ]
};

let enrichedVariants = 0;
products.forEach(p => {
  if (multiColorDefinitions[p.id]) {
    p.variants = multiColorDefinitions[p.id];
    enrichedVariants++;
  }
});
console.log(`Enriched variants for ${enrichedVariants} key products.`);

// 2. Fetch additional gallery images for products with only 1 image from CJ API
async function enrichSingleImageProducts() {
  const singleImageProducts = products.filter(p => p.status === 'active' && (p.images || []).length === 1);
  console.log(`Found ${singleImageProducts.length} active products with 1 image. Querying CJ API...`);

  let fetchedImagesCount = 0;

  for (const p of singleImageProducts) {
    const searchTerms = [
      p.name.replace(/,.*$/, '').replace(/pendant/i, '').replace(/necklace/i, '').trim(),
      p.category
    ];

    let foundImages = [];

    for (const term of searchTerms) {
      if (!term || term.length < 3) continue;
      const url = `${CJ_BASE_URL}/product/list?productNameEn=${encodeURIComponent(term)}&pageNum=1&pageSize=3`;
      try {
        const res = await fetch(url, {
          headers: { "CJ-Access-Token": token, "Content-Type": "application/json" }
        });
        const data = await res.json();
        if (data.data?.list?.length > 0) {
          const pid = data.data.list[0].pid;
          const detailRes = await fetch(`${CJ_BASE_URL}/product/query?pid=${pid}`, {
            headers: { "CJ-Access-Token": token, "Content-Type": "application/json" }
          });
          const detailData = await detailRes.json();
          if (detailData.data) {
            const set = detailData.data.productImageSet || [];
            const varImgs = (detailData.data.variants || []).map(v => v.variantImage).filter(Boolean);
            const allFound = [...set, ...varImgs].filter(u => typeof u === 'string' && u.startsWith('http'));
            if (allFound.length > 0) {
              foundImages = Array.from(new Set(allFound)).slice(0, 4);
              break;
            }
          }
        }
      } catch (err) {
        // Continue on failure
      }
    }

    if (foundImages.length > 0) {
      // Append unique remote CJ images
      const initialCount = p.images.length;
      p.images = Array.from(new Set([...p.images, ...foundImages]));
      fetchedImagesCount += (p.images.length - initialCount);
      console.log(`[CJ Enrich] Added ${p.images.length - initialCount} images for Product #${p.id} (${p.name})`);
    }
  }

  console.log(`Total new gallery images fetched from CJ API: ${fetchedImagesCount}`);
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
  console.log('Saved updated products to data/products.json');
}

enrichSingleImageProducts().catch(console.error);
