'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase.client';
import { Button, Input, Spinner } from '@/components/ui';
import { toast } from 'sonner';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Spinner size={24} /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Verify admin role
      const snap = await getDoc(doc(db, 'adminUsers', cred.user.uid));
      if (!snap.exists() || !(snap.data() as { active: boolean }).active) {
        await auth.signOut();
        throw new Error('Access denied. Contact your administrator.');
      }
      // Mint server session cookie
      const idToken = await cred.user.getIdToken();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      if (!res.ok) throw new Error('Session creation failed');
      router.push(next);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      toast.error(msg.includes('auth/') ? 'Invalid credentials' : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — visual */}
      <div className="hidden lg:flex w-1/2 bg-ink text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1600&q=80')",
                   backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/95 via-ink/80 to-ink/60" />
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 border border-white flex items-center justify-center font-serif italic text-xl">G</span>
            <span className="font-serif tracking-[.18em] uppercase text-sm">Gazgan Marmo</span>
          </div>
          <div>
            <div className="text-[11px] tracking-[.32em] uppercase text-gold mb-4">Admin Console · v1.0</div>
            <h1 className="font-serif text-5xl leading-tight font-light max-w-md">Manage the alliance,<br /><em className="text-gold not-italic">from one</em><br />unified console.</h1>
            <p className="mt-6 text-sm text-white/55 max-w-sm leading-relaxed">Products, entrepreneurs, leads, and analytics — managed in real time across the Gazgan Marmo platform.</p>
          </div>
          <div className="text-[10px] tracking-[.28em] uppercase text-white/35">
            Authorized personnel only · Activity is logged
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="text-[10px] tracking-[.32em] uppercase text-gold mb-3 font-medium">Secure sign in</div>
          <h2 className="font-serif text-4xl font-light text-ink mb-2">Welcome back.</h2>
          <p className="text-sm text-muted mb-10">Sign in with your Gazgan Marmo administrator account.</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
              Sign in →
            </Button>
          </form>

          <p className="mt-10 text-xs text-muted">
            Lost access? Contact <a href="mailto:admin@gazganmarmo.uz" className="text-gold hover:underline">admin@gazganmarmo.uz</a>
          </p>
        </div>
      </div>
    </div>
  );
}
