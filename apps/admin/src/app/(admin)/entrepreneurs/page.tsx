import { adminDb } from '@/lib/firebase.admin';
import Topbar from '@/components/layout/Topbar';
import { Entrepreneur } from '@/types';
import EntrepreneursClient from './EntrepreneursClient';

export const dynamic = 'force-dynamic';

async function getAll(): Promise<Entrepreneur[]> {
  const snap = await adminDb.collection('entrepreneurs').orderBy('priority', 'asc').get();
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id, ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null
    } as unknown as Entrepreneur;
  });
}

export default async function Page() {
  const items = await getAll();
  return (
    <>
      <Topbar title="Entrepreneurs" subtitle="Alliance · Manage member companies" />
      <div className="px-6 md:px-10 py-8">
        <EntrepreneursClient initial={items} />
      </div>
    </>
  );
}
