import 'server-only';
import { adminDb } from './firebase.admin';
import { FieldValue } from 'firebase-admin/firestore';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface AlertPayload {
  severity: AlertSeverity;
  module: string;            // 'auth' | 'inquiry' | 'upload' | 'cron' | 'system'
  title: string;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * Central alert sink:
 * 1. Persists to Firestore `alerts` collection (always)
 * 2. Posts to ALERT_WEBHOOK_URL if configured (Slack/Discord)
 * 3. Falls through silently on transport errors
 */
export async function emitAlert(p: AlertPayload): Promise<void> {
  // 1) Persist
  try {
    await adminDb.collection('alerts').add({
      ...p,
      createdAt: FieldValue.serverTimestamp(),
      acknowledged: false
    });
  } catch (e) {
    console.error('[alert] persist failed', e);
  }

  // 2) Webhook
  const url = process.env.ALERT_WEBHOOK_URL;
  if (url) {
    try {
      const emoji = p.severity === 'critical' ? '🚨' : p.severity === 'warning' ? '⚠️' : 'ℹ️';
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${emoji} *[${p.severity.toUpperCase()}] ${p.module}* — ${p.title}\n${p.message}`,
          attachments: p.context ? [{ text: '```' + JSON.stringify(p.context, null, 2) + '```' }] : undefined
        })
      });
    } catch (e) {
      console.error('[alert] webhook failed', e);
    }
  }
}

/* Convenience helpers */
export const Alert = {
  inquiry: (title: string, message: string, ctx?: Record<string, unknown>) =>
    emitAlert({ severity: 'warning', module: 'inquiry', title, message, context: ctx }),
  upload: (title: string, message: string, ctx?: Record<string, unknown>) =>
    emitAlert({ severity: 'warning', module: 'upload', title, message, context: ctx }),
  security: (title: string, message: string, ctx?: Record<string, unknown>) =>
    emitAlert({ severity: 'critical', module: 'auth', title, message, context: ctx }),
  system: (title: string, message: string, ctx?: Record<string, unknown>) =>
    emitAlert({ severity: 'info', module: 'system', title, message, context: ctx })
};
