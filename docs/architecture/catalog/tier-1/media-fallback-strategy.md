# Tier-1 media fallback strategy

See also: `zyvev-frontend/docs/media-listing-trust/fallback-strategy.md`

## `mediaPaths(slug)` fields

| Field | Path | Notes |
|-------|------|-------|
| heroImage | `{slug}/hero.jpg` | Required for import |
| listingThumbnail | `{slug}/listing-thumb.jpg` | Card crop |
| compareThumbnail | `{slug}/compare-thumb.jpg` | Compare grid |
| ogImage | `{slug}/og.jpg` | Social share |
| gallery | `exterior-1..3.jpg` | Detail gallery |

## `brandFallbackImage(brandSlug, bodyType)`

`https://cdn.evsavari.com/catalog/_fallbacks/{brand}-{bodyType}.jpg`

## Audit

```bash
node audit-media.mjs
```

Fails on: Unsplash URLs, slug mismatch, duplicate heroes, duplicate gallery entries.
