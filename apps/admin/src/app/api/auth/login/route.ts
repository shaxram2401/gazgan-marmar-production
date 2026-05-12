import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/auth.server';
import { adminAuth, adminDb } from '@/lib/firebase.admin';
import { rateLimit, recordFailedLogin, isLockedOut, clearFailedLogins, clientIp } from '@/lib/ratelimit.server';
import { notify, logActivity } from '@/lib/audit.server';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

const MAX_PER_MIN = Number(process.env.RATE_LIMIT_LOGIN || 5);

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  try {
    // 1. Rate limit per IP
    const rl = await rateLimit({ key: `login:${ip}`, limit: MAX_PER_MIN });
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many attempts. Retry in ${rl.retryAfter}s.` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      );
    }

    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: 'idToken required' }, { status: 400 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email || '';

    // 2. Brute force lockout
    if (await isLockedOut(email, ip)) {
      await notify({
        type: 'system',
        title: 'Login lockout triggered',
        message: `Account ${email} from ${ip} is locked out due to repeated failed attempts.`,
        link: '/activity'
      });
      return NextResponse.json({ error: 'Account temporarily locked. Try again later.' }, { status: 423 });
    }

    // 3. Verify admin record + active
    const adminSnap = await adminDb.collection('adminUsers').doc(decoded.uid).get();
    if (!adminSnap.exists || !(adminSnap.data() as { active: boolean }).active) {
      await recordFailedLogin(email, ip);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 4. Mint session cookie
    await createSessionCookie(idToken);
    await clearFailedLogins(email, ip);

    // 5. Update last login + log
    await adminDb.collection('adminUsers').doc(decoded.uid).set(
      { lastLoginAt: FieldValue.serverTimestamp(), lastLoginIp: ip },
      { merge: true }
    );
    const data = adminSnap.data()!;
    await logActivity({
      actor: { uid: decoded.uid, email, displayName: data.displayName, role: data.role, active: true } as any,
      action: 'login',
      resource: 'auth',
      resourceLabel: ip
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Record failure if email known from token (otherwise just generic)
    try {
      const { idToken } = await req.clone().json();
      if (idToken) {
        const d = await adminAuth.verifyIdToken(idToken).catch(() => null);
        if (d?.email) await recordFailedLogin(d.email, ip);
      }
    } catch {}
    return NextResponse.json({ error: 'Login failed' }, { status: 401 });
  }
}

