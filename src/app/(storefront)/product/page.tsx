import { redirect } from 'next/navigation';

/**
 * `/product` with no id used to render a hard-coded product. Send shoppers to
 * the catalogue instead so there is one canonical URL per product.
 */
export default function ProductIndexPage() {
  redirect('/shop');
}
