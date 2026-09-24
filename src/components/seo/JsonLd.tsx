import { jsonLdScript } from '@/lib/seo';

/**
 * Renders structured data. Content is escaped by `jsonLdScript` so a product
 * name containing markup cannot break out of the script element.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(item) }}
        />
      ))}
    </>
  );
}
