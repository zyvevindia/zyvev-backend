# EV master record — quality scoring rubric

Score each variant **0–100** before publish. Minimum **85** for Tier-1 import; target **90+** for featured/compare hero slots.

## Scoring weights

| Dimension | Weight | Criteria |
|-----------|--------|----------|
| **Identity completeness** | 10 | Brand, model, variant, slug, segment, launch status, body type |
| **Pricing trust** | 15 | Ex-showroom sourced; on-road/EMI flagged if estimated; `priceLastUpdated` set |
| **Technical specs** | 20 | Battery kWh, ARAI range, AC/DC charging, power, drive type — OEM-aligned |
| **Real-world intelligence** | 10 | `realWorldKm` band with methodology; not copy-paste ARAI |
| **Ownership confidence** | 10 | Both warranties; service/network/resale scores justified |
| **Psychology** | 10 | ≥2 tags; ≥5 score dimensions; narrative ≤120 words, specific |
| **Compare readiness** | 10 | ≥2 rivals in-segment; ≥2 advantages + ≥2 weaknesses; `valueScore` |
| **SEO richness** | 10 | Meta title/description; 3+ pros, 2+ cons; expert summary; ≥2 FAQ |
| **Media** | 5 | Hero URL present; gallery optional for Tier-1 |
| **Verification hygiene** | 10 | All estimates flagged; no empty required paths |

## Grade bands

| Score | Grade | Action |
|-------|-------|--------|
| 90–100 | A | Publish-ready |
| 85–89 | B | Publish with minor editorial pass |
| 70–84 | C | Hold — complete gaps |
| &lt;70 | D | Do not import |

## Automatic penalties (−5 each)

- Missing `verification.flags` on estimated price or range
- `compare.segmentRivalSlugs` points to non-existent slug
- Duplicate slug in manifest
- `seo.pros` generic filler (e.g. "good car" without specifics)
- ARAI range without `claimedStandard`

## Stored field

Set `governance.dataQualityScore` to the computed total after manual review.
