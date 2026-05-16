# Media operations guide

## Image sourcing hierarchy

1. **OEM India press kit** — official EV launch assets (preferred)
2. **OEM brochure / configurator** — trim-accurate angles (document source PDF)
3. **Authorized dealer media bank** — only with written usage scope
4. **EVSavari shoot** — controlled studio / location (full rights)
5. **Never** — stock photo sites, competitor trims, ICE-only variants, AI-generated bodies

## Acceptable source policy

| Source | Allowed | Conditions |
|--------|---------|------------|
| OEM press portal | Yes | India-market EV trim; retain attribution metadata |
| Brochure PDF extract | Yes | Vector/raster export at ≥300 DPI equivalent |
| Social reposts | No | Unless explicit OEM redistribution rights |
| User uploads | No | For catalog master (dealer listings separate) |
| Wikipedia / blogs | No | |

## Copyright-safe usage approach

- Store `attribution.sourceType`, `rightsNote`, and `accessedAt` in `media.assets[]` (catalog JSON).
- Prefer OEM terms that allow **editorial marketplace** use in India.
- When terms are unclear, keep `governance.status: review` and flag `media` in verification.
- Re-review assets after OEM facelifts or mid-cycle updates.

## Naming conventions

| Asset | Filename | Slug folder |
|-------|----------|-------------|
| Hero | `hero.jpg` | `catalog/{slug}/` |
| Listing | `listing-thumb.jpg` | same |
| Compare | `compare-thumb.jpg` | same |
| OG | `og.jpg` | same |
| Gallery exterior | `exterior-{n}.jpg` | same |
| Interior | `interior-1.jpg` | same |
| Charging | `charging-port.jpg` | same |

Slug = `identity.slug` (e.g. `tata-nexon-ev-empowered-lr`). No spaces, lowercase, hyphenated.

## Image quality standards

- Authentic trim and market specification
- Minimum long edge: 1600px (hero/gallery), 1280px (thumbs)
- sRGB, JPEG q≈82 or WebP q≈85
- No heavy filters; exposure balanced for white vehicle bodies
- CCS2 port visible on charging asset for India catalog

## Review workflow

1. **Ingest** — media ops prepares package (`prepare-media-package.mjs`)
2. **Optimize** — per [image-optimization.md](./image-optimization.md)
3. **Upload** — CDN path matches slug
4. **Verify** — `verify-cdn-media.mjs` + [cdn-verification-workflow.md](./cdn-verification-workflow.md)
5. **QA** — [media-qa-checklist.md](./media-qa-checklist.md)
6. **Catalog** — `build-catalog.mjs`, `audit-media.mjs`
7. **Publish** — set `governance.status: published` only after QA sign-off
8. **Staging** — visual check on listing, compare, detail, OG debugger
