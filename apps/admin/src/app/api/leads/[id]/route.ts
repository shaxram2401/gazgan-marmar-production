import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin, canWrite } from '@/lib/auth.server';
import { leadUpdateSchema } from '@/lib/schemas';
import { logActivity } from '@/lib/audit.server';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canWrite(admin.role, 'leads')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = leadUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Capture before state for diff
  const before = (await adminDb.collection('inquiries').doc(params.id).get()).data() || {};
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (before[k] !== v) changes[k] = { from: before[k], to: v };
  }

  await adminDb.collection('inquiries').doc(params.id).set(
    { ...parsed.data, updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.uid },
    { merge: true }
  );

  await logActivity({
    actor: admin, action: 'update', resource: 'leads',
    resourceId: params.id, resourceLabel: before.company as string,
    changes: Object.keys(changes).length ? changes : undefined
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (admin.role !== 'super_admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const snap = await adminDb.collection('inquiries').doc(params.id).get();
  const label = snap.data()?.company as string | undefined;
  await adminDb.collection('inquiries').doc(params.id).delete();
  await logActivity({ actor: admin, action: 'delete', resource: 'leads', resourceId: params.id, resourceLabel: label });
  return NextResponse.json({ ok: true });
}
