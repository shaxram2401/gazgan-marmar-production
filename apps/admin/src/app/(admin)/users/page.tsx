import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';
import Topbar from '@/components/layout/Topbar';
import { redirect } from 'next/navigation';
import { AdminUser, ROLE_PERMISSIONS } from '@/types';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

async function getUsers(): Promise<AdminUser[]> {
  const snap = await adminDb.collection('adminUsers').orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => {
    const data = d.data();
    return {
      uid: d.id, ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() ?? null
    } as unknown as AdminUser;
  });
}

export default async function Page() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== 'super_admin') redirect('/dashboard');
  const users = await getUsers();
  return (
    <>
      <Topbar title="Team & Roles" subtitle="Permissions · Manage admin access" />
      <div className="px-6 md:px-10 py-8"><UsersClient initial={users} currentUid={admin.uid} permissions={ROLE_PERMISSIONS} /></div>
    </>
  );
}
