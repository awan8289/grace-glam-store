GRACE & GLAM — full project bundle
Built 10 September 2026

WHAT IS IN HERE
  src/                 all application code
  public/              all images — 117 WebP files, every one 900x1350
                       products/hero-*.webp  the 5 cut-out model shots
                       icon.png              brand logo
                       brand/og-default.jpg  social share card
  data/                catalogue: 39 products, 68 colour variants, 5 categories
  scripts/             build-catalogue.mjs        rebuilds data/products.json
                       build-catalogue-images.py  photos -> 900x1350 WebP
                       build-hero-images.py       cut-outs -> 900x1350 WebP
                       set-admin-password.mjs     generates the admin hash
  node_modules/        dependencies, so it runs without `npm install`
  .next/               the production build (dev + cache folders stripped:
                       1.2 GB of throwaway cache that rebuilds itself)
  source-images/       full-resolution 1024x1536 originals of the 5 hero
                       cut-outs, with transparency

TO RUN
  npm start                       (already built)
  npm run build && npm start      (to rebuild from source)

WHAT IS DELIBERATELY NOT IN HERE
  .env.local

  It holds the admin password hash, the session secret and the Stripe keys.
  The previous archive DID include it, which is how a live Stripe secret key
  ("sk_live_...") ended up travelling between machines. Anyone holding that
  file can charge cards and read customer records on the account.

  Whoever runs this needs their own .env.local. Copy .env.example and fill in:
    ADMIN_PASSWORD_HASH    from: npm run admin:password -- "your-password"
    ADMIN_SESSION_SECRET   from the same command
    NEXT_PUBLIC_SITE_URL   the real domain, no trailing slash
    STRIPE_SECRET_KEY      from the Stripe dashboard
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  The old Stripe key should be rolled in the Stripe dashboard regardless — it
  has already left the machine it was created on.

STILL TO CONFIRM BEFORE ADVERTISING
  - Prices are drafts, set from market rates. Not confirmed by the owner.
  - Garment dimensions are industry-standard, not measured.
  - Folder "Scarf Clips" contained a photo of pearl-head PINS, not clips.
  - Hijab Magnets: 12 pieces visible, fastening mechanism not visible.
  - Cashmere Stoles: fibre content unverified, so nothing claims "cashmere".
  - 7 stoles with a woven CHRISTIAN DIOR band were NOT listed (counterfeit
    risk; it is the fastest way to lose a Meta or Google ads account).

IF `npm start` FAILS RIGHT AFTER EXTRACTING
  Some extractors (notably on Windows) do not restore the symlinks inside
  node_modules/.bin. Run `npm install` once — every package is already here, so
  it only rewrites those shims and takes a few seconds.
