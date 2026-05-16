# Proposed master catalog models (reference only)

These Mongoose schemas are **not registered** in `server.js` and do **not** replace `models/Car.js`.

| File | Collection role |
|------|-----------------|
| `EvBrand.schema.js` | Brand master |
| `EvModel.schema.js` | Model grouping |
| `EvMasterVariant.schema.js` | Canonical variant (sections A–K) |
| `DealerListing.schema.js` | Dealer inventory overlay |

Documentation: `docs/architecture/ev-master-data-architecture.md`
