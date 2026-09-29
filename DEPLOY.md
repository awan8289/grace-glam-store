# Deploying Grace & Glam to Hostinger

A Next.js 16 app. It needs a **Node.js runtime** — Hostinger's Web App / Node.js
hosting, available on Business plans and up. Plain shared hosting that only
serves static files will not run it.

- **Node:** 20.9 or newer (22 LTS recommended)
- **Build command:** `npm ci && npm run build`
- **Start command:** `npm start`
- **Port:** none to configure — `next start` reads the `PORT` the host sets.

---

## 1. Generate your admin credentials — do this first, on your own machine

```bash
npm run admin:password -- "your-new-admin-password"
```

It prints two lines. Keep them; you will paste them into Hostinger in step 3.

```
ADMIN_PASSWORD_HASH=<salt>:<hash>
ADMIN_SESSION_SECRET=<64 random characters>
```

The password must be at least 12 characters. Nothing but the hash ever leaves
your machine — the password itself is never stored anywhere.

> The zip deliberately contains **no** `.env.local`. Credentials belong in
> Hostinger's environment-variable panel, not in a file that gets copied around.

---

## 2. Upload

Push to the `main` branch of the Git repository and point Hostinger at it; every
push redeploys. Do not upload `node_modules` or `.next` — Hostinger builds both.
`build` must keep `--webpack` (see `AGENTS.md`).

---

## 3. Environment variables

Set these in Hostinger's environment-variables panel, then deploy.

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD_HASH` | from step 1 |
| `ADMIN_SESSION_SECRET` | from step 1 |
| `NEXT_PUBLIC_SITE_URL` | `https://graceandglame.com` — no trailing slash |
| `FIREBASE_PROJECT_ID` | Firebase service account |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account |
| `FIREBASE_PRIVATE_KEY` | Firebase service account, keep the `\n` line breaks |
| `GOOGLE_CLIENT_ID` | optional — see below |
| `GOOGLE_CLIENT_SECRET` | optional — see below |

Without the three `FIREBASE_*` variables the build still succeeds and pages
return 200, but the shop shows "No products found." — that means the variables
are missing, not that the build is broken.

**`NEXT_PUBLIC_SITE_URL` must be set before the build runs.** Anything prefixed
`NEXT_PUBLIC_` is baked into the compiled output, so setting it afterwards
changes nothing until you rebuild. Get it wrong and every canonical URL,
sitemap entry and social-share card points at the wrong domain.

The app refuses to start without the admin variables, by design.

### "Continue with Google" (optional)

Leave `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` unset and the button simply
does not appear — everything else works. To switch it on:

1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client
   ID**, application type **Web application**.
2. Under **Authorised redirect URIs**, add — exactly, no trailing slash:
   `https://graceandglame.com/api/account/google/callback`
   Google compares this as a literal string, so add a separate line for every
   domain you serve from, including the temporary `*.hostingersite.com` one.
3. Paste the generated Client ID and Client secret into the two variables.

If someone signs in with Google using an email that already has a
password account, the two are joined — same account, same order history — and
only when Google reports the address as verified.

---

## 4. Deploy, then verify

Once it is up, check each of these:

| Check | Expected |
|---|---|
| `/` | home page, hero products visible |
| `/shop` | catalogue |
| `/admin/login` | sign-in card |
| Sign in with your password | dashboard opens |
| `/sitemap.xml` | URLs on **your** domain, not the placeholder |
| The padlock in the address bar | HTTPS active |

---

## 5. Firestore catalogue

Products, customers and orders live in Firestore. The seed products in
`data/products.json` are written only into an **empty** collection, so an
already-populated Firestore does not pick up new seed products. To push the
seed into an existing database, run `node scripts/migrate-to-firestore.mjs`
locally with the `FIREBASE_*` values in a git-ignored `.env.local`.

After the first deploy, check persistence: add a product called
`PERSISTENCE TEST` in the admin panel, redeploy, and confirm it is still there.
Uploaded media in `public/uploads/` is on the container disk, which some hosts
reset on every deploy — confirm that too before relying on uploads.

Edit the catalogue in `data/products.json`, then run `node scripts/sync-seed.mjs`
to regenerate `src/lib/seed.ts`.

---

## Updating later

Push to `main` and Hostinger reruns the build. Orders and customers are in
Firestore, so a redeploy does not touch them.

---

## Local development

```bash
# create .env.local (git-ignored) with the variables from step 3
npm install
npm run dev                    # http://localhost:3000
```

Checks before you ship a change:

```bash
npm run typecheck
npm run lint
npm run build
```
