import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { read } = await req.json();
  await adminDb.collection('notifications').doc(params.id).update({ read: !!read });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await adminDb.collection('notifications').doc(params.id).delete();
  return NextResponse.json({ ok: true });
}
