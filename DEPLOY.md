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

The zip ships your **11 real products** and their media, and **zero customers
and zero orders** — a shop about to take real money should not open with test
orders already in its books, inflating the revenue figure on the dashboard.


Unzip and upload the contents to your app's directory, **or** push the same
files to a Git repository and point Hostinger at it. Git is easier to update
later.

Do not upload `node_modules` or `.next` — Hostinger builds both itself.

---

## 3. Environment variables

Set these three in Hostinger's environment-variables panel, then deploy.

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD_HASH` | from step 1 |
| `ADMIN_SESSION_SECRET` | from step 1 |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com.au` — your real domain, no trailing slash |
| `GOOGLE_CLIENT_ID` | optional — see below |
| `GOOGLE_CLIENT_SECRET` | optional — see below |

**`NEXT_PUBLIC_SITE_URL` must be set before the build runs.** Anything prefixed
`NEXT_PUBLIC_` is baked into the compiled output, so setting it afterwards
changes nothing until you rebuild. Get it wrong and every canonical URL,
sitemap entry and social-share card points at the wrong domain.

The app refuses to start without the first two, by design — a live admin panel
with no password is worse than a site that will not boot.

### "Continue with Google" (optional)

Leave `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` unset and the button simply
does not appear — everything else works. To switch it on:

1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client
   ID**, application type **Web application**.
2. Under **Authorised redirect URIs**, add — exactly, no trailing slash:
   `https://yourdomain.com.au/api/account/google/callback`
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

## 5. The one thing you must test before trusting it with real orders

**This app stores its data on disk**, in two places:

- `data/*.json` — products, customers, orders
- `public/uploads/` — images and videos you upload in the admin panel

That is fine on a normal server with a persistent disk. It is **not** fine on a
host that rebuilds the container from source on every deploy — there, each
deploy silently resets the site to whatever was in the zip. Orders placed by
real customers would vanish.

Test it, do not assume:

1. Deploy.
2. In the admin panel, add a product called `PERSISTENCE TEST`.
3. Redeploy without changing anything.
4. Look for the product.

**Still there** → the disk persists. You are done; just take regular copies of
the `data/` folder as a backup.

**Gone** → the filesystem is ephemeral. Do not launch on it. The app needs a
real database (Postgres, e.g. Supabase or Hostinger's own) and object storage
for uploads before it can take a single real order.

---

## Updating later

Upload the changed files (or `git push`), then trigger a redeploy. Hostinger
reruns `npm ci && npm run build`.

**Never overwrite `data/` on the server with your local copy** — the live one
holds real customer orders. Exclude it from every upload after the first.

---

## Local development

```bash
cp .env.example .env.local     # then fill in the three values
npm install
npm run dev                    # http://localhost:3000
```

Checks before you ship a change:

```bash
npm run typecheck
npm run lint
npm run build
```
