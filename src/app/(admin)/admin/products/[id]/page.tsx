import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/products';
import { listAllCategories } from '@/lib/categories';
import ProductForm from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product ? `Edit ${product.name}` : 'Product not found' };
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), listAllCategories()]);

  if (!product) notFound();

  return <ProductForm product={product} categories={categories} />;
}
