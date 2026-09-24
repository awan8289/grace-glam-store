/**
 * The editorial layer of the catalogue.
 *
 * Colours, images and hex values come from the photography (see the JSON under
 * scratchpad/catalogue-out). Everything a photograph cannot tell you — price,
 * fibre, dimensions, care — lives here, where a human can check it.
 *
 * PRICES ARE DRAFTS. Every product is written as `draft` status so nothing is
 * purchasable until the owner reviews them in the admin panel.
 *
 * DIMENSIONS ARE INDUSTRY-STANDARD, NOT MEASURED. They could not be read from
 * the photos. They are flagged in scripts/build-catalogue.mjs output so they can
 * be confirmed before anything goes live — a wrong length is a guaranteed return.
 */

export const CATEGORIES = [
  'Hijabs',
  'Scarves',
  'Pashminas & Stoles',
  'Underscarves',
  'Hijab Accessories',
];

const CARE_JERSEY = 'Machine wash cold on a gentle cycle. Cool iron if needed.';
const CARE_DELICATE = 'Hand wash cold or dry clean. Cool iron on the reverse.';
const CARE_WOOL = 'Dry clean recommended. Do not tumble dry.';

/**
 * Keyed by the product name the cataloguing agents produced, so the generator
 * can join this to the right set of photographs.
 */
