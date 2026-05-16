# Tier-1 EV catalog plan (India)

**Goal:** Publish a credible, compare-ready master catalog for nine priority brands without breaking existing `cars` data.  
**Unit of catalog:** **variant** (trim/battery combo), grouped under **model**.

---

## Priority tiers

| Tier | Brands | Rationale |
|------|--------|-----------|
| **T1 (this sprint)** | Tata, MG, Mahindra, Hyundai, BYD, Kia, BMW, Mercedes, Volvo | Volume, search demand, compare traffic, dealer interest |
| T2 (next) | Citroën, Toyota, Lexus, Audi, Porsche, Mini | Niche or late entrants |
| T3 | Two-wheelers / fleet | Separate taxonomy later |

---

## Target catalog depth (phase 1)

| Brand | Models (on-sale focus) | Variants (est.) | Segment focus |
|-------|------------------------|-----------------|---------------|
| **Tata** | Nexon EV, Punch EV, Tiago EV, Harrier EV (upcoming), Curvv EV | 8–12 | Mass market, first EV |
| **MG** | Comet EV, ZS EV, Windsor EV | 6–9 | City + family SUV |
| **Mahindra** | XUV400, BE 6, XEV 9e (as launched) | 6–10 | SUV, adventure positioning |
| **Hyundai** | Kona Electric, Ioniq 5, Creta Electric (when on sale) | 5–8 | Tech, premium mass |
| **BYD** | Atto 3, Seal, e6 | 6–8 | Tech, fleet, premium |
| **Kia** | EV6, EV9, Carens Clavis EV (as launched) | 4–7 | Design-led family |
| **BMW** | iX1, i4, iX | 6–9 | Premium |
| **Mercedes** | EQA, EQB, EQS SUV, EQS sedan | 6–10 | Luxury |
| **Volvo** | EX30, XC40 Recharge, C40 Recharge | 4–6 | Safety-premium |

**Phase 1 total:** ~55–85 published variants (quality over quantity).

---

## Rollout waves (8 weeks suggested)

### Wave 1 — Mass market compare core (weeks 1–2)
**Brands:** Tata, MG, Mahindra  
**Why:** Highest India EV consideration set; powers default compare triangles.

| Model | Priority variants |
|-------|-------------------|
| Tata Nexon EV | Creative+, Fearless+, Empowered LR |
| Tata Punch EV | Smart+, Smart+ S, Empowered LR |
| MG ZS EV | Excite, Exclusive, Essence |
| MG Comet EV | Play, Plush, Plush+ |
| Mahindra XUV400 | EC Pro, EL Pro, EL Pro 7.2kW |

**Exit criteria:** All Wave 1 variants `published`, `dataQualityScore` ≥ 85, compare rivals linked within segment.

### Wave 2 — Tech-forward & Hyundai/Kia (weeks 3–4)
**Brands:** Hyundai, Kia, BYD (Atto 3 + Seal)

| Model | Priority variants |
|-------|-------------------|
| Hyundai Kona Electric | Premium |
| Hyundai Ioniq 5 | RWD, AWD (as sold in IN) |
| Kia EV6 | GT Line, AWD |
| BYD Atto 3 | Dynamic, Superior |
| BYD Seal | Dynamic, Premium |

### Wave 3 — Premium trust layer (weeks 5–6)
**Brands:** BMW, Mercedes, Volvo

| Model | Priority variants |
|-------|-------------------|
| BMW iX1 | xDrive30 |
| BMW i4 | eDrive35, M50 |
| Mercedes EQB | 250+, 350 4MATIC |
| Volvo EX30 | Single Motor, Twin Motor |

**Exit criteria:** Psychology scores + ownership confidence populated; SEO expert summaries reviewed.

### Wave 4 — Enrichment & rivals (weeks 7–8)
- Compute `compare.valueScore` and `segmentRivalIds` for all published variants.
- Fill `chargingFaq` for mass-market models.
- Bridge legacy `cars` → `ev_variants` where slugs match.
- Dealer listings pilot: 3 dealers × 10 variants.

---

## Data sourcing matrix

| Source type | Use for | Trust |
|-------------|---------|-------|
| OEM India spec sheets | Range, battery, charging, power | High |
| OEM price lists | Ex-showroom | High (date-stamp) |
| ARAI / homologation | Claimed range | High |
| EVSavari editorial | Real-world range band, psychology, pros/cons | Medium (reviewed) |
| Dealer interviews | Waiting period, on-road by city | Medium |
| AI draft | FAQ, summary first pass | Low until approved |

---

## Per-brand slug convention

```
{brandSlug}-{modelSlug}-{variantSlug}

Examples:
  tata-nexon-ev-long-range
  mg-zs-ev-exclusive
  byd-atto-3-superior
  bmw-ix1-xdrive30
```

---

## Compare triangles (seed rival sets)

Pre-wire these **segment rival groups** in `compare.segmentRivalIds`:

| Segment | Core triangle |
|---------|----------------|
| Compact SUV EV | Nexon EV LR ↔ XUV400 EL ↔ ZS EV Exclusive |
| City EV | Comet EV Plush+ ↔ Punch EV Empowered ↔ Tiago EV XZ+ |
| Mid SUV premium | Atto 3 Superior ↔ Kona Electric ↔ ZS EV (top) |
| Premium crossover | Ioniq 5 ↔ EV6 ↔ Model Y (when added) |
| Luxury SUV | iX1 ↔ EQB 350 ↔ XC40 Recharge |

---

## Required fields per wave (minimum viable publish)

**Wave 1 minimum:** identity, `pricing.exShowroom`, `battery.capacityKwh`, `range.claimedKm`, `charging.standards`, `performance.powerKw`, `media.heroImage`, `seo.metaTitle`, `seo.metaDescription`, `seo.pros` (3), `seo.cons` (2), `ownership.warrantyBatteryYears`.

**Wave 3 add:** psychology scores, `ownership.chargingNetworkScore`, `compare.strongestAdvantages` / `weakestAreas`.

---

## KPIs for catalog sprint

| KPI | Target (90 days) |
|-----|------------------|
| Published master variants | ≥ 60 |
| Variants with compare rivals | ≥ 90% |
| Avg `dataQualityScore` | ≥ 88 |
| Detail pages with FAQ schema | ≥ 80% |
| Legacy `cars` bridged | 100% of live inventory |

---

## Dependencies

- Master schema deployed read-only alongside `Car` (no cutover until dual-read tested).
- Admin import templates per brand (CSV).
- Cloudinary folder convention: `catalog/{brandSlug}/{modelSlug}/`.

---

## Out of scope (this sprint)

- Two-wheeler EV master schema
- Used EV / battery health scoring
- Real-time dealer DMS integration
- Consumer UI redesign

See: [ev-master-data-architecture.md](./ev-master-data-architecture.md)
