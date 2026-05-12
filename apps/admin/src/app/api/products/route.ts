import { NextRequest } from 'next/server';
import { createDoc } from '@/lib/crud.server';
import { productSchema } from '@/lib/schemas';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  return createDoc(req, { collection: 'products', schema: productSchema, resource: 'products' });
}