export const PRODUCTS = {
  // ---------------------------------------------------------------- Hijabs
  'Jersey Hijab': {
    category: 'Hijabs',
    price: 22,
    subtitle: 'The everyday one',
    tags: ['top-selling', 'trending'],
    description:
      'Soft, stretchable and easy to style — our everyday jersey hijab holds its shape all day without a single pin. The cotton-blend knit has a matte finish and just enough weight to drape cleanly around the face.',
    details: [
      'Approx. 180 × 75 cm',
      'Cotton-blend jersey knit, four-way stretch',
      'Matte finish, medium opacity — no underscarf needed for most',
      'Raw-cut edges, so it will not fray or roll',
      CARE_JERSEY,
    ],
  },
  'Ribbed Jersey Hijab': {
    category: 'Hijabs',
    price: 24,
    subtitle: 'Texture and grip',
    tags: ['new-arrivals', 'trending'],
    description:
      'The same easy jersey comfort with a fine rib running through it. The texture gives the fabric grip, so folds stay exactly where you set them — the practical choice for a long day.',
    details: [
      'Approx. 180 × 75 cm',
      'Ribbed cotton-blend jersey, four-way stretch',
      'Textured surface grips itself and holds a fold',
      'Slightly heavier than plain jersey, fully opaque',
      CARE_JERSEY,
    ],
  },
  'Georgette Hijab': {
    category: 'Hijabs',
    price: 25,
    subtitle: 'Light and fluid',
    tags: ['new-arrivals'],
    description:
      'A featherlight crinkle georgette that moves with you. It falls in soft folds rather than sitting flat, which makes it the easy pick for warm weather and for anyone who prefers a lighter drape.',
    details: [
      'Approx. 180 × 75 cm',
      'Crinkle georgette, woven — no stretch',
      'Lightweight and semi-sheer; an underscarf is recommended',
      'Textured crinkle finish that resists creasing',
      CARE_DELICATE,
    ],
  },

  // --------------------------------------------------------------- Scarves
  'Silk Scarf': {
    category: 'Scarves',
    price: 45,
    subtitle: 'For the occasion',
    tags: ['trending'],
    description:
      'A satin-finish scarf with real sheen, printed in classic motifs. Heavier and smoother than our chiffon prints, it holds a knot beautifully and reads as dressed-up without any effort.',
    details: [
      'Approx. 180 × 70 cm',
      'Satin-finish woven scarf fabric with a soft lustre',
      'Fluid drape, holds a knot without slipping',
      'Neatly hemmed edges',
      CARE_DELICATE,
    ],
  },

  // Applies to all nineteen printed scarves; the print name distinguishes them.
  __PRINTED_SCARF__: {
    category: 'Scarves',
    price: 35,
    subtitle: 'Printed chiffon',
    tags: ['new-arrivals'],
    description:
      'A lightweight printed scarf in soft, fluid chiffon. The print runs across the full length, so it reads differently depending on how you fold it — draped long, wrapped, or knotted at the neck.',
    details: [
      'Approx. 180 × 70 cm',
      'Lightweight chiffon with a soft, silky handle',
      'Semi-sheer — an underscarf is recommended for full coverage',
      'Hemmed edges',
      CARE_DELICATE,
    ],
  },

  // --------------------------------------------------- Pashminas & Stoles
  'Embroidered Paisley Border Pashmina': {
    category: 'Pashminas & Stoles',
    price: 40,
    subtitle: 'Embroidered border',
    tags: ['top-selling', 'trending'],
    description:
      'A finely woven pashmina-weight shawl with a dense embroidered paisley border running down each long edge. Warm without bulk, and formal enough for an event while still working over a coat.',
    details: [
      'Approx. 200 × 70 cm plus fringe',
      'Fine woven wool-blend shawl fabric, soft matte finish',
      'Embroidered paisley border on both long edges',
      'Hand-knotted fringe',
      CARE_WOOL,
    ],
  },
  'Striped Paisley Pashmina': {
    category: 'Pashminas & Stoles',
    price: 40,
    subtitle: 'Woven stripe',
    tags: ['new-arrivals'],
    description:
      'Tonal stripes woven through a soft pashmina-weight ground, with paisley detailing at the ends. Quieter than the embroidered border, and easier to wear with a patterned outfit.',
    details: [
      'Approx. 200 × 70 cm plus fringe',
      'Fine woven wool-blend shawl fabric',
      'Tonal woven stripe with paisley end panels',
      'Hand-knotted fringe',
      CARE_WOOL,
    ],
  },
  'Medallion Embroidered Pashmina': {
    category: 'Pashminas & Stoles',
    price: 45,
    subtitle: 'Centre medallion',
    tags: ['top-selling'],
    description:
      'A statement shawl with a large embroidered medallion worked across the body and a decorated border. This is the one for a wedding or an evening event.',
    details: [
      'Approx. 200 × 70 cm plus fringe',
      'Fine woven wool-blend shawl fabric',
      'Large embroidered medallion motif with a worked border',
      'Hand-knotted fringe',
      CARE_WOOL,
    ],
  },
  'Ornate Corner Pashmina': {
    category: 'Pashminas & Stoles',
    price: 45,
    subtitle: 'Corner embroidery',
    tags: ['trending'],
    description:
      'Embroidery concentrated at the corners, so the detail sits where it shows — over the shoulder and at the fall. Plain through the body, which keeps it from competing with what you are wearing.',
    details: [
      'Approx. 200 × 70 cm plus fringe',
      'Fine woven wool-blend shawl fabric',
      'Ornate embroidered corner motifs, plain ground',
      'Hand-knotted fringe',
      CARE_WOOL,
    ],
  },
  'Classic Twill Stole': {
    category: 'Pashminas & Stoles',
    price: 59,
    subtitle: 'Plain and warm',
    tags: ['new-arrivals'],
    description:
      'A plain twill-woven stole with a tight, flat weave and a deep hand-knotted fringe. No pattern, no shine — just a warm, well-made winter layer in a colour that will go with everything.',
    details: [
      'Approx. 200 × 70 cm plus fringe',
      'Tight twill weave with a soft matte surface',
      'Approx. 10 cm hand-knotted fringe',
      'Substantial winter weight',
      CARE_WOOL,
    ],
  },
  'Heathered Boucle Stole': {
    category: 'Pashminas & Stoles',
    price: 55,
    subtitle: 'Brushed and soft',
    tags: ['new-arrivals'],
    description:
      'A brushed bouclé stole with a flecked, heathered surface and a noticeably soft hand. Lighter and fuzzier than the twill, and the melange colour hides everyday wear well.',
    details: [
      'Approx. 200 × 70 cm plus fringe',
      'Brushed bouclé knit with a heathered melange surface',
      'Soft, lofty handle',
      'Hand-knotted fringe',
      CARE_WOOL,
    ],
  },
  'Rose Jacquard Stole': {
    category: 'Pashminas & Stoles',
    price: 62,
    subtitle: 'Tonal rose motif',
    tags: ['trending'],
    description:
      'A rose motif woven tone-on-tone into the ground, so the pattern catches the light rather than shouting. Smooth-faced, warm, and dressier than a plain stole.',
    details: [
      'Approx. 200 × 70 cm plus fringe',
      'Tonal jacquard weave, rose motif',
      'Smooth face with a subtle raised pattern',
      'Hand-knotted fringe',
      CARE_WOOL,
    ],
  },
  'Embossed Paisley Stole': {
    category: 'Pashminas & Stoles',
    price: 62,
    subtitle: 'Raised paisley',
    tags: [],
    description:
      'Paisley embossed into a smooth ground — the pattern is felt as much as seen. A quiet, tactile stole that works as well over a coat as it does indoors.',
    details: [
      'Approx. 200 × 70 cm plus fringe',
      'Smooth ground with a raised embossed paisley pattern',
      'Hand-knotted fringe',
      CARE_WOOL,
    ],
  },
  'Camel Leopard Paisley Print Stole': {
    category: 'Pashminas & Stoles',
    price: 62,
    subtitle: 'Printed animal paisley',
    tags: ['trending'],
    description:
      'Leopard and paisley printed together over a warm camel ground. Bold, but the tonal palette keeps it wearable with a plain coat.',
    details: [
      'Approx. 200 × 70 cm plus fringe',
      'Printed on a smooth woven ground',
      'Hand-knotted fringe',
      CARE_WOOL,
    ],
  },

  // ---------------------------------------------------------- Underscarves
  'Ribbed Jersey Tube Cap': {
    category: 'Underscarves',
    price: 12,
    subtitle: 'Grip that holds',
    tags: ['top-selling'],
    description:
      'A ribbed jersey tube cap that sits close to the head and gives your hijab something to grip. Pull it on, set your hairline, and nothing shifts for the rest of the day.',
    details: [
      'One size — ribbed knit stretches to fit',
      'Ribbed cotton-blend jersey',
      'Closed tube with a single gathered seam at the centre back',
      'Textured surface stops the hijab sliding',
      CARE_JERSEY,
    ],
  },
  'Tube Cap': {
    category: 'Underscarves',
    price: 12,
    subtitle: 'Smooth and simple',
    tags: [],
    description:
      'A smooth jersey tube cap — the plain, comfortable base layer. Thin enough to disappear under a lightweight hijab and soft enough to wear all day.',
    details: [
      'One size — jersey knit stretches to fit',
      'Smooth cotton-blend jersey',
      'Open-ended tube, twin-stitched hems top and bottom',
      'Thin enough to sit invisibly under light fabrics',
      CARE_JERSEY,
    ],
  },

  // Woven, matte and opaque — visibly not the chiffon the other eighteen are,
  // so it gets its own copy rather than inheriting a false fabric claim.
  'Slate Geometric Trellis': {
    category: 'Scarves',
    price: 39,
    subtitle: 'Woven, not printed',
    tags: [],
    description:
      'A matte woven scarf with a trellis grid running through the body and a bold geometric key border at each end. Heavier and more opaque than our chiffon prints — this one sits like a light shawl.',
    details: [
      'Approx. 180 × 70 cm',
      'Matte woven blend with a soft, slightly textured handle',
      'Opaque — no underscarf needed',
      'Woven trellis field with a geometric key border',
      CARE_DELICATE,
    ],
  },

  // ------------------------------------------------------ Hijab Accessories
  'Hijab Pins': {
    category: 'Hijab Accessories',
    price: 8,
    subtitle: 'Ball-head pins',
    tags: [],
    description:
      'Straight pins with rounded ball heads, boxed and ready to go in your bag. Fine enough not to mark a delicate weave, long enough to hold a double layer.',
    details: [
      'Straight dressmaker-style pins, approx. 38 mm',
      'Steel shaft with a coloured ball head',
      'Supplied in a hinged storage box',
      'Pack quantity not printed on the box — confirm before ordering',
    ],
  },
  'Pearl Dressmaker Pins': {
    category: 'Hijab Accessories',
    price: 12,
    subtitle: '100 pieces',
    tags: [],
    description:
      'A hundred pearl-head pins in a resealable box. The larger pearl head is easier to grip and sits neatly against the fabric when pinned.',
    details: [
      '100 pieces per box',
      'Steel shaft with a pearl-effect head',
      'Approx. 38 mm',
      'Resealable storage box',
    ],
  },
  'Hijab Magnets': {
    category: 'Hijab Accessories',
    price: 15,
    subtitle: 'No holes, no snags',
    tags: ['trending'],
    description:
      'Magnetic fasteners that hold your hijab closed without piercing the fabric — the answer for chiffon and silk, where a pin leaves a mark behind. Twelve domed caps in muted tones, cased and ready for your bag.',
    details: [
      'Set of 12, one per compartment',
      'Holds without piercing — safe on chiffon, silk and georgette',
      'Matte domed caps in twelve muted tones',
      'Keep away from cards, watches and pacemakers',
    ],
  },
  // The supplied folder was labelled "Scarf Clips", but the photograph shows a
  // box of pastel pearl-head pins — no clips of any kind. Described as what is
  // actually in the picture; the owner has been asked to confirm which is right.
  'Pastel Pearl Hijab Pins': {
    category: 'Hijab Accessories',
    price: 14,
    subtitle: 'Assorted pastels',
    tags: [],
    description:
      'A small boxed set of pearl-head pins in soft pastels — blush, ivory, dove grey, lilac and black. The rounded pearl head is easy to grip and finishes neatly against the fabric.',
    details: [
      'Pearl-effect heads on fine steel pins',
      'Assorted pastel shades',
      'Supplied in a clear hinged box that fits a handbag',
      'Pack quantity not printed on the box — confirm before ordering',
    ],
  },
  'Hijab Dress Tape': {
    category: 'Hijab Accessories',
    price: 10,
    subtitle: 'Double-sided',
    tags: [],
    description:
      'Double-sided fashion tape for the places a pin cannot reach — a neckline that gapes, a fold that will not sit. Skin-safe adhesive that peels away cleanly.',
    details: [
      'Double-sided fabric-to-skin tape',
      'Skin-safe adhesive, removes without residue',
      'Supplied in a resealable pouch',
      'Single use per strip — final sale for hygiene reasons',
    ],
  },
};

