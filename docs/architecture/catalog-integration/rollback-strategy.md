# Rollback strategy

## Instant rollback (no deploy)

Set environment on Render:

```env
USE_EV_MASTER=false
```

Restart service. Effect:

- `GET /cars`, `/cars/slug/:slug`, `/cars/:id` → **legacy `Car` only**
- `/api/catalog/*` still available but master variants hidden from public merge
- **Zero data loss** — `EvMasterVariant` documents remain in MongoDB

## Rollback after bad import

1. Set `USE_EV_MASTER=false`.
2. Identify bad slugs in `evmastervariants` collection.
3. Update `governance.status` to `archived` for affected docs (no delete required).
4. Re-import corrected JSON with `import-tier1-catalog.js`.

## Rollback after partial publish

If wrong prices/specs shipped:

1. `USE_EV_MASTER=false` immediately.
2. Fix JSON in `docs/architecture/catalog/tier-1/variants/`.
3. Re-run import (upsert by slug).
4. Re-enable flag after validation.

## What we do NOT do in rollback

- Drop `cars` collection
- Drop `evmastervariants` collection
- Force-delete dealer listings

## Recovery time objective

| Action | Target |
|--------|--------|
| Flag flip | &lt; 5 minutes |
| Re-deploy previous build | &lt; 15 minutes |
| Data fix + re-import | 1–4 hours (editorial) |
