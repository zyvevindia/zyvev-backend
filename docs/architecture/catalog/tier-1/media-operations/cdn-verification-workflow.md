# CDN verification workflow

## Automated

```bash
cd docs/architecture/catalog/tier-1

# All Tier-1 slugs from manifest
node media-operations/verify-cdn-media.mjs

# Single variant
node media-operations/verify-cdn-media.mjs --slug tata-nexon-ev-empowered-lr

# Strict: fail if any asset missing (CI before publish)
node media-operations/verify-cdn-media.mjs --strict
```

Checks:

- HTTP `HEAD` or `GET` status 200
- `Content-Type` image/*
- Response size &gt; 5 KB (catches empty/error HTML)
- URL contains `/catalog/{slug}/`

## Manual spot-check

1. Incognito browser: open hero URL directly
2. Listing page: hard refresh `/cars`
3. View Page Source → OG `og:image` on detail
4. Compare two catalog vehicles side-by-side

## Rollback

- Remove broken file from CDN or replace in place (new hash filename preferred)
- Set variant to `review`; dual-read hides unpublished master if configured

## CI recommendation

On PRs touching `variants/*.json`:

```yaml
- run: node docs/architecture/catalog/tier-1/audit-media.mjs
- run: node docs/architecture/catalog/tier-1/media-operations/verify-cdn-media.mjs --strict
  continue-on-error: true  # until CDN fully populated
```
