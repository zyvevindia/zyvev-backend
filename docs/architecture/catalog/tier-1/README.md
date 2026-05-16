# Tier-1 EV catalog (population sprint)

**Target:** 17 high-quality master variant records (quality over quantity).  
**Status:** Import-ready JSON only — **not wired** to production API or `cars` collection.

## Layout

```
tier-1/
  README.md
  manifest.json
  quality-rubric.md
  sourcing-checklist.md
  verification-workflow.md
  build-catalog.mjs
  validate-catalog.mjs
  variants/
    *.json
```

## Usage

```bash
node docs/architecture/catalog/tier-1/build-catalog.mjs
node docs/architecture/catalog/tier-1/validate-catalog.mjs
```

## Rules

- Every variant includes `verification.flags` for estimated or unverified fields.
- Slugs: `{brand}-{model}-{variant}` (lowercase, hyphenated).
- `compare.segmentRivalSlugs` must reference slugs in `manifest.json`.
- Do not import to production until editorial sign-off per `verification-workflow.md`.
