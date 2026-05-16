# EVSavari OEM Media Operations

Scalable Tier-1 EV media pipeline: OEM-quality visuals, CDN discipline, and marketplace trust.

## Documents

| Guide | Purpose |
|-------|---------|
| [operations-guide.md](./operations-guide.md) | Sourcing hierarchy, copyright, naming, QA, review |
| [ingestion-workflow.md](./ingestion-workflow.md) | Press → package → optimize → CDN → verify |
| [image-optimization.md](./image-optimization.md) | Per-role compression and dimensions |
| [tier-1-upload-checklist.md](./tier-1-upload-checklist.md) | Pre-upload gate |
| [media-qa-checklist.md](./media-qa-checklist.md) | Human QA before publish |
| [cdn-verification-workflow.md](./cdn-verification-workflow.md) | Automated + manual CDN checks |

## Scripts

```bash
cd docs/architecture/catalog/tier-1

# Local ingest folders per slug
node media-operations/prepare-media-package.mjs
node media-operations/prepare-media-package.mjs --slug tata-nexon-ev-empowered-lr

# HTTP verify CDN (after upload)
node media-operations/verify-cdn-media.mjs
node media-operations/verify-cdn-media.mjs --slug tata-nexon-ev-empowered-lr

# Rebuild catalog JSON (includes media.assets metadata)
node build-catalog.mjs
node audit-media.mjs
```

## CDN layout

```
cdn.evsavari.com/catalog/
  {variant-slug}/
    hero.jpg
    listing-thumb.jpg
    compare-thumb.jpg
    og.jpg
    exterior-1.jpg … exterior-3.jpg
    interior-1.jpg
    charging-port.jpg
  _fallbacks/
    {brand}-{bodyType}.jpg
    ev-placeholder.jpg
```

## Frontend

See `zyvev-frontend/docs/oem-media-operations/README.md` for `VehicleImage`, fallback chains, and CLS safeguards.
