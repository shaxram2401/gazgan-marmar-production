import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';

export const runtime = 'nodejs';

/**
 * GET /api/admin/monitoring/verify
 * Pre-flight deployment verification — admin only.
 * Checks env vars, Firebase project access, Auth, Storage, and
 * confirms at least one super_admin exists.
 */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== 'super_admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const checks: { name: string; ok: boolean; detail?: string }[] = [];

  // 1. Env vars
  const required = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'FIREBASE_ADMIN_CREDENTIALS_B64',
    'SESSION_COOKIE_NAME',
    'CRON_SECRET'
  ];
  const missing = required.filter(k => !process.env[k]);
  checks.push({
    name: 'Environment variables',
    ok: missing.length === 0,
    detail: missing.length ? `Missing: ${missing.join(', ')}` : 'All required vars set'
  });

  // 2. Firebase Admin SDK
  try {
    await adminDb.collection('settings').doc('global').get();
    checks.push({ name: 'Firestore access', ok: true });
  } catch (e) {
    checks.push({ name: 'Firestore access', ok: false, detail: errorMsg(e) });
  }

  // 3. Auth
  try {
    await adminAuth.listUsers(1);
    checks.push({ name: 'Firebase Auth access', ok: true });
  } catch (e) {
    checks.push({ name: 'Firebase Auth access', ok: false, detail: errorMsg(e) });
  }

  // 4. Storage bucket reachable
  try {
    const { getStorage } = await import('firebase-admin/storage');
    const bucket = getStorage().bucket();
    const [exists] = await bucket.exists();
    checks.push({ name: 'Storage bucket', ok: exists, detail: bucket.name });
  } catch (e) {
    checks.push({ name: 'Storage bucket', ok: false, detail: errorMsg(e) });
  }

  // 5. At least one super_admin
  try {
    const snap = await adminDb.collection('adminUsers')
      .where('role', '==', 'super_admin').where('active', '==', true).limit(1).get();
    checks.push({
      name: 'Super admin present',
      ok: !snap.empty,
      detail: snap.empty ? 'Run scripts/createSuperAdmin.ts' : `${snap.size} active`
    });
  } catch (e) {
    checks.push({ name: 'Super admin present', ok: false, detail: errorMsg(e) });
  }

  // 6. Settings doc
  try {
    const s = await adminDb.collection('settings').doc('global').get();
    checks.push({
      name: 'Global settings configured',
      ok: s.exists,
      detail: s.exists ? 'OK' : 'Visit /settings to configure'
    });
  } catch (e) {
    checks.push({ name: 'Global settings configured', ok: false, detail: errorMsg(e) });
  }

  // 7. Recent backup
  try {
    const snap = await adminDb.collection('backups').orderBy('createdAt', 'desc').limit(1).get();
    if (snap.empty) {
      checks.push({ name: 'Recent backup', ok: false, detail: 'No backups recorded yet' });
    } else {
      const last = snap.docs[0].data();
      const t = last.createdAt?.toDate?.() as Date | undefined;
      const ageH = t ? (Date.now() - t.getTime()) / 3_600_000 : Infinity;
      checks.push({
        name: 'Recent backup',
        ok: ageH < 48,
        detail: t ? `${ageH.toFixed(1)}h ago · ${last.outputUri}` : 'no timestamp'
      });
    }
  } catch (e) {
    checks.push({ name: 'Recent backup', ok: false, detail: errorMsg(e) });
  }

  const allOk = checks.every(c => c.ok);
  return NextResponse.json(
    { ok: allOk, checks, at: new Date().toISOString() },
    { status: allOk ? 200 : 207 }
  );
}

function errorMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'unknown error';
}
