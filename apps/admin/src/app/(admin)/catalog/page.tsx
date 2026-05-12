import { adminDb } from '@/lib/firebase.admin';
import Topbar from '@/components/layout/Topbar';
import { CatalogVersion } from '@/types';
import CatalogClient from './CatalogClient';

export const dynamic = 'force-dynamic';

async function getAll(): Promise<CatalogVersion[]> {
  const snap = await adminDb.collection('catalogVersions').orderBy('uploadedAt', 'desc').get();
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id, ...data,
      uploadedAt: data.uploadedAt?.toDate?.()?.toISOString() ?? null
    } as unknown as CatalogVersion;
  });
}

export default async function Page() {
  const versions = await getAll();
  const active = versions.find(v => v.active);
  return (
    <>
      <Topbar title="Catalog PDF" subtitle="Document · Version control & analytics" />
      <div className="px-6 md:px-10 py-8"><CatalogClient initial={versions} active={active || null} /></div>
    </>
  );
}
