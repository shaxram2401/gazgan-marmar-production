import { adminDb } from '@/lib/firebase.admin';
import Topbar from '@/components/layout/Topbar';
import { Testimonial } from '@/types';
import TestimonialsClient from './TestimonialsClient';

export const dynamic = 'force-dynamic';

async function getAll(): Promise<Testimonial[]> {
  const snap = await adminDb.collection('testimonials').orderBy('order', 'asc').get();
  return snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null } as unknown as Testimonial;
  });
}

export default async function Page() {
  const items = await getAll();
  return (
    <>
      <Topbar title="Testimonials" subtitle="Trust · Buyer & partner quotes" />
      <div className="px-6 md:px-10 py-8"><TestimonialsClient initial={items} /></div>
    </>
  );
}
