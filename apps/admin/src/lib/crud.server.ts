import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from './firebase.admin';
import { getCurrentAdmin, canWrite } from './auth.server';
import { logActivity } from './audit.server';
import { FieldValue } from 'firebase-admin/firestore';

type DocData = Record<string, unknown>;

export async function listDocs(collection: string, orderField = 'order', dir: 'asc' | 'desc' = 'asc') {
  const snap = await adminDb.collection(collection).orderBy(orderField, dir).get();
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null
    };
  });
}

export async function createDoc(req: NextRequest, opts: {
  collection: string;
  schema: z.ZodTypeAny;
  resource: string;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canWrite(admin.role, opts.resource))
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = opts.schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data as DocData;
  const docRef = await adminDb.collection(opts.collection).add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    createdBy: admin.uid
  });

  const label = (data.title || data.companyName || data.clientName || data.country || data.version) as string | undefined;
  await logActivity({
    actor: admin, action: 'create', resource: opts.resource,
    resourceId: docRef.id, resourceLabel: label
  });

  return NextResponse.json({ ok: true, id: docRef.id });
}

export async function updateDoc(req: NextRequest, id: string, opts: {
  collection: string;
  schema: z.ZodTypeAny;
  resource: string;
}) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canWrite(admin.role, opts.resource))
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const partial = (opts.schema as unknown as z.ZodObject<z.ZodRawShape>).partial?.() ?? opts.schema;
  const parsed = partial.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data as DocData;
  await adminDb.collection(opts.collection).doc(id).set(
    { ...data, updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.uid },
    { merge: true }
  );

  const label = (data.title || data.companyName || data.clientName || data.country) as string | undefined;
  await logActivity({
    actor: admin, action: 'update', resource: opts.resource,
    resourceId: id, resourceLabel: label
  });
  return NextResponse.json({ ok: true });
}

export async function deleteDoc(id: string, opts: { collection: string; resource: string }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!canWrite(admin.role, opts.resource))
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // Capture label before deletion
  const snap = await adminDb.collection(opts.collection).doc(id).get();
  const data = snap.data() || {};
  const label = (data.title || data.companyName || data.clientName || data.country) as string | undefined;

  await adminDb.collection(opts.collection).doc(id).delete();
  await logActivity({
    actor: admin, action: 'delete', resource: opts.resource,
    resourceId: id, resourceLabel: label
  });
  return NextResponse.json({ ok: true });
}
