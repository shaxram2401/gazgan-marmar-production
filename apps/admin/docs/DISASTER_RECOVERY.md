# Disaster Recovery Runbook · Gazgan Marmo Admin

## RTO / RPO targets

| Metric | Target |
|--------|--------|
| **RPO** (Recovery Point Objective) | 24 h — daily Firestore export |
| **RTO** (Recovery Time Objective) | 2 h — restore + verify |

## Backup architecture

1. **Vercel cron** triggers `/api/admin/backup` daily at 03:00 UTC
2. Endpoint calls `firestore.googleapis.com/v1/.../exportDocuments`
3. Firestore writes a full collection-level export to `gs://gazgan-marmo-backups/firestore-backups/<timestamp>`
4. Each backup is recorded in the `backups` Firestore collection
5. Bucket lifecycle policy auto-deletes objects older than 90 days

## What is backed up

- `products`, `entrepreneurs`, `gallery`, `testimonials`, `exportCountries`
- `inquiries` (leads), `catalogVersions`, `settings`
- `adminUsers`, `auditLogs`, `notifications`

What is **not** backed up automatically:

- **Firebase Storage** (images, PDFs) — set up GCS bucket versioning manually
- **Firebase Auth** — accounts and custom claims persist in Firebase regardless
- `rateLimits`, `loginAttempts`, `eventLogs` — transient telemetry; intentionally excluded

## Recovery procedures

### 1. Single-document corruption

Use the Admin Panel UI to edit / revert in `/leads/[id]`, `/products`, etc. The activity log preserves the previous state in `changes`.

### 2. Collection-level data loss

Restore from the most recent export:

```bash
# 1. Identify latest export
gsutil ls gs://gazgan-marmo-backups/firestore-backups/

# 2. Restore one or more collections
FIREBASE_ADMIN_CREDENTIALS_B64=$(cat sa.b64) \
  npx tsx scripts/restore.ts \
  gs://gazgan-marmo-backups/firestore-backups/2026-01-15T03-00-00-000Z
```

The restore is **destructive for matching document IDs** but does not delete documents that exist only in the live database.

### 3. Full project compromise

If the production project is compromised (credentials leaked, malicious actor):

1. **Immediately:** rotate the service account
   - Firebase Console → Project Settings → Service Accounts → "Generate new private key"
   - Delete old key
   - Update `FIREBASE_ADMIN_CREDENTIALS_B64` in Vercel + redeploy
2. Rotate `CRON_SECRET`, `SESSION_COOKIE_NAME` (forces all logouts)
3. Force-revoke all sessions:
   ```bash
   firebase auth:revoke-refresh-tokens
   ```
4. Suspend suspicious accounts in `/users`
5. Review `/activity` for unauthorized changes
6. Restore from clean export if data was modified

### 4. Bringing up a staging project

For periodic restore drills:

1. Create new Firebase project `gazgan-marmo-staging`
2. Grant the **production** service account `Datastore Import Export Admin` on staging
3. Run `scripts/restore.ts` pointing at production backup
4. Bootstrap a staging super_admin with `npm run create-admin`
5. Validate `/api/admin/monitoring/verify` returns OK

### 5. Vercel platform outage

Admin Panel is unreachable but **data is safe in Firebase**. Options:

- Wait for Vercel restoration (typical RTO < 1 h)
- Redeploy to alternate platform: Netlify, Fly.io, or self-hosted Node
- Direct Firestore access via Firebase Console is always available for emergency reads

## Test schedule

- **Monthly:** `/api/admin/backup/verify` must show backup < 48 h old
- **Quarterly:** Full restore drill into staging project, record completion in `/activity`
- **Annually:** Tabletop exercise — simulate compromise + recovery with team

## Contacts

| Role | Contact |
|------|---------|
| Primary admin | admin@gazganmarmo.uz |
| Infrastructure escalation | (fill at deploy time) |
| Firebase support | https://firebase.google.com/support |
| Vercel support | https://vercel.com/help |
