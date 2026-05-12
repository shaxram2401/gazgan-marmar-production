import { adminDb } from '@/lib/firebase.admin';
import Topbar from '@/components/layout/Topbar';
import { Product } from '@/types';
import ProductsClient from './ProductsClient';

export const dynamic = 'force-dynamic';

async function getProducts(): Promise<Product[]> {
  const snap = await adminDb.collection('products').orderBy('order', 'asc').get();
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null
    } as unknown as Product;
  });
}

export default async function ProductsPage() {
  const products = await getProducts();
  return (
    <>
      <Topbar title="Products" subtitle="Catalog · Manage stone collection" />
      <div className="px-6 md:px-10 py-8">
        <ProductsClient initial={products} />
      </div>
    </>
  );
}
