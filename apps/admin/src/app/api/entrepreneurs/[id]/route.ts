import { NextRequest } from 'next/server';
import { updateDoc, deleteDoc } from '@/lib/crud.server';
import { entrepreneurSchema } from '@/lib/schemas';
export const runtime = 'nodejs';
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return updateDoc(req, params.id, { collection: 'entrepreneurs', schema: entrepreneurSchema, resource: 'entrepreneurs' });
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return deleteDoc(params.id, { collection: 'entrepreneurs', resource: 'entrepreneurs' });
}
