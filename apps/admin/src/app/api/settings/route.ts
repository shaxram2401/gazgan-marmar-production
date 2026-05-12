import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';
import { settingsSchema } from '@/lib/schemas';
import { logActivity } from '@/lib/audit.server';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function GET() {
  const snap = await adminDb.collection('settings').doc('global').get();
  return NextResponse.json({ settings: snap.exists ? snap.data() : null });
}

export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (admin.role !== 'super_admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await adminDb.collection('settings').doc('global').set(
    { ...parsed.data, updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.uid },
    { merge: true }
  );

  await logActivity({
    actor: admin, action: 'update', resource: 'settings',
    resourceId: 'global', resourceLabel: 'Global settings updated'
  });

  return NextResponse.json({ ok: true });
}
