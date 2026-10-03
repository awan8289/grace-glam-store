import fs from "fs";
import path from "path";
import https from "https";

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

const imagesToDownload = [
  // Product 1
  { url: "https://cf.cjdropshipping.com/1622712876751.jpg", name: "cj-house-number-wall-art-1.jpg" },
  { url: "https://cf.cjdropshipping.com/1622712876752.jpg", name: "cj-house-number-wall-art-2.jpg" },
  { url: "https://cf.cjdropshipping.com/1622712876753.jpg", name: "cj-house-number-wall-art-3.jpg" },
  { url: "https://cf.cjdropshipping.com/1622709527197.png", name: "cj-house-number-wall-art-4.png" },
  { url: "https://cf.cjdropshipping.com/1622712870431.jpg", name: "cj-house-number-wall-art-5.jpg" },
  { url: "https://cf.cjdropshipping.com/1622709546811.jpg", name: "cj-house-number-wall-art-6.jpg" },

  // Product 2
  { url: "https://oss-cf.cjdropshipping.com/product/2024/01/22/06/8aaf5f6a-2441-48a3-9c03-77c3fe87731b.jpg", name: "cj-rose-love-gift-box-1.jpg" },
  { url: "https://cf.cjdropshipping.com/f1c1e3f9-1489-4769-8c95-4bba139883cf.jpg", name: "cj-rose-love-gift-box-2.jpg" },
  { url: "https://cf.cjdropshipping.com/67a30cf1-e9bc-4e47-aab6-0bf61dc38ac0.jpg", name: "cj-rose-love-gift-box-3.jpg" },
  { url: "https://cf.cjdropshipping.com/0d1863c2-5054-4a09-9c28-7461d6c70e34.jpg", name: "cj-rose-love-gift-box-4.jpg" },
  { url: "https://cf.cjdropshipping.com/c12dd996-dc53-4f92-8959-2be083c43751.jpg", name: "cj-rose-love-gift-box-5.jpg" },
  { url: "https://cf.cjdropshipping.com/12a385f4-8e4a-45ca-af17-15226164ad3d.jpg", name: "cj-rose-love-gift-box-6.jpg" },

  // Product 3
  { url: "https://cf.cjdropshipping.com/a7e3c8ff-b164-4383-be01-4ee2a3965c80.jpg", name: "cj-double-door-rose-box-1.jpg" },
  { url: "https://cf.cjdropshipping.com/a371c5bf-93cb-4f8a-b70a-3e3f200615fe.jpg", name: "cj-double-door-rose-box-2.jpg" },
  { url: "https://oss-cf.cjdropshipping.com/product/2026/04/28/05/f5c8585b-1728-4220-b34a-527228a2fdaa.jpg", name: "cj-double-door-rose-box-3.jpg" },
  { url: "https://cf.cjdropshipping.com/b5b92b0b-e421-4b51-a546-576c162bd4ba.jpg", name: "cj-double-door-rose-box-4.jpg" },
  { url: "https://cf.cjdropshipping.com/79dfcc9a-2566-403d-b6fa-18edcb05e592.jpg", name: "cj-double-door-rose-box-5.jpg" },
  { url: "https://oss-cf.cjdropshipping.com/product/2026/04/28/05/dab0cff5-4f6c-49d4-a82c-6aab90516b42.jpg", name: "cj-double-door-rose-box-6.jpg" },
  { url: "https://cf.cjdropshipping.com/2c509683-48f3-4d87-aa64-3ba9d8cc09b5.jpg", name: "cj-double-door-rose-box-7.jpg" },
  { url: "https://oss-cf.cjdropshipping.com/product/2025/01/16/02/40eaba14-c3e0-491b-a0d3-92a36fd800db.jpg", name: "cj-double-door-rose-box-8.jpg" },
  { url: "https://cf.cjdropshipping.com/9c3bc207-93c8-4478-b1bf-4ba1cdc45416.jpg", name: "cj-double-door-rose-box-9.jpg" },
  { url: "https://cf.cjdropshipping.com/7fce7862-04cb-43b9-9829-58d7e8b741cf.jpg", name: "cj-double-door-rose-box-10.jpg" }
];

