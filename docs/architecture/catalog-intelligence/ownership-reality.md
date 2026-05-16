# Ownership Reality Sprint

Real-world EV ownership intelligence — conservative, provenance-aware, non-speculative.

## Blocks

| Block | Purpose |
|-------|---------|
| `rangeReality` | City/winter/highway/AC/load/eco km bands — never above ARAI claim |
| `chargingReality` | India lifestyle: apartment, society, office, road-trip confidence |
| `buyerAssurance` | Confidence scores (first EV, battery, family, daily use) |
| `ownershipTradeoffs` | Primary strength, compromise, ideal use, less suitable for |
| `scenarioCompare` | Per-scenario alignment for compare 2.0 |

## Pipeline

```
enrichVariantIntelligence → applyGovernanceLayer
  → applyOwnershipReality → buildProvenanceRegistry
```

Module: `services/ownership-reality/`

## Audits

Extended `catalog-intelligence-audits` with `ownershipReality.js` rules:

- Range bands must not exceed claimed km
- Highway vs city realism
- Charging / society contradictions
- Tradeoff hype language
- Overconfident assurance scores

```bash
node scripts/audit-catalog-intelligence.js --verbose
```

## API / flags

Exposed on `catalogMeta` when `CATALOG_INTELLIGENCE_ENABLED=true`.

Frontend: `VITE_CATALOG_INTELLIGENCE=true` surfaces chips, panels, scenario compare.
