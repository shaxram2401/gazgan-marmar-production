/**
 * Bootstrap the first super_admin account.
 *
 * Usage:
 *   1. Set FIREBASE_ADMIN_CREDENTIALS_B64 in your env.
 *   2. Run:  npx tsx scripts/createSuperAdmin.ts admin@gazganmarmo.uz "StrongPass123!" "Akmal Karimov"
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const [, , email, password, name] = process.argv;
if (!email || !password) {
  console.error('Usage: npx tsx scripts/createSuperAdmin.ts <email> <password> [name]');
  process.exit(1);
}

const b64 = process.env.FIREBASE_ADMIN_CREDENTIALS_B64;
if (!b64) { console.error('FIREBASE_ADMIN_CREDENTIALS_B64 not set'); process.exit(1); }
const sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: sa.project_id, clientEmail: sa.client_email, privateKey: sa.private_key
    })
  });
}

const auth = getAuth();
const db = getFirestore();

async function main() {
  let user;
  try {
    user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { password, displayName: name || email });
    console.log('Updated existing user:', user.uid);
  } catch {
    user = await auth.createUser({ email, password, displayName: name || email, emailVerified: true });
    console.log('Created user:', user.uid);
  }
  await auth.setCustomUserClaims(user.uid, { role: 'super_admin' });
  await db.collection('adminUsers').doc(user.uid).set({
    email,
    displayName: name || email,
    role: 'super_admin',
    active: true,
    createdAt: FieldValue.serverTimestamp()
  }, { merge: true });
  console.log('✓ Super admin ready:', email);
}

main().catch(e => { console.error(e); process.exit(1); });
