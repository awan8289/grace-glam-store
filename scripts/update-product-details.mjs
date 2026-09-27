import fs from "fs";

const products = JSON.parse(fs.readFileSync("data/products.json", "utf-8"));

const necklaceDetails = [
  "Certified 18K Gold Plated over 316L surgical stainless steel",
  "Tarnish-resistant, shower-safe & 100% hypoallergenic",
  "Precision laser-cut typography with hand-polished mirror luster",
  "Adjustable chain with secure lobster clasp",
  "Delivered in signature Grace & Glam velvet box & gift pouch",
  "12-hour spelling verification grace period"
];

const diamondPaintingDetails = [
  "Full drill 5D high-density poured glue canvas",
  "Custom color calibration mapped from your photo",
  "Includes ergonomic drill pen, wax caddy, grooved sorting tray & precision tweezers",
  "30% extra resin diamond drills included in every DMC shade",
  "Rolled and packaged crease-free for immediate crafting",
  "12-hour photo replacement grace period after checkout"
];

const giftKeepsakeDetails = [
  "Handcrafted with premium materials & artisanal attention to detail",
  "Laser engraved or high-definition finish",
  "Designed in Australia for timeless sentimental value",
  "Packaged ready for luxury presentation and gifting",
  "Backed by the Grace & Glam satisfaction and quality guarantee"
];

const updated = products.map((prod) => {
  const cat = prod.category.toLowerCase();
  const name = prod.name.toLowerCase();

  let details = giftKeepsakeDetails;
  if (cat.includes("necklace") || name.includes("necklace") || name.includes("pendant")) {
    details = necklaceDetails;
  } else if (cat.includes("diamond") || name.includes("diamond") || cat.includes("art")) {
    details = diamondPaintingDetails;
  }

  return {
    ...prod,
    details,
  };
});

fs.writeFileSync("data/products.json", JSON.stringify(updated, null, 2), "utf-8");
console.log("Updated details for all 39 products in data/products.json!");
