# LiveDeck Companion module

Bitfocus Companion module for the LiveDeck Studio control API (`/api/*`). Repo `rihani/companion-module-livedeck-studio` (public).

## Releasing (owner rule 2026-11-27: GitHub AND the website, every time)

1. Bump `version` in `package.json`, commit.
2. `NOTES="what's new" tools/publish.sh` — packages, tags, GitHub release with the .tgz, uploads to
   `manarlabs.com/dl/livedeck/companion/` (keeps the newest 2 builds + the c4 build), points the site's download links
   (`Shortlisted/site/content/docs/livedeck.html`, `lib/products.ts`) at it, builds and deploys the site, checks both.
   No separate site-deploy OK is needed for this (owner: "a given").

- Typecheck: `/usr/bin/env npx tsc --pretty false -p tsconfig.build.json --noEmit` (rtk-wrapped tsc hid errors).
- `livedeck-studio-c4-0.1.0.tgz` = SDK 1.x build for Companion 4.1–4.3, frozen at 0.1.0.
- Bitfocus module store: NOT applied for yet (2026-11-27). Steps in `SUBMISSION.md` (owner posts in Bitfocus Slack first).
