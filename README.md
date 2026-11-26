# SplitTable

A working full-stack bill splitter built for Ishan Sachdeva. Create a bill, add people, enter receipt line totals, and assign each item to one or several people. Share a bill URL to work on the same saved bill.

## Implemented

- React + TypeScript responsive interface, CAD/USD denomination selection
- Cloudflare D1 (SQLite) persistent storage via server API routes
- Shareable high-entropy bill IDs; the site itself starts owner-private
- Polling every five seconds, with revision-aware responses
- Atomic compare-and-swap writes with bounded retries to preserve concurrent edits
- Item-level equal splitting, fixed discounts, proportional tax and pre-tax tips
- Integer-cent arithmetic and largest-remainder allocation
- Unassigned-item bucket so missing claims are never silently distributed
- Copyable and downloadable text summaries
- Recent bill links remembered locally; bill contents stored on the server

## Architecture

`app/page.tsx` — client UI and polling. `lib/split.ts` — pure allocation engine. `lib/actions.ts` — Zod validation and mutation reducer. `app/api/bills/` — create/read/mutate API. `db/schema.ts` and `drizzle/` — database schema and migration.

Each bill is one JSON document with a revision number. A mutation reads the latest revision, applies a validated operation, and updates only if that revision still matches. A conflict retries against the new state (up to eight attempts). This avoids whole-document last-writer-wins overwrites. Claim operations set explicit desired membership instead of toggling stale state.

## Math

Prices are entered in cents. Each item is split equally among its claimants; any indivisible pennies go by claimant order. Items without claimants go into an unassigned bucket. Discounts are distributed across these bases using largest remainders; tax and tip apply to the discounted subtotal and are distributed proportionally. Ties use participant order. The tax and tip are independently rounded to a cent. Summing all participants plus the unassigned bucket always equals the bill total.

Tax is a single bill-level percentage; item-specific exemptions are not modeled. Tip is calculated after discount and before tax. Currency selection relabels the denomination; it does not convert values. Receipt amounts are line totals, not unit prices.

## Local setup

Requires Node 22.13+ (Node 24 recommended).

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_brainy_brood.sql
npm run dev
```

Apply each migration once per local database. In the managed Sites environment use `sites-preview start` instead of launching a separate server. Deployment provisions the production D1 database and applies migrations; local test data is not deployed.

## Checks

```sh
node --experimental-strip-types --test tests/split.test.ts
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

Tests include penny rounding, proportional allocation, zero/full discounts, empty bills, invalid amounts, and 1,000 deterministically generated scenarios checking conservation and nonnegative integer shares.

## Access and limitations

The published site starts private. To collaborate with friends, the site owner must separately change its access settings. Anyone with site access AND a bill URL can read or edit that bill, including participants and prices. Bill URLs are bearer links, not per-person authentication; do not put sensitive information in bill names. Participant names do not establish identity. There is no payment collection, OCR, settlement tracking, or per-person authorization. This version uses D1/SQLite, not Supabase/PostgreSQL. Recent bills are device-local bookmarks, not an account-wide dashboard. There is no application-level bill deletion or account system yet.

## Development

Built with AI assistance using React, TypeScript, Vinext and Cloudflare D1. The exported application code matches the saved Site version; unused starter UI components and example code are omitted.

## GitHub upload

Unzip this package. Create an empty repository named `splittable` on GitHub, then upload the CONTENTS of this folder (not the ZIP or the containing folder). Include `.gitignore`, `.npmrc` and the `.openai` directory. On macOS, press Command+Shift+Period in Finder to reveal these files. No generated dependencies, local database records or credentials are included.

Publishing source on GitHub does not deploy the application or make its private hosted demo accessible. This app requires a server and database; GitHub Pages cannot run its API routes. The included Site manifest identifies the existing hosted project and is not a credential. Deploying elsewhere requires configuring the target hosting and database.

Optional API integration check against a running development instance:

```sh
TEST_BASE_URL=http://localhost:5173 node --test tests/api.test.mjs
```

Use the actual URL printed by your development server. This test creates an isolated test bill. Browser workflows and cross-tab synchronization were verified; the standalone API test was not completed in the managed build environment because the preview server was unreachable from its shell.
