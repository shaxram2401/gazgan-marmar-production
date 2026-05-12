import 'server-only';
import { adminDb } from './firebase.admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);

/**
 * Sliding-window rate limiter backed by Firestore.
 * Returns { ok, remaining, retryAfter }.
 */
export async function rateLimit(opts: {
  key: string;                  // e.g. `login:1.2.3.4` or `tracking:ip`
  limit: number;
  windowMs?: number;
}): Promise<{ ok: boolean; remaining: number; retryAfter: number }> {
  const windowMs = opts.windowMs ?? WINDOW_MS;
  const now = Date.now();
  const cutoff = now - windowMs;
  const docRef = adminDb.collection('rateLimits').doc(opts.key);

  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const hits: number[] = (snap.exists ? (snap.data()?.hits as number[]) : []) || [];
    const fresh = hits.filter(t => t > cutoff);

    if (fresh.length >= opts.limit) {
      const oldest = Math.min(...fresh);
      return { ok: false, remaining: 0, retryAfter: Math.ceil((oldest + windowMs - now) / 1000) };
    }

    fresh.push(now);
    tx.set(docRef, { hits: fresh, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { ok: true, remaining: opts.limit - fresh.length, retryAfter: 0 };
  });
}

/* Track failed logins per IP + email for brute-force lockout */
export async function recordFailedLogin(email: string, ip: string) {
  const docRef = adminDb.collection('loginAttempts').doc(`${email}__${ip}`);
  await docRef.set({
    email, ip,
    count: FieldValue.increment(1),
    lastAttempt: FieldValue.serverTimestamp()
  }, { merge: true });
}

export async function isLockedOut(email: string, ip: string, threshold = 8, lockoutMin = 15): Promise<boolean> {
  const snap = await adminDb.collection('loginAttempts').doc(`${email}__${ip}`).get();
  if (!snap.exists) return false;
  const d = snap.data()!;
  const last = (d.lastAttempt as Timestamp | undefined)?.toMillis?.() ?? 0;
  if ((d.count as number) >= threshold && Date.now() - last < lockoutMin * 60_000) return true;
  return false;
}

export async function clearFailedLogins(email: string, ip: string) {
  await adminDb.collection('loginAttempts').doc(`${email}__${ip}`).delete().catch(() => {});
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
