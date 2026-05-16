# EVSavari Master EV Data Architecture

**Sprint:** Master EV Data Architecture  
**Scope:** Data modeling, normalization, compare intelligence, SEO, ownership psychology, dealer separation  
**Status:** Design (additive to existing `Car` collection — no destructive migration)

---

## 1. Design principles

| Principle | Implementation |
|-----------|----------------|
| **Master vs inventory** | Canonical specs live in **master catalog**; dealers attach **listings** (price override, stock, city, waiting period). |
| **Variant granularity** | Compare, pricing, and range are **variant-level**; model-level pages aggregate variants. |
| **India-first** | Prices in INR; on-road by city optional; subsidy/FAME awareness; ARAI vs real-world range distinction. |
| **Psychology as data** | Lifestyle tags are **structured scores + labels**, not free text only — enables filters and compare narratives. |
| **Computed vs stored** | Store source facts; compute rankings, value scores, and rival sets in jobs or on read with cache. |
| **SEO as first-class** | Pros/cons/FAQ stored per variant (or model) with schema.org-ready shapes. |
| **Backward compatible** | Existing `Car` documents remain valid; `legacyCarId` links during transition. |

---

## 2. MongoDB collections architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  ev_brands      │────▶│  ev_models       │────▶│  ev_variants        │
│  (Brand)        │     │  (Model)         │     │  (Master variant)   │
└─────────────────┘     └──────────────────┘     └──────────┬──────────┘
                                                              │
                    ┌─────────────────────────────────────────┼──────────────────────────┐
                    │                                         │                          │
                    ▼                                         ▼                          ▼
           ┌────────────────┐                      ┌──────────────────┐      ┌──────────────────┐
           │ ev_segments    │                      │ dealer_listings  │      │ ev_compare_cache │
           │ (taxonomy)     │                      │ (inventory)      │      │ (optional)       │
           └────────────────┘                      └────────┬─────────┘      └──────────────────┘
                                                          │
                                                          ▼
                                                 ┌──────────────────┐
                                                 │ dealers          │
                                                 │ (existing)       │
                                                 └──────────────────┘

