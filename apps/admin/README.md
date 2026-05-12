# Gazgan Marmo — Admin Console

Production-level admin dashboard. Next.js 14 (App Router) · TypeScript · Firebase Auth + Firestore · Tailwind.

---

## 📁 Structure

```
admin/
├── firebase/                            # Firebase config (rules + indexes)
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── storage.rules
├── firebase.json
├── scripts/
│   └── createSuperAdmin.ts              # Bootstrap first super_admin
├── src/
│   ├── app/
│   │   ├── (admin)/                     # Protected route group
│   │   │   ├── layout.tsx               # Auth guard + Sidebar shell
│   │   │   ├── dashboard/page.tsx       ✅ Overview + stats + recent leads
│   │   │   ├── leads/                   ✅ List · Filters · Detail · Notes
│   │   │   │   ├── page.tsx
│   │   │   │   ├── LeadFilters.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── LeadActions.tsx
│   │   │   │       └── LeadNotes.tsx
│   │   │   ├── products/                ⏳ Stub (next phase)
│   │   │   ├── entrepreneurs/           ⏳
│   │   │   ├── gallery/                 ⏳
│   │   │   ├── testimonials/            ⏳
│   │   │   ├── countries/               ⏳
│   │   │   ├── catalog/                 ⏳
│   │   │   ├── settings/                ⏳
│   │   │   └── analytics/               ⏳
│   │   ├── api/
│   │   │   ├── auth/{login,logout,me}/
│   │   │   └── leads/[id]/{route,notes}
│   │   ├── login/page.tsx               # Secure sign-in
│   │   ├── layout.tsx                   # Root (AuthProvider + Toaster)
│   │   ├── page.tsx                     # → redirect /dashboard
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/index.tsx                 # Button, Input, Card, Badge, Modal, etc.
│   │   ├── layout/{Sidebar,Topbar}.tsx
│   │   └── ComingSoon.tsx
│   ├── hooks/useAuth.tsx                # Client auth context
│   ├── lib/
│   │   ├── firebase.client.ts           # Web SDK
│   │   ├── firebase.admin.ts            # Admin SDK (server)
│   │   ├── auth.server.ts               # Session cookies + getCurrentAdmin
│   │   ├── permissions.client.ts
│   │   ├── schemas.ts                   # Zod schemas (all entities)
│   │   └── utils.ts
│   ├── types/index.ts                   # All domain types + role matrix
│   └── middleware.ts                    # Protect routes
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
└── .env.example
```

---

## 🚀 Setup (10 min)

### 1. Firebase project

```bash
# Create project at console.firebase.google.com → "gazgan-marmo"
# Enable: Authentication (Email/Password), Firestore (production), Storage
```

### 2. Service account

In Firebase Console → ⚙ Project Settings → Service accounts → **Generate new private key**.
Base64-encode the JSON:

```bash
base64 -w 0 service-account.json > sa.b64
```

### 3. Local env

```bash
cp .env.example .env.local
# Fill all NEXT_PUBLIC_FIREBASE_* (web SDK config from Console)
# Set FIREBASE_ADMIN_CREDENTIALS_B64 to the base64 string from step 2
```

### 4. Install + bootstrap super admin

```bash
npm install
npm install -D tsx
FIREBASE_ADMIN_CREDENTIALS_B64=$(cat sa.b64) \
  npx tsx scripts/createSuperAdmin.ts admin@gazganmarmo.uz "StrongPass123!" "Akmal Karimov"
```

### 5. Deploy Firebase rules + indexes

