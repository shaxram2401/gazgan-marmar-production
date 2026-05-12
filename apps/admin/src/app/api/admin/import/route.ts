import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';
import { logActivity } from '@/lib/audit.server';

export const runtime = 'nodejs';

const ALLOWED: Record<string, string> = {
  products: 'products',
  entrepreneurs: 'entrepreneurs',
  testimonials: 'testimonials',
  exportCountries: 'exportCountries'
};

/**
 * POST /api/admin/import?resource=products
 * Body: { rows: [...] }
 * Super-admin only. Used for disaster recovery and bulk seeding.
 */
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (admin.role !== 'super_admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const resource = req.nextUrl.searchParams.get('resource') || '';
  const collection = ALLOWED[resource];
  if (!collection) return NextResponse.json({ error: 'invalid resource' }, { status: 400 });

  const body = await req.json();
  const rows = Array.isArray(body?.rows) ? body.rows : null;
  if (!rows) return NextResponse.json({ error: 'rows array required' }, { status: 400 });
  if (rows.length > 500) return NextResponse.json({ error: 'max 500 rows per request' }, { status: 400 });

  let inserted = 0;
  const batch = adminDb.batch();
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue;
    const { id, ...data } = r as Record<string, unknown>;
    const ref = id ? adminDb.collection(collection).doc(String(id)) : adminDb.collection(collection).doc();
    batch.set(ref, { ...data, importedAt: new Date(), importedBy: admin.uid }, { merge: true });
    inserted++;
  }
  await batch.commit();

  await logActivity({
    actor: admin, action: 'create', resource: 'import',
    resourceLabel: `Imported ${inserted} ${resource}`
  });

  return NextResponse.json({ ok: true, inserted });
}