/**
 * Products deliberately NOT built. These reproduce a registered trademark
 * (a woven "CHRISTIAN DIOR" band and the Dior Oblique monogram), which makes
 * them counterfeit goods. Listing them risks the store's Meta and Google ad
 * accounts as well as legal exposure — so the decision is left to the owner
 * rather than made silently by a build script.
 */
export const EXCLUDED = [
  { name: 'Dior Oblique-Print Stole', reason: 'Reproduces the Dior Oblique monogram with a woven "CHRISTIAN DIOR" text band.' },
  { name: 'Diamond Monogram Cable-Panel Stole', reason: 'Diamond monogram jacquard closely reproducing a luxury house pattern.' },
];

/** Things the photographs could not settle. Ask the owner before publishing. */
export const NEEDS_CONFIRMATION = [
  'Folder "Scarf Clips" contains a photo of pearl-head PINS, not clips — wrong photo, or wrong folder name?',
  'Hijab Magnets: 12 caps are visible but the fastening mechanism is not — confirm they are magnetic, not push-pins.',
  'Hijab Pins / Pastel Pearl Pins / Scarf Clips: no pack count printed on any box except the 100pcs pearls.',
  'Jersey Hijab "Dusty Rose" and "Rose Mauve" may be one dye lot under different lighting — confirm they are two colours.',
  'Printed scarves: the five half-solid marble prints, and the four cream-ground florals, are each a close family — confirm they are separate designs and not fewer SKUs.',
  'Cashmere Stoles: fibre content unverified. Nothing is described as cashmere until a supplier certificate says so.',
  'Pashmina Navy Blue and Emerald Green have only a mannequin shot, no flat photo.',
];

/** Dimensions that were assumed, not measured. Surfaced for confirmation. */
export const ASSUMED_DIMENSIONS = [
  'Jersey Hijab / Ribbed Jersey Hijab / Georgette Hijab — 180 × 75 cm',
  'Printed Scarf / Silk Scarf — 180 × 70 cm',
  'All Pashminas and Stoles — 200 × 70 cm plus fringe',
  'Pins — 38 mm length',
];
