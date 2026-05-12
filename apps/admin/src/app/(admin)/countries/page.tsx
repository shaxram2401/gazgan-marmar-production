import { adminDb } from '@/lib/firebase.admin';
import Topbar from '@/components/layout/Topbar';
import { ExportCountry } from '@/types';
import CountriesClient from './CountriesClient';

export const dynamic = 'force-dynamic';

async function getAll(): Promise<ExportCountry[]> {
  const snap = await adminDb.collection('exportCountries').orderBy('order', 'asc').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as ExportCountry));
}

export default async function Page() {
  const items = await getAll();
  return (
    <>
      <Topbar title="Export Countries" subtitle="Global Reach · Manage export destinations" />
      <div className="px-6 md:px-10 py-8"><CountriesClient initial={items} /></div>
    </>
  );
}
