import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { deleteProduct, getProduct, setStock, updateProduct } from '@/lib/products';

export const dynamic = 'force-dynamic';

// `params` is a Promise in Next 16 — see route.js reference.
type Context = { params: Promise<{ id: string }> };

/** Public for published pieces; a draft is invisible until the admin says so. */
export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return Response.json({ error: 'Product not found.' }, { status: 404 });
  }

  // 404, not 403 — confirming a draft exists is itself the leak.
  if (product.status !== 'active' && !(await isAuthenticated())) {
    return Response.json({ error: 'Product not found.' }, { status: 404 });
  }

  return Response.json({ product });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  if (!(await isAuthenticated())) return unauthorized();

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  // `{ stock }` on its own is the inline table editor; anything else is a full save.
  const isStockOnly =
    Object.keys(body).every((key) => key === 'stock' || key === 'variantId') && 'stock' in body;

  const product = isStockOnly
    ? await setStock(id, Number(body.stock), body.variantId ? String(body.variantId) : undefined)
    : await updateProduct(id, body);

  if (!product) {
    return Response.json({ error: 'Product not found.' }, { status: 404 });
  }

  revalidatePath('/', 'layout');

  return Response.json({ product });
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  if (!(await isAuthenticated())) return unauthorized();

  const { id } = await params;
  const deleted = await deleteProduct(id);

  if (!deleted) {
    return Response.json({ error: 'Product not found.' }, { status: 404 });
  }

  revalidatePath('/', 'layout');

  return Response.json({ ok: true });
}
