import { ImageResponse } from 'next/og';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getProduct } from '@/lib/products';
import { getPrimaryImage, getDiscountPercent } from '@/types';
import { formatPrice } from '@/lib/format';
import { SITE } from '@/lib/seo';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Product preview';

/**
 * Inlines the product shot as a data URI.
 *
 * Satori fetches `src` over the network and decodes only PNG and JPEG, while
 * our art is WebP. Reading from `public/` and re-encoding through sharp (which
 * ships with Next) sidesteps both problems.
 */
async function inlineImage(source: string): Promise<string | null> {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const file = path.join(publicDir, source.replace(/^\//, ''));
    // Guard against a crafted path escaping the public directory.
    if (!file.startsWith(publicDir)) return null;

    const buffer = await fs.readFile(file);

    if (/\.png(\?|$)/i.test(source)) {
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }
    if (/\.jpe?g(\?|$)/i.test(source)) {
      return `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }

    const sharp = (await import('sharp')).default;
    const png = await sharp(buffer).resize(420, 560, { fit: 'inside' }).png().toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

/**
 * Branded share card for a product link.
 *
 * `params` is a Promise here — Next 16 made the props of image-generating
 * functions async along with the rest of the request APIs.
 */
export default async function OpengraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: '#d3a95d',
            fontSize: 56,
            letterSpacing: '0.2em',
          }}
        >
          {SITE.name}
        </div>
      ),
      size
    );
  }

  const discount = getDiscountPercent(product);
  const shot = await inlineImage(getPrimaryImage(product));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #0a0a0c 0%, #14141a 55%, #0a0a0c 100%)',
          color: '#ffffff',
        }}
      >
        {/* Product shot */}
        <div
          style={{
            width: 480,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f7f7f6',
          }}
        >
          {/* satori renders a plain img; next/image is not available here */}
          {shot && (
            <img src={shot} alt="" width={420} height={560} style={{ objectFit: 'contain' }} />
          )}
        </div>

        {/* Copy */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 60px',
          }}
        >
          <div
            style={{
              fontSize: 20,
              letterSpacing: '0.32em',
              color: '#d3a95d',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            {SITE.name}
          </div>

          <div style={{ fontSize: 60, lineHeight: 1.1, fontWeight: 700, marginBottom: 18 }}>
            {product.name}
          </div>

          <div style={{ fontSize: 26, color: '#9a9aa2', marginBottom: 36 }}>
            {product.category}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 52, fontWeight: 700, color: '#d3a95d' }}>
              {formatPrice(product.price)}
            </span>
            {discount !== null && (
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#ffffff',
                  background: '#c0392b',
                  padding: '8px 18px',
                  borderRadius: 999,
                }}
              >
                -{discount}%
              </span>
            )}
          </div>

          <div style={{ fontSize: 22, color: '#7c7c85', marginTop: 40 }}>
            Free shipping on orders over A$150
          </div>
        </div>
      </div>
    ),
    size
  );
}
