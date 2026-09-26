import { Product, ProductStatus, ProductVariant, InventoryStats, getTotalStock } from '@/types';
import { SEED_PRODUCTS } from '@/lib/seed';
import { slugify } from '@/lib/format';
import { createFirestoreStore } from '@/lib/firestore-store';

/** Cached, write-serialised, atomically-written catalogue. */
export const productStore = createFirestoreStore<Product>('products', SEED_PRODUCTS);

const readFile = productStore.read;

// ---------------------------------------------------------------------------
// Normalisation — anything reaching the store passes through here, so a
// malformed request body can never corrupt the catalogue shape.
// ---------------------------------------------------------------------------

const VALID_STATUSES: ProductStatus[] = ['active', 'draft', 'archived'];

function toNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).trim()).filter(Boolean);
}

function normalizeHex(value: unknown, fallback = '#000000'): string {
  const raw = String(value ?? '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw.toLowerCase() : fallback;
}

function normalizeVariant(
  input: Partial<ProductVariant>,
  index: number,
  productSlug: string
): ProductVariant {
  const colorName = String(input.colorName ?? '').trim() || `Colour ${index + 1}`;
  return {
    id:
      String(input.id ?? '').trim() ||
      `v-${Date.now()}-${index}-${Math.round(Math.random() * 1e6)}`,
    colorName,
    hex: normalizeHex(input.hex),
    sku:
      String(input.sku ?? '').trim() ||
      `GG-${slugify(productSlug).slice(0, 6).toUpperCase()}-${slugify(colorName).slice(0, 4).toUpperCase()}`,
    stock: Math.max(0, Math.round(toNumber(input.stock, 0))),
    images: toStringArray(input.images),
  };
}

/** Builds a complete, valid Product from arbitrary input plus an optional base. */
function normalizeProduct(input: Record<string, unknown>, base?: Product): Product {
  const now = new Date().toISOString();
  const name = String(input.name ?? base?.name ?? '').trim() || 'Untitled Product';
  const slug =
    String(input.slug ?? '').trim() || base?.slug || slugify(name) || `product-${Date.now()}`;

  const rawVariants = Array.isArray(input.variants)
    ? (input.variants as Partial<ProductVariant>[])
    : (base?.variants ?? []);

  const status = VALID_STATUSES.includes(input.status as ProductStatus)
    ? (input.status as ProductStatus)
    : (base?.status ?? 'draft');

  const video =
    input.video === undefined ? (base?.video ?? null) : ((input.video as Product['video']) ?? null);

  return {
    id: base?.id ?? String(input.id ?? '').trim(),
    slug,
    name,
    subtitle: String(input.subtitle ?? base?.subtitle ?? '').trim() || undefined,
    description: String(input.description ?? base?.description ?? '').trim(),
    price: Math.max(0, toNumber(input.price, base?.price ?? 0)),
    compareAtPrice: (() => {
      const raw = input.compareAtPrice ?? base?.compareAtPrice;
      const value = toNumber(raw, 0);
      return value > 0 ? value : undefined;
    })(),
    category: String(input.category ?? base?.category ?? '').trim() || 'Uncategorised',
    images: input.images === undefined ? (base?.images ?? []) : toStringArray(input.images),
    video,
    variants: rawVariants.map((v, i) => normalizeVariant(v, i, slug)),
    stock: Math.max(0, Math.round(toNumber(input.stock, base?.stock ?? 0))),
    lowStockThreshold: Math.max(
      0,
      Math.round(toNumber(input.lowStockThreshold, base?.lowStockThreshold ?? 10))
    ),
    sizes: input.sizes === undefined ? (base?.sizes ?? []) : toStringArray(input.sizes),
    details: input.details === undefined ? (base?.details ?? []) : toStringArray(input.details),
    tags: input.tags === undefined ? (base?.tags ?? []) : toStringArray(input.tags),
    status,
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ProductQuery {
  /** Free-text match on name, category, SKU and colour names. */
  search?: string;
  category?: string;
  tag?: string;
  status?: ProductStatus | 'all';
  /** Only products at or below their low-stock threshold. */
  lowStockOnly?: boolean;
  sort?: 'newest' | 'oldest' | 'price-asc' | 'price-desc' | 'name' | 'stock-asc';
}

export async function listProducts(query: ProductQuery = {}): Promise<Product[]> {
  // Copied because the sorts below mutate, and `readFile` returns the cache.
  let products = [...(await readFile())];

  const status = query.status ?? 'all';
  if (status !== 'all') {
    products = products.filter((p) => p.status === status);
  }

  if (query.category) {
    products = products.filter((p) => p.category === query.category);
  }

  if (query.tag) {
    products = products.filter((p) => p.tags.includes(query.tag!));
  }

  if (query.lowStockOnly) {
    products = products.filter((p) => getTotalStock(p) <= p.lowStockThreshold);
  }

  if (query.search) {
    const needle = query.search.trim().toLowerCase();
    products = products.filter((p) => {
      const haystack = [
        p.name,
        p.subtitle ?? '',
        p.category,
        p.slug,
        ...p.tags,
        ...p.variants.map((v) => `${v.colorName} ${v.sku}`),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }

  switch (query.sort) {
    case 'oldest':
      products.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      break;
    case 'price-asc':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'name':
      products.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'stock-asc':
      products.sort((a, b) => getTotalStock(a) - getTotalStock(b));
      break;
    case 'newest':
    default:
      products.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
  }

  return products;
}

/** Storefront listing: active products only, oldest-first so the shop is stable. */
export async function listStorefrontProducts(
  query: Omit<ProductQuery, 'status'> = {}
): Promise<Product[]> {
  return listProducts({ ...query, status: 'active', sort: query.sort ?? 'oldest' });
}

/** Looks a product up by id first, then by slug. */
export async function getProduct(idOrSlug: string): Promise<Product | null> {
  const products = await readFile();
  return (
    products.find((p) => p.id === idOrSlug) ?? products.find((p) => p.slug === idOrSlug) ?? null
  );
}

export async function createProduct(input: Record<string, unknown>): Promise<Product> {
  return productStore.mutate(async (products) => {
    const nextId = String(products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1);

    let product = normalizeProduct(input);
    product = { ...product, id: nextId };

    // Slugs address product routes, so they have to stay unique.
    if (products.some((p) => p.slug === product.slug)) {
      product.slug = `${product.slug}-${nextId}`;
    }

    await productStore.write([...products, product]);
    return product;
  });
}

export async function updateProduct(
  id: string,
  input: Record<string, unknown>
): Promise<Product | null> {
  return productStore.mutate(async (products) => {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const updated = normalizeProduct(input, products[index]);
    if (products.some((p) => p.id !== id && p.slug === updated.slug)) {
      updated.slug = `${updated.slug}-${id}`;
    }

    products[index] = updated;
    await productStore.write(products);
    return updated;
  });
}

export async function deleteProduct(id: string): Promise<boolean> {
  return productStore.mutate(async (products) => {
    const remaining = products.filter((p) => p.id !== id);
    if (remaining.length === products.length) return false;
    await productStore.write(remaining);
    return true;
  });
}

/**
 * Stock-only write used by the inventory table's inline editor. Targets either
 * a single variant or the product's own stock counter.
 */
export async function setStock(
  id: string,
  stock: number,
  variantId?: string
): Promise<Product | null> {
  return productStore.mutate(async (products) => {
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const product = products[index];
    const value = Math.max(0, Math.round(toNumber(stock, 0)));

    if (variantId) {
      const variantIndex = product.variants.findIndex((v) => v.id === variantId);
      if (variantIndex === -1) return null;
      product.variants[variantIndex] = { ...product.variants[variantIndex], stock: value };
    } else {
      product.stock = value;
    }

    product.updatedAt = new Date().toISOString();
    products[index] = product;
    await productStore.write(products);
    return product;
  });
}

/** One line of a stock movement: which product, which colour, how many units. */
export interface StockMovement {
  productId: string;
  variantId?: string;
  quantity: number;
}

export type ReserveResult = { ok: true } | { ok: false; error: string };

/**
 * Atomically checks and takes stock for a whole order.
 *
 * The check and the decrement MUST happen inside one `mutate`. Doing the check
 * in the route and the decrement here let five concurrent requests all pass the
 * same check and oversell a single unit four times over — verified, not
 * theoretical.
 *
 * Two phases: validate every line first, then apply. That way a shortfall on
 * the last line cannot leave the earlier lines already decremented.
 */
export async function reserveStock(movements: StockMovement[]): Promise<ReserveResult> {
  if (movements.length === 0) return { ok: true };

  return productStore.mutate(async (products) => {
    // ---- Phase 1: validate, changing nothing ----
    for (const movement of movements) {
      const product = products.find((p) => p.id === movement.productId);
      if (!product) {
        return { ok: false as const, error: 'A product in your bag is no longer available.' };
      }
      if (product.status !== 'active') {
        return { ok: false as const, error: `${product.name} is no longer available.` };
      }

      const quantity = Math.max(0, Math.floor(movement.quantity));

      if (movement.variantId) {
        const variant = product.variants.find((v) => v.id === movement.variantId);
        if (!variant) {
          return {
            ok: false as const,
            error: `That colour of ${product.name} is no longer available.`,
          };
        }
        if (variant.stock < quantity) {
          return {
            ok: false as const,
            error: `${product.name} (${variant.colorName}) only has ${variant.stock} left.`,
          };
        }
      } else {
        // A product with colours must be ordered by colour, or stock cannot be
        // attributed correctly.
        if (product.variants.length > 0) {
          return { ok: false as const, error: `Choose a colour for ${product.name}.` };
        }
        if (product.stock < quantity) {
          return { ok: false as const, error: `${product.name} only has ${product.stock} left.` };
        }
      }
    }

    // ---- Phase 2: apply, nothing can fail now ----
    for (const movement of movements) {
      const product = products.find((p) => p.id === movement.productId)!;
      const quantity = Math.max(0, Math.floor(movement.quantity));

      if (movement.variantId) {
        const variant = product.variants.find((v) => v.id === movement.variantId)!;
        variant.stock -= quantity;
      } else {
        product.stock -= quantity;
      }
      product.updatedAt = new Date().toISOString();
    }

    await productStore.write(products);
    return { ok: true as const };
  });
}

/**
 * Applies several stock changes in one pass. Used to put stock BACK (direction
 * +1) when an order is cancelled, and to take it again if that order is
 * reopened.
 *
 * Taking stock for a new order must go through `reserveStock` instead — this
 * function floors at zero rather than refusing, so on its own it would happily
 * oversell.
 */
export async function applyStockMovements(
  movements: StockMovement[],
  direction: -1 | 1
): Promise<void> {
  if (movements.length === 0) return;

  await productStore.mutate(async (products) => {
    let touched = false;

    for (const movement of movements) {
      const product = products.find((p) => p.id === movement.productId);
      if (!product) continue;

      const delta = direction * Math.max(0, Math.round(movement.quantity));
      if (delta === 0) continue;

      const variant = movement.variantId
        ? product.variants.find((v) => v.id === movement.variantId)
        : undefined;

      if (variant) {
        variant.stock = Math.max(0, variant.stock + delta);
      } else if (product.variants.length === 0) {
        product.stock = Math.max(0, product.stock + delta);
      } else {
        // The variant is gone (deleted since the order was placed). Take the
        // units off the first variant that can absorb them rather than silently
        // losing the movement.
        const fallback =
          product.variants.find((v) => v.stock + delta >= 0) ?? product.variants[0];
        fallback.stock = Math.max(0, fallback.stock + delta);
      }

      product.updatedAt = new Date().toISOString();
      touched = true;
    }

    if (touched) await productStore.write(products);
  });
}

export async function getInventoryStats(): Promise<InventoryStats> {
  const products = await readFile();

  return products.reduce<InventoryStats>(
    (stats, product) => {
      const stock = getTotalStock(product);
      stats.totalProducts += 1;
      if (product.status === 'active') stats.activeProducts += 1;
      if (product.status === 'draft') stats.draftProducts += 1;
      stats.totalUnits += stock;
      stats.inventoryValue += stock * product.price;
      stats.variantCount += product.variants.length;
      if (product.video) stats.productsWithVideo += 1;
      if (stock === 0) stats.outOfStockCount += 1;
      else if (stock <= product.lowStockThreshold) stats.lowStockCount += 1;
      return stats;
    },
    {
      totalProducts: 0,
      activeProducts: 0,
      draftProducts: 0,
      totalUnits: 0,
      inventoryValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      variantCount: 0,
      productsWithVideo: 0,
    }
  );
}

export async function listCategories(): Promise<string[]> {
  const products = await readFile();
  return [...new Set(products.map((p) => p.category))].sort();
}
