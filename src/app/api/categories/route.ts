import { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { addCategory, listAllCategories } from '@/lib/categories';
import { listCategories } from '@/lib/products';

export const dynamic = 'force-dynamic';

/**
 * Public — the storefront footer reads this.
 *
 * Shoppers get only the categories that actually contain something for sale; a
 * link to an empty category is a dead end. The admin gets the managed list too,
 * so a category can be created before the first product goes into it.
 */
export async function GET() {
  const categories = (await isAuthenticated())
    ? await listAllCategories()
    : await listCategories();

  return Response.json({ categories, count: categories.length });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) return unauthorized();

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const result = await addCategory(String(body.name ?? ''));
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });

  // The footer and the shop filters render this list.
  revalidatePath('/', 'layout');

  return Response.json({ categories: result.categories }, { status: 201 });
}
