'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase.client';
import { AdminUser, Role } from '@/types';

interface Ctx {
  user: User | null;
  admin: AdminUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<Ctx>({ user: null, admin: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'adminUsers', u.uid));
        if (snap.exists()) {
          setAdmin({ uid: u.uid, ...(snap.data() as Omit<AdminUser, 'uid'>) });
        } else {
          setAdmin(null);
        }
      } else {
        setAdmin(null);
      }
      setLoading(false);
    });
  }, []);

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    await fbSignOut(auth);
    window.location.href = '/login';
  }

  return <AuthCtx.Provider value={{ user, admin, loading, signOut }}>{children}</AuthCtx.Provider>;
}

export function useAuth() { return useContext(AuthCtx); }

export function hasRole(admin: AdminUser | null, ...roles: Role[]) {
  return !!admin && roles.includes(admin.role);
}
