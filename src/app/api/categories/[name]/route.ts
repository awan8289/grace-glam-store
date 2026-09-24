import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { deleteCategory } from '@/lib/categories';

export const dynamic = 'force-dynamic';

// `params` is a Promise in Next 16 — see route.js reference.
type Context = { params: Promise<{ name: string }> };

export async function DELETE(_request: NextRequest, { params }: Context) {
  if (!(await isAuthenticated())) return unauthorized();

  const { name } = await params;
  const result = await deleteCategory(decodeURIComponent(name));

  if (!result.ok) {
    // 409, not 400: the request is well formed, the catalogue's current state is
    // what refuses it. Moving the products makes the same request succeed.
    return Response.json({ error: result.error }, { status: 409 });
  }

  revalidatePath('/', 'layout');

  return Response.json({ categories: result.categories });
}
