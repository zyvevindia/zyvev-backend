# Production rollout sequence

Ordered checklist for catalog integration go-live.

## Pre-flight

- [ ] `npm`/Node 20+ on Render
- [ ] `MONGO_URI` backup snapshot
- [ ] Tier-1 JSON validated: `node docs/architecture/catalog/tier-1/validate-catalog.mjs`
- [ ] Staging import dry-run: `node scripts/import-tier1-catalog.js --dry-run`
- [ ] Frontend build passes with `normalizeCar` catalog fields

## Step 1 — Deploy code (flag off)

1. Deploy backend containing catalog modules.
2. Confirm `USE_EV_MASTER` unset or `false`.
3. Smoke legacy: homepage, `/cars`, `/car/{known-slug}`, compare, admin login.

## Step 2 — Import data (production DB)

1. `node scripts/import-tier1-catalog.js --dry-run`
2. `node scripts/import-tier1-catalog.js` (imports as `review`)
3. Editorial QA on 17 variants
4. `node scripts/import-tier1-catalog.js --publish`

## Step 3 — Enable dual-read

1. Set `USE_EV_MASTER=true` on Render.
2. Redeploy / restart.
3. `GET /api/catalog/status` → `useEvMaster: true`
4. `GET /cars` → check `catalogMode`, sample `catalogSource`

## Step 4 — Verify API

- [ ] Listing filters (brand, price, sort)
- [ ] Detail by slug for one Tata, one MG, one BYD master slug
- [ ] Compare: add 2 master vehicles → `/compare`
- [ ] Lead form still posts to `/leads`
- [ ] Dealer routes unaffected

## Step 5 — SEO & analytics

- [ ] `robots.txt` / sitemap unchanged
- [ ] Spot-check meta on detail pages (Helmet + API data)
- [ ] GA events still fire

## Step 6 — Admin preview (optional)

1. `EV_MASTER_ADMIN_PREVIEW=true`
2. Admin token → `GET /api/catalog/variants?preview=true`
3. Confirm draft/review visible; public still sees published only

## Step 7 — Monitor (48h)

- 5xx rate on `/cars`
- CORS errors from frontend
- User reports of missing vehicles (slug collision audit)

## Rollback

Set `USE_EV_MASTER=false` → restart. See [rollback-strategy.md](./rollback-strategy.md).
