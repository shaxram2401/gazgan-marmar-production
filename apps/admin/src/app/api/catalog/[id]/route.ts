import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin, canWrite } from '@/lib/auth.server';
import { logActivity } from '@/lib/audit.server';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canWrite(admin.role, 'catalog')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { action } = await req.json();
  if (action === 'activate') {
    const all = await adminDb.collection('catalogVersions').get();
    const batch = adminDb.batch();
    all.forEach(d => batch.update(d.ref, { active: d.id === params.id }));
    await batch.commit();
    await logActivity({ actor: admin, action: 'update', resource: 'catalog', resourceId: params.id, resourceLabel: 'Activated' });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'invalid action' }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (admin.role !== 'super_admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const snap = await adminDb.collection('catalogVersions').doc(params.id).get();
  if (snap.exists && snap.data()?.active) {
    return NextResponse.json({ error: 'Cannot delete the active catalog. Activate another version first.' }, { status: 400 });
  }
  await adminDb.collection('catalogVersions').doc(params.id).delete();
  await logActivity({ actor: admin, action: 'delete', resource: 'catalog', resourceId: params.id });
  return NextResponse.json({ ok: true });
}
