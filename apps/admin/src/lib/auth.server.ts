import 'server-only';
import { cookies } from 'next/headers';
import { adminAuth, adminDb, verifySession } from './firebase.admin';
import { Role, AdminUser, ROLE_PERMISSIONS } from '@/types';

const COOKIE = process.env.SESSION_COOKIE_NAME || '__gm_session';
const MAX_AGE = Number(process.env.SESSION_MAX_AGE || 60 * 60 * 24 * 5); // 5 days

export async function createSessionCookie(idToken: string) {
  const expiresIn = MAX_AGE * 1000;
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
  cookies().set(COOKIE, sessionCookie, {
    maxAge: MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  return sessionCookie;
}

export async function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const token = cookies().get(COOKIE)?.value;
  const decoded = await verifySession(token);
  if (!decoded) return null;
  const snap = await adminDb.collection('adminUsers').doc(decoded.uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as Omit<AdminUser, 'uid'>;
  if (!data.active) return null;
  return { uid: decoded.uid, ...data } as AdminUser;
}

export function canWrite(role: Role, resource: string): boolean {
  const w = ROLE_PERMISSIONS[role].write;
  return w.includes('*') || w.includes(resource);
}
export function canRead(role: Role, resource: string): boolean {
  const r = ROLE_PERMISSIONS[role].read;
  return r.includes('*') || r.includes(resource);
}
