/**
 * Restore from a Firestore export held in GCS.
 *
 * Usage:
 *   FIREBASE_ADMIN_CREDENTIALS_B64=$(cat sa.b64) \
 *     npx tsx scripts/restore.ts gs://gazgan-marmo-backups/firestore-backups/2026-01-15...
 *
 * The export must have been produced via Cloud Firestore export (the same
 * format our /api/admin/backup endpoint creates).
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { GoogleAuth } from 'google-auth-library';

const [, , inputUri] = process.argv;
if (!inputUri || !inputUri.startsWith('gs://')) {
  console.error('Usage: npx tsx scripts/restore.ts gs://<bucket>/<path>');
  process.exit(1);
}

const b64 = process.env.FIREBASE_ADMIN_CREDENTIALS_B64;
if (!b64) { console.error('FIREBASE_ADMIN_CREDENTIALS_B64 not set'); process.exit(1); }
const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId: sa.project_id, clientEmail: sa.client_email, privateKey: sa.private_key })
  });
}

async function getAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    credentials: { client_email: sa.client_email, private_key: sa.private_key },
    scopes: ['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/cloud-platform']
  });
  const client = await auth.getClient();
  const t = await client.getAccessToken();
  if (!t.token) throw new Error('No access token');
  return t.token;
}

async function main() {
  console.log('⚠  This will OVERWRITE matching documents in:', sa.project_id);
  console.log('   From:', inputUri);
  console.log('   Continue in 5s... (Ctrl+C to abort)');
  await new Promise(r => setTimeout(r, 5000));

  const token = await getAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default):importDocuments`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputUriPrefix: inputUri })
  });
  const json = await res.json();
  if (!res.ok) { console.error('Restore failed:', json); process.exit(1); }
  console.log('✓ Restore operation started:', json.name);
  console.log('  Monitor in Firebase Console → Firestore → Imports');
}

main().catch(e => { console.error(e); process.exit(1); });
