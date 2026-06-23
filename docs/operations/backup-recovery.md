# MongoDB backup & recovery (EVSavari)

## Atlas managed backups (primary)

For production, **MongoDB Atlas** should remain the source of truth for backups:

1. Enable **Cloud Backup** on the production cluster (continuous).
2. Set retention per compliance needs (e.g. 7–30 days minimum for soft launch).
3. Test a **restore to a staging cluster** monthly.
4. Document cluster name, project ID, and on-call access in your ops runbook.

Atlas handles point-in-time recovery without custom cron on the app server.

## Application export script (secondary)

For drills or pre-migration snapshots:

```bash
cd zyvev-backend
node scripts/export-mongo-backup.js --out=./backups/manual-2026-05-20
```

Exports (when collections exist):

| Collection | Purpose |
|------------|---------|
| `leads` | CRM / lead pipeline |
| `cars` | Legacy catalog documents |
| `opsaudits` | Contact, newsletter, feedback audit |
| `buyerbehaviorevents` | Behavioral compare/view events (capped) |
| `content-manifest.json` | SEO discovery manifest (from frontend static) |

Output: `manifest.json` + per-collection JSON files.

## Restore drill (staging)

1. Create empty staging database in Atlas.
2. Update `MONGO_URI` in staging `.env`.
3. Use `mongoimport` or a one-off Node script to insert JSON from backup files.
4. Verify lead counts and sample vehicle slugs.

**Do not** import production backups into local machines with real PII unless encrypted and policy-approved.

## Critical collections checklist

- [ ] `leads` — buyer enquiries
- [ ] `cars` — marketplace listings (if still used)
- [ ] SEO static content — `zyvev-frontend/public/seo-data/` (git + build artifacts)
- [ ] Cloudinary media — separate Cloudinary backup policy

## Related scripts

- `npm run ops:leads` — lead quality report
- `npm run ops:dashboard` — operational dashboard CLI
- `GET /api/admin/ops-snapshot` — live in-process counters (admin JWT)
