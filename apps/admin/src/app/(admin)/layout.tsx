import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth.server';
import Sidebar from '@/components/layout/Sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/login');
  return (
    <div className="min-h-screen flex bg-paper">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
