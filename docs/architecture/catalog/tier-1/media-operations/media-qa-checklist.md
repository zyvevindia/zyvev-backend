# Media QA checklist

Human review after CDN upload, before `governance.status: published`.

## Trust

- [ ] Would an Indian buyer recognize this exact EV trim?
- [ ] No misleading range/performance graphics baked into image
- [ ] Charging port shot matches CCS2 India story

## Consistency

- [ ] Lighting similar across exterior gallery
- [ ] Listing thumb matches hero vehicle angle family
- [ ] Compare thumb readable at mobile width (~360px)

## Technical

- [ ] No pixelation or JPEG banding on white paint
- [ ] File sizes within [image-optimization.md](./image-optimization.md) budgets
- [ ] OG preview correct in social debugger

## Frontend

- [ ] `/cars` card — no CLS on load
- [ ] `/compare` — thumbnails load, fallback not shown
- [ ] `/car/:slug` — hero + gallery; color swap if applicable
- [ ] Broken URL test — shows brand fallback, not random stock

## Sign-off

| Role | Name | Date |
|------|------|------|
| Media ops | | |
| Content | | |
| Engineering | | |
