# Catalog Intelligence Sprint

Transforms master catalog data into trusted EV decision support (India-first).

## Schema extensions (Tier-1 + `EvMasterVariant`)

| Block | Path | Purpose |
|-------|------|---------|
| Safety | `safety` | Bharat/Global NCAP, airbags, ADAS, cameras, parking, ESC |
| Comfort | `comfort` | Ventilation, rear seat, boot, family/city/ingress scores |
| Charging ecosystem | `chargingEcosystem` | Networks, home charging, DC curve, cost estimates |
| Ownership intelligence | `ownershipIntelligence` | Service, battery replace, insurance band, resale |
| Psychology extended | `psychologyExtended` | Anxiety, first EV, premium, enthusiast, inclusivity scores |
| Decision helper | `decision` | Who should buy/avoid, alt/upgrade/downgrade slugs |
| Persona fit | `personaFit` | City, family, highway, first, premium, value scores |
| Compare picks | `compare.picks` | Strongest/weakest labels, value & ownership flags |
| Commercial readiness | `commercial` | Subscription, battery lease, fleet, taxi (future) |

## Build pipeline

```bash
cd docs/architecture/catalog/tier-1
node build-catalog.mjs   # runs enrichVariantIntelligence()
```

Source: `data/_intelligence.js` — `enrichVariantIntelligence()` derives defaults from existing variant fields; override per variant in data modules when needed.

## Governance sprint

See [governance.md](./governance.md) — provenance registry, audit CLI, editorial templates, `scenarioFit`, `compare.narrative`.

```bash
node scripts/audit-catalog-intelligence.js --verbose
```

## Feature flags

| Env | Default | Effect |
|-----|---------|--------|
| `CATALOG_INTELLIGENCE_ENABLED` | `false` | When false, `catalogMeta` on public API omits intelligence blocks (backward compatible) |
| `USE_EV_MASTER` | `false` | Dual-read master catalog |
| `VITE_CATALOG_INTELLIGENCE` | `false` | Frontend decision UI |

**Production:** keep intelligence flags off until content QA sign-off.

## API

Full blocks available on `GET /api/catalog/variants/slug/:slug` (master DTO). Marketplace `catalogMeta` includes intelligence only when `CATALOG_INTELLIGENCE_ENABLED=true`.

## Frontend

`zyvev-frontend/docs/catalog-intelligence/README.md`
