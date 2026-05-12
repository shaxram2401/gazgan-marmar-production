import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';
import { logActivity } from '@/lib/audit.server';

export const runtime = 'nodejs';

const ALLOWED = ['leads', 'products', 'entrepreneurs', 'testimonials', 'exportCountries'] as const;
type Allowed = typeof ALLOWED[number];

const COLLECTION_MAP: Record<Allowed, string> = {
  leads: 'inquiries',
  products: 'products',
  entrepreneurs: 'entrepreneurs',
  testimonials: 'testimonials',
  exportCountries: 'exportCountries'
};

/**
 * GET /api/admin/export?resource=leads&format=csv
 * Streams CSV / JSON export. Used for CRM hand-off & investor reports.
 */
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const resource = req.nextUrl.searchParams.get('resource') as Allowed;
  const format = req.nextUrl.searchParams.get('format') || 'csv';
  if (!ALLOWED.includes(resource)) return NextResponse.json({ error: 'invalid resource' }, { status: 400 });

  const snap = await adminDb.collection(COLLECTION_MAP[resource]).get();
  const rows = snap.docs.map(d => {
    const data = d.data();
    const flat: Record<string, unknown> = { id: d.id };
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
        flat[k] = (v as { toDate: () => Date }).toDate().toISOString();
      } else if (Array.isArray(v)) {
        flat[k] = v.join('; ');
      } else if (v && typeof v === 'object') {
        flat[k] = JSON.stringify(v);
      } else {
        flat[k] = v;
      }
    }
    return flat;
  });

  await logActivity({
    actor: admin, action: 'update', resource: 'export',
    resourceLabel: `Exported ${rows.length} ${resource} as ${format}`
  });

  const ts = new Date().toISOString().slice(0, 10);
  const filename = `gazgan-${resource}-${ts}`;

  if (format === 'json') {
    return new NextResponse(JSON.stringify(rows, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}.json"`
      }
    });
  }

  if (rows.length === 0) return new NextResponse('No data', { status: 200 });
  const allKeys = Array.from(rows.reduce((s, r) => { Object.keys(r).forEach(k => s.add(k)); return s; }, new Set<string>()));
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    allKeys.join(','),
    ...rows.map(r => allKeys.map(k => escape(r[k])).join(','))
  ].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`
    }
  });
}
