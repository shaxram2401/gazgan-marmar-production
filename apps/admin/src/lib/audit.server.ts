import 'server-only';
import { adminDb } from './firebase.admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { ActivityAction, NotificationType } from '@/types';
import type { AdminUser } from '@/types';
import { headers } from 'next/headers';

export async function logActivity(opts: {
  actor: AdminUser;
  action: ActivityAction;
  resource: string;
  resourceId?: string;
  resourceLabel?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
}) {
  const h = headers();
  await adminDb.collection('auditLogs').add({
    action: opts.action,
    resource: opts.resource,
    resourceId: opts.resourceId ?? null,
    resourceLabel: opts.resourceLabel ?? null,
    changes: opts.changes ?? null,
    actorUid: opts.actor.uid,
    actorEmail: opts.actor.email,
    actorName: opts.actor.displayName ?? opts.actor.email,
    ip: h.get('x-forwarded-for') ?? null,
    userAgent: h.get('user-agent') ?? null,
    createdAt: FieldValue.serverTimestamp()
  });
}

export async function notify(opts: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  meta?: Record<string, unknown>;
}) {
  await adminDb.collection('notifications').add({
    type: opts.type,
    title: opts.title,
    message: opts.message,
    link: opts.link ?? null,
    meta: opts.meta ?? null,
    read: false,
    createdAt: FieldValue.serverTimestamp()
  });
}
