import Link from 'next/link';
import { listProducts, ProductQuery } from '@/lib/products';
import { listAllCategories } from '@/lib/categories';
import { ProductStatus } from '@/types';
import ProductTable from '@/components/admin/ProductTable';
import ProductFilters from '@/components/admin/ProductFilters';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Products' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && raw.length > 0 ? raw : undefined;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const query: ProductQuery = {
    search: one(params.search),
    category: one(params.category),
    status: (one(params.status) as ProductStatus | 'all') ?? 'all',
    lowStockOnly: one(params.lowStock) === 'true',
    sort: (one(params.sort) as ProductQuery['sort']) ?? 'newest',
  };

  // The managed list, not just the in-use one — a category created for an
  // upcoming drop must be filterable before anything is in it.
  const [products, categories] = await Promise.all([listProducts(query), listAllCategories()]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-[13px] text-[#6b6b73]">
            {products.length} {products.length === 1 ? 'product' : 'products'}
            {query.search ? ` matching “${query.search}”` : ''}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-[#16161a] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#2c2c33]"
        >
          Add product
        </Link>
      </header>

      <ProductFilters categories={categories} />

      <ProductTable products={products} />
    </div>
  );
}
