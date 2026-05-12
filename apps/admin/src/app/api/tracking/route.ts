import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { FieldValue } from 'firebase-admin/firestore';
import { notify } from '@/lib/audit.server';

export const runtime = 'nodejs';

/**
 * Public endpoint — called from the website (no auth) for event tracking.
 * Events: whatsapp_click | catalog_download | inquiry_view
 * Body: { event, meta?, catalogId? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, meta, catalogId } = body as { event: string; meta?: Record<string, unknown>; catalogId?: string };
    if (!event) return NextResponse.json({ error: 'event required' }, { status: 400 });

    // Always log the raw event
    await adminDb.collection('eventLogs').add({
      event,
      meta: meta || null,
      createdAt: FieldValue.serverTimestamp(),
      ip: req.headers.get('x-forwarded-for') ?? null,
      userAgent: req.headers.get('user-agent') ?? null
    });

    // Side-effects
    if (event === 'catalog_download' && catalogId) {
      await adminDb.collection('catalogVersions').doc(catalogId).update({
        downloadCount: FieldValue.increment(1)
      });
      await notify({
        type: 'catalog_download',
        title: 'Catalog Downloaded',
        message: `Someone downloaded the catalog (v${meta?.version ?? '-'}).`,
        link: '/catalog'
      });
    }
    if (event === 'whatsapp_click') {
      await notify({
        type: 'whatsapp_click',
        title: 'WhatsApp Inquiry',
        message: `A visitor opened WhatsApp from ${meta?.page ?? 'the site'}.`,
        link: '/leads'
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'tracking failed' }, { status: 500 });
  }
}
