# Deployment & operations checklist

## Pre-deploy

- [ ] `MONGO_URI`, `JWT_SECRET`, Turnstile keys set (production)
- [ ] `CORS_ORIGINS` includes production frontend URL(s)
- [ ] `VITE_API_URL` points to production API
- [ ] `VITE_GA_ID` configured (GA4)
- [ ] `VITE_SENTRY_DSN` + `SENTRY_DSN` configured (recommended)
- [ ] Run `npm run build` (frontend) — includes sitemap generation
- [ ] Run `npm run ops:soft-launch-smoke` (backend API up)
- [ ] Run `npm run seo:foundation` (frontend)

## Startup validation

Backend `config/env.js` fails fast if required env vars are missing.

Frontend analytics/Sentry load only when env vars are present (no crash if omitted in dev).

## Logging

- Backend: structured JSON via Pino (`LOG_LEVEL=info` in production)
- Events: `lead_submitted`, `rate_limit_hit`, `turnstile_rejected`, `slow_request`, `api_exception`

## Observability endpoints (admin only)

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/admin/ops-snapshot` | JWT + admin | In-process counters |
| `GET /api/admin/ops-snapshot?db=true` | JWT + admin | + Mongo summary |
| `GET /api/admin/ops-summary` | JWT + admin | CRM ops summary |

Frontend: `/admin/ops-snapshot` (admin login required)

## Post-deploy smoke

1. Homepage loads, GA Realtime shows active user (if configured)
2. Submit test lead (staging phone) — no Turnstile on lead forms
3. Submit feedback with Turnstile — succeeds
4. Compare 2 EVs — no console errors
5. Trigger test Sentry error in staging only

## Rollback

- Redeploy previous Render/Vercel build
- Atlas PITR if data migration caused issues
- Re-run export script before risky migrations
