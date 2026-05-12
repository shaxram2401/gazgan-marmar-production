import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin, canWrite } from '@/lib/auth.server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canWrite(admin.role, 'leads')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { text } = await req.json();
  if (!text || typeof text !== 'string' || !text.trim())
    return NextResponse.json({ error: 'text required' }, { status: 400 });

  const note = {
    text: text.trim().slice(0, 2000),
    author: admin.displayName || admin.email,
    authorEmail: admin.email,
    createdAt: Timestamp.now()
  };

  await adminDb.collection('inquiries').doc(params.id).update({
    notes: FieldValue.arrayUnion(note),
    updatedAt: FieldValue.serverTimestamp()
  });

  return NextResponse.json({ ok: true });
}
