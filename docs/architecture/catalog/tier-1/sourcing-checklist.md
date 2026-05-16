# Tier-1 sourcing checklist (per variant)

Use before setting `verification.confidence` to `high`.

## Primary sources (prefer in order)

- [ ] OEM India official website — variant spec PDF / configurator
- [ ] OEM press kit or homologation sheet (ARAI range)
- [ ] Authorized price list (ex-showroom) with **date captured**
- [ ] Owner manual or charging appendix (AC kW, CCS2, V2L)

## Secondary sources (cross-check only)

- [ ] Autocar / CarDekho / CarWale — compare numbers, do not sole-source price
- [ ] Dealership quote screenshot (on-road by city) — mark `estimated` until verified
- [ ] Forum / owner reports — real-world range bands only, flag `low_confidence`

## Never sole-source

- Social media posts
- AI-generated spec tables without OEM link
- Pre-2024 launches for current MY pricing without refresh

## Per-section checklist

| Section | Must verify from OEM or price list |
|---------|-----------------------------------|
| Identity | Model year, variant name, launch status |
| Pricing | Ex-showroom; subsidy notes |
| Battery | Gross kWh, chemistry if published |
| Range | ARAI/certified km |
| Charging | AC kW, DC peak kW, port standard |
| Performance | kW, torque, 0–100 if published |
| Practicality | Boot space, ground clearance — OEM |
| Ownership | Warranty years/km — OEM policy doc |
| Psychology | EVSavari editorial — reviewer sign-off |
| Compare | Rivals chosen by segment + price band |
| SEO | Pros/cons factual; FAQ not speculative legal/tax advice |

## Capture metadata

Record in `verification.sources[]`:

```json
{ "type": "oem_web", "url": "...", "accessedAt": "2026-05-15" }
```
