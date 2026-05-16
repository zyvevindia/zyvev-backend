# Media ingestion workflow

## Overview

```
OEM press / brochure → local package → optimize → CDN upload → verify → catalog import
```

## 1. Intake (OEM press & brochure)

- Collect India EV trim assets from OEM press portal or brochure PDF.
- Log source URL / PDF version in variant verification `sources[]`.
- Drop raw files into `media-packages/{slug}/_source/` (gitignored in ops, not committed).

## 2. Prepare package

```bash
node media-operations/prepare-media-package.mjs --slug <slug>
```

Creates:

```
media-packages/{slug}/
  MANIFEST.md          # required files checklist
  _source/             # raw OEM drops (ops local)
  hero.jpg             # (you place optimized files here)
  listing-thumb.jpg
  ...
```

## 3. Gallery import

- Map brochure pages to `exterior-1..3`, `interior-1`, `charging-port`.
- Tag mentally (later in JSON `media.assets[].tags`): `exterior`, `interior`, `charging`, `ccs2`.

## 4. Optimize

Follow [image-optimization.md](./image-optimization.md). Tools: Squoosh, ImageMagick, `sharp` CLI.

## 5. CDN upload standards

- **Path:** `s3://…/catalog/{slug}/` or CDN sync equivalent
- **Cache:** `Cache-Control: public, max-age=31536000, immutable` (version by filename)
- **ACL:** public read
- **Content-Type:** `image/jpeg` or `image/webp`
- Do not overwrite `{slug}` folder with another variant’s files

## 6. Slug-based organization

One folder per **variant** slug (not model-only). Nexon Creative Plus ≠ Nexon Empowered LR.

## 7. Verify & catalog

```bash
node media-operations/verify-cdn-media.mjs --slug <slug>
node build-catalog.mjs
node audit-media.mjs
```

## 8. Staging visual QA

Frontend `VehicleImage` will chain fallbacks if any crop 404s — fix before publish.
