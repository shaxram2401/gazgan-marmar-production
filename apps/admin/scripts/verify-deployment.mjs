#!/usr/bin/env node
/**
 * Pre-deploy verification script.
 * Run locally:  node scripts/verify-deployment.mjs
 * Run against production:  BASE_URL=https://admin.gazganmarmo.uz node scripts/verify-deployment.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const log = (icon, msg) => console.log(`${icon}  ${msg}`);

let failures = 0;
const fail = (msg) => { failures++; log('✗', `\x1b[31m${msg}\x1b[0m`); };
const pass = (msg) => log('✓', `\x1b[32m${msg}\x1b[0m`);
const info = (msg) => log('·', msg);

console.log('\n\x1b[1mGazgan Marmo Admin — Deployment Verification\x1b[0m\n');

/* 1. Required files */
const required = [
  'package.json', 'next.config.js', 'tsconfig.json', 'tailwind.config.ts',
  'vercel.json', 'firebase.json', 'firebase/firestore.rules',
  'firebase/firestore.indexes.json', 'firebase/storage.rules',
  '.env.example', 'README.md',
  'src/app/layout.tsx', 'src/app/login/page.tsx', 'src/app/(admin)/layout.tsx',
  'src/lib/firebase.admin.ts', 'src/lib/firebase.client.ts',
  'src/lib/auth.server.ts', 'src/lib/audit.server.ts',
  'src/lib/ratelimit.server.ts', 'src/lib/alerts.server.ts',
  'src/middleware.ts'
];
console.log('\x1b[1m1. File integrity\x1b[0m');
required.forEach(f => existsSync(resolve(ROOT, f)) ? pass(f) : fail(`MISSING: ${f}`));

/* 2. Env vars */
console.log('\n\x1b[1m2. Environment\x1b[0m');
const envFile = resolve(ROOT, '.env.local');
if (existsSync(envFile)) {
  const env = readFileSync(envFile, 'utf8');
  const need = [
    'NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'FIREBASE_ADMIN_CREDENTIALS_B64',
    'CRON_SECRET'
  ];
  need.forEach(k => {
    const m = env.match(new RegExp(`^${k}=(.+)$`, 'm'));
    if (m && m[1].trim().length > 0) pass(`${k} set`);
    else fail(`${k} missing or empty in .env.local`);
  });
} else {
  info('No .env.local found — skipping env check (will run on Vercel env)');
}

/* 3. package.json sanity */
console.log('\n\x1b[1m3. Dependencies\x1b[0m');
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
['next', 'react', 'firebase', 'firebase-admin', 'react-hook-form', 'zod', 'recharts']
  .forEach(d => pkg.dependencies?.[d] ? pass(`${d}@${pkg.dependencies[d]}`) : fail(`Missing dep: ${d}`));

/* 4. Live endpoint check (optional) */
const BASE = process.env.BASE_URL;
if (BASE) {
  console.log(`\n\x1b[1m4. Live endpoints (${BASE})\x1b[0m`);
  const endpoints = ['/login', '/api/auth/me'];
  for (const ep of endpoints) {
    try {
      const r = await fetch(BASE + ep, { redirect: 'manual' });
      if (r.status < 500) pass(`${ep} → ${r.status}`);
      else fail(`${ep} → ${r.status}`);
    } catch (e) {
      fail(`${ep} → ${e.message}`);
    }
  }
} else {
  info('Set BASE_URL env to enable live endpoint checks.');
}

console.log('');
if (failures > 0) {
  console.log(`\x1b[31m${failures} issue(s) found.\x1b[0m\n`);
  process.exit(1);
}
console.log('\x1b[32m✓ All checks passed — ready to deploy.\x1b[0m\n');
