import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';

export const runtime = 'nodejs';

/**
 * GET /api/admin/backup/verify
 * Lists recent Firestore export operations and their ages.
 * Useful to confirm cron is working.
 */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (admin.role !== 'super_admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const snap = await adminDb.collection('backups').orderBy('createdAt', 'desc').limit(20).get();
  const items = snap.docs.map(d => {
    const data = d.data();
    const t = data.createdAt?.toDate?.() as Date | undefined;
    return {
      id: d.id,
      outputUri: data.outputUri,
      operation: data.operation,
      triggeredBy: data.triggeredBy,
      createdAt: t?.toISOString() ?? null,
      ageHours: t ? Number(((Date.now() - t.getTime()) / 3_600_000).toFixed(2)) : null
    };
  });

  const latest = items[0];
  const healthy = latest && latest.ageHours !== null && latest.ageHours < 48;

  return NextResponse.json({
    ok: !!healthy,
    healthy,
    latest: latest || null,
    history: items
  });
}
