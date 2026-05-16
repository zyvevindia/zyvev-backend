# Tier-1 upload checklist

Per variant slug before CDN upload.

## Package

- [ ] `prepare-media-package.mjs --slug <slug>` run
- [ ] All files in `media-packages/<slug>/` (not `_source` only)
- [ ] Filenames match MANIFEST exactly

## Files

- [ ] `hero.jpg`
- [ ] `listing-thumb.jpg`
- [ ] `compare-thumb.jpg`
- [ ] `og.jpg` (1200×630)
- [ ] `exterior-1.jpg`, `exterior-2.jpg`, `exterior-3.jpg`
- [ ] `interior-1.jpg`
- [ ] `charging-port.jpg`

## Authenticity

- [ ] Correct brand, model, generation, trim
- [ ] India-market spec (no foreign plate / spec)
- [ ] EV-only (no exhaust, ICE grille)

## Upload

- [ ] Path: `catalog/<slug>/`
- [ ] `Cache-Control` immutable set
- [ ] `verify-cdn-media.mjs` all 200

## Catalog

- [ ] `build-catalog.mjs`
- [ ] `audit-media.mjs` pass
- [ ] Staging listing + detail visual check
