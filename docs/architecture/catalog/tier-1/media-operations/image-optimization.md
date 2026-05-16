# Image optimization recommendations

Target: fast LCP, sharp cards, SEO/social readiness, no CLS.

## Hero (`hero.jpg`)

| Setting | Value |
|---------|--------|
| Dimensions | 1920×1080 (16:9) or 1920×1280 (3:2) |
| Crop | Full vehicle, minimal ground crop |
| Weight | ≤ 500 KB JPEG |
| Detail page | `object-fit: contain` in hero container |
| Delivery | `srcset` 480 / 800 / 1200 via Cloudinary when migrated |

## Listing thumbnail (`listing-thumb.jpg`)

| Setting | Value |
|---------|--------|
| Dimensions | 1280×800 (16:10) |
| Safe zone | 8% margin; badges overlay bottom 22% |
| Weight | ≤ 280 KB |
| Priority | `#1` for `/cars` LCP |

## Compare thumbnail (`compare-thumb.jpg`)

| Setting | Value |
|---------|--------|
| Dimensions | 800×800 subject in 1280×800 canvas |
| Weight | ≤ 200 KB |
| Note | Center vehicle; compare grid is dense |

## OG / social (`og.jpg`)

| Setting | Value |
|---------|--------|
| Dimensions | **1200×630** exact |
| Weight | ≤ 350 KB |
| Text safe | 10% margin (platform crop) |
| Test | Facebook Sharing Debugger, Twitter card validator |

## Gallery (`exterior-*`, `interior-1`, `charging-port`)

| Setting | Value |
|---------|--------|
| Dimensions | 1600×900 |
| Weight | ≤ 400 KB each |
| Lazy load | yes on detail thumbs |
| Charging | CCS2 port legible at 400px width |

## Formats

- **Now:** JPEG progressive, sRGB
- **Next:** WebP + JPEG fallback, or CDN auto format (`f_auto,q_auto`)

## Batch example (ImageMagick)

```bash
magick hero-src.png -resize 1920x1080^ -gravity center -extent 1920x1080 -strip -quality 82 hero.jpg
magick hero.jpg -resize 1280x800^ -gravity center -extent 1280x800 -quality 82 listing-thumb.jpg
magick hero.jpg -resize 1200x630^ -gravity center -extent 1200x630 -quality 84 og.jpg
```
