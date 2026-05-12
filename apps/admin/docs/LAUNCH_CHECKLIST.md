# Production Launch Checklist · Gazgan Marmo Admin

Run through this list end-to-end before announcing the platform to clients.

---

## A. Firebase project setup

- [ ] Firebase project `gazgan-marmo` created in production mode
- [ ] **Authentication** → Email/Password provider enabled
- [ ] **Authentication → Settings → Authorized domains**: production domains added (`admin.gazganmarmo.uz`, `gazganmarmo.uz`)
- [ ] **Firestore** initialized in `eur3` (or your preferred region)
- [ ] **Storage** initialized in same region
- [ ] **Service account** key generated → base64-encoded → stored in `FIREBASE_ADMIN_CREDENTIALS_B64`
- [ ] Service account granted:
  - [ ] **Cloud Datastore User**
  - [ ] **Cloud Datastore Import Export Admin** (for daily backups)
  - [ ] **Storage Admin** on the backups bucket
- [ ] GCS bucket `gazgan-marmo-backups` created (same region, multi-region OK)
- [ ] Bucket lifecycle policy set: delete objects > 90 days

```bash
gcloud iam service-accounts add-iam-policy-binding \
  firebase-adminsdk-xxx@gazgan-marmo.iam.gserviceaccount.com \
  --member="serviceAccount:firebase-adminsdk-xxx@gazgan-marmo.iam.gserviceaccount.com" \
  --role="roles/datastore.importExportAdmin"
```

## B. Security rules + indexes deploy

- [ ] `firebase use gazgan-marmo`
- [ ] `firebase deploy --only firestore:rules,firestore:indexes,storage`
- [ ] In Firebase console verify rules are live
- [ ] Verify all 14 composite indexes are built (state = "Enabled")

## C. First super-admin bootstrap

- [ ] Run:
  ```bash
  FIREBASE_ADMIN_CREDENTIALS_B64=$(cat sa.b64) \
    npm run create-admin -- admin@gazganmarmo.uz "STRONG_PASSWORD" "Full Name"
  ```
- [ ] Sign in successfully at `/login` locally with that account
- [ ] Open `/settings` → fill in: WhatsApp, phone, email, Telegram, address, SEO, GA4, Meta Pixel, Search Console tokens, social links, legal info, lead routing emails

## D. Environment variables (Vercel)

Set every variable from `.env.example` in **Vercel → Project Settings → Environment Variables**:

- [ ] All `NEXT_PUBLIC_FIREBASE_*`
- [ ] `FIREBASE_ADMIN_CREDENTIALS_B64`
- [ ] `SESSION_COOKIE_NAME` = `__gm_session`
- [ ] `SESSION_MAX_AGE` = `432000`
- [ ] `CRON_SECRET` = generate a long random string (`openssl rand -hex 32`)
- [ ] `BACKUP_BUCKET` = `gazgan-marmo-backups`
- [ ] `ALERT_WEBHOOK_URL` (Slack / Discord, optional)
- [ ] `ALERT_EMAIL_TO`
- [ ] `RATE_LIMIT_LOGIN` = `5`

## E. Deploy

- [ ] Push to GitHub main branch
- [ ] Vercel auto-deploys
- [ ] `npm run verify` locally passes
- [ ] Attach custom domain `admin.gazganmarmo.uz` in Vercel
- [ ] DNS: CNAME `admin` → `cname.vercel-dns.com`
- [ ] HTTPS certificate auto-provisioned
- [ ] Visit `/api/admin/monitoring/verify` (signed in as super_admin) → all checks pass

## F. Smoke test

- [ ] `/login` renders, brute-force lockout returns 423 after 8 failed attempts
- [ ] Dashboard loads with stats
- [ ] Add a test product → image upload to Firebase Storage works
- [ ] Submit a test inquiry from the public website → arrives in `/leads` within seconds
- [ ] Notification bell shows new lead (real-time)
- [ ] Set lead to "won" → activity log records the change
- [ ] Upload a test catalog PDF → `/api/catalog` returns OK → version visible
- [ ] Export catalog from public site → `/api/tracking` increments download counter
- [ ] Generate an investor report `/api/admin/reports?type=investor` → printable HTML
- [ ] Export leads CSV `/api/admin/export?resource=leads&format=csv` → downloads
- [ ] Trigger backup manually `/api/admin/backup?token=$CRON_SECRET` → operation created
- [ ] Backup history visible at `/api/admin/backup/verify`

## G. Operational hardening

- [ ] Vercel cron jobs visible in dashboard (daily 03:00 backup, 15-min health check)
- [ ] At least one secondary `manager` account created for redundancy
- [ ] Slack/Discord webhook receiving test alert
- [ ] Add `admin.gazganmarmo.uz` to monitoring tool (UptimeRobot / Better Stack)
- [ ] Document service-account location in 1Password / Bitwarden vault
- [ ] Schedule quarterly restore-drill: download latest export → test-import to staging project

## H. Admin onboarding

For each new team member:

1. Super-admin creates account at `/users` with appropriate role
2. Send onboarding email with login URL + temporary password
3. New user signs in → forced to change password on first use *(planned)*
4. Walkthrough screen-share: dashboard, leads workflow, their permitted modules
5. Record their UID and role assignment in `/activity` for audit trail

## I. Post-launch monitoring (first 30 days)

- [ ] Daily: review `/leads` queue + new entries in `/activity`
- [ ] Weekly: review `/analytics` → check conversion, drop-off
- [ ] Weekly: confirm `/api/admin/backup/verify` shows backups < 48h old
- [ ] Monthly: download an investor report and a leads CSV — keep offline copies
- [ ] Monthly: rotate `CRON_SECRET` and any compromised keys
- [ ] Quarterly: full restore drill to staging project
- [ ] Quarterly: review role assignments — revoke unused accounts

---

✅  **System is launch-ready when every box above is checked.**
