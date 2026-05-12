import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { action } = await req.json();
  if (action === 'markAllRead') {
    const snap = await adminDb.collection('notifications').where('read', '==', false).get();
    const batch = adminDb.batch();
    snap.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
    return NextResponse.json({ ok: true, marked: snap.size });
  }
  return NextResponse.json({ error: 'invalid action' }, { status: 400 });
}
