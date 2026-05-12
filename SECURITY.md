# Security Policy

## Supported versions

Only the `main` branch is supported and patched.

## Reporting a vulnerability

**Do not** open public GitHub issues for security vulnerabilities.

Email security disclosures to <security@gazganmarmo.uz> with:

* Brief description of the vulnerability
* Steps to reproduce
* Affected component (`apps/site` / `apps/admin` / Firebase rules / infrastructure)
* Any proof-of-concept code or screenshots
* Your name / handle if you'd like credit in the changelog

We aim to acknowledge within **48 hours** and provide a fix or mitigation
plan within **14 days** for high-severity issues.

## Scope

In scope:

* Authentication, authorization, session, or role bypass in the admin
* Firestore / Storage rule weaknesses allowing unauthorized read or write
* XSS, CSRF, SSRF, IDOR, or injection in admin or public APIs
* Sensitive data exposure (PII, lead data, service account keys)
* Supply-chain risks in our dependency graph

Out of scope:

* DoS via brute force (we have rate limiting + lockout)
* Self-XSS or social engineering
* Issues in third-party services (report to them directly)
* Missing security headers on `apps/site` static assets (we set core headers; non-critical headers are intentional)

## Responsible disclosure

Please give us reasonable time to remediate before public disclosure.
We will credit you in the release notes unless you prefer anonymity.

## Security controls in place

| Layer | Control |
|-------|---------|
| Edge | Vercel HSTS preload, X-Frame DENY, strict CSP, X-Content-Type-Options nosniff |
| Auth | Firebase Auth + httpOnly server session cookie + Admin SDK verify |
| Rate limiting | 5 login attempts / min / IP (sliding window, Firestore-backed) |
| Brute force | 8 fails / 15-min lockout per email + IP |
| Authorization | Role matrix enforced in API + Firestore rules + UI |
| Audit | Every write logged to `auditLogs` with actor + IP + UA + field diff |
| Alerts | Slack/Discord webhook + Firestore `alerts` collection |
| Backups | Daily Firestore export → GCS, retained 90 days |
| Recovery | Documented runbook (`apps/admin/docs/DISASTER_RECOVERY.md`) |

---

© 2026 Gazgan Marmar Alliance LLC.
