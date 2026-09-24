'use client';

import { ProductVariant } from '@/types';
import { slugify } from '@/lib/format';
import { ImageUploader } from '@/components/admin/MediaUploader';

/** Starting palette so adding a colour is one click, not a colour-picker chore. */
const SUGGESTED_COLORS = [
  { name: 'Obsidian Black', hex: '#111111' },
  { name: 'Champagne Gold', hex: '#d4af37' },
  { name: 'Desert Sand', hex: '#c5a880' },
  { name: 'Ivory', hex: '#f3eee4' },
  { name: 'Olive Green', hex: '#6b7a4b' },
  { name: 'Sapphire Blue', hex: '#0f52ba' },
  { name: 'Rose Gold', hex: '#b76e79' },
  { name: 'Charcoal', hex: '#36393f' },
];

const fieldClass =
  'h-8 w-full rounded-md border border-[#e2e2df] bg-white px-2.5 text-[13px] text-[#16161a] outline-none transition-colors focus:border-[#16161a]';

const labelClass = 'mb-1 block text-[11px] font-medium uppercase tracking-[0.06em] text-[#8a8a93]';

export function makeVariant(productName: string, index: number): ProductVariant {
  const suggestion = SUGGESTED_COLORS[index % SUGGESTED_COLORS.length];
  const stem = slugify(productName).slice(0, 6).toUpperCase() || 'PROD';
  return {
    id: `v-${Date.now()}-${index}`,
    colorName: suggestion.name,
    hex: suggestion.hex,
    sku: `GG-${stem}-${slugify(suggestion.name).slice(0, 4).toUpperCase()}`,
    stock: 0,
    images: [],
  };
}

export default function VariantEditor({
  productName,
  variants,
  onChange,
}: {
  productName: string;
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}) {
  const update = (id: string, patch: Partial<ProductVariant>) => {
    onChange(variants.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)));
  };

  const totalStock = variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">Colour variants</h2>
          <p className="mt-0.5 text-[12px] text-[#8a8a93]">
            {variants.length === 0
              ? 'No variants — the product uses a single stock count.'
              : `${variants.length} colour${variants.length === 1 ? '' : 's'} · ${totalStock} units total`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...variants, makeVariant(productName, variants.length)])}
          className="rounded-md border border-[#e2e2df] bg-white px-3 py-1.5 text-[13px] font-medium transition-colors hover:border-[#16161a]"
        >
          + Add colour
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="rounded-md border border-dashed border-[#d5d5d1] bg-white px-4 py-6 text-center text-[13px] text-[#8a8a93]">
          Add a colour to track stock and imagery per shade.
        </p>
      ) : (
        <ul className="space-y-2">
          {variants.map((variant, index) => (
            <li key={variant.id} className="rounded-lg border border-[#e2e2df] bg-white p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                {/* Swatch */}
                <div className="sm:col-span-2">
                  <span className={labelClass}>Swatch</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={variant.hex}
                      onChange={(event) => update(variant.id, { hex: event.target.value })}
                      aria-label={`Colour for ${variant.colorName}`}
                      className="h-8 w-9 cursor-pointer rounded border border-[#e2e2df] bg-white p-0.5"
                    />
                    <input
                      type="text"
                      value={variant.hex}
                      onChange={(event) => update(variant.id, { hex: event.target.value })}
                      aria-label={`Hex code for ${variant.colorName}`}
                      className={`${fieldClass} font-mono text-[12px]`}
                    />
                  </div>
                </div>

                {/* Name */}
                <div className="sm:col-span-4">
                  <label className={labelClass} htmlFor={`${variant.id}-name`}>
                    Colour name
                  </label>
                  <input
                    id={`${variant.id}-name`}
                    type="text"
                    value={variant.colorName}
                    onChange={(event) => update(variant.id, { colorName: event.target.value })}
                    list="admin-colour-suggestions"
                    className={fieldClass}
                  />
                </div>

                {/* SKU */}
                <div className="sm:col-span-3">
                  <label className={labelClass} htmlFor={`${variant.id}-sku`}>
                    SKU
                  </label>
                  <input
                    id={`${variant.id}-sku`}
                    type="text"
                    value={variant.sku}
                    onChange={(event) => update(variant.id, { sku: event.target.value })}
                    className={`${fieldClass} font-mono text-[12px]`}
                  />
                </div>

                {/* Stock */}
                <div className="sm:col-span-2">
                  <label className={labelClass} htmlFor={`${variant.id}-stock`}>
                    Stock
                  </label>
                  <input
                    id={`${variant.id}-stock`}
                    type="number"
                    min={0}
                    value={variant.stock}
                    onChange={(event) => update(variant.id, { stock: Number(event.target.value) })}
                    className={`${fieldClass} tabular-nums`}
                  />
                </div>

                {/* Remove */}
                <div className="flex items-end sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => onChange(variants.filter((v) => v.id !== variant.id))}
                    aria-label={`Remove ${variant.colorName}`}
                    className="h-8 w-full rounded-md border border-[#e2e2df] text-[13px] text-[#6b6b73] transition-colors hover:border-[#a4272a] hover:text-[#a4272a]"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="mt-3 border-t border-[#f2f2f0] pt-3">
                <ImageUploader
                  images={variant.images}
                  onChange={(images) => update(variant.id, { images })}
                  label={`${variant.colorName || `Colour ${index + 1}`} images`}
                  compact
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <datalist id="admin-colour-suggestions">
        {SUGGESTED_COLORS.map((color) => (
          <option key={color.name} value={color.name} />
        ))}
      </datalist>
    </div>
  );
}
