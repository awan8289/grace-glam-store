import fs from "fs";
import path from "path";

const productsPath = path.resolve("data/products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

// 5 New Categories
export const NEW_CATEGORIES = [
  "Personalised Necklaces",
  "Pet Diamond Paintings",
  "Custom Photo Art",
  "Name Jewelry",
  "Gift Keepsakes"
];

// Product transformations for all 39 products
const PRODUCT_TEMPLATES = [
  // 1
  {
    name: "Personalised Gold Name Necklace",
    slug: "personalised-gold-name-necklace",
    subtitle: "The Signature Atelier Piece",
    category: "Personalised Necklaces",
    price: 49,
    compareAtPrice: 79,
    description: "Our signature flagship piece. Precision laser-cut in certified 18K gold plated 316L stainless steel with your custom name or word. Hypoallergenic, tarnish-resistant, and hand-polished to a radiant mirror finish. Includes custom gift box.",
    sizes: ["40cm (Choker)", "45cm (Standard)", "50cm (Princess)"],
  },
  // 2
  {
    name: "Custom Photo Pet Diamond Painting",
    slug: "custom-photo-pet-diamond-painting",
    subtitle: "Turn Your Pet Photo Into 5D Sparkling Art",
    category: "Pet Diamond Paintings",
    price: 59,
    compareAtPrice: 89,
    description: "Our flagship pet diamond painting. Simply upload or provide your beloved dog, cat, or pet's photo. Our artists calibrate colours and map every facial contour onto a high-density poured glue canvas. Includes full 5D resin drills, tool kit, and tray.",
    sizes: ["30x40cm", "40x50cm", "50x70cm"],
  },
  // 3
  {
    name: "Double Name Heart Pendant Necklace",
    slug: "double-name-heart-pendant-necklace",
    subtitle: "Two Names, One Heart",
    category: "Personalised Necklaces",
    price: 54,
    compareAtPrice: 85,
    description: "Celebrate an unbreakable bond. Two custom engraved names seamlessly intertwined with an elegant central heart motif. Available in 18K Gold Plated, Sterling Silver, and Rose Gold.",
    sizes: ["40cm", "45cm", "50cm"],
  },
  // 4
  {
    name: "Custom Cat Portrait 5D Diamond Art Kit",
    slug: "custom-cat-portrait-5d-diamond-art-kit",
    subtitle: "Vibrant Feline Diamond Canvas",
    category: "Pet Diamond Paintings",
    price: 52,
    compareAtPrice: 79,
    description: "Designed specifically to capture the sparkling eyes and delicate fur of your feline friend. Hand-poured adhesive canvas with DMC-matched resin drills for brilliant facet reflection.",
    sizes: ["30x30cm", "40x40cm", "50x50cm"],
  },
  // 5
  {
    name: "Cursive Script Initial Pendant Necklace",
    slug: "cursive-script-initial-pendant-necklace",
    subtitle: "Timeless Monogram Elegance",
    category: "Name Jewelry",
    price: 42,
    compareAtPrice: 65,
    description: "An understated luxury statement. A delicate cursive initial pendant dangling from a classic rolo chain. Hypoallergenic, shower-safe, and perfect for everyday layering.",
    sizes: ["40cm", "45cm"],
  },
  // 6
  {
    name: "Custom Dog Portrait Diamond Painting Kit",
    slug: "custom-dog-portrait-diamond-painting-kit",
    subtitle: "Man's Best Friend in Shimmering Drills",
    category: "Pet Diamond Paintings",
    price: 59,
    compareAtPrice: 89,
    description: "Immortalize your faithful dog in brilliant 5D diamond art. Our design team sharpens fur textures and balances contrast so every detail sparkles on your wall.",
    sizes: ["30x40cm", "40x50cm", "50x70cm"],
  },
  // 7
  {
    name: "Butterfly Personalized Name Necklace",
    slug: "butterfly-personalized-name-necklace",
    subtitle: "Elegance in Flight",
    category: "Personalised Necklaces",
    price: 52,
    compareAtPrice: 79,
    description: "Graceful butterfly wings accenting the beginning and end of your custom engraved name. 18K gold plated over stainless steel for lifetime durability.",
    sizes: ["40cm", "45cm", "50cm"],
  },
  // 8
  {
    name: "Memorial Pet Keepsake Diamond Art",
    slug: "memorial-pet-keepsake-diamond-art",
    subtitle: "A Loving Tribute That Sparkles Forever",
    category: "Pet Diamond Paintings",
    price: 64,
    compareAtPrice: 95,
    description: "A touching memorial keepsake. Turn a cherished memory of a pet who has crossed the rainbow bridge into a therapeutic, shimmering diamond painting. Includes angel wings border option.",
    sizes: ["30x40cm", "40x50cm", "50x70cm"],
  },
  // 9
  {
    name: "Old English Gothic Name Necklace",
    slug: "old-english-gothic-name-necklace",
    subtitle: "Bold Vintage Typography",
    category: "Name Jewelry",
    price: 48,
    compareAtPrice: 75,
    description: "Statement gothic lettering precision-crafted with clean edges and substantial metal weight. 18K gold plated finish that never fades or discolours.",
    sizes: ["40cm", "45cm", "50cm"],
  },
  // 10
  {
    name: "Multi-Pet Family Diamond Painting Canvas",
    slug: "multi-pet-family-diamond-painting-canvas",
    subtitle: "All Your Fur Babies on One Canvas",
    category: "Pet Diamond Paintings",
    price: 69,
    compareAtPrice: 110,
    description: "Can't choose just one? Combine photos of multiple dogs, cats, or pets into a single panoramic diamond art masterpiece. Wide format high-definition canvas.",
    sizes: ["40x60cm", "50x70cm", "60x80cm"],
  },
  // 11
  {
    name: "Birthstone Custom Name Bar Necklace",
    slug: "birthstone-custom-name-bar-necklace",
    subtitle: "Engraved Inscription with Crystal Accents",
    category: "Personalised Necklaces",
    price: 56,
    compareAtPrice: 85,
    description: "A minimalist horizontal bar necklace engraved with your chosen name or date, flanked by a sparkling simulated birthstone crystal.",
    sizes: ["40cm", "45cm"],
  },
  // 12
  {
    name: "Personalised Photo Canvas Keepsake",
    slug: "personalised-photo-canvas-keepsake",
    subtitle: "Your Cherished Portrait in 5D Diamonds",
    category: "Custom Photo Art",
    price: 62,
    compareAtPrice: 95,
    description: "Transform wedding, family, baby, or landscape photographs into an extraordinary diamond painting canvas with rich colour depth and sparkling facet reflections.",
    sizes: ["30x40cm", "40x50cm", "50x70cm"],
  },
  // 13
  {
    name: "Arabic Calligraphy Custom Name Necklace",
    slug: "arabic-calligraphy-custom-name-necklace",
    subtitle: "Artisanal Flowing Script",
    category: "Name Jewelry",
    price: 49,
    compareAtPrice: 79,
    description: "Any English or Arabic name transcribed into flowing traditional Thuluth calligraphy. Hand-crafted in 18K Gold Plated stainless steel with smooth, non-snag curves.",
    sizes: ["40cm", "45cm", "50cm"],
  },
  // 14
  {
    name: "Custom Pet Paw Print Diamond Art",
    slug: "custom-pet-paw-print-diamond-art",
    subtitle: "Your Pet's Actual Paw in Diamonds",
    category: "Pet Diamond Paintings",
    price: 48,
    compareAtPrice: 75,
    description: "Send a photo or ink stamp of your dog or cat's actual paw print. We render the authentic footprint into a sparkling high-contrast diamond canvas.",
    sizes: ["30x30cm", "40x40cm"],
  },
  // 15
  {
    name: "Infinity Name Pendant Necklace",
    slug: "infinity-name-pendant-necklace",
    subtitle: "Infinite Love & Remembrance",
    category: "Personalised Necklaces",
    price: 52,
    compareAtPrice: 79,
    description: "The timeless infinity loop woven with one or two custom names. A classic gift for anniversaries, birthdays, and cherished milestones.",
    sizes: ["40cm", "45cm"],
  },
  // 16
  {
    name: "Full Drill 5D Custom Couple Diamond Painting",
    slug: "full-drill-5d-custom-couple-diamond-painting",
    subtitle: "A Sparkling Anniversary Keepsake",
    category: "Custom Photo Art",
    price: 65,
    compareAtPrice: 99,
    description: "Turn your engagement, anniversary, or romantic holiday photo into an unforgettable diamond art project you can complete together.",
    sizes: ["40x50cm", "50x70cm"],
  },
  // 17
  {
    name: "Tiny Minimalist Name Choker Necklace",
    slug: "tiny-minimalist-name-choker-necklace",
    subtitle: "Dainty Everyday Inscription",
    category: "Name Jewelry",
    price: 44,
    compareAtPrice: 69,
    description: "Delicate micro-letters spaced along a fine curb chain. Subtle, sophisticated, and engineered for effortless all-day wear.",
    sizes: ["38cm", "40cm", "42cm"],
  },
  // 18
  {
    name: "Square Drill Custom Pet Diamond Painting",
    slug: "square-drill-custom-pet-diamond-painting",
    subtitle: "Ultra High-Definition Edge-to-Edge Mosaic",
    category: "Pet Diamond Paintings",
    price: 64,
    compareAtPrice: 95,
    description: "For experienced diamond artists. Square resin drills snap tightly together with zero canvas gaps, creating a mosaic painting of breathtaking clarity.",
    sizes: ["40x50cm", "50x70cm"],
  },
  // 19
  {
    name: "Custom Vertical Bar Roman Numeral Necklace",
    slug: "custom-vertical-bar-roman-numeral-necklace",
    subtitle: "Special Dates Engraved in Gold",
    category: "Name Jewelry",
    price: 46,
    compareAtPrice: 72,
    description: "A 4-sided vertical cuboid bar engraved with your special dates, coordinates, or names. Sleek, unisex luxury in 18K Gold Plated finish.",
    sizes: ["45cm", "50cm"],
  },
  // 20
  {
    name: "Baby & Pet First Year Diamond Art Collage",
    slug: "baby-and-pet-first-year-diamond-art-collage",
    subtitle: "Double the Cuteness on Canvas",
    category: "Custom Photo Art",
    price: 68,
    compareAtPrice: 105,
    description: "Combine your baby's photo and beloved family pet into a harmonious diamond painting. A wonderful nursery decoration and lifelong family heirloom.",
    sizes: ["40x50cm", "50x70cm"],
  },
  // 21
  {
    name: "Crown Princess Custom Name Necklace",
    slug: "crown-princess-custom-name-necklace",
    subtitle: "Royal Inscription with Tiara Accent",
    category: "Personalised Necklaces",
    price: 54,
    compareAtPrice: 85,
    description: "Your name crowned with a miniature laser-cut tiara motif. Shines brilliantly with 18K gold plating over surgical steel.",
    sizes: ["40cm", "45cm", "50cm"],
  },
  // 22
  {
    name: "Round Drill Custom Pet Diamond Painting Kit",
    slug: "round-drill-custom-pet-diamond-painting-kit",
    subtitle: "Effortless & Relaxing Shimmer",
    category: "Pet Diamond Paintings",
    price: 56,
    compareAtPrice: 82,
    description: "Easy-to-place round diamond drills that sparkle from every lighting angle. Perfect for beginners and pet lovers of all ages.",
    sizes: ["30x40cm", "40x50cm", "50x60cm"],
  },
  // 23
  {
    name: "Engraved Heart Locket with Secret Message",
    slug: "engraved-heart-locket-with-secret-message",
    subtitle: "Keepsake Locket for Photos & Names",
    category: "Gift Keepsakes",
    price: 58,
    compareAtPrice: 88,
    description: "A vintage-inspired heart locket that opens to hold two miniature photos, with your custom name or monogram delicately engraved on the face.",
    sizes: ["45cm", "50cm"],
  },
  // 24
  {
    name: "A4 LED Light Pad for Diamond Painting",
    slug: "a4-led-light-pad-for-diamond-painting",
    subtitle: "Ultra-Thin Backlight Crafting Companion",
    category: "Gift Keepsakes",
    price: 36,
    compareAtPrice: 55,
    description: "Illuminate canvas symbols clearly and eliminate eye strain. 3-level adjustable brightness with USB-C power connection.",
    sizes: ["A4 Standard"],
  },
  // 25
  {
    name: "Personalised Pet Tag & Matching Necklace Set",
    slug: "personalised-pet-tag-and-matching-necklace-set",
    subtitle: "One for You, One for Your Best Friend",
    category: "Personalised Necklaces",
    price: 68,
    compareAtPrice: 105,
    description: "A matching pair: an engraved collar charm for your dog or cat, and a complementary initial pendant necklace for you to wear.",
    sizes: ["One Size"],
  },
  // 26
  {
    name: "Deluxe Diamond Painting Tool Kit & Storage Box",
    slug: "deluxe-diamond-painting-tool-kit-and-storage-box",
    subtitle: "60-Slot Drill Organizer with Ergonomic Pens",
    category: "Gift Keepsakes",
    price: 39,
    compareAtPrice: 59,
    description: "Keep every diamond colour perfectly sorted. Includes 60 screw-top jars, comfortable resin drill pens, funnel, anti-static tweezers, and roller.",
    sizes: ["60 Jars Kit"],
  },
  // 27
  {
    name: "Personalised Monogram Coin Necklace",
    slug: "personalised-monogram-coin-necklace",
    subtitle: "Classic Vintage Medallion",
    category: "Name Jewelry",
    price: 45,
    compareAtPrice: 70,
    description: "A brushed gold coin medallion laser-engraved with your initials or family crest. Pairs effortlessly with chunky paperclip chains.",
    sizes: ["45cm", "50cm"],
  },
  // 28
  {
    name: "Golden Retriever 5D Diamond Art Canvas",
    slug: "golden-retriever-5d-diamond-art-canvas",
    subtitle: "Warm Amber Highlights in Full Drills",
    category: "Pet Diamond Paintings",
    price: 54,
    compareAtPrice: 80,
    description: "Specially calibrated color spectrum to highlight golden fur, warm smiles, and loyal expressions. High-definition poured glue canvas.",
    sizes: ["40x50cm", "50x70cm"],
  },
  // 29
  {
    name: "Heart-Shaped Custom Pet Photo Necklace",
    slug: "heart-shaped-custom-pet-photo-necklace",
    subtitle: "Your Pet's Picture Inside a Micro-Lens",
    category: "Personalised Necklaces",
    price: 48,
    compareAtPrice: 75,
    description: "Look inside or use your phone camera to reveal your beloved pet's hidden photograph inside a nanotech crystal lens pendant.",
    sizes: ["45cm"],
  },
  // 30
  {
    name: "French Bulldog Custom Diamond Painting",
    slug: "french-bulldog-custom-diamond-painting",
    subtitle: "Bat Ears & Playful Expressions in Diamonds",
    category: "Pet Diamond Paintings",
    price: 52,
    compareAtPrice: 78,
    description: "Rich contrast palette designed specifically for Frenchies and Pugs, preserving adorable wrinkles and lively gaze.",
    sizes: ["30x40cm", "40x50cm"],
  },
  // 31
  {
    name: "Personalised Family Tree Birthstone Pendant",
    slug: "personalised-family-tree-birthstone-pendant",
    subtitle: "All the Names That Matter Most",
    category: "Gift Keepsakes",
    price: 62,
    compareAtPrice: 95,
    description: "An intricate laser-cut family tree medallion engraved with up to 6 family names and their corresponding birthstone crystals.",
    sizes: ["45cm", "50cm"],
  },
  // 32
  {
    name: "Bespoke Handwriting Signature Necklace",
    slug: "bespoke-handwriting-signature-necklace",
    subtitle: "Actual Signature or Note Recreated in Metal",
    category: "Name Jewelry",
    price: 56,
    compareAtPrice: 85,
    description: "Upload a photo of handwritten handwriting or an old letter. Our artisans trace and cut the authentic handwriting into 18K gold plated steel.",
    sizes: ["40cm", "45cm"],
  },
  // 33
  {
    name: "Custom Horse Portrait 5D Diamond Art",
    slug: "custom-horse-portrait-5d-diamond-art",
    subtitle: "Equestrian Splendour in Sparkling Facets",
    category: "Pet Diamond Paintings",
    price: 65,
    compareAtPrice: 98,
    description: "Magnificent wide canvas capturing the powerful muscular definition and flowing mane of your horse in high-gloss resin drills.",
    sizes: ["40x60cm", "50x70cm"],
  },
  // 34
  {
    name: "Layered Paperclip Chain with Custom Name Tag",
    slug: "layered-paperclip-chain-with-custom-name-tag",
    subtitle: "Modern Runway Layering",
    category: "Personalised Necklaces",
    price: 54,
    compareAtPrice: 82,
    description: "On-trend paperclip link chain combined with a delicate engraved rectangular name tag. Bold yet refined.",
    sizes: ["40+5cm Extension"],
  },
  // 35
  {
    name: "Custom Rabbit & Small Pet Diamond Painting",
    slug: "custom-rabbit-and-small-pet-diamond-painting",
    subtitle: "Soft Whiskers & Precious Memories",
    category: "Pet Diamond Paintings",
    price: 48,
    compareAtPrice: 72,
    description: "High-density diamond mosaic kit calibrated for bunnies, hamsters, and birds. Includes ultra-fine tweezer for precise drill placement.",
    sizes: ["30x30cm", "30x40cm"],
  },
  // 36
  {
    name: "Velvet Keepsake Jewelry Travel Case",
    slug: "velvet-keepsake-jewelry-travel-case",
    subtitle: "Plush Personalized Travel Organizer",
    category: "Gift Keepsakes",
    price: 32,
    compareAtPrice: 48,
    description: "Plush velvet travel jewelry case personalized with gold foil monogramming. Ring rolls, necklace hooks, and earring pockets.",
    sizes: ["Compact Travel Size"],
  },
  // 37
  {
    name: "Custom Pet Silhouette Engraved Coin Necklace",
    slug: "custom-pet-silhouette-engraved-coin-necklace",
    subtitle: "Minimalist Dog or Cat Outline in Gold",
    category: "Personalised Necklaces",
    price: 46,
    compareAtPrice: 70,
    description: "A clean minimalist coin medallion engraved with the precise silhouette of your pet's breed and their name beneath.",
    sizes: ["45cm", "50cm"],
  },
  // 38
  {
    name: "Diamond Painting Wooden Magnetic Frame Hanger",
    slug: "diamond-painting-wooden-magnetic-frame-hanger",
    subtitle: "Instant Ready-to-Hang Wall Display",
    category: "Gift Keepsakes",
    price: 28,
    compareAtPrice: 42,
    description: "Natural teak wood magnetic bars that clamp safely onto the top and bottom of your completed diamond painting without damaging drills.",
    sizes: ["30cm", "40cm", "50cm"],
  },
  // 39
  {
    name: "The Grace & Glam Signature Atelier Gift Set",
    slug: "the-grace-and-glam-signature-atelier-gift-set",
    subtitle: "Custom Name Necklace + Velvet Keepsake Box",
    category: "Personalised Gifts",
    price: 79,
    compareAtPrice: 120,
    description: "Our ultimate gift package: A bespoke 18K Gold Plated Name Necklace paired with our signature velvet jewelry box, cleaning cloth, and greeting card.",
    sizes: ["Standard Luxury Set"],
  }
];

// Apply transformations while keeping images, variants, and stock intact
const updatedProducts = products.map((prod, index) => {
  const template = PRODUCT_TEMPLATES[index] || PRODUCT_TEMPLATES[0];

  return {
    ...prod,
    name: template.name,
    slug: template.slug,
    subtitle: template.subtitle,
    category: template.category,
    price: template.price,
    compareAtPrice: template.compareAtPrice,
    description: template.description,
    sizes: template.sizes || prod.sizes || ["One Size"],
    tags: index < 5 ? ["top-selling", "trending"] : index < 12 ? ["trending"] : ["new-arrivals"],
    // Existing images & variants are strictly preserved!
  };
});

fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2), "utf-8");
console.log(`Successfully pivoted ${updatedProducts.length} products in ${productsPath}!`);
