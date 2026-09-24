import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { createProduct, listProducts, ProductQuery } from '@/lib/products';
import { ProductStatus } from '@/types';

/** Admin edits must show on the storefront immediately, so never cache reads. */
export const dynamic = 'force-dynamic';

/**
 * Public — the storefront header search reads this.
 *
 * Which is exactly why the status filter is not the caller's to choose: an
 * unpublished product is a launch that hasn't happened yet, and `?status=all`
 * would hand its name, price and photos to anyone who asked. Only a signed-in
 * admin sees drafts and archived pieces.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const admin = await isAuthenticated();

  const query: ProductQuery = {
    search: params.get('search') ?? undefined,
    category: params.get('category') ?? undefined,
    tag: params.get('tag') ?? undefined,
    status: admin ? ((params.get('status') as ProductStatus | 'all') ?? 'all') : 'active',
    lowStockOnly: admin && params.get('lowStock') === 'true',
    sort: (params.get('sort') as ProductQuery['sort']) ?? undefined,
  };

  const products = await listProducts(query);
  return Response.json({ products, count: products.length });
}

export async function POST(request: NextRequest) {
  // The proxy gates this too. Checking here as well means a matcher edit can
  // never silently open the catalogue up to anonymous writes.
  if (!(await isAuthenticated())) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  if (!String(body.name ?? '').trim()) {
    return Response.json({ error: 'A product name is required.' }, { status: 400 });
  }

  const product = await createProduct(body);

  revalidatePath('/', 'layout');

  return Response.json({ product }, { status: 201 });
}
