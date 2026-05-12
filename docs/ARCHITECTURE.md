# Architecture

Gazgan Marmar runs as a small, durable, cloud-native stack. No servers to maintain, no databases to run, fully reproducible.

```
                          ┌──────────────────────────┐
                          │     gazganmarmo.uz       │
                          │   (public website)       │
                          │   apps/site · Vercel     │
                          └────────────┬─────────────┘
                                       │  HTTPS
                                       │  ▲ form submit (POST /api/tracking)
                                       ▼
              ┌────────────────────────────────────────────────────┐
              │              admin.gazganmarmo.uz                  │
              │           (Next.js admin · Vercel)                 │
              │   ┌────────────┐  ┌────────────┐  ┌─────────────┐  │
              │   │  /login    │  │ middleware │  │ /api/*      │  │
              │   │  /dashboard│  │ session    │  │ Zod + roles │  │
              │   │  /leads    │  │ cookie     │  │ audit log   │  │
              │   │  ...       │  │ guard      │  │             │  │
              │   └────────────┘  └────────────┘  └──────┬──────┘  │
              └────────────────────────────────────────┬──┼─────────┘
                                                       │  │
                                       Firebase Admin SDK│  │ Firebase Web SDK
                                                       │  │ (real-time)
                                                       ▼  ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │                              Firebase                                 │
   │  ┌──────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
   │  │   Firestore       │  │   Auth          │  │   Storage           │  │
   │  │   products        │  │   admin users   │  │   product images    │  │
   │  │   entrepreneurs   │  │   custom claims │  │   gallery photos    │  │
   │  │   gallery         │  │                 │  │   catalog PDFs      │  │
   │  │   testimonials    │  └─────────────────┘  └─────────────────────┘  │
   │  │   countries       │                                                 │
   │  │   inquiries       │  Security rules + indexes versioned in repo:    │
   │  │   catalogVersions │  apps/admin/firebase/{rules,indexes}.json       │
   │  │   settings        │                                                 │
   │  │   adminUsers      │                                                 │
   │  │   auditLogs       │                                                 │
   │  │   notifications   │                                                 │
   │  │   alerts          │                                                 │
   │  │   backups         │                                                 │
   │  │   eventLogs       │                                                 │
   │  │   rateLimits      │                                                 │
   │  │   loginAttempts   │                                                 │
   │  └────────┬──────────┘                                                 │
   │           │  daily 03:00 UTC                                           │
   │           ▼                                                            │
   │  ┌────────────────────────────┐                                        │
   │  │  GCS  gazgan-marmo-backups │  ←  triggered by Vercel cron           │
   │  │  Firestore exports         │     /api/admin/backup                  │
   │  │  90-day retention          │                                        │
   │  └────────────────────────────┘                                        │
   └──────────────────────────────────────────────────────────────────────┘
                                  │
                                  │  Slack / Discord webhook
                                  ▼
                            ┌──────────────┐
                            │   Ops team   │
                            └──────────────┘
```

## Data flow — inbound lead

1. Visitor on `gazganmarmo.uz` submits the export inquiry form
2. Client builds a structured WhatsApp message, opens `wa.me/<number>?text=...`
3. Same payload posted to `/api/tracking` for logging (event `inquiry_submit`)
4. Admin SDK writes to `inquiries` with status `new`, `assignedToEmail` from settings
5. `notify()` writes a Notification doc → admin bell updates via Firestore `onSnapshot`
6. Sales sees lead in `/leads` real-time, opens detail, sets status, adds notes
7. Every write captured in `auditLogs` with actor + IP + UA + diff

## Permission model

Three roles defined in `apps/admin/src/types/index.ts`:

```ts
super_admin    read: *   write: *
manager        read: *   write: products, entrepreneurs, gallery, testimonials,
                              countries, catalog, leads, notifications
sales_manager  read: leads, products, entrepreneurs, countries, analytics
               write: leads
```

Enforced in **three places** that must all agree:

1. `canWrite(role, resource)` in `lib/auth.server.ts` (API guards)
2. `firebase/firestore.rules` (`isManager()`, `isSales()`)
3. Sidebar visibility via `canRead` (UX gate, not security)

## Reliability characteristics

| Concern | Mitigation |
|---|---|
| Vercel outage | Read-only Firebase still accessible via Console; failover redeploy possible to Netlify / Fly within ~1 h |
| Firebase outage | Public website remains up (static); admin degrades gracefully |
| Data corruption | Daily Firestore export to GCS, 90-day retention, documented restore procedure |
| Credential leak | Service-account rotation procedure in `DISASTER_RECOVERY.md` |
| Account compromise | Brute-force lockout, rate limit, session cookie httpOnly + secure |
| Code regression | CI typecheck + lint + build on every PR, pre-deploy verify script |
| Unauthorized changes | Audit log captures actor, IP, UA, and field-level diff |

## Why this stack

* **No backend to maintain.** Firebase Admin SDK + Vercel functions cover all server logic.
* **Real-time by default.** `onSnapshot` powers the notification bell with no polling.
* **Versioned security.** Firestore rules live in the repo; changes ship via `firebase deploy`.
* **Cost predictability.** Both Vercel and Firebase scale to zero on idle.
* **Onboarding speed.** A new engineer is productive in under 30 minutes (clone → install → run).
