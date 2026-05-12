# Contributing

This is a proprietary project. Pull requests are restricted to internal team members and contracted partners with signed agreements.

## Local setup

```bash
git clone https://github.com/shaxram2401/gazgan-marmar-site.git
cd gazgan-marmar-site
npm install
```

## Working in the monorepo

The repo uses npm workspaces. Each app is independently deployable.

```bash
# Public site (no build)
npx serve apps/site -p 3000

# Admin (Next.js)
cd apps/admin
cp .env.example .env.local       # fill values from your Firebase project
npm run dev
```

## Branching

* `main` — production, protected, deploys auto on push
* `dev` — staging integration branch
* `feature/<name>` — short-lived feature branches
* `hotfix/<name>` — urgent production fixes branched from `main`

## Commit style

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat(admin/leads): add bulk-export CSV button
fix(site): correct OG image meta tag
chore(deps): bump next to 14.2.5
docs(launch): expand step C in checklist
```

Allowed types: `feat` · `fix` · `chore` · `docs` · `refactor` · `perf` · `test` · `style` · `ci`.

## Pre-PR checks

```bash
npm run typecheck
npm run lint
npm run verify
npm --workspace apps/admin run build
```

CI runs the same on every PR.

## Code style

* TypeScript strict mode — no `any` unless explicitly justified
* TailwindCSS for admin; tokens from `@gazgan/design-system`
* No inline component styles unless dynamic
* Server components by default; mark client only when needed
* Always log writes through `lib/audit.server.ts` → `logActivity()`
* All write endpoints must be role-gated via `canWrite()` and Firestore rules

## Design changes

Any visual change must pass through the design system first:

1. Add / update token in `packages/design-system/`
2. Reflect in `packages/design-system/preview/index.html`
3. Apply in consuming app

## Security

See [`SECURITY.md`](SECURITY.md) for vulnerability disclosure.

## Questions

Internal Slack `#gazgan-platform` · or email <dev@gazganmarmo.uz>
