'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Product, ProductStatus, ProductVariant, ProductVideo } from '@/types';
import { formatPrice, slugify } from '@/lib/format';
import { PRODUCT_TAGS } from '@/lib/seed';
import { ImageUploader, VideoUploader } from '@/components/admin/MediaUploader';
import VariantEditor, { makeVariant } from '@/components/admin/VariantEditor';

const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'One Size'];

/** Sentinel option value. No real category may equal this. */
const NEW_CATEGORY = '__new__';

const fieldClass =
  'h-9 w-full rounded-md border border-[#e2e2df] bg-white px-3 text-[13px] text-[#16161a] outline-none transition-colors focus:border-[#16161a]';

const labelClass = 'mb-1.5 block text-[13px] font-medium';

interface FormState {
  name: string;
  subtitle: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  category: string;
  status: ProductStatus;
  stock: string;
  lowStockThreshold: string;
  sizes: string[];
  tags: string[];
  details: string;
  images: string[];
  variants: ProductVariant[];
  video: ProductVideo | null;
}

function toFormState(product?: Product, categories: string[] = []): FormState {
  return {
    name: product?.name ?? '',
    subtitle: product?.subtitle ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    price: product ? String(product.price) : '',
    compareAtPrice: product?.compareAtPrice ? String(product.compareAtPrice) : '',
    category: product?.category ?? categories[0] ?? '',
    status: product?.status ?? 'active',
    stock: product ? String(product.stock) : '0',
    lowStockThreshold: product ? String(product.lowStockThreshold) : '10',
    sizes: product?.sizes ?? ['S', 'M', 'L'],
    tags: product?.tags ?? [],
    details: (product?.details ?? []).join('\n'),
    images: product?.images ?? [],
    variants: product?.variants ?? [],
    video: product?.video ?? null,
  };
}

