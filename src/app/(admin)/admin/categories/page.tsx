import { listAllCategories } from '@/lib/categories';
import { listProducts } from '@/lib/products';
import CategoryManager from '@/components/admin/CategoryManager';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Categories' };

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([listAllCategories(), listProducts({})]);

  // Counted here so each row can say why it cannot be deleted before it is tried.
  const withUsage = categories.map((name) => ({
    name,
    productCount: products.filter(
      (product) => product.category.toLowerCase() === name.toLowerCase()
    ).length,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Categories</h1>
        <p className="mt-1 max-w-prose text-[13px] text-[#6b6b73]">
          These are the collections a product can belong to. They appear in the product form, the
          shop filters and the footer. A category holding products cannot be deleted until they are
          moved.
        </p>
      </header>

      <CategoryManager categories={withUsage} />
    </div>
  );
}
