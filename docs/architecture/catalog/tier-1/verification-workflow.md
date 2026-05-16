# Field verification workflow

## States

| State | Meaning |
|-------|---------|
| `verified` | Matches OEM or official price list |
| `estimated` | Informed estimate; flagged |
| `placeholder` | Structural placeholder only — block publish |
| `needs_review` | Conflicting sources |

## Workflow

```
Draft JSON created
    → Author runs validate-catalog.js
    → Catalog editor fills sourcing-checklist.md per variant
    → Flags added to verification.flags for every non-verified path
    → Quality score computed (quality-rubric.md)
    → If score ≥ 85 and no placeholder flags → status "review"
    → Catalog lead approves → status "published" (import script only, later)
```

## Flag schema (in each variant JSON)

```json
{
  "path": "pricing.exShowroom",
  "status": "estimated",
  "note": "Rounded from Jan 2026 price list; re-verify before campaign",
  "reviewBy": "2026-06-01"
}
```

## Review cadence

| Field type | Re-verify |
|------------|-----------|
| Ex-showroom | Monthly during active promos |
| Subsidy / FAME | On policy change |
| Waiting period | Bi-weekly |
| Real-world range | Quarterly (editorial) |
| Compare rivals | When new variant launches in segment |

## Sign-off

| Role | Responsibility |
|------|----------------|
| Data author | Accuracy of specs + flags |
| Editorial | Psychology, pros/cons, expert summary |
| Catalog lead | Publish approval + manifest integrity |
