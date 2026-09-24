import { listAllCategories } from '@/lib/categories';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'New product' };

export default async function NewProductPage() {
  const categories = await listAllCategories();
  return <ProductForm categories={categories} />;
}
