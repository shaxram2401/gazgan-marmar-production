import { NextRequest } from 'next/server';
import { updateDoc, deleteDoc } from '@/lib/crud.server';
import { testimonialSchema } from '@/lib/schemas';
export const runtime = 'nodejs';
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return updateDoc(req, params.id, { collection: 'testimonials', schema: testimonialSchema, resource: 'testimonials' });
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return deleteDoc(params.id, { collection: 'testimonials', resource: 'testimonials' });
}
