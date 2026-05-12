import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';
import { userSchema } from '@/lib/schemas';
import { logActivity } from '@/lib/audit.server';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== 'super_admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const snap = await adminDb.collection('adminUsers').orderBy('createdAt', 'desc').get();
  const users = snap.docs.map(d => {
    const data = d.data();
    return {
      uid: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() ?? null
    };
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== 'super_admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = userSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!parsed.data.password) return NextResponse.json({ error: 'Password required for new user' }, { status: 400 });

  try {
    let user;
    try {
      user = await adminAuth.getUserByEmail(parsed.data.email);
      await adminAuth.updateUser(user.uid, {
        displayName: parsed.data.displayName,
        password: parsed.data.password
      });
    } catch {
      user = await adminAuth.createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        displayName: parsed.data.displayName,
        emailVerified: true
      });
    }

    await adminAuth.setCustomUserClaims(user.uid, { role: parsed.data.role });
    await adminDb.collection('adminUsers').doc(user.uid).set({
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      role: parsed.data.role,
      active: parsed.data.active,
      createdAt: FieldValue.serverTimestamp()
    }, { merge: true });

    await logActivity({
      actor: admin, action: 'create', resource: 'users',
      resourceId: user.uid, resourceLabel: parsed.data.email
    });

    return NextResponse.json({ ok: true, uid: user.uid });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 });
  }
}
