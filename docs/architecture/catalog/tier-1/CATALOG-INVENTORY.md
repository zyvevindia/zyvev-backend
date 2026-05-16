# Tier-1 catalog inventory (17 variants)

Generated for population sprint — **not imported** to production.

| # | Slug | Brand | Model | Variant | Quality | Confidence |
|---|------|-------|-------|---------|---------|------------|
| 1 | `tata-nexon-ev-creative-plus` | Tata | Nexon EV | Creative+ | 88 | medium |
| 2 | `tata-nexon-ev-empowered-lr` | Tata | Nexon EV | Empowered LR | 91 | high |
| 3 | `tata-punch-ev-smart-plus` | Tata | Punch EV | Smart+ | 87 | medium |
| 4 | `tata-punch-ev-empowered-lr` | Tata | Punch EV | Empowered LR | 90 | medium |
| 5 | `tata-curvv-ev-empowered` | Tata | Curvv EV | Empowered | 86 | medium |
| 6 | `tata-curvv-ev-empowered-lr` | Tata | Curvv EV | Empowered LR | 85 | medium |
| 7 | `tata-tiago-ev-xt` | Tata | Tiago EV | XT | 86 | medium |
| 8 | `tata-tiago-ev-xz-plus` | Tata | Tiago EV | XZ+ | 88 | medium |
| 9 | `mg-zs-ev-excite` | MG | ZS EV | Excite | 88 | medium |
| 10 | `mg-zs-ev-exclusive-plus` | MG | ZS EV | Exclusive Plus | 90 | medium |
| 11 | `mg-comet-ev-play` | MG | Comet EV | Play | 87 | medium |
| 12 | `mg-comet-ev-plush-plus` | MG | Comet EV | Plush+ | 88 | medium |
| 13 | `mahindra-xuv400-ec-pro` | Mahindra | XUV400 | EC Pro | 89 | medium |
| 14 | `mahindra-xuv400-el-pro` | Mahindra | XUV400 | EL Pro | 91 | medium |
| 15 | `hyundai-kona-electric-premium` | Hyundai | Kona Electric | Premium | 90 | medium |
| 16 | `byd-atto-3-dynamic` | BYD | Atto 3 | Dynamic | 90 | medium |
| 17 | `byd-atto-3-superior` | BYD | Atto 3 | Superior | 91 | medium |

## Compare triangles (seed)

1. `tata-nexon-ev-empowered-lr` ↔ `mahindra-xuv400-el-pro` ↔ `mg-zs-ev-exclusive-plus`
2. `tata-punch-ev-empowered-lr` ↔ `mg-comet-ev-plush-plus` ↔ `tata-tiago-ev-xz-plus`
3. `byd-atto-3-superior` ↔ `hyundai-kona-electric-premium` ↔ `mg-zs-ev-exclusive-plus`

## Fields commonly flagged (manual verification)

| Path | Status | Action |
|------|--------|--------|
| `pricing.exShowroom` | estimated | Reconcile with OEM price list monthly |
| `range.realWorldKm` | estimated | Refresh after editorial / telematics |
| `tata-curvv-ev-*` launch/range | needs_review | Confirm homologation + on-sale cities |
| `byd-atto-3-superior` `range.claimedKm` | needs_review | Confirm top-trim ARAI |
| `tata-punch-ev-smart-plus` `battery.capacityKwh` | needs_review | Confirm MY pack size |

## Media

All records use **placeholder CDN paths**: `https://cdn.evsavari.com/catalog/{slug}/…` — replace with Cloudinary assets before publish.

## Regenerate

```bash
node docs/architecture/catalog/tier-1/build-catalog.mjs
node docs/architecture/catalog/tier-1/validate-catalog.mjs
```
