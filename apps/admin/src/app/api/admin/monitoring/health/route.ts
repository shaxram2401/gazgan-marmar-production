import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { Alert } from '@/lib/alerts.server';
import { verifyCron } from '@/lib/cron.server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Allow either a logged-in admin OR a valid cron token
  const isCron = verifyCron(req);
  const start = Date.now();
  const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {};

  // 1. Firestore connectivity
  try {
    const t0 = Date.now();
    await adminDb.collection('settings').doc('global').get();
    checks.firestore = { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    checks.firestore = { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }

  // 2. Recent inquiries throughput sanity (no errors, just count last 24h)
  try {
    const yesterday = new Date(Date.now() - 86_400_000);
    const cnt = await adminDb.collection('inquiries').where('createdAt', '>=', yesterday).count().get();
    checks.inquiries24h = { ok: true, ms: cnt.data().count };
  } catch (e) {
    checks.inquiries24h = { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }

  // 3. Auth admin
  try {
    const t0 = Date.now();
    const { adminAuth } = await import('@/lib/firebase.admin');
    await adminAuth.listUsers(1);
    checks.auth = { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    checks.auth = { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }

  const allOk = Object.values(checks).every(c => c.ok);
  const status = { ok: allOk, durationMs: Date.now() - start, checks, at: new Date().toISOString() };

  // Alert if cron-triggered and unhealthy
  if (isCron && !allOk) {
    await Alert.system('Health check FAILED', JSON.stringify(checks));
  }

  return NextResponse.json(status, { status: allOk ? 200 : 503 });
}
