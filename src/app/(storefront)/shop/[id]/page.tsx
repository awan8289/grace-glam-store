import { permanentRedirect } from 'next/navigation';

/** Legacy alias — `/product/[id]` is the canonical product URL. */
export default async function ShopProductRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/product/${id}`);
}
