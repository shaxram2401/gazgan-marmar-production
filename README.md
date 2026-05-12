# Gazgan Marmar

> Premium marble &amp; granite export platform — Gazgan district, Uzbekistan.

A monorepo containing the public-facing website, the enterprise admin console, the shared design system, and all production infrastructure to run the business online.

[![CI](https://github.com/shaxram2401/gazgan-marmar-site/actions/workflows/ci.yml/badge.svg)](https://github.com/shaxram2401/gazgan-marmar-site/actions)

---

## What this is

Gazgan Marmar is the unified digital platform for an alliance of 12 marble &amp; granite producers in the Gazgan district. The platform consists of three parts:

| Part | Tech | Purpose |
|------|------|---------|
| **Public site** | Static HTML / CSS / JS (zero build) | International buyers discover products, request quotes, download catalog |
| **Admin console** | Next.js 14 · TypeScript · Firebase · Tailwind | Real-time CRUD, lead management, analytics, role-based access |
| **Design system** | CSS vars + TypeScript tokens | Single source of truth, used by both apps |

---

## Repository layout

```
gazgan-marmar-site/
├── apps/
│   ├── site/                    # Public static website  →  gazganmarmo.uz
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── script.js
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   ├── sitemap.xml
│   │   ├── vercel.json
│   │   ├── favicon.ico / .svg
│   │   ├── og-cover.jpg
│   │   ├── icons/               # PWA icons (16, 32, 180, 192, 512)
│   │   ├── images/              # Hero, products, gallery, og
│   │   └── catalog/             # Export catalog PDFs
│   │
│   └── admin/                   # Next.js admin console  →  admin.gazganmarmo.uz
│       ├── src/
│       │   ├── app/             # App Router (login, dashboard, leads, products, …)
│       │   ├── components/      # UI primitives, layout shell, ImageUpload
│       │   ├── hooks/           # AuthProvider
│       │   ├── lib/             # firebase.{client,admin}, auth.server, audit, alerts, ratelimit
│       │   ├── types/           # Domain models + role matrix
│       │   └── middleware.ts    # Route protection
│       ├── firebase/            # firestore.rules, firestore.indexes.json, storage.rules
│       ├── scripts/             # createSuperAdmin, verify-deployment, restore
│       ├── docs/                # LAUNCH_CHECKLIST, DISASTER_RECOVERY
│       ├── package.json
│       ├── next.config.js
│       ├── vercel.json
│       ├── tailwind.config.ts
│       └── tsconfig.json
│
├── packages/
│   └── design-system/           # Shared tokens (CSS vars + TS)
│       ├── tokens/index.ts
│       ├── css/tokens.css
│       ├── preview/index.html   # Visual reference page
│       └── package.json
│
├── .github/workflows/ci.yml
├── package.json                 # npm workspaces root
├── LICENSE
├── CONTRIBUTING.md
├── SECURITY.md
└── README.md  (this file)
```

---

## Quick start

```bash
git clone https://github.com/shaxram2401/gazgan-marmar-site.git
cd gazgan-marmar-site
npm install

# Public site (no build step)
npx serve apps/site -p 3000

# Admin console
cp apps/admin/.env.example apps/admin/.env.local   # fill Firebase keys
npm run dev:admin                                   # → http://localhost:3000
```

---

## Deployments

Both apps deploy to Vercel as separate projects from the same repo.

### Public site

* **URL:** https://gazganmarmo.uz
* **Vercel root:** `apps/site`
* **Framework:** Other (static)
* **Build:** *(none)*

### Admin console

* **URL:** https://admin.gazganmarmo.uz
* **Vercel root:** `apps/admin`
* **Framework:** Next.js
* **Build:** `next build`
* **Env:** see `apps/admin/.env.example` — all `NEXT_PUBLIC_FIREBASE_*` plus `FIREBASE_ADMIN_CREDENTIALS_B64`, `CRON_SECRET`, etc.

### Firebase

```bash
cd apps/admin
firebase use gazgan-marmo
firebase deploy --only firestore:rules,firestore:indexes,storage
```

---

## Feature status

### Public website  ✅

* Premium luxury hero with black marble pattern
* About · Products · Stats · Entrepreneurs alliance · Gallery
* Investor section · Testimonials · Partners · Global export map · Contact
* CEO message · Export Terms (FOB/CIF/EXW) · Certifications (ISO/CE/SGS)
* Catalog download CTA · WhatsApp float · Mobile sticky CTA
* Lang switcher (UZ/RU/EN) · Scroll progress · Legal modals (Privacy/Terms/License)
* SEO complete: meta, OG, Twitter, hreflang, JSON-LD (Organization + WebSite), sitemap, robots, favicons
* B2B inquiry form with lead-type routing → WhatsApp + email
* GA4 / Meta Pixel / Search Console placeholders

### Admin console  ✅

* Secure Firebase Auth + session cookie + route protection + brute-force lockout + rate limiting
* Premium sidebar/topbar + real-time notification bell
* **Dashboard** — stats grid, lead pulse, recent leads
* **Leads** — list, filters, detail, status/priority/assign workflow, notes/activity, server diff capture
* **Products / Entrepreneurs / Gallery / Testimonials / Countries** — full CRUD with Firebase Storage image upload
* **Catalog PDF** — resumable upload, version history, atomic activation, download counter
* **Settings** — tabbed (contact, SEO+tracking, social, legal, lead routing), super-admin only
* **Analytics** — KPIs + 12-week growth area + top countries/products/types/pipeline (Recharts)
* **Team &amp; Roles** — permission matrix, CRUD, role-based access (super_admin / manager / sales_manager)
* **Activity Log** — full audit trail with filters
* **Production hardening** — CSP, rate limiting, lockouts, daily Firestore backup → GCS, health check, deployment verify, alerts (Slack/Discord)
* **Reports** — investor / leads / monthly printable HTML (+ optional PDF via Puppeteer)
* **CRM export** — CSV/JSON for any collection
* **Disaster recovery** — restore script + runbook + RPO/RTO targets

### Design system  ✅

* `@gazgan/design-system` package with CSS variables + TypeScript tokens
* Visual reference page at `packages/design-system/preview/index.html`
* Tokens: colors (ink/paper/gold + status) · typography (Cormorant / Inter) · spacing (4 px base) · shadows · motion · breakpoints · z-index
* Component patterns: buttons, badges, fields, cards, hero composition

---

## Production launch

See:

* [`apps/admin/docs/LAUNCH_CHECKLIST.md`](apps/admin/docs/LAUNCH_CHECKLIST.md) — 60+ item end-to-end checklist (A → I)
* [`apps/admin/docs/DISASTER_RECOVERY.md`](apps/admin/docs/DISASTER_RECOVERY.md) — RTO/RPO, restore runbooks
* [`apps/admin/README.md`](apps/admin/README.md) — admin setup
* [`SECURITY.md`](SECURITY.md) — security policy

---

## License

Proprietary — © 2026 Gazgan Marmar Alliance LLC. All rights reserved.
See [LICENSE](LICENSE).
