import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin, canWrite } from '@/lib/auth.server';
import { catalogSchema } from '@/lib/schemas';
import { logActivity } from '@/lib/audit.server';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canWrite(admin.role, 'catalog')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = catalogSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // If new version marked active → deactivate all others
  if (parsed.data.active) {
    const existing = await adminDb.collection('catalogVersions').where('active', '==', true).get();
    const batch = adminDb.batch();
    existing.forEach(d => batch.update(d.ref, { active: false }));
    await batch.commit();
  }

  const ref = await adminDb.collection('catalogVersions').add({
    ...parsed.data,
    uploadedBy: admin.uid,
    uploadedByEmail: admin.email,
    uploadedAt: FieldValue.serverTimestamp(),
    downloadCount: 0
  });

  await logActivity({
    actor: admin, action: 'upload', resource: 'catalog',
    resourceId: ref.id, resourceLabel: parsed.data.version
  });

  return NextResponse.json({ ok: true, id: ref.id });
}
