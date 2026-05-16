# Behavioral Intelligence Governance

EVSavari buyer intent tracking is **anonymous**, **session-scoped**, and **governance-audited**.

## Principles

1. **No PII in behavior events** — names, phones, emails, and addresses belong only in the lead form (separate collection with consent).
2. **No fingerprinting** — session IDs are random UUIDs in `sessionStorage`, not device-derived.
3. **No third-party ad/tracking pixels** for this layer — optional GA remains separate and user-configured.
4. **Allowlisted events only** — see `services/behavioral-intelligence/eventSchema.js`.
5. **Retention** — MongoDB TTL on `BuyerBehaviorEvent` (default 90 days).
6. **Rate limits** — per-session hourly cap to prevent abuse.

## Prohibited

- Cross-site tracking
- Demographic profiling
- Storing behavioral events with lead PII
- Invasive heatmaps / session replay
- Public exposure of intent scores

## Dealer data

`Lead.buyerIntentContext` is stored with `select: false` and **not** returned on dealer APIs. Foundation for future dealer intelligence only.

## Audits

```bash
node scripts/audit-behavioral-intelligence.js
```

## Flags

| Variable | Default |
|----------|---------|
| `BEHAVIORAL_INTELLIGENCE_ENABLED` | `false` |
| `BEHAVIORAL_EVENT_RETENTION_DAYS` | `90` |
| `BEHAVIORAL_SESSION_HOURLY_CAP` | `120` |
| `VITE_BEHAVIORAL_INTELLIGENCE` | unset (`false`) |

## Rollback

Set both flags to `false` — frontend stops emitting events; API returns `204`. Existing Mongo events expire via TTL.
