## Summary

<!-- One-line description of the change -->

## Scope

- [ ] apps/site
- [ ] apps/admin
- [ ] packages/design-system
- [ ] Firebase rules / indexes
- [ ] Docs / CI

## Type

- [ ] feat — new feature
- [ ] fix — bug fix
- [ ] chore — tooling, deps
- [ ] docs — documentation only
- [ ] refactor / perf / test / style / ci

## Pre-merge checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run verify` passes
- [ ] `npm --workspace apps/admin run build` succeeds locally
- [ ] Audit log entries added for any new write paths (`logActivity`)
- [ ] Role gating added in API + Firestore rules (if a new resource)
- [ ] Design tokens used (no hard-coded colors / spacing)
- [ ] Screenshots attached if UI changed
- [ ] Tested on mobile width (≤ 640 px) if UI changed

## Screenshots

<!-- before / after for any visual change -->

## Notes for reviewers

<!-- migration steps, env var changes, manual QA notes -->
