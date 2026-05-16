# API compatibility notes

## Unchanged (frontend contract preserved)

| Endpoint | Behavior when `USE_EV_MASTER=false` | Behavior when `USE_EV_MASTER=true` |
|----------|--------------------------------------|-------------------------------------|
| `GET /cars` | Same as before | Merged list; **same JSON shape** per car |
| `GET /cars/slug/:slug` | Legacy car | Master first, else legacy |
| `GET /cars/:id` | Legacy by ObjectId | Master first, else legacy |

### Vehicle object (marketplace shape)

Legacy fields retained:

- `_id`, `name`, `brand`, `slug`, `category`, `startingPrice`, `heroImage`, `image`
- `specifications` (`batteryPack`, `range`, `chargingTime`, `topSpeed`)
- `galleryImages`, `variants`, `colors`, `overview`, `features`, `seo`, `isFeatured`

**Additive fields** (safe for old clients to ignore):

| Field | Type | Description |
|-------|------|-------------|
| `catalogSource` | `"master"` \| `"legacy"` | Data lineage |
| `catalogMeta` | object | Quality, governance, compare, psychology |

### Response wrappers

`GET /cars` may include:

```json
{
  "cars": [],
  "total": 0,
  "page": 1,
  "totalPages": 1,
  "catalogMode": "dual-read",
  "catalogStats": { "masterCount": 12, "legacyCount": 3 }
}
```

`catalogMode` / `catalogStats` are **additive** — existing parsers using `cars` only remain valid.

### Headers

| Header | When |
|--------|------|
| `X-Catalog-Mode` | `USE_EV_MASTER=true` on `GET /cars` |
| `X-Catalog-Source: master` | Detail resolved from master |

## New read-only routes (`/api/catalog`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/catalog/status` | Public | Feature flags |
| GET | `/api/catalog/brands` | Public | Brand index |
| GET | `/api/catalog/models?brand=tata` | Public | Models by brand |
| GET | `/api/catalog/variants` | Public | Master DTOs (published) |
| GET | `/api/catalog/variants?preview=true` | Admin JWT | Draft/review/published |
| GET | `/api/catalog/variants/slug/:slug` | Public / preview | SEO slug lookup |
| GET | `/api/catalog/compare?slugs=a,b,c` | Public | Compare-ready bundle |
| GET | `/api/catalog/markplace` | Public | Same merge as `GET /cars` |

## Compare flow

- **Client compare (current):** localStorage + `/compare` page — works if listing returns mapped master cars (same shape).
- **Server compare (new):** `GET /api/catalog/compare?slugs=` returns `cars` + `compareMeta.valueScores`.

## SEO URLs

- Canonical paths remain `/car/{slug}` (unchanged).
- Master `seo.canonicalPath` stored as `/car/{slug}` in catalog JSON.

## Breaking changes

**None** when flag is off.

When flag is on, a legacy car whose slug matches a **published** master variant is **hidden** in listing (master wins). Document slugs before enablement.
