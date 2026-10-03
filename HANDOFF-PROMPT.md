# Grace & Glam — handoff prompt for the next agent session

Paste this whole file into Antigravity at the start of a session.

Repo: https://github.com/awan8289/grace-glam-store (public)
Stack: Next.js 16 App Router, React 19, Tailwind v4, Firestore, Stripe (AUD).
Host: Hostinger, auto-deploys on every push to `main`.

Read `AGENTS.md` in the repo first. The "Rules for this repository" section is
binding. Summary, because breaking these has already cost days:

1. NEVER force-push `main`. A force-push has already silently deleted a
   teammate's pushed commit. A `non-fast-forward` rejection is Git protecting
   their work — run `git pull --rebase origin main`, then push normally.
2. `package.json` must keep `"dev": "next dev --webpack"` and
   `"build": "next build --webpack"`. Next 16 defaults to Turbopack and
   Hostinger's build container kills its workers, so the deploy dies with
   `FATAL: An unexpected Turbopack error occurred`. That is not a code bug.
3. Leave the `*.rar`, `*.zip`, `/Products` rules in `.gitignore`. A 301 MB
   archive sits beside the project on one machine and GitHub rejects any push
   containing a file over 100 MB.
4. No secrets in the repo. Never prefix a server secret with `NEXT_PUBLIC_`.
   Never commit `*-firebase-adminsdk-*.json`.
5. Before every push, from a tree already rebased onto `origin/main`:
   `npm run typecheck && npm run lint && npm run build` — all three pass.

Work through the list below in order. Confirm each item with evidence before
calling it done, and commit each one separately.

---

## P0 — 36 of the 39 products show the wrong photograph

This is the launch blocker. The pivot changed every product's name, price and
category but kept the old modest-fashion image arrays, so the shop currently
sells pet art using photographs of scarves. Verified:

    Custom Photo Pet Diamond Painting   -> /products/hero-ribbed-jersey-hijab-navy.webp
    Personalised Gold Name Necklace     -> /products/hero-jersey-hijab-burgundy.webp
    Golden Retriever 5D Diamond Art     -> /products/black-floral-scarf-cbe050.webp
    A4 LED Light Pad                    -> /products/cocoa-floral-bouquet-scarf-f11be5.webp

Reproduce:

    node -e 'const p=require("./data/products.json");
    console.log(p.filter(x=>(x.images||[]).some(i=>/hijab|pashmina|scarf|stole|pins|magnet/i.test(i))).length + "/" + p.length)'
    # prints 36/39

Also wrong: the five homepage hero cut-outs are hijab models
(`/products/hero-*.webp`), and `heroLineUp()` in `src/app/(storefront)/page.tsx`
deliberately prefers files matching `/products/hero-`, so they are guaranteed to
be the first thing a visitor sees.

To do:
- Source real product photography for all 39 products, 900x1350 (2:3) WebP to
  match the existing pipeline. `scripts/build-catalogue-images.py` and
  `scripts/build-hero-images.py` already do the resizing and the transparent
  hero cut-outs; reuse them rather than writing new ones.
- Update `data/products.json`, then run `node scripts/sync-seed.mjs` so
  `src/lib/seed.ts` matches. A stale seed means a fresh deploy comes up with the
  old images; that has happened once already.
- Once nothing references them, delete the orphaned modest-fashion files in
  `public/products/` and the `source-images/hero-originals/` PNGs. They are dead
  weight in a public repo (the largest single file is 1.93 MB).
- Do not ship placeholder or stock images as if they were the real product.
  Misleading product imagery is a problem under Australian Consumer Law and will
  get the Google Merchant Center feed rejected.

## P0 — Firebase variables are required on Hostinger

Firestore is now the data store, so the site needs these three on the host.
Without them the build still exits 0 and every page still returns 200 — the shop
just renders "No products found.", because the catalogue read fails and falls
back to an empty list. Verified locally: `/shop` returns 200 with 0 product
cards and the text "No products found.".

    FIREBASE_PROJECT_ID
    FIREBASE_CLIENT_EMAIL
    FIREBASE_PRIVATE_KEY     # newlines stored as literal \n; the code converts them back

