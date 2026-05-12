import { adminDb } from '@/lib/firebase.admin';
import Topbar from '@/components/layout/Topbar';
import { GalleryItem } from '@/types';
import GalleryClient from './GalleryClient';

export const dynamic = 'force-dynamic';

async function getAll(): Promise<GalleryItem[]> {
  const snap = await adminDb.collection('gallery').orderBy('order', 'asc').get();
  return snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null } as unknown as GalleryItem;
  });
}

export default async function Page() {
  const items = await getAll();
  return (
    <>
      <Topbar title="Gallery" subtitle="Media · Project & quarry imagery" />
      <div className="px-6 md:px-10 py-8"><GalleryClient initial={items} /></div>
    </>
  );
}
