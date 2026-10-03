import fs from "fs";
import path from "path";
import https from "https";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", reject);
  });
}

const token = "API@CJ5869406@CJ:eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI1MjkwNiIsInR5cGUiOiJBQ0NFU1NfVE9LRU4iLCJzdWIiOiJicUxvYnFRMGxtTm55UXB4UFdMWnlvY3Q5bklaTGtpNDV2Q3MwWUNZV2dNZ2tMNW9NVUpjNEJRSjF0V2tEdEYxcE42QmRybUI3VWNuaXRaZkZrNHNuOHZ4TUwyK3BmOEJ2YjBGRXR3NUMxYWZFOUFhTjJIVUx1S1RUTVFhR2NadVZuVkpZWkNvMlNkRGRLcTN4L1RwQkpWM2R0UlUwazBpcFcyYVpqYzJ1TTBybUxVODhnU2RzSFhZVm9TKy95aVE1K3VXNDI0UlhUK2JHZlc3TDNqZ3czQ096WlM5ZG1qSzE3MzVYV0pmLytEc0F0aE9qa0FvSWl4NlZCNDkyK0JXbmNRaHMrNXIrUmQ3YVEzcGhteVpEU01WMmE2ZU9pT3hLZ2poalduRWJGRGRDbCtER3RmNjNXSUFTOHVrK2M2eiIsImlhdCI6MTc5MDc4Nzg5NX0.kUbKgvPiAYgCF6aJkFkfog5F85OadFHDSyMICHohkvQ";