async function main() {
  console.log("Downloading", imagesToDownload.length, "images from CJ Dropshipping CDN...");
  for (const item of imagesToDownload) {
    const dest = path.join("public", "products", item.name);
    try {
      await downloadFile(item.url, dest);
      console.log("Downloaded:", item.name);
    } catch (e) {
      console.error("Error downloading", item.name, e.message);
    }
  }

  const products = [
    // -------------------------------------------------------------
    // Product 1: House Number Wall Art Photo Digital Oil Painting
    // -------------------------------------------------------------
    {
      id: "1",
      slug: "house-number-wall-art-photo-digital-oil-painting",
      name: "House Number Wall Art Photo Digital Oil Painting",
      subtitle: "Custom photo digital oil painting on textured canvas",
      description: "Transform your cherished photo into a bespoke digital oil painting wall artwork. Handcrafted on premium artist linen canvas, this custom piece captures rich textures, vibrant tones, and museum-grade visual effects. Available in multiple canvas dimensions (40x50cm, 50x65cm, 60x75cm) across style options A, B, and C. Perfect for housewarming gifts, family memorials, wedding milestones, or elevated home decor.",
      price: 21.15,
      compareAtPrice: 42.95,
      baseCost: 5.90,
      shippingCost: 15.25,
      category: "Custom Photo Art",
      sku: "CJZW1157939",
      weight: "350g-600g",
      stock: 120,
      lowStockThreshold: 5,
      requiresPhotoUpload: true,
      requiresCustomText: false,
      sizes: ["40x50cm no frame", "50x65cm no frame", "60x75cm no frame"],
      images: [
        "/products/cj-house-number-wall-art-1.jpg",
        "/products/cj-house-number-wall-art-2.jpg",
        "/products/cj-house-number-wall-art-3.jpg",
        "/products/cj-house-number-wall-art-4.png",
        "/products/cj-house-number-wall-art-5.jpg",
        "/products/cj-house-number-wall-art-6.jpg"
      ],
      variants: [
        {
          id: "v-p1-40x50-a",
          colorName: "Style A (Warm Golden Glow)",
          hex: "#D4AF37",
          sku: "CJZW115793901AZ",
          stock: 50,
          size: "40x50cm no frame",
          style: "A",
          weight: "350g",
          price: 21.15,
          compareAtPrice: 42.95,
          images: ["/products/cj-house-number-wall-art-1.jpg"]
        },
        {
          id: "v-p1-40x50-b",
          colorName: "Style B (Sunset Crimson Tones)",
          hex: "#C41E3A",
          sku: "CJZW115793902BY",
          stock: 50,
          size: "40x50cm no frame",
          style: "B",
          weight: "350g",
          price: 21.15,
          compareAtPrice: 42.95,
          images: ["/products/cj-house-number-wall-art-2.jpg"]
        },
        {
          id: "v-p1-40x50-c",
          colorName: "Style C (Moody Monochrome Slate)",
          hex: "#708090",
          sku: "CJZW115793903CX",
          stock: 50,
          size: "40x50cm no frame",
          style: "C",
          weight: "350g",
          price: 21.15,
          compareAtPrice: 42.95,
          images: ["/products/cj-house-number-wall-art-3.jpg"]
        },
        {
          id: "v-p1-50x65-a",
          colorName: "Style A (Warm Golden Glow)",
          hex: "#D4AF37",
          sku: "CJZW115793904DW",
          stock: 50,
          size: "50x65cm no frame",
          style: "A",
          weight: "400g",
          price: 27.60,
          compareAtPrice: 54.95,
          images: ["/products/cj-house-number-wall-art-1.jpg"]
        },
        {
          id: "v-p1-50x65-b",
          colorName: "Style B (Sunset Crimson Tones)",
          hex: "#C41E3A",
          sku: "CJZW115793905EV",
          stock: 50,
          size: "50x65cm no frame",
          style: "B",
          weight: "400g",
          price: 27.60,
          compareAtPrice: 54.95,
          images: ["/products/cj-house-number-wall-art-2.jpg"]
        },
        {
          id: "v-p1-50x65-c",
          colorName: "Style C (Moody Monochrome Slate)",
          hex: "#708090",
          sku: "CJZW115793906FU",
          stock: 50,
          size: "50x65cm no frame",
          style: "C",
          weight: "400g",
          price: 27.60,
          compareAtPrice: 54.95,
          images: ["/products/cj-house-number-wall-art-3.jpg"]
        },
        {
          id: "v-p1-60x75-a",
          colorName: "Style A (Warm Golden Glow)",
          hex: "#D4AF37",
          sku: "CJZW115793907GT",
          stock: 50,
          size: "60x75cm no frame",
          style: "A",
          weight: "600g",
          price: 32.65,
          compareAtPrice: 64.95,
          images: ["/products/cj-house-number-wall-art-1.jpg"]
        },
        {
          id: "v-p1-60x75-b",
          colorName: "Style B (Sunset Crimson Tones)",
          hex: "#C41E3A",
          sku: "CJZW115793908HS",
          stock: 50,
          size: "60x75cm no frame",
          style: "B",
          weight: "600g",
          price: 32.65,
          compareAtPrice: 64.95,
          images: ["/products/cj-house-number-wall-art-2.jpg"]
        },
        {
          id: "v-p1-60x75-c",
          colorName: "Style C (Moody Monochrome Slate)",
          hex: "#708090",
          sku: "CJZW115793909IR",
          stock: 50,
          size: "60x75cm no frame",
          style: "C",
          weight: "600g",
          price: 32.65,
          compareAtPrice: 64.95,
          images: ["/products/cj-house-number-wall-art-3.jpg"]
        }
      ],
      details: [
        "Material: Premium artist-grade linen canvas",
        "Visual effects: Textured plane digital oil painting finish",
        "Available sizes: 40x50cm, 50x65cm, 60x75cm (no frame)",
        "Styles: A (Autumn Gold), B (Twilight Path), C (Lakeside Calm)",
        "Custom photo to oil painting reproduction",
        "Ships rolled in protective cylinder container",
        "Tracked delivery to Australia (5-14 business days)"
      ],
      tags: ["custom-photo", "oil-painting", "wall-art", "trending", "new-arrivals"],
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },

    // -------------------------------------------------------------
    // Product 2: Heart-Shaped Preserved Rose Soap Flower Gift Box
    // -------------------------------------------------------------
    {
      id: "2",
      slug: "heart-shaped-rose-soap-flower-gift-box",
      name: "Heart-Shaped Rose Soap Flower Gift Box",
      subtitle: "Handcrafted natural fragrance soap roses in keepsake heart box",
      description: "An elegant heart-shaped gift box filled with delicate, naturally scented soap roses. Crafted with gentle botanicals and natural fragrances, these roses are completely soluble, fast-foaming, and fiber-free—perfect for aromatherapy baths, handwashing, or permanent romantic keepsake decoration. An unforgettable gift for Valentine's Day, Mother's Day, anniversaries, weddings, graduations, and cherished milestones.",
      price: 11.75,
      compareAtPrice: 24.95,
      baseCost: 2.10,
      shippingCost: 9.65,
      category: "Gift Keepsakes",
      sku: "CJZS1654727",
      weight: "140g",
      stock: 80,
      lowStockThreshold: 5,
      requiresPhotoUpload: false,
      requiresCustomText: false,
      sizes: ["Small Heart Box (340x260x40mm)"],
      images: [
        "/products/cj-rose-love-gift-box-1.jpg",
        "/products/cj-rose-love-gift-box-2.jpg",
        "/products/cj-rose-love-gift-box-3.jpg",
        "/products/cj-rose-love-gift-box-4.jpg",
        "/products/cj-rose-love-gift-box-5.jpg",
        "/products/cj-rose-love-gift-box-6.jpg"
      ],
      variants: [
        {
          id: "v-p2-red",
          colorName: "Classic Crimson Red",
          hex: "#C41E3A",
          sku: "CJZS165472701AZ",
          stock: 50,
          size: "340x260x40mm",
          weight: "140g",
          price: 11.75,
          compareAtPrice: 24.95,
          images: ["/products/cj-rose-love-gift-box-1.jpg"]
        },
        {
          id: "v-p2-pink",
          colorName: "Blush Petal Pink",
          hex: "#FFB6C1",
          sku: "CJZS165472702BY",
          stock: 50,
          size: "340x260x40mm",
          weight: "140g",
          price: 11.75,
          compareAtPrice: 24.95,
          images: ["/products/cj-rose-love-gift-box-2.jpg"]
        },
        {
          id: "v-p2-red1",
          colorName: "Gradient Rose Red",
          hex: "#E30022",
          sku: "CJZS165472703CX",
          stock: 50,
          size: "340x260x40mm",
          weight: "140g",
          price: 11.75,
          compareAtPrice: 24.95,
          images: ["/products/cj-rose-love-gift-box-3.jpg"]
        },
        {
          id: "v-p2-pink1",
          colorName: "Pastel Sweet Pink",
          hex: "#FFC0CB",
          sku: "CJZS165472704DW",
          stock: 50,
          size: "340x260x40mm",
          weight: "140g",
          price: 11.75,
          compareAtPrice: 24.95,
          images: ["/products/cj-rose-love-gift-box-4.jpg"]
        }
      ],
      details: [
        "Material: High-clarity casing with soap flower roses",
        "Natural fragrances: Fiber-free, rich lathering soap petals",
        "Package dimensions: 340 x 260 x 40 mm",
        "Item number: Rose Love gift box",
        "Colors available: Classic Red, Blush Pink, Gradient Rose Red, Pastel Pink",
        "Suitable for: Valentine's Day, Mother's Day, birthdays, anniversaries, weddings",
        "Free Tracked Delivery across Australia"
      ],
      tags: ["rose-box", "gift-keepsake", "valentines-day", "mothers-day", "trending"],
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },

    // -------------------------------------------------------------
    // Product 3: Mother's Day Double Door Rose Jewelry Gift Box
    // -------------------------------------------------------------
    {
      id: "3",
      slug: "mothers-day-double-door-rose-jewelry-gift-box",
      name: "Mother's Day Double Door Rose Jewelry Gift Box",
      subtitle: "Illuminated double-door keepsake box with eternal roses and jewelry display",
      description: "Celebrate Mom with this breathtaking double-door eternal rose jewelry box. Opening the front doors reveals a glowing illuminated arrangement of preserved everlasting roses and carnations, complete with a concealed bottom sliding drawer designed to hold necklaces, rings, and fine jewelry. Built with ambient LED lighting, it serves as both an unforgettable gift presentation and a stunning keepsake nightstand centerpiece.",
      price: 29.70,
      compareAtPrice: 59.95,
      baseCost: 8.10,
      shippingCost: 21.60,
      category: "Gift Keepsakes",
      sku: "CJJT1668817",
      weight: "581g",
      stock: 65,
      lowStockThreshold: 5,
      requiresPhotoUpload: false,
      requiresCustomText: false,
      sizes: ["Standard Double Door (150x150x190mm)"],
      images: [
        "/products/cj-double-door-rose-box-1.jpg",
        "/products/cj-double-door-rose-box-2.jpg",
        "/products/cj-double-door-rose-box-3.jpg",
        "/products/cj-double-door-rose-box-4.jpg",
        "/products/cj-double-door-rose-box-5.jpg",
        "/products/cj-double-door-rose-box-6.jpg",
        "/products/cj-double-door-rose-box-7.jpg",
        "/products/cj-double-door-rose-box-8.jpg",
        "/products/cj-double-door-rose-box-9.jpg",
        "/products/cj-double-door-rose-box-10.jpg"
      ],
      variants: [
        {
          id: "v-p3-pink-light",
          colorName: "Pink - Double Door with LED Light",
          hex: "#FFB6C1",
          sku: "CJJT166881701AZ",
          stock: 50,
          size: "150x150x190mm",
          weight: "581g",
          price: 29.70,
          compareAtPrice: 59.95,
          images: ["/products/cj-double-door-rose-box-1.jpg"]
        },
        {
          id: "v-p3-carnation-light",
          colorName: "Pink - Carnation LED Light Double Door",
          hex: "#FF69B4",
          sku: "CJJT166881703CX",
          stock: 50,
          size: "150x150x190mm",
          weight: "581g",
          price: 29.70,
          compareAtPrice: 59.95,
          images: ["/products/cj-double-door-rose-box-2.jpg"]
        },
        {
          id: "v-p3-pink-set",
          colorName: "Pink Set - Carnation Light with Jewelry Box",
          hex: "#DB7093",
          sku: "CJJT166881704DW",
          stock: 50,
          size: "150x150x190mm",
          weight: "576g",
          price: 31.55,
          compareAtPrice: 62.95,
          images: ["/products/cj-double-door-rose-box-3.jpg"]
        },
        {
          id: "v-p3-set-1",
          colorName: "Luxury Set 1 - Carnation LED Light",
          hex: "#E75480",
          sku: "CJJT166881707GT",
          stock: 50,
          size: "150x150x190mm",
          weight: "576g",
          price: 33.80,
          compareAtPrice: 64.95,
          images: ["/products/cj-double-door-rose-box-4.jpg"]
        },
        {
          id: "v-p3-set-2",
          colorName: "Luxury Set 2 - Carnation LED Light",
          hex: "#C71585",
          sku: "CJJT166881710JQ",
          stock: 50,
          size: "150x150x190mm",
          weight: "576g",
          price: 33.80,
          compareAtPrice: 64.95,
          images: ["/products/cj-double-door-rose-box-5.jpg"]
        }
      ],
      details: [
        "Interactive double-door reveal with integrated soft LED illumination",
        "Includes eternal preserved roses and carnations",
        "Concealed slide-out velvet drawer for necklace or ring presentation",
        "Dimensions: 150 x 150 x 190 mm (Weight: ~581g)",
        "Materials: Composite acrylic display, velvet lining, preserved floral botanicals",
        "A memorable keepsake for Mother's Day, anniversaries, and romantic milestones",
        "Free Tracked Delivery across Australia (CJPacket Eub Special Line)"
      ],
      tags: ["mothers-day", "rose-box", "jewelry-box", "gift-keepsake", "trending"],
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  fs.writeFileSync("data/products.json", JSON.stringify(products, null, 2), "utf8");
  console.log("Successfully wrote 3 complete products to data/products.json!");
}

main();
