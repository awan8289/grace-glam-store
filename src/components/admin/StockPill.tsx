import { Product, getTotalStock } from '@/types';

/** Colour-coded stock badge shared by the overview and the product table. */
export default function StockPill({ product }: { product: Product }) {
  const stock = getTotalStock(product);

  const tone =
    stock === 0
      ? 'bg-[#fdeaea] text-[#a4272a]'
      : stock <= product.lowStockThreshold
        ? 'bg-[#fdf3e2] text-[#8a5a12]'
        : 'bg-[#eaf5ed] text-[#1f6b3c]';

  const label = stock === 0 ? 'Out of stock' : `${stock} in stock`;

  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-[12px] font-medium tabular-nums ${tone}`}>
      {label}
    </span>
  );
}
