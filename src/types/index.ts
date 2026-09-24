// ============================================================================
// Core catalogue model — single source of truth for storefront + admin panel.
// ============================================================================

/** A colour variant of a product. Carries its own stock, SKU and imagery. */
export interface ProductVariant {
  id: string;
  colorName: string;
  hex: string;
  sku: string;
  stock: number;
  /** Variant-specific gallery. Falls back to the product gallery when empty. */
  images: string[];
}

/** A video asset attached to a product, uploaded through the admin panel. */
export interface ProductVideo {
  url: string;
  filename: string;
  /** MIME type, e.g. `video/mp4`. */
  type: string;
  /** Bytes. */
  size: number;
  /** Optional still shown before playback. */
  poster?: string;
  uploadedAt: string;
}

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  description: string;
  /** Selling price in the store currency (see BRAND_CONFIG). */
  price: number;
  /** Struck-through reference price. */
  compareAtPrice?: number;
  category: string;
  /** Base gallery, used when a variant carries no imagery of its own. */
  images: string[];
  video?: ProductVideo | null;
  variants: ProductVariant[];
  /** Stock for products sold without colour variants. */
  stock: number;
  lowStockThreshold: number;
  sizes: string[];
  details: string[];
  /** Merchandising tags, e.g. `trending`, `new-arrivals`. */
  tags: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
}

export type Currency = 'AUD' | 'USD' | 'EUR' | 'GBP';

export interface BrandConfig {
  name: string;
  tagline: string;
  country: string;
  currency: Currency;
  currencySymbol: string;
}

/** Aggregated numbers the admin dashboard renders. */
export interface InventoryStats {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  totalUnits: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  variantCount: number;
  productsWithVideo: number;
}

// ---------------------------------------------------------------------------
// Derived helpers — shared by server and client, so keep them dependency-free.
// ---------------------------------------------------------------------------

/** Units on hand: the sum of variant stock, or the product's own stock. */
export function getTotalStock(product: Product): number {
  if (product.variants.length > 0) {
    return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  return product.stock || 0;
}

export function isInStock(product: Product): boolean {
  return getTotalStock(product) > 0;
}

export function isLowStock(product: Product): boolean {
  const stock = getTotalStock(product);
  return stock > 0 && stock <= product.lowStockThreshold;
}

/** Every image for a product: base gallery first, then each variant's. */
export function getAllImages(product: Product): string[] {
  const images = [...product.images];
  for (const variant of product.variants) {
    for (const image of variant.images) {
      if (!images.includes(image)) images.push(image);
    }
  }
  return images;
}

/** Gallery to show for a given variant, falling back to the base gallery. */
export function getVariantImages(product: Product, variantId?: string): string[] {
  const variant = product.variants.find((v) => v.id === variantId);
  if (variant && variant.images.length > 0) return variant.images;
  return product.images.length > 0 ? product.images : getAllImages(product);
}

export function getPrimaryImage(product: Product): string {
  return getAllImages(product)[0] ?? '/products/placeholder.webp';
}

/** Percentage off, rounded, or null when there is no compare-at price. */
export function getDiscountPercent(product: Product): number | null {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return null;
  return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
}
