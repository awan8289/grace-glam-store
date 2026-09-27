<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Rules for this repository

Two people work on this repo with agentic editors, and it deploys straight to
Hostinger on every push to `main`. Each rule below is here because breaking it
has already cost a day.

## Never force-push `main`

`git push --force` (and `--force-with-lease`, and anything that rewrites
published history) is off limits on `main`. It has already silently deleted a
commit that was pushed by someone else — the deploy fix in rule 2, which then
had to be diagnosed and rebuilt from scratch.

To bring your work up to date, rebase instead:

```bash
git pull --rebase origin main
npm run build          # must exit 0 before you push
git push origin main
```

If a push is rejected as `non-fast-forward`, that is Git protecting the other
person's commits. Pull and rebase. Do not reach for `--force`.

## `build` must keep `--webpack`

```json
"dev":   "next dev --webpack",
"build": "next build --webpack",
```

Next 16 builds with Turbopack by default. Hostinger's build container kills
Turbopack's worker processes, so the deploy dies with:

```
FATAL: An unexpected Turbopack error occurred
Caused by: creating new process - node process exited before we co...
```

That message reads like a fault in the application and is not one — the same
commit builds clean locally. Do not remove either flag, and if you regenerate
`package.json`, put them back.

## Leave the archive rules in `.gitignore` alone

```
*.rar
*.zip
/Products
```

There is a 301 MB `.rar` of source photography sitting beside the project on one
machine. GitHub refuses any push containing a file over 100 MB, so without these
rules a single `git add -A` makes every push fail — and the pre-receive error
names the file without mentioning the size limit, which sends you looking for a
credentials problem that is not there.

## Secrets stay in the host's environment panel

No credential is ever committed, and there is no `.env.local` in the repo. The
data store is Firestore, so the site needs `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` set on the host. Without
them the build still exits 0 and the pages still return 200 — they just render
"No products found.", because the catalogue read fails and falls back. An empty
shop after a green deploy means missing Firebase variables, not a broken build.

Never prefix a server-side secret with `NEXT_PUBLIC_`; that ships it to the
browser. Never commit a `*-firebase-adminsdk-*.json` service-account key.

## Before you push

```bash
npm run typecheck
npm run lint
npm run build
```

All three from a tree that has already been rebased onto `origin/main`. A push
that has not had `npm run build` run against it is a coin toss on the live site.
