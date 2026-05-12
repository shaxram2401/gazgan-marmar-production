# Vercel deployment guide

This monorepo deploys to Vercel as **two independent projects** from the same repository.

## Project 1 — Public website

| Setting | Value |
|---|---|
| **Project name** | `gazgan-marmar-site` |
| **Framework preset** | Other |
| **Root directory** | `apps/site` |
| **Build command** | *(leave empty)* |
| **Output directory** | *(leave empty)* |
| **Install command** | *(leave empty)* |
| **Production branch** | `main` |
| **Custom domain** | `gazganmarmo.uz`, `www.gazganmarmo.uz` |

DNS records:

```
A      @     76.76.21.21
CNAME  www   cname.vercel-dns.com
```

No environment variables required for the public site.

## Project 2 — Admin console

| Setting | Value |
|---|---|
| **Project name** | `gazgan-marmar-admin` |
| **Framework preset** | Next.js |
| **Root directory** | `apps/admin` |
| **Build command** | `next build` |
| **Output directory** | `.next` |
| **Install command** | `npm install` |
| **Production branch** | `main` |
| **Custom domain** | `admin.gazganmarmo.uz` |

DNS:

```
CNAME  admin   cname.vercel-dns.com
```

Required environment variables (Vercel → Settings → Environment Variables):

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | from Firebase Console → Project Settings → Web App config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | same |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | same |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | same |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | optional (GA4) |
| `FIREBASE_ADMIN_CREDENTIALS_B64` | base64 of service-account JSON |
| `SESSION_COOKIE_NAME` | `__gm_session` |
| `SESSION_MAX_AGE` | `432000` (5 days) |
| `CRON_SECRET` | `openssl rand -hex 32` |
| `BACKUP_BUCKET` | `gazgan-marmo-backups` |
| `ALERT_WEBHOOK_URL` | Slack / Discord webhook (optional) |
| `ALERT_EMAIL_TO` | ops email |
| `RATE_LIMIT_LOGIN` | `5` |

## Cron jobs

`apps/admin/vercel.json` schedules two cron jobs:

```jsonc
{
  "crons": [
    { "path": "/api/admin/backup?token=PROTECTED",         "schedule": "0 3 * * *"  },
    { "path": "/api/admin/monitoring/health",              "schedule": "*/15 * * * *" }
  ]
}
```

Replace `PROTECTED` with your `CRON_SECRET`, or move the secret to the `Authorization` header by configuring a Vercel project secret. Both header and query forms are accepted by `lib/cron.server.ts`.

## Quick deploy (CLI)

```bash
# From repo root
vercel link --cwd apps/site
vercel --cwd apps/site --prod

vercel link --cwd apps/admin
vercel --cwd apps/admin --prod
```

## Post-deploy checks

```bash
# 1. Public site
curl -I https://gazganmarmo.uz                          # → 200
curl https://gazganmarmo.uz/robots.txt                  # → robots
curl https://gazganmarmo.uz/sitemap.xml                 # → sitemap

# 2. Admin
curl -I https://admin.gazganmarmo.uz                    # → 307 (redirect to /login)
curl https://admin.gazganmarmo.uz/login                 # → login page

# 3. Admin verification (signed in as super_admin)
# Visit https://admin.gazganmarmo.uz/api/admin/monitoring/verify
```

Run through [`apps/admin/docs/LAUNCH_CHECKLIST.md`](../apps/admin/docs/LAUNCH_CHECKLIST.md) before announcing.
