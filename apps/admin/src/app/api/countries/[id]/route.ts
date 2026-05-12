import { NextRequest } from 'next/server';
import { updateDoc, deleteDoc } from '@/lib/crud.server';
import { countrySchema } from '@/lib/schemas';
export const runtime = 'nodejs';
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return updateDoc(req, params.id, { collection: 'exportCountries', schema: countrySchema, resource: 'countries' });
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return deleteDoc(params.id, { collection: 'exportCountries', resource: 'countries' });
}