export default function ProductForm({
  product,
  categories = [],
}: {
  product?: Product;
  categories?: string[];
}) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [form, setForm] = useState<FormState>(() => toFormState(product, categories));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** `null` = picking from the list; a string = typing a brand new name. */
  const [newCategory, setNewCategory] = useState<string | null>(null);

  /**
   * The product's own category is always offered, even when it is not in the
   * managed list. Without this the select has no matching option, the browser
   * shows the first one instead, and saving silently moves the product.
   */
  const categoryOptions = form.category && !categories.includes(form.category)
    ? [form.category, ...categories]
    : categories;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const confirmNewCategory = () => {
    const trimmed = (newCategory ?? '').trim().replace(/\s+/g, ' ');
    if (!trimmed) {
      setNewCategory(null);
      return;
    }
    // Matching an existing name case-insensitively reuses it rather than
    // creating "Luxury pins" alongside "Luxury Pins".
    const existing = categories.find((entry) => entry.toLowerCase() === trimmed.toLowerCase());
    set('category', existing ?? trimmed);
    setNewCategory(null);
  };

  const toggleFrom = (list: string[], value: string) =>
    list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

  const variantStock = form.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
  const effectiveStock = form.variants.length > 0 ? variantStock : Number(form.stock) || 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('A product name is required.');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      setError('Enter a selling price greater than zero.');
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      subtitle: form.subtitle.trim(),
      slug: form.slug.trim() || slugify(form.name),
      description: form.description.trim(),
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : 0,
      category: form.category,
      status: form.status,
      stock: Number(form.stock) || 0,
      lowStockThreshold: Number(form.lowStockThreshold) || 0,
      sizes: form.sizes,
      tags: form.tags,
      details: form.details
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      images: form.images,
      variants: form.variants,
      video: form.video,
    };

    try {
      const response = await fetch(isEdit ? `/api/products/${product!.id}` : '/api/products', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Could not save the product.');

      router.push('/admin/products');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the product.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      {/* ---------------- Header ---------------- */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/products" className="text-[13px] text-[#6b6b73] hover:text-[#16161a]">
            ← Products
          </Link>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight">
            {isEdit ? form.name || 'Edit product' : 'New product'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="rounded-md border border-[#e2e2df] bg-white px-3.5 py-2 text-[13px] font-medium transition-colors hover:border-[#16161a]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-[#16161a] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#2c2c33] disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-md bg-[#fdeaea] px-3 py-2 text-[13px] text-[#a4272a]">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ============ Main column ============ */}
        <div className="space-y-8 lg:col-span-2">
          {/* Basics */}
          <section className="rounded-lg border border-[#ececea] bg-white p-5">
            <h2 className="mb-4 text-[15px] font-semibold tracking-tight">Details</h2>

            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(event) => set('name', event.target.value)}
                  placeholder="Signature Royal Abaya"
                  required
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="subtitle">
                    Subtitle
                  </label>
                  <input
                    id="subtitle"
                    type="text"
                    value={form.subtitle}
                    onChange={(event) => set('subtitle', event.target.value)}
                    placeholder="The house signature"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="slug">
                    URL slug
                  </label>
                  <input
                    id="slug"
                    type="text"
                    value={form.slug}
                    onChange={(event) => set('slug', event.target.value)}
                    placeholder={slugify(form.name) || 'auto-generated'}
                    className={`${fieldClass} font-mono text-[12px]`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(event) => set('description', event.target.value)}
                  rows={3}
                  placeholder="Crafted with premium breathable fabric and hand-stitched detailing."
                  className="w-full rounded-md border border-[#e2e2df] bg-white px-3 py-2 text-[13px] leading-relaxed text-[#16161a] outline-none transition-colors focus:border-[#16161a]"
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="details">
                  Detail bullets
                </label>
                <textarea
                  id="details"
                  value={form.details}
                  onChange={(event) => set('details', event.target.value)}
                  rows={3}
                  placeholder={'One per line\nPremium breathable crepe\nDry clean only'}
                  className="w-full rounded-md border border-[#e2e2df] bg-white px-3 py-2 text-[13px] leading-relaxed text-[#16161a] outline-none transition-colors focus:border-[#16161a]"
                />
                <p className="mt-1 text-[12px] text-[#8a8a93]">One bullet per line.</p>
              </div>
            </div>
          </section>

          {/* Media */}
          <section className="space-y-6 rounded-lg border border-[#ececea] bg-white p-5">
            <h2 className="text-[15px] font-semibold tracking-tight">Media</h2>
            <ImageUploader images={form.images} onChange={(images) => set('images', images)} />
            <div className="border-t border-[#f2f2f0] pt-6">
              <VideoUploader video={form.video} onChange={(video) => set('video', video)} />
            </div>
          </section>

          {/* Variants */}
          <section className="rounded-lg border border-[#ececea] bg-white p-5">
            <VariantEditor
              productName={form.name}
              variants={form.variants}
              onChange={(variants) => set('variants', variants)}
            />
          </section>
        </div>

        {/* ============ Sidebar ============ */}
        <div className="space-y-6">
          {/* Status */}
          <section className="rounded-lg border border-[#ececea] bg-white p-5">
            <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Visibility</h2>
            <div className="flex gap-1 rounded-md bg-[#f2f2f0] p-1">
              {(['active', 'draft', 'archived'] as ProductStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => set('status', status)}
                  aria-pressed={form.status === status}
                  className={`flex-1 rounded px-2 py-1.5 text-[12px] font-medium capitalize transition-colors ${
                    form.status === status ? 'bg-white text-[#16161a] shadow-sm' : 'text-[#6b6b73]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-[#8a8a93]">
              Only active products appear on the storefront.
            </p>
          </section>

          {/* Pricing */}
          <section className="rounded-lg border border-[#ececea] bg-white p-5">
            <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Pricing</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="price">
                  Price
                </label>
                <input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(event) => set('price', event.target.value)}
                  required
                  className={`${fieldClass} tabular-nums`}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="compareAtPrice">
                  Compare at
                </label>
                <input
                  id="compareAtPrice"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.compareAtPrice}
                  onChange={(event) => set('compareAtPrice', event.target.value)}
                  className={`${fieldClass} tabular-nums`}
                />
              </div>
            </div>
            {Number(form.compareAtPrice) > Number(form.price) && Number(form.price) > 0 && (
              <p className="mt-2 text-[12px] text-[#1f6b3c]">
                Shows as{' '}
                {Math.round(
                  ((Number(form.compareAtPrice) - Number(form.price)) / Number(form.compareAtPrice)) * 100
                )}
                % off.
              </p>
            )}
          </section>

          {/* Inventory */}
          <section className="rounded-lg border border-[#ececea] bg-white p-5">
            <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Inventory</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="stock">
                  Stock
                </label>
                <input
                  id="stock"
                  type="number"
                  min={0}
                  value={form.variants.length > 0 ? variantStock : form.stock}
                  onChange={(event) => set('stock', event.target.value)}
                  disabled={form.variants.length > 0}
                  className={`${fieldClass} tabular-nums disabled:bg-[#f7f7f6] disabled:text-[#8a8a93]`}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="lowStockThreshold">
                  Low at
                </label>
                <input
                  id="lowStockThreshold"
                  type="number"
                  min={0}
                  value={form.lowStockThreshold}
                  onChange={(event) => set('lowStockThreshold', event.target.value)}
                  className={`${fieldClass} tabular-nums`}
                />
              </div>
            </div>

            <p className="mt-2 text-[12px] text-[#8a8a93]">
              {form.variants.length > 0
                ? 'Stock is the sum of the colour variants below.'
                : 'Add colour variants to track stock per shade.'}
            </p>

            <div className="mt-3 flex items-center justify-between border-t border-[#f2f2f0] pt-3 text-[13px]">
              <span className="text-[#6b6b73]">Stock value</span>
              <span className="font-medium tabular-nums">
                {formatPrice(effectiveStock * (Number(form.price) || 0))}
              </span>
            </div>
          </section>

          {/* Organisation */}
          <section className="rounded-lg border border-[#ececea] bg-white p-5">
            <h2 className="mb-3 text-[15px] font-semibold tracking-tight">Organisation</h2>

            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="category">
                  Category
                </label>
                {newCategory === null ? (
                  <select
                    id="category"
                    value={form.category}
                    onChange={(event) => {
                      if (event.target.value === NEW_CATEGORY) {
                        setNewCategory('');
                        return;
                      }
                      set('category', event.target.value);
                    }}
                    className={fieldClass}
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value={NEW_CATEGORY}>+ New category…</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      id="category"
                      autoFocus
                      value={newCategory}
                      onChange={(event) => setNewCategory(event.target.value)}
                      onKeyDown={(event) => {
                        // Enter here must not submit the whole product form.
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          confirmNewCategory();
                        }
                        if (event.key === 'Escape') setNewCategory(null);
                      }}
                      placeholder="Category name"
                      maxLength={60}
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={confirmNewCategory}
                      className="h-9 shrink-0 rounded-md border border-[#e2e2df] px-3 text-[13px] transition-colors hover:border-[#16161a]"
                    >
                      Use
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewCategory(null)}
                      className="h-9 shrink-0 rounded-md px-2 text-[13px] text-[#6b6b73] transition-colors hover:text-[#16161a]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <p className="mt-1.5 text-[12px] text-[#8a8a93]">
                  Manage the full list under{' '}
                  <Link href="/admin/categories" className="underline hover:text-[#16161a]">
                    Categories
                  </Link>
                  .
                </p>
              </div>

              <div>
                <span className={labelClass}>Sizes</span>
                <div className="flex flex-wrap gap-1.5">
                  {SIZE_PRESETS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => set('sizes', toggleFrom(form.sizes, size))}
                      aria-pressed={form.sizes.includes(size)}
                      className={`rounded border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                        form.sizes.includes(size)
                          ? 'border-[#16161a] bg-[#16161a] text-white'
                          : 'border-[#e2e2df] bg-white text-[#6b6b73] hover:border-[#16161a]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className={labelClass}>Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRODUCT_TAGS.map((tag) => (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => set('tags', toggleFrom(form.tags, tag.value))}
                      aria-pressed={form.tags.includes(tag.value)}
                      className={`rounded border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                        form.tags.includes(tag.value)
                          ? 'border-[#16161a] bg-[#16161a] text-white'
                          : 'border-[#e2e2df] bg-white text-[#6b6b73] hover:border-[#16161a]'
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {isEdit && (
            <Link
              href={`/product/${product!.slug}`}
              className="block rounded-md border border-[#e2e2df] bg-white px-3.5 py-2 text-center text-[13px] font-medium transition-colors hover:border-[#16161a]"
            >
              View on storefront →
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}

export { makeVariant };