A green deploy with an empty shop means these are missing, not that the build
broke. Full list of variables the code reads:

    required   ADMIN_PASSWORD_HASH  ADMIN_SESSION_SECRET
               FIREBASE_PROJECT_ID  FIREBASE_CLIENT_EMAIL  FIREBASE_PRIVATE_KEY
               STRIPE_SECRET_KEY  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
               NEXT_PUBLIC_SITE_URL
    optional   GOOGLE_CLIENT_ID  GOOGLE_CLIENT_SECRET      (the "Continue with
                 Google" button hides itself when these are unset)
               SMTP_HOST  SMTP_PORT  SMTP_USER  SMTP_PASS  SMTP_FROM
               CJ_API_EMAIL  CJ_API_KEY  CJ_PASSWORD

`NEXT_PUBLIC_SITE_URL` must be set BEFORE the build runs. Anything prefixed
`NEXT_PUBLIC_` is baked into the compiled output, so setting it afterwards
changes nothing until a rebuild — and every canonical URL, sitemap entry and
share card points at the wrong domain until then.

## P1 — Admin-uploaded media still lands on the container filesystem

Moving the data to Firestore fixed products, orders and customers. It did not
fix uploads: `src/app/api/upload/route.ts` still does `fs.writeFile` under
`public/uploads`. If Hostinger rebuilds the container from source on each
deploy, every image an admin uploads disappears on the next push and the
products referencing them show broken images.

Test it rather than assuming — this test has never actually been run:

1. Deploy.
2. In the admin panel, upload an image and add a product named `PERSISTENCE TEST`.
3. Push a trivial change to trigger a redeploy.
4. Check whether the product and the image are still there.

The product will survive (Firestore). If the image does not, move uploads to
Firebase Storage — `firebase-admin` is already a dependency, so this is a new
adapter beside `firestore-store.ts`, not a new service.

## P1 — The returns policy does not exclude change-of-mind on custom goods

Every product in the catalogue is made to order. The returns copy in
`src/components/maison/TheMaisonPortal.tsx` contains zero occurrences of
"change of mind" (`grep -c 'change of mind'` returns 0).

Australian Consumer Law lets a business refuse a change-of-mind return on
personalised goods, but only if it says so clearly and up front; it does NOT let
the business refuse a remedy for goods that are faulty, not as described, or not
fit for purpose. The policy needs to state plainly:

- personalised and made-to-order items cannot be returned for change of mind
- the cancellation window (how long after ordering, before production starts)
- that faulty, damaged or misdescribed items are still refunded or replaced,
  ACL rights unaffected
- how a customer reports a spelling mistake THEY made versus one the shop made

Do not copy this text from a competitor's site.

## P1 — "18K Gold" on a plated product

The product is named `Personalised Gold Name Necklace` and a heading reads
"Personalised 18K Gold Name Necklaces", while the body copy correctly says it is
316L stainless steel "electroplated with certified 18K Gold". Describing plated
goods as gold in the name and headings is misleading under the ACL even when the
detail is accurate further down. Rename to "18K Gold Plated" (or equivalent)
everywhere the short name appears, and keep the honest description.

Same check for any other material claim in the catalogue: if there is no
supplier certificate for it, do not print it.

## P2 — Housekeeping

- `npm audit fix` — 2 moderate advisories, `uuid < 11.1.1` reached through
  `gaxios` (a `firebase-admin` transitive dependency).
- 6 lint warnings, all in new code, all unused identifiers:
  `src/components/product/NecklaceCustomizer.tsx` (`useEffect`, `Image`,
  `AnimatePresence`, `AlertCircle`, `baseImage`) and
  `src/lib/cj-dropshipping.ts` (`password`). Zero errors, so the build passes —
  clean them anyway.
- `src/lib/categories.ts:6` still documents the old catalogue:
  `{ id: "hijabs", name: "Hijabs" }`. Update the comment.
- `backend/cj_dropshipping_service.py` is not referenced anywhere in `src`; the
  wired-up integration is `src/lib/cj-dropshipping.ts`, imported by
  `src/app/api/orders/route.ts`. Decide whether the Python service is still
  needed and delete it if not — it is dead code carrying its own SMTP defaults.

## Not for the agent — the repo owner must do this

The live Stripe secret key `sk_live_51UAYiG...` was committed in three separate
files and has been distributed inside zip archives. It is removed from the code
now, but a key that has been published stays compromised: it must be rolled in
the Stripe dashboard, and the new one entered only in the host's environment
panel. Nobody else can do this.