function cjGet(endpoint) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "developers.cjdropshipping.com",
        path: "/api2.0/v1" + endpoint,
        method: "GET",
        headers: { "CJ-Access-Token": token, "Content-Type": "application/json" },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  console.log("Fetching exact data from CJ API...");
  const p4Res = await cjGet("/product/query?pid=1593053933327626240");
  await sleep(1500);
  const p5Res = await cjGet("/product/query?pid=1650749894501605376");
  await sleep(1500);
  const p6Res = await cjGet("/product/query?pid=2509300736331653600");

  const existingProducts = JSON.parse(fs.readFileSync("data/products.json", "utf8"));

  // Fix Product 1: Remove color circles! Only size-based variants with distinct prices.
  const p1 = existingProducts.find((p) => p.id === "1");
  if (p1) {
    p1.variants = [
      {
        id: "v-p1-40x50",
        colorName: "Standard",
        hex: "#D4AF37",
        sku: "CJZW115793901AZ",
        stock: 50,
        size: "40x50cm no frame",
        price: 21.15,
        compareAtPrice: 42.95,
        images: ["/products/cj-house-number-wall-art-1.jpg"],
      },
      {
        id: "v-p1-50x65",
        colorName: "Standard",
        hex: "#D4AF37",
        sku: "CJZW115793904DW",
        stock: 50,
        size: "50x65cm no frame",
        price: 27.60,
        compareAtPrice: 54.95,
        images: ["/products/cj-house-number-wall-art-1.jpg"],
      },
      {
        id: "v-p1-60x75",
        colorName: "Standard",
        hex: "#D4AF37",
        sku: "CJZW115793907GT",
        stock: 50,
        size: "60x75cm no frame",
        price: 32.65,
        compareAtPrice: 64.95,
        images: ["/products/cj-house-number-wall-art-1.jpg"],
      },
    ];
  }

  // --------------------------------------------------------------------------
  // PRODUCT 4: Apple Preserved Rose Gift Box with Necklace (PID: 1593053933327626240)
  // --------------------------------------------------------------------------
  console.log("Downloading images for Product 4 (Apple Rose Box)...");
  const p4Images = p4Res.data.productImageSet || [];
  const localP4Images = [];
  for (let i = 0; i < p4Images.length; i++) {
    const filename = `cj-apple-rose-box-${i + 1}.jpg`;
    const dest = path.join("public", "products", filename);
    try {
      await downloadFile(p4Images[i], dest);
      localP4Images.push(`/products/${filename}`);
    } catch (e) {
      localP4Images.push(p4Images[i]);
    }
  }

  const p4Variants = [
    {
      id: "v-p4-boxes-necklaces",
      colorName: "Boxes and necklaces",
      style: "Boxes and necklaces",
      hex: "#C41E3A",
      sku: "CJLX161438403CX",
      stock: 50,
      price: 35.00,
      compareAtPrice: 69.95,
      weight: "445g",
      images: [localP4Images[1] || localP4Images[0]],
    },
    {
      id: "v-p4-box-only",
      colorName: "Box",
      style: "Box",
      hex: "#A81C2E",
      sku: "CJLX161438402BY",
      stock: 50,
      price: 24.80,
      compareAtPrice: 49.95,
      weight: "420g",
      images: [localP4Images[0]],
    },
    {
      id: "v-p4-necklace-only",
      colorName: "Necklace",
      style: "Necklace",
      hex: "#D4AF37",
      sku: "CJLX161438401AZ",
      stock: 50,
      price: 17.70,
      compareAtPrice: 34.95,
      weight: "3g",
      images: [localP4Images[2] || localP4Images[0]],
    },
  ];

  const product4 = {
    id: "4",
    slug: "pendant-valentines-day-gift-fashion-necklace-apple-rose-box",
    name: "Apple Preserved Rose Gift Box & Pendant Necklace",
    subtitle: "Creative apple-shaped presentation box with eternal rose & projection pendant",
    description: "An unforgettable romantic keepsake featuring a sculptural red apple that opens to reveal an exquisite eternal preserved rose and a hidden jewelry drawer. Accompanied by an 18K gold-plated crystal pendant necklace. Choose between the complete presentation set, the jewelry box alone, or the pendant necklace.",
    price: 35.00,
    compareAtPrice: 69.95,
    baseCost: 19.30,
    shippingCost: 15.70,
    category: "Gift Keepsakes",
    sku: "CJLX1614384",
    weight: "445g",
    stock: 90,
    lowStockThreshold: 5,
    requiresPhotoUpload: false,
    requiresCustomText: false,
    sizes: ["Boxes and necklaces", "Box", "Necklace"],
    images: localP4Images,
    variants: p4Variants,
    details: [
      "Material: High-gloss composite apple casing with velvet lining",
      "Flower: Grade-A eternal preserved rose",
      "Necklace: 18K Gold-Plated with sparkling cubic zirconia crystal",
      "Style options: Boxes and necklaces, Box, Necklace",
      "Ideal for: Valentine's Day, anniversaries, birthdays, romantic surprises",
      "Free Tracked Delivery across Australia (CJPacket Eub)"
    ],
    tags: ["gift-keepsake", "rose-box", "necklace", "valentines-day", "trending"],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // --------------------------------------------------------------------------
  // PRODUCT 5: Rotating Soap Flower Rose Gift Box (PID: 1650749894501605376)
  // --------------------------------------------------------------------------
  console.log("Downloading images for Product 5 (Rotating Rose Box)...");
  const p5RawVariants = p5Res.data.variants || [];
  const localP5Images = [];
  const p5Variants = [];

  // Download key variant images
  for (let i = 0; i < Math.min(p5RawVariants.length, 12); i++) {
    const v = p5RawVariants[i];
    const filename = `cj-rotating-rose-${v.variantKey.toLowerCase().replace(/[^a-z0-9]/g, "-")}.jpg`;
    const dest = path.join("public", "products", filename);
    let imgPath = `/products/${filename}`;
    try {
      if (v.variantImage) {
        await downloadFile(v.variantImage, dest);
      } else {
        imgPath = p5Res.data.productImage;
      }
    } catch (e) {
      imgPath = v.variantImage || p5Res.data.productImage;
    }
    localP5Images.push(imgPath);

    const baseCostAud = Number((v.variantSellPrice * 1.54).toFixed(2));
    const shippingCostAud = 12.85; // CJPacket Eub Special Line to AU (~$8.35 USD)
    const priceAud = Number((baseCostAud + shippingCostAud).toFixed(2));

    const colorHexes = {
      Red: "#C41E3A",
      Blue: "#1E3F66",
      "Lake blue": "#2E8B57",
      Pink: "#FFB6C1",
      White: "#F5F5F5",
      Black: "#1A1A1A",
      Set1: "#C41E3A",
      Set2: "#1E3F66",
      Set3: "#2E8B57",
      Set4: "#FFB6C1",
      Set5: "#F5F5F5",
      Set6: "#1A1A1A",
    };

    p5Variants.push({
      id: `v-p5-${v.variantSku}`,
      colorName: v.variantKey,
      hex: colorHexes[v.variantKey] || "#D4AF37",
      sku: v.variantSku,
      stock: 50,
      price: priceAud,
      compareAtPrice: Number((priceAud * 2).toFixed(2)),
      weight: `${v.variantWeight || 225}g`,
      images: [imgPath],
    });
  }

  const product5 = {
    id: "5",
    slug: "rotating-soap-flower-rose-gift-box",
    name: "Rotating Soap Flower Rose Jewelry Gift Box",
    subtitle: "Kinetic rotating eternal rose presentation box with pop-up jewelry drawer",
    description: "A mesmerizing mechanical keepsake gift box. Gently twisting the outer dial causes the internal eternal soap flower rose to rotate gracefully into full bloom while elevating a lower concealed jewelry drawer. Scented with natural calming botanical fragrances, each petal is water-soluble and fiber-free. Available in vibrant individual rose colors or deluxe jewelry necklace gift sets.",
    price: p5Variants[0]?.price || 18.25,
    compareAtPrice: 36.95,
    baseCost: 5.40,
    shippingCost: 12.85,
    category: "Gift Keepsakes",
    sku: "CJJT1743853",
    weight: "225g",
    stock: 100,
    lowStockThreshold: 5,
    requiresPhotoUpload: false,
    requiresCustomText: false,
    sizes: ["Standard Kinetic Box (100x100x120mm)"],
    images: localP5Images.slice(0, 8),
    variants: p5Variants,
    details: [
      "Mechanism: Precision 360-degree kinetic rotating petal mechanism",
      "Soap roses: Natural botanical fragrance, water-soluble, gentle on skin",
      "Drawer: Bottom pop-up jewelry display compartment for rings and necklaces",
      "Dimensions: 100 x 100 x 120 mm (Weight: ~225g)",
      "Available colors & sets: Red, Pink, Blue, Lake Blue, White, Black, Deluxe Sets",
      "Tracked Delivery to Australia via CJPacket Eub Special Line"
    ],
    tags: ["gift-keepsake", "rose-box", "rotating-box", "valentines-day", "trending"],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // --------------------------------------------------------------------------
  // PRODUCT 6: Retro Sunflower Earrings (PID: 2509300736331653600)
  // --------------------------------------------------------------------------
  console.log("Downloading images for Product 6 (Sunflower Earrings)...");
  const p6Images = p6Res.data.productImageSet || [];
  const localP6Images = [];
  for (let i = 0; i < p6Images.length; i++) {
    const filename = `cj-sunflower-earrings-${i + 1}.jpg`;
    const dest = path.join("public", "products", filename);
    try {
      await downloadFile(p6Images[i], dest);
      localP6Images.push(`/products/${filename}`);
    } catch (e) {
      localP6Images.push(p6Images[i]);
    }
  }

  const product6 = {
    id: "6",
    slug: "retro-sunflower-earrings",
    name: "Retro Sunflower Floral Drop Earrings",
    subtitle: "Handcrafted vintage botanical sunflower earrings with textured petals",
    description: "Charming vintage-inspired sunflower drop earrings designed to bring sunshine and warmth to any ensemble. Sculpted with detailed organic petals and a delicate textured centerpiece, crafted in hypoallergenic metal alloy. Available in antique silver tone and warm golden finish. A delightful gift for birthdays, teachers, best friends, and sunny summer days.",
    price: 8.40,
    compareAtPrice: 19.95,
    baseCost: 0.90,
    shippingCost: 7.50,
    category: "Gift Keepsakes",
    sku: "CJYD2546395",
    weight: "10g",
    stock: 100,
    lowStockThreshold: 5,
    requiresPhotoUpload: false,
    requiresCustomText: false,
    sizes: ["Standard Drop (18x18mm)"],
    images: localP6Images,
    variants: [
      {
        id: "v-p6-gold",
        colorName: "Warm Gold Tone",
        hex: "#D4AF37",
        sku: "CJYD254639502BY",
        stock: 50,
        price: 8.40,
        compareAtPrice: 19.95,
        images: [localP6Images[0]],
      },
      {
        id: "v-p6-silver",
        colorName: "Antique Silver Tone",
        hex: "#C0C0C0",
        sku: "CJYD254639501AZ",
        stock: 50,
        price: 8.40,
        compareAtPrice: 19.95,
        images: [localP6Images[1] || localP6Images[0]],
      },
    ],
    details: [
      "Design: Detailed botanical sunflower drop earrings",
      "Finishes: Antique Silver Tone and Warm Gold Tone",
      "Dimensions: ~18 x 18 mm (Weight: ~10g)",
      "Material: Hypoallergenic alloy, nickel-free and lead-free",
      "Closure: Secure hook backings for comfortable all-day wear",
      "Includes Free Tracked Delivery across Australia"
    ],
    tags: ["earrings", "sunflower", "botanical", "gift-keepsake", "trending"],
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const finalProducts = [p1, existingProducts[1], existingProducts[2], product4, product5, product6].filter(Boolean);
  fs.writeFileSync("data/products.json", JSON.stringify(finalProducts, null, 2), "utf8");
  console.log(`Saved ${finalProducts.length} products to data/products.json`);
}

main().catch((err) => console.error("Script error:", err.message));
