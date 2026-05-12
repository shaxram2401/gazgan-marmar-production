import 'server-only';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

function init(): App {
  if (getApps().length) return getApps()[0]!;
  const b64 = process.env.FIREBASE_ADMIN_CREDENTIALS_B64;
  if (!b64) throw new Error('FIREBASE_ADMIN_CREDENTIALS_B64 not set');
  const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  return initializeApp({
    credential: cert({
      projectId: json.project_id,
      clientEmail: json.client_email,
      privateKey: json.private_key
    })
  });
}

adminApp = init();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);

/* Verify session cookie and return decoded token (uid + custom claims) */
export async function verifySession(sessionCookie?: string) {
  if (!sessionCookie) return null;
  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}