Legacy bridge: `cars` collection (existing Car model) ──▶ `ev_variants.legacyCarId`
```

### Collection responsibilities

| Collection | Purpose | Replaces / extends |
|------------|---------|-------------------|
| **ev_brands** | Brand identity, logo, country, EV portfolio metadata | Normalizes `brand` string on `Car` |
| **ev_models** | Model name, body type, segment, launch status, default media | Groups variants |
| **ev_variants** | Full master record (sections A–K) | **Source of truth** for specs, SEO, psychology |
| **dealer_listings** | Dealer-specific availability, on-road quote, waiting period | Splits `dealer` fields off master `Car` |
| **ev_segments** | Segment definitions + rival rules | Powers compare intelligence |
| **ev_compare_cache** | Precomputed rival IDs, value scores (TTL) | Optional performance layer |
| **cars** (legacy) | Keep until migration complete | Current production API |

### API read paths (future)

- **Public discovery:** `ev_variants` + join `ev_models` + `ev_brands` (published only).
- **Compare:** variant IDs → `ev_compare_cache` or live compute from `compareIntelligence`.
- **Dealer portal:** `dealer_listings` filtered by `dealerId`.
- **Detail page:** variant by `slug` (unique globally: `{brandSlug}-{modelSlug}-{variantSlug}`).

---

## 3. Field classification matrix

Legend: **R** = required for publish, **O** = optional, **S** = static (stored), **C** = computed, **I** = indexed, **SEO** = SEO-critical, **CMP** = compare-critical

### A. Identity

| Field | R/O | S/C | I | SEO | CMP | Notes |
|-------|-----|-----|---|-----|-----|-------|
| `brandId` | R | S | I | | ✓ | Ref `ev_brands` |
| `modelId` | R | S | I | | ✓ | Ref `ev_models` |
| `variantName` | R | S | | ✓ | ✓ | e.g. "Long Range" |
| `slug` | R | S | I | ✓ | ✓ | Unique compound with brand+model |
| `bodyType` | R | S | I | ✓ | ✓ | SUV, sedan, hatchback, MPV, etc. |
| `segment` | R | S | I | ✓ | ✓ | compact-suv, premium-sedan, etc. |
| `launchStatus` | R | S | I | ✓ | | on-sale \| upcoming \| discontinued |
| `modelYear` | O | S | I | | | |
| `fuelType` | R | S | | | | Always `electric` for this catalog |

### B. Pricing

| Field | R/O | S/C | I | SEO | CMP | Notes |
|-------|-----|-----|---|-----|-----|-------|
| `pricing.exShowroom` | R | S | I | ✓ | ✓ | INR, variant default |
| `pricing.onRoadByCity` | O | S | | ✓ | | Map city → amount |
| `pricing.emi` | O | S/C | | ✓ | ✓ | Stored assumptions or computed |
| `pricing.subsidy` | O | S | | ✓ | ✓ | Central/state/FAME breakdown |
| `pricing.ownershipCost5yr` | O | C | | ✓ | ✓ | Computed from energy + service |
| `pricing.priceLastUpdated` | R | S | | | | Audit |

### C. Battery & charging

| Field | R/O | S/C | I | SEO | CMP | Notes |
|-------|-----|-----|---|-----|-----|-------|
| `battery.capacityKwh` | R | S | I | ✓ | ✓ | Gross pack |
| `battery.usableKwh` | O | S | | ✓ | ✓ | |
| `battery.chemistry` | O | S | | | | LFP, NMC, etc. |
| `range.claimedKm` | R | S | I | ✓ | ✓ | ARAI/certified |
| `range.realWorldKm` | O | S | I | ✓ | ✓ | EVSavari estimate band |
| `charging.acKw` | R | S | | ✓ | ✓ | |
| `charging.dcKw` | O | S | | ✓ | ✓ | Peak DC |
| `charging.time0to80` | O | S | | ✓ | ✓ | Minutes |
| `charging.standards` | R | S | | ✓ | ✓ | CCS2, Type2, etc. |
| `charging.v2l` / `v2v` | O | S | | | | Boolean + watts |
| `charging.regenLevels` | O | S | | | | |

### D. Performance

| Field | R/O | S/C | I | SEO | CMP | Notes |
|-------|-----|-----|---|-----|-----|-------|
| `performance.powerKw` | R | S | I | ✓ | ✓ | |
| `performance.torqueNm` | O | S | | ✓ | ✓ | |
| `performance.acceleration0to100` | O | S | I | ✓ | ✓ | Seconds |
| `performance.driveType` | R | S | I | | ✓ | FWD/RWD/AWD |
| `performance.driveModes` | O | S | | | | Array |

### E. Practicality

| Field | R/O | S/C | I | SEO | CMP | Notes |
|-------|-----|-----|---|-----|-----|-------|
| `practicality.bootSpaceL` | O | S | | ✓ | ✓ | |
| `practicality.familyScore` | O | S/C | I | | ✓ | 0–100 |
| `practicality.highwayComfortScore` | O | S/C | I | | ✓ | |
| `practicality.cityUsabilityScore` | O | S/C | I | | ✓ | |
| `practicality.groundClearanceMm` | O | S | | ✓ | ✓ | |
| `practicality.turningRadiusM` | O | S | | | | |

### F. Ownership confidence

| Field | R/O | S/C | I | SEO | CMP | Notes |
|-------|-----|-----|---|-----|-----|-------|
| `ownership.warrantyVehicleYears` | R | S | | ✓ | ✓ | |
| `ownership.warrantyBatteryYears` | R | S | | ✓ | ✓ | |
| `ownership.warrantyBatteryKm` | O | S | | ✓ | ✓ | |
| `ownership.serviceCostPerKm` | O | S/C | | ✓ | ✓ | |
| `ownership.chargingNetworkScore` | O | S/C | I | ✓ | ✓ | Brand ecosystem |
| `ownership.resaleConfidenceScore` | O | S/C | I | | ✓ | |
| `ownership.softwareUpdatePolicy` | O | S | | ✓ | | OTA frequency |

### G. Psychology / lifestyle

| Field | R/O | S/C | I | SEO | CMP | Notes |
|-------|-----|-----|---|-----|-----|-------|
| `psychology.tags` | O | S | I | ✓ | ✓ | best-for-family, first-ev, etc. |
| `psychology.scores` | O | S/C | I | | ✓ | Normalized 0–100 per dimension |
| `psychology.narrative` | O | S | | ✓ | | Short human copy |

**Recommended tags (enum):** `best_for_family`, `best_for_city`, `best_first_ev`, `premium_feel`, `wow_factor`, `silent_comfort`, `tech_appeal`

### H. Dealer & availability (master defaults; listing overrides)

| Field | R/O | S/C | I | SEO | CMP | Notes |
|-------|-----|-----|---|-----|-----|-------|
| `availability.availableCities` | O | S | I | ✓ | | Master-level coverage |
| `availability.dealerCountNational` | O | S/C | | | | |
| `availability.waitingPeriodWeeks` | O | S | | ✓ | ✓ | Default; listing may override |
| `availability.testDriveAvailable` | O | S | | ✓ | | |

*Dealer-specific:* see `dealer_listings` collection.

### I. Compare intelligence

| Field | R/O | S/C | I | SEO | CMP | Notes |
|-------|-----|-----|---|-----|-----|-------|
| `compare.segmentRivalIds` | O | C | I | | ✓ | Variant ObjectIds |
| `compare.strongestAdvantages` | O | S/C | | ✓ | ✓ | Structured bullets |
| `compare.weakestAreas` | O | S/C | | ✓ | ✓ | Honest gaps |
| `compare.valueScore` | O | C | I | | ✓ | price/range/feature composite |
| `compare.featureMatrix` | O | S | | | ✓ | Key booleans for table |

### J. SEO intelligence

| Field | R/O | S/C | I | SEO | CMP | Notes |
|-------|-----|-----|---|-----|-----|-------|
| `seo.metaTitle` | R | S | | ✓ | | |
| `seo.metaDescription` | R | S | | ✓ | | |
| `seo.pros` | R | S | | ✓ | ✓ | Array, 3–7 items |
| `seo.cons` | R | S | | ✓ | ✓ | Array, 2–5 items |
| `seo.expertSummary` | R | S | | ✓ | | 150–300 words |
| `seo.faq` | O | S | | ✓ | | `{q, a}[]` |
| `seo.chargingFaq` | O | S | | ✓ | ✓ | India-specific |
| `seo.canonicalPath` | R | S/C | I | ✓ | | `/car/{slug}` |

### K. Media

| Field | R/O | S/C | I | SEO | CMP | Notes |
|-------|-----|-----|---|-----|-----|-------|
| `media.heroImage` | R | S | | ✓ | ✓ | URL |
| `media.gallery` | O | S | | ✓ | | Ordered URLs |
| `media.interior` | O | S | | ✓ | | |
| `media.charging` | O | S | | ✓ | ✓ | |
| `media.videos` | O | S | | ✓ | | `{title, url, provider}` |

### System / governance

| Field | R/O | S/C | I | Notes |
|-------|-----|-----|---|-------|
| `status` | R | S | I | draft \| review \| published \| archived |
| `dataQualityScore` | O | C | I | Completeness % |
| `source` | O | S | | oem \| evsavari \| import |
| `legacyCarId` | O | S | I | Bridge to existing `cars._id` |
| `publishedAt` | O | S | I | |
| `version` | R | S | | Monotonic for cache bust |

---

## 4. Recommended indexes

### `ev_variants`

```javascript
{ slug: 1 }                           // unique
{ brandId: 1, modelId: 1 }
{ status: 1, "pricing.exShowroom": 1 }
{ segment: 1, launchStatus: 1 }
{ "range.claimedKm": -1 }
{ "compare.valueScore": -1 }
{ "psychology.tags": 1 }
{ legacyCarId: 1 }                    // sparse
{ "seo.canonicalPath": 1 }
```

### `dealer_listings`

```javascript
{ dealerId: 1, variantId: 1 }         // unique compound
{ dealerId: 1, status: 1 }
{ "availability.cities": 1 }
{ variantId: 1, status: 1 }
```

### `ev_models`

```javascript
{ brandId: 1, slug: 1 }               // unique compound
{ segment: 1, launchStatus: 1 }
```

---

## 5. Normalization rules

1. **Money:** integers in **paise** internally OR integers in **INR** with consistent convention (recommend **INR whole rupees** for readability; document in API).
2. **Range:** always **km** as number; display strings generated in UI.
3. **Power:** store **kW**; convert hp in import layer only.
4. **Slugs:** `{brand}-{model}-{variant}` lowercase, hyphenated; never change after publish (use redirects table if needed).
5. **Rivals:** store **ObjectId references**, not rival names (names drift).
6. **Scores:** 0–100 integers; weights in config collection for tuning without schema migration.
7. **Legacy `Car`:** map `name` → model+variant split via import script; keep `startingPrice` ↔ `pricing.exShowroom`.

---

## 6. Scalable import strategy

### Phase 1 — Reference data
- CSV/JSON templates per brand → `ev_brands`, `ev_models`.
- Validate slugs and segment enums in CI.

### Phase 2 — Variant facts
- Row-per-variant spreadsheet columns mapped to schema paths.
- **Upsert** by `slug`; never delete published without `archived` status.
- Idempotent `importRunId` on each batch for rollback audit.

### Phase 3 — Enrichment pass
- Compute `compare.valueScore`, `segmentRivalIds` from segment rules.
- Generate `seo.metaDescription` from template if blank.

### Phase 4 — Legacy bridge
- Script: for each `cars` doc, create/update `ev_variants` with `legacyCarId`.
- Dual-read API: prefer master, fallback to `Car` until cutover flag.

### Phase 5 — Dealer listings
- Dealers link to `variantId`; copy no specs into listing (only commercial fields).

**Tools:** `scripts/import/brand-{slug}.json`, Zod/Joi validation mirror of Mongoose schema, dry-run mode.

---

## 7. Admin data-entry strategy

| Role | Capability |
|------|------------|
| **Catalog editor** | Draft variants; cannot publish |
| **Catalog lead** | Publish; approve psychology/SEO copy |
| **Dealer admin** | CRUD own `dealer_listings` only |

**UI sections (admin, not consumer UI redesign):**
1. Identity wizard (brand → model → variant)
2. Spec grids (battery, performance, practicality)
3. Psychology sliders (0–100) + tag picker
4. SEO panel with pros/cons/FAQ preview
5. Compare rivals picker (search variants in segment)
6. Media uploader (Cloudinary paths)
7. Quality meter (% required fields)

**Validation gates before publish:** ex-showroom, claimed range, hero image, meta title/description, pros/cons, warranties.

---

## 8. Future AI enrichment (safe boundaries)

| Use case | Input | Output | Human review |
|----------|-------|--------|--------------|
| SEO FAQ draft | Spec JSON + city context | `seo.faq[]` | Required |
| Expert summary | Specs + pros/cons | `seo.expertSummary` | Required |
| Psychology scores | Specs + segment benchmarks | `psychology.scores` | Optional approve |
| Real-world range band | Pack kWh + segment | `range.realWorldKm` | Required |
| Compare narrative | Two variant IDs | UI-only snippet | No auto-write to DB |
| Rival suggestions | Segment + price band | `compare.segmentRivalIds` candidates | Pick in admin |

**Never auto-publish** without `status: review → published` transition.

---

## 9. Migration from existing `Car` model (non-destructive)

| Existing `Car` field | Master mapping |
|---------------------|----------------|
| `name` | Split → `ev_models.name` + `ev_variants.variantName` (manual rules per brand) |
| `brand` | `ev_brands` lookup |
| `slug` | `ev_variants.slug` (may need suffix if collision) |
| `category` | `bodyType` / `segment` |
| `startingPrice` | `pricing.exShowroom` |
| `specifications.*` | `battery.*`, `range.*`, `charging.*` |
| `dimensions.bootSpace` | `practicality.bootSpaceL` |
| `heroImage`, `galleryImages` | `media.*` |
| `seo.*` | `seo.*` |
| `dealer`, `dealerListingStatus` | `dealer_listings` |
| `variants[]` | Child `ev_variants` OR embedded refs |

Existing API routes continue serving `Car` until feature flag `USE_EV_MASTER=true`.

---

## 10. Related artifacts

- Example JSON: `examples/tata-nexon-ev-long-range.example.json`
- Proposed Mongoose schemas: `../../models/architecture/` (reference only)
- Tier-1 catalog plan: `tier-1-ev-catalog-plan.md`
