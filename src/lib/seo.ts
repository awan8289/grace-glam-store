import { BRAND_CONFIG } from '@/constants/config';
import { Product, getAllImages, getDiscountPercent, getTotalStock } from '@/types';

/**
 * Canonical origin for the site.
 *
 * Every absolute URL in metadata, the sitemap and the structured data is built
 * from this, so it must match the domain Google actually crawls — a mismatch
 * makes canonicals point at a host that does not serve the page. Set
 * NEXT_PUBLIC_SITE_URL in the deployment environment.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://graceandglam.com.au'
).replace(/\/$/, '');

interface PostalAddress {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
}

export const SITE = {
  name: BRAND_CONFIG.name,
  legalName: 'Grace & Glam Pty Ltd',
  tagline: BRAND_CONFIG.tagline,
  locale: 'en_AU',
  language: 'en-AU',
  country: 'AU',
  currency: BRAND_CONFIG.currency,
  email: 'sales@graceglam.com.au',
  // No street address or phone until real ones exist. The placeholders that
  // were here ("72 Luxury Boulevard, Suite 4B" and a made-up 1800 number) were
  // being published in the Organization JSON-LD, where a false address is the
  // exact field Google Merchant Center and Meta verification check.
  //
  // Fill this in and the Organization schema starts emitting it again — no
  // other change needed.
  telephone: '+61494794408',
  address: null as PostalAddress | null,
  social: [
    'https://www.instagram.com/graceandglam.au',
    'https://www.facebook.com/graceandglam.au/',
  ],
};

/**
 * The shipping terms, in one place.
 *
 * These numbers are repeated in the Shipping Policy page, the header marquee
 * and the product page badges. They are stated once here so the structured data
 * cannot drift away from what the site actually says.
 */
export const FREE_SHIPPING_THRESHOLD = 150;
export const FREE_SHIPPING_UNDER_RATE = '9.95';

export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

/**
 * Serialises structured data for a `<script>` tag.
 *
 * `<` is escaped so a product name containing markup cannot break out of the
 * script element — `JSON.stringify` alone does not prevent that.
 */
export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** The store itself. Rendered once, on the home page. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${SITE_URL}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE_URL,
    logo: absoluteUrl('/icon.png'),
    image: absoluteUrl('/brand/og-default.jpg'),
    description: SITE.tagline,
    email: SITE.email,
    currenciesAccepted: SITE.currency,
    paymentAccepted: 'Visa, Mastercard, American Express, Apple Pay',
    // `address` is emitted only once a real one is set on SITE. An omitted
    // field is neutral; an invented one is a false statement about the business.
    ...(SITE.address ? { address: { '@type': 'PostalAddress', ...SITE.address } } : {}),
    areaServed: [
      { '@type': 'Country', name: 'Australia' },
      { '@type': 'Country', name: 'New Zealand' },
    ],
    sameAs: SITE.social,
  };
}

/** Enables the sitelinks search box in Google results. */
export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE.name,
    inLanguage: SITE.language,
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Product schema — this is what puts price, currency and stock status in the
 * search result itself. Colour variants become a ProductGroup so Google shows
 * them as one listing rather than duplicates.
 */
export function productSchema(product: Product) {
  const images = getAllImages(product).map((image) => absoluteUrl(image));
  const inStock = getTotalStock(product) > 0;
  const url = absoluteUrl(`/product/${product.slug}`);

  const offer = (sku: string, price: number, available: boolean) => ({
    '@type': 'Offer',
    url,
    sku,
    price: price.toFixed(2),
    priceCurrency: SITE.currency,
    availability: available
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': `${SITE_URL}/#organization` },
    // A concrete validity window keeps the offer from being treated as stale.
    priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90)
      .toISOString()
      .slice(0, 10),
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      // Must match the Shipping Policy word for word. Merchant Center compares
      // this against the page and rejects the feed when they disagree.
      shippingRate: {
        '@type': 'MonetaryAmount',
        value: FREE_SHIPPING_UNDER_RATE,
        currency: SITE.currency,
      },
      shippingDestination: [
        { '@type': 'DefinedRegion', addressCountry: 'AU' },
        { '@type': 'DefinedRegion', addressCountry: 'NZ' },
      ],
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 8, unitCode: 'DAY' },
      },
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'AU',
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: 30,
      returnMethod: 'https://schema.org/ReturnByMail',
      // Change-of-mind postage is the customer's; only faults are covered.
      returnFees: 'https://schema.org/ReturnShippingFees',
    },
  });

  const base = {
    '@context': 'https://schema.org',
    name: product.name,
    description: product.description || product.subtitle || product.name,
    image: images,
    category: product.category,
    brand: { '@type': 'Brand', name: SITE.name },
    ...(product.video
      ? {
          video: {
            '@type': 'VideoObject',
            name: `${product.name} — video`,
            description: `Product video for ${product.name}.`,
            contentUrl: absoluteUrl(product.video.url),
            thumbnailUrl: images[0],
            uploadDate: product.video.uploadedAt,
          },
        }
      : {}),
  };

  // With colour variants, describe the group and each colour separately.
  if (product.variants.length > 0) {
    return {
      ...base,
      '@type': 'ProductGroup',
      '@id': `${url}#product`,
      url,
      productGroupID: product.slug,
      variesBy: ['https://schema.org/color'],
      hasVariant: product.variants.map((variant) => ({
        '@type': 'Product',
        name: `${product.name} — ${variant.colorName}`,
        sku: variant.sku,
        color: variant.colorName,
        image: variant.images.length > 0 ? variant.images.map(absoluteUrl) : images,
        offers: offer(variant.sku, product.price, variant.stock > 0),
      })),
    };
  }

  return {
    ...base,
    '@type': 'Product',
    '@id': `${url}#product`,
    url,
    sku: `GG-${product.id}`,
    offers: offer(`GG-${product.id}`, product.price, inStock),
  };
}

/** Breadcrumb trail, shown under the result instead of a raw URL. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** Category / collection listing. */
export function itemListSchema(products: Product[], path: string, name: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    url: absoluteUrl(path),
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/product/${product.slug}`),
      name: product.name,
    })),
  };
}

// ---------------------------------------------------------------------------
// Copy helpers
// ---------------------------------------------------------------------------

/**
 * Meta descriptions want ~155 characters. Building them from real product data
 * (price, colours, discount) beats a generic template for click-through.
 */
export function productDescription(product: Product): string {
  const discount = getDiscountPercent(product);
  const colours = product.variants.length;

  const parts = [
    product.description || product.subtitle || product.name,
    colours > 1 ? `${colours} colours.` : '',
    discount ? `Save ${discount}%.` : '',
    `Free shipping over A$${FREE_SHIPPING_THRESHOLD}.`,
  ].filter(Boolean);

  const text = parts.join(' ');
  return text.length > 158 ? `${text.slice(0, 155).trimEnd()}…` : text;
}
