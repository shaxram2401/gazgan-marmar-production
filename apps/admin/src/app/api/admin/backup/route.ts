import { NextRequest, NextResponse } from 'next/server';
import { verifyCron } from '@/lib/cron.server';
import { adminDb } from '@/lib/firebase.admin';
import { Alert } from '@/lib/alerts.server';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

/**
 * POST /api/admin/backup
 * Cron-triggered (Vercel cron schedules → calls with ?token=$CRON_SECRET).
 *
 * Uses Firestore Admin export to dump all collections to GCS bucket.
 * Bucket must be in same project; service account must have
 * `Cloud Datastore Import Export Admin` role.
 */
async function runBackup() {
  const bucket = process.env.BACKUP_BUCKET;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
  if (!bucket) throw new Error('BACKUP_BUCKET not configured');

  const accessToken = await getAccessToken();
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const outputUri = `gs://${bucket}/firestore-backups/${ts}`;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default):exportDocuments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      outputUriPrefix: outputUri,
      collectionIds: [
        'products', 'entrepreneurs', 'gallery', 'testimonials',
        'exportCountries', 'inquiries', 'catalogVersions',
        'settings', 'adminUsers', 'auditLogs', 'notifications'
      ]
    })
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Firestore export failed: ${JSON.stringify(body)}`);

  await adminDb.collection('backups').add({
    type: 'firestore_export',
    outputUri,
    operation: body.name,
    triggeredBy: 'cron',
    createdAt: FieldValue.serverTimestamp()
  });

  return { ok: true, outputUri, operation: body.name };
}

/* Get an OAuth access token from the admin SDK credentials */
async function getAccessToken(): Promise<string> {
  // Lazy import to keep client bundle clean
  const { GoogleAuth } = await import('google-auth-library');
  const b64 = process.env.FIREBASE_ADMIN_CREDENTIALS_B64!;
  const credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  const auth = new GoogleAuth({
    credentials: { client_email: credentials.client_email, private_key: credentials.private_key },
    scopes: ['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/cloud-platform']
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error('Failed to mint access token');
  return token.token;
}

export async function POST(req: NextRequest) {
  if (!verifyCron(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const result = await runBackup();
    await Alert.system('Daily backup completed', `Firestore exported to ${result.outputUri}`);
    return NextResponse.json(result);
  } catch (e) {
    await Alert.system('Backup FAILED', e instanceof Error ? e.message : 'unknown');
    return NextResponse.json({ error: 'backup failed' }, { status: 500 });
  }
}

// Allow GET for Vercel cron simplicity
export const GET = POST;
