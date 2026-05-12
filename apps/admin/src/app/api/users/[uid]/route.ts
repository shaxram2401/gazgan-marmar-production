import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';
import { logActivity } from '@/lib/audit.server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

export const runtime = 'nodejs';

const patchSchema = z.object({
  displayName: z.string().min(2).max(120).optional(),
  role: z.enum(['super_admin', 'manager', 'sales_manager']).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8).optional()
});

export async function PATCH(req: NextRequest, { params }: { params: { uid: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== 'super_admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (params.uid === admin.uid) {
    // Self-edit: don't allow role demotion or self-deactivation
    const body = await req.json();
    if (body.role && body.role !== 'super_admin') return NextResponse.json({ error: 'Cannot demote yourself' }, { status: 400 });
    if (body.active === false) return NextResponse.json({ error: 'Cannot deactivate yourself' }, { status: 400 });
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    await applyUpdate(params.uid, parsed.data);
    await logActivity({ actor: admin, action: 'update', resource: 'users', resourceId: params.uid });
    return NextResponse.json({ ok: true });
  }
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  await applyUpdate(params.uid, parsed.data);
  await logActivity({
    actor: admin,
    action: parsed.data.role ? 'role_change' : 'update',
    resource: 'users',
    resourceId: params.uid
  });
  return NextResponse.json({ ok: true });
}

async function applyUpdate(uid: string, data: z.infer<typeof patchSchema>) {
  const authUpdate: Record<string, unknown> = {};
  if (data.displayName) authUpdate.displayName = data.displayName;
  if (data.password) authUpdate.password = data.password;
  if (typeof data.active === 'boolean') authUpdate.disabled = !data.active;
  if (Object.keys(authUpdate).length) await adminAuth.updateUser(uid, authUpdate);
  if (data.role) await adminAuth.setCustomUserClaims(uid, { role: data.role });

  const docUpdate: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (data.displayName) docUpdate.displayName = data.displayName;
  if (data.role) docUpdate.role = data.role;
  if (typeof data.active === 'boolean') docUpdate.active = data.active;
  await adminDb.collection('adminUsers').doc(uid).set(docUpdate, { merge: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { uid: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== 'super_admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (params.uid === admin.uid) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });

  await adminAuth.deleteUser(params.uid).catch(() => {});
  await adminDb.collection('adminUsers').doc(params.uid).delete();
  await logActivity({ actor: admin, action: 'delete', resource: 'users', resourceId: params.uid });
  return NextResponse.json({ ok: true });
}
