# Catalog integration sprint — overview

## Quick start

```bash
# Validate Tier-1 JSON
node docs/architecture/catalog/tier-1/validate-catalog.mjs

# Import (staging)
node scripts/import-tier1-catalog.js --dry-run
node scripts/import-tier1-catalog.js
node scripts/import-tier1-catalog.js --publish

# Enable dual-read (staging/production when ready)
# USE_EV_MASTER=true
```

## Architecture

```
GET /cars  ──▶ dualReadService ──▶ legacy Car
                    │              + EvMasterVariant (if flag on)
                    ▼
              mappers.toMarketplaceVehicle()
```

## Docs

- [migration-execution-plan.md](./migration-execution-plan.md)
- [rollback-strategy.md](./rollback-strategy.md)
- [api-compatibility.md](./api-compatibility.md)
- [production-rollout-sequence.md](./production-rollout-sequence.md)

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `USE_EV_MASTER` | `false` | Dual-read merge |
| `EV_MASTER_ADMIN_PREVIEW` | `true` | Admin `?preview=true` |
