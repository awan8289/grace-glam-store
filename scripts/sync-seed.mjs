import fs from "fs";

const products = JSON.parse(fs.readFileSync("data/products.json", "utf-8"));
const categories = JSON.parse(fs.readFileSync("data/categories.json", "utf-8"));

const content = `/**
 * Initial catalogue for Grace & Glam.
 * Bespoke Keepsakes & Personalized Jewelry
 */
import { Product } from "@/types";

export const SEED_PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};

export const PRODUCT_CATEGORIES = ${JSON.stringify(categories, null, 2)};

export const PRODUCT_TAGS = [
  { value: "trending", label: "Trending Now" },
  { value: "new-arrivals", label: "New Arrivals" },
  { value: "top-selling", label: "Top Selling" },
];
`;

fs.writeFileSync("src/lib/seed.ts", content, "utf-8");
console.log("Successfully synchronized src/lib/seed.ts with pivoted products and categories!");