```bash
npm install -g firebase-tools
firebase login
firebase use gazgan-marmo
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 6. Run locally

```bash
npm run dev
# → http://localhost:3000  →  redirect to /login
```

### 7. Deploy to Vercel

```bash
vercel --prod
# Add all env vars in Vercel project settings (same as .env.local)
```

---

## 🔐 Auth flow

1. User submits `email + password` on `/login`.
2. Firebase Web SDK signs in → returns `idToken`.
3. `/api/auth/login` (server) calls `adminAuth.createSessionCookie(idToken)` → HTTP-only cookie `__gm_session`.
4. `middleware.ts` checks cookie presence on every protected route.
5. `(admin)/layout.tsx` calls `getCurrentAdmin()` → verifies cookie + loads `adminUsers/{uid}` doc.
6. If `!active` or doc missing → redirect to `/login`.

Session persists 5 days (configurable via `SESSION_MAX_AGE`).

---

## 👥 Role matrix

| Role            | Read                       | Write                                                                  |
|-----------------|----------------------------|------------------------------------------------------------------------|
| `super_admin`   | all                        | all (incl. adminUsers, settings)                                       |
| `manager`       | all                        | products, entrepreneurs, gallery, testimonials, countries, catalog, leads |
| `sales_manager` | leads, products, analytics | leads only                                                              |

Defined in `src/types/index.ts` → `ROLE_PERMISSIONS`. Enforced in:
- API routes via `canWrite(role, resource)`
- Firestore rules (`isManager()`, `isSales()`)
- Sidebar visibility via `canRead`

---

## 📦 Firestore collections

| Collection         | Public read | Admin write  | Notes                                  |
|--------------------|-------------|--------------|----------------------------------------|
| `adminUsers`       | —           | super_admin  | Internal staff records                 |
| `products`         | ✓           | manager      | Renders products section               |
| `entrepreneurs`    | ✓           | manager      | Alliance member cards                  |
| `gallery`          | ✓           | manager      | Gallery grid                           |
| `testimonials`     | ✓           | manager      | Buyer quotes                           |
| `exportCountries`  | ✓           | manager      | Export map list                        |
| `inquiries`        | create only | sales+       | Public form submits; admin reads/updates |
| `catalogVersions`  | ✓           | manager      | Catalog PDF history                    |
| `settings`         | ✓           | super_admin  | Single doc `settings/global`           |
| `auditLogs`        | admin only  | admin create | Append-only audit trail                |

---

## ✅ Phase 1 — completed

- Secure Firebase Auth + protected routes + session persistence + logout
- Premium sidebar/topbar shell
- Dashboard Overview: stats + lead pulse + recent leads
- Leads module: list, filters, detail, notes, workflow
- API: auth + leads
- Firestore rules + indexes + storage rules
- Role-based permissions
- Super-admin bootstrap script

## ✅ Phase 2 — completed (this commit)

Full enterprise-level CRUD modules with shared components:

- **Shared UI**: `ImageUpload` (Firebase Storage drag-drop, 8MB validation, replace/remove) · `ConfirmDialog` · `Switch` · `SearchBar` · `FormRow`
- **Generic CRUD API helper** (`lib/crud.server.ts`): typed, role-gated, Zod-validated POST / PATCH / DELETE
- **Products** ✅ — table view · search · category filter · pagination · featured toggle · export toggle · SEO fields · auto-slug · CRUD modal
- **Entrepreneurs** ✅ — card grid · active/featured filters · multi-tag export-countries field · location field · CRUD modal · featured/active toggles
- **Gallery** ✅ — image grid · category filter · hover actions · featured toggle · CRUD modal
- **Testimonials** ✅ — quote cards · 5-star rating · featured/active toggles · avatar upload · CRUD modal
- **Export Countries** ✅ — table + stat strip (total/active/inactive/volume) · flag emoji · active toggle · CRUD modal

All modules:
- React Hook Form + Zod resolver
- Optimistic UI via `router.refresh()` + Sonner toasts
- Role-gated server-side (`canWrite` in API helper, Firestore rules)
- Production-ready error handling

## ✅ Phase 4 — Production deployment (this commit)

Enterprise hardening + launch infrastructure:

- **Hardened `next.config.js`** — CSP, AVIF/WebP, standalone output, source maps off, server-action body limit
- **`vercel.json`** — strict security headers (HSTS preload, X-Frame DENY, X-Robots noindex), aggressive static caching, `no-store` for `/api/*`, cron schedules
- **CSP** locked to Firebase, Google, fonts only
- **Rate limiting** (`lib/ratelimit.server.ts`) — sliding-window per IP in Firestore, 5 login attempts/min default
- **Brute force lockout** — 8 fails → 15-min lockout per email+IP, auto-alert on trigger
- **Login route** rewritten — rate-limit → lockout check → admin validation → cookie mint → audit log → record IP
- **Alert dispatcher** (`lib/alerts.server.ts`) — persists to `alerts` collection + posts to Slack/Discord webhook
- **Backup endpoint** (`/api/admin/backup`) — daily Firestore export to GCS via Admin SDK, cron-protected via `CRON_SECRET`
- **Backup verify** (`/api/admin/backup/verify`) — lists recent exports + age health
- **Health check** (`/api/admin/monitoring/health`) — pings Firestore + Auth + recent inquiries; cron + manual
- **Deployment verify** (`/api/admin/monitoring/verify`) — env vars, Firestore, Auth, Storage, super-admin presence, settings doc, recent backup
- **CSV / JSON export** (`/api/admin/export`) — leads / products / entrepreneurs for CRM
- **JSON import** (`/api/admin/import`) — disaster-recovery bulk seed, super-admin only, batch 500
- **Investor / leads / monthly reports** (`/api/admin/reports`) — printable HTML (browser PDF) with optional Puppeteer + sparticuz/chromium PDF rendering
- **`scripts/verify-deployment.mjs`** — local CLI pre-deploy checker (files, env, deps, live endpoints)
- **`scripts/restore.ts`** — restore from GCS Firestore export
- **GitHub Actions CI** — typecheck + lint + verify + build
- **`docs/LAUNCH_CHECKLIST.md`** — 60+ item end-to-end production checklist
- **`docs/DISASTER_RECOVERY.md`** — RTO/RPO targets, runbooks, recovery procedures

**Firestore rules** extended with `alerts`, `backups`, server-only `rateLimits` / `loginAttempts` (deny client access).

## 📁 Phase 4 file map

```
admin/
├── vercel.json                              # Production headers + cron
├── next.config.js                           # Hardened + CSP
├── .github/workflows/ci.yml
├── docs/
│   ├── LAUNCH_CHECKLIST.md
│   └── DISASTER_RECOVERY.md
├── scripts/
│   ├── createSuperAdmin.ts                  # (Phase 1)
│   ├── verify-deployment.mjs
│   └── restore.ts
├── src/lib/
│   ├── ratelimit.server.ts
│   ├── alerts.server.ts
│   └── cron.server.ts
└── src/app/api/admin/
    ├── backup/{route,verify/route}.ts
    ├── monitoring/{health/route,verify/route}.ts
    ├── export/route.ts
    ├── import/route.ts
    └── reports/route.ts
```

## 🚀 Final production launch

```bash
# 1. Pre-deploy local
npm run verify

# 2. Deploy
git push origin main          # → Vercel auto-deploys

# 3. Post-deploy verify
curl -H "Cookie: __gm_session=..." https://admin.gazganmarmo.uz/api/admin/monitoring/verify
```

Walk through [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) sections A → I.

---

## ✅ Phase 3 — completed

All remaining enterprise modules built:

- **PDF Catalog Management** ✅ — drag-drop PDF upload via Firebase Storage with resumable progress · version history table · activate version (atomic batch) · delete (blocked if active) · public download URL with copy-to-clipboard · download counter
- **Settings** ✅ — tabbed form (Contact / SEO & Tracking / Social / Legal / Lead Routing) · WhatsApp, email, telegram, address, social URLs · Google Analytics + Meta Pixel + Search Console + Yandex verification tokens · OG image upload · legal entity fields · lead routing by buyer type · super_admin only
- **Analytics Dashboard** ✅ — 6 KPI cards (leads 90d, qualified rate, conversion, deals won, WhatsApp 30d, catalog downloads) · monthly growth area chart (12 weeks) · top countries horizontal bar · top products bar · lead type pie · pipeline status bar with status colors (Recharts)
- **Role Management** ✅ — permission matrix table (Read/Write per resource × role) · users table with avatar, role icon, last login, status · add/edit/delete via API · Firebase Auth user create + custom claims + Firestore mirror · self-edit guards (no self-demote, no self-deactivate, no self-delete) · password reset · super_admin only
- **Notifications System** ✅ — real-time bell in sidebar (Firestore onSnapshot) · unread badge · mark all read · auto-created notifications for new lead / investor / WhatsApp click / catalog download · public `/api/tracking` endpoint for website events
- **Activity Logs** ✅ — full audit trail · who / what action / which resource / target / when · filterable by action + module · diff capture for lead updates · IP + UA metadata · admin readable

**Cross-cutting upgrades:**
- Generic `lib/audit.server.ts` with `logActivity()` + `notify()` helpers
- All CRUD operations (products / entrepreneurs / gallery / testimonials / countries / leads / catalog / settings / users) now write to `auditLogs`
- Tracking events also increment `catalogVersions.downloadCount`
- Firestore rules extended (notifications, eventLogs)
- Composite indexes added (auditLogs × action / resource, notifications × read, eventLogs × event)

## 📁 Phase 3 file map

```
src/
├── app/(admin)/
│   ├── catalog/{page,CatalogClient}.tsx
│   ├── settings/{page,SettingsClient}.tsx
│   ├── analytics/{page,AnalyticsCharts}.tsx
│   ├── users/{page,UsersClient}.tsx
│   └── activity/{page,ActivityFilters}.tsx
├── app/api/
│   ├── catalog/{route,[id]/route}.ts
│   ├── settings/route.ts
│   ├── users/{route,[uid]/route}.ts
│   ├── notifications/{route,[id]/route}.ts
│   └── tracking/route.ts
├── components/layout/NotificationBell.tsx
└── lib/audit.server.ts
```

---

## 🎨 Design tokens

- **Ink** `#0a0a0a` — primary text + sidebar bg
- **Gold** `#b08d4f` — luxury accent
- **Line** `#e6e6e6` — hairlines
- **Paper** `#fafaf8` — page bg
- **Fonts** — Cormorant Garamond (serif headings) + Inter (UI sans)

---

© Gazgan Marmo Alliance LLC
