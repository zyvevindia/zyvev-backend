# EV master catalog — migration execution plan

**Principle:** additive, reversible, no destructive changes to `cars`.

## Phase 0 — Prep (no production flag)

1. Deploy backend with catalog code; **`USE_EV_MASTER=false`** (default).
2. Run `node scripts/import-tier1-catalog.js --dry-run`.
3. Import to staging: `node scripts/import-tier1-catalog.js` (status `review`).
4. Editorial review + `quality-rubric.md` sign-off.
5. Publish on staging: `node scripts/import-tier1-catalog.js --publish`.

## Phase 1 — Staging dual-read

1. Set **`USE_EV_MASTER=true`** on staging API only.
2. Verify:
   - `GET /cars` returns `catalogMode: dual-read` header `X-Catalog-Mode`.
   - Slug URLs unchanged (`/car/{slug}`).
   - Legacy-only slugs still appear.
   - Master slugs override legacy on collision.
3. Run smoke: listing, detail, compare, leads.

## Phase 2 — Production dual-read (read path)

1. Import Tier-1 to production DB (**`--publish` only after review**).
2. Enable **`USE_EV_MASTER=true`** on Render.
3. Monitor errors and response shape for 24–48h.

## Phase 3 — Optional legacy bridge

1. For each legacy `Car`, set `EvMasterVariant.governance.legacyCarId` (script TBD).
2. Do **not** delete legacy rows until Phase 5.

## Phase 4 — Admin & preview

1. Train editors on `GET /api/catalog/variants?preview=true` (admin JWT).
2. Use governance badges in admin UI (future).

## Phase 5 — Cutover (future, not this sprint)

1. Stop writing new specs to `cars` (admin creates master only).
2. Deprecate legacy public writes.
3. Archive duplicate legacy catalog rows (soft `inactive`, not delete).

## Rollback trigger

Any of: elevated 5xx on `/cars`, SEO slug 404 spike, compare regressions → set **`USE_EV_MASTER=false`** (instant legacy-only).

See [rollback-strategy.md](./rollback-strategy.md).
