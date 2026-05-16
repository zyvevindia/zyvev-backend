# Intelligence Governance Sprint

Separates **facts** from **interpretations** with provenance, audits, and template editorial.

## Components

| Module | Path |
|--------|------|
| Provenance metadata | `services/catalog/intelligenceMetadata.js` |
| Governance pipeline | `services/catalog/governancePipeline.js` |
| Editorial templates | `services/editorial-intelligence/` |
| Audit engine | `services/catalog-intelligence-audits/` |

## Provenance (`intelligenceGovernance`)

```json
{
  "schemaVersion": 1,
  "generatedAt": "ISO-8601",
  "fields": {
    "range.claimedKm": {
      "metadata": {
        "sourceType": "OFFICIAL_OEM",
        "confidenceLevel": "verified",
        "verificationStatus": "pending_review",
        "lastVerifiedAt": null,
        "verificationMethod": "arai_certification"
      }
    }
  }
}
```

### sourceType

`OFFICIAL_OEM` | `OFFICIAL_NCAP` | `EDITORIAL_ESTIMATE` | `INDUSTRY_ESTIMATE` | `DERIVED_LOGIC` | `USER_REPORTED` | `THIRD_PARTY_REFERENCE`

### confidenceLevel

`verified` | `high` | `medium` | `low` | `experimental`

### verificationStatus

`verified` | `pending_review` | `unverified`

## Build pipeline

```bash
cd docs/architecture/catalog/tier-1
node build-catalog.mjs   # enrich + governance

node ../../../../scripts/audit-catalog-intelligence.js --verbose
```

## Feature flags

| Flag | Effect |
|------|--------|
| `CATALOG_INTELLIGENCE_ENABLED` | Exposes intelligence + governance on `catalogMeta` |
| `USE_EV_MASTER` | Dual-read |
| `VITE_CATALOG_INTELLIGENCE` | Frontend decision UI |

Governance JSON is always written to Tier-1 variant files; API strips unless intelligence flag on.

## Rollback

Disable `CATALOG_INTELLIGENCE_ENABLED` — public API returns legacy-trimmed `catalogMeta`. Tier-1 JSON remains for re-enable.
