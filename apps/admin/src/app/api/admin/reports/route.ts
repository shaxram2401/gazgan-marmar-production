import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';
import { logActivity } from '@/lib/audit.server';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface LeadDoc {
  country?: string;
  product?: string;
  leadType?: string;
  status?: string;
  quantity?: string;
  company?: string;
  createdAt?: { toDate?: () => Date };
}

/**
 * GET /api/admin/reports?type=investor|leads|monthly[&format=html|pdf]
 *
 * Generates a printable report. Returns inline HTML by default
 * (works with browser "Save as PDF"). When format=pdf, attempts
 * to render via Puppeteer if @sparticuz/chromium + puppeteer-core
 * are installed (optional dependency).
 */
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const type = (req.nextUrl.searchParams.get('type') || 'investor') as 'investor' | 'leads' | 'monthly';
  const format = req.nextUrl.searchParams.get('format') || 'html';

  const html = await buildReport(type);

  await logActivity({
    actor: admin, action: 'update', resource: 'reports',
    resourceLabel: `${type} report (${format})`
  });

  const filename = `gazgan-${type}-${new Date().toISOString().slice(0, 10)}`;

  if (format === 'pdf') {
    try {
      const pdf = await renderPdf(html);
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`
        }
      });
    } catch {
      // Graceful fallback to HTML if PDF stack unavailable on this deployment
    }
  }

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}.html"`
    }
  });
}

/* ============================================================
   Report builders
============================================================ */
async function buildReport(type: 'investor' | 'leads' | 'monthly'): Promise<string> {
  if (type === 'investor') return investorReport();
  if (type === 'leads') return leadsReport();
  return monthlyReport();
}

async function fetchLeads(sinceDays: number): Promise<LeadDoc[]> {
  const since = new Date(Date.now() - sinceDays * 86_400_000);
  const snap = await adminDb.collection('inquiries')
    .where('createdAt', '>=', since)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(d => d.data() as LeadDoc);
}

/* ---------- Investor report ---------- */
async function investorReport(): Promise<string> {
  const [leads90, leads30, products, entrepreneurs, countries, catalog] = await Promise.all([
    fetchLeads(90),
    fetchLeads(30),
    adminDb.collection('products').count().get(),
    adminDb.collection('entrepreneurs').count().get(),
    adminDb.collection('exportCountries').count().get(),
    adminDb.collection('catalogVersions').get()
  ]);

  const won = leads90.filter(l => l.status === 'won').length;
  const qualified = leads90.filter(l => ['qualified', 'negotiation', 'won'].includes(l.status || '')).length;
  const conversion = leads90.length ? ((won / leads90.length) * 100).toFixed(1) : '0';
  const qualRate = leads90.length ? ((qualified / leads90.length) * 100).toFixed(1) : '0';
  const totalDownloads = catalog.docs.reduce((s, d) => s + ((d.data().downloadCount as number) || 0), 0);

  const byCountry = topGroup(leads90, l => l.country);
  const byProduct = topGroup(leads90, l => l.product);
  const byType = topGroup(leads90, l => l.leadType);

  return layout('Investor Report · Q-on-Q', `
    <section class="hero">
      <div class="eyebrow">Confidential · Investor Brief</div>
      <h1>Gazgan Marmo Alliance</h1>
      <p class="subtitle">Operating performance summary · last 90 days</p>
      <div class="meta">Generated ${new Date().toLocaleString('en-GB')}</div>
    </section>

    <section>
      <h2>Executive Summary</h2>
      <div class="kpis">
        ${kpi('Total inquiries', leads90.length)}
        ${kpi('Qualified rate', qualRate + '%')}
        ${kpi('Conversion rate', conversion + '%')}
        ${kpi('Deals won', won)}
        ${kpi('Inquiries (30d)', leads30.length)}
        ${kpi('Catalog downloads', totalDownloads)}
      </div>
    </section>

    <section>
      <h2>Platform footprint</h2>
      <div class="kpis">
        ${kpi('Products in catalog', products.data().count)}
        ${kpi('Alliance entrepreneurs', entrepreneurs.data().count)}
        ${kpi('Export countries', countries.data().count)}
        ${kpi('Catalog versions', catalog.size)}
      </div>
    </section>

    <section>
      <h2>Top markets · 90 days</h2>
      ${table(['Country', 'Inquiries', '% share'], byCountry.slice(0, 10).map(([k, c]) => [
        k || '—', String(c), pct(c, leads90.length)
      ]))}
    </section>

    <section>
      <h2>Most-requested products</h2>
      ${table(['Product', 'Inquiries', '% share'], byProduct.slice(0, 8).map(([k, c]) => [
        k || '—', String(c), pct(c, leads90.length)
      ]))}
    </section>

    <section>
      <h2>Buyer profile mix</h2>
      ${table(['Profile', 'Inquiries', '% share'], byType.map(([k, c]) => [
        (k || '—').toString().replace('_', ' '), String(c), pct(c, leads90.length)
      ]))}
    </section>

    <footer class="report-foot">
      Gazgan Marmo Alliance LLC · License №UZ-EXP-2024-1142 · gazganmarmo.uz<br>
      This document is confidential and prepared for the named recipient only.
    </footer>
  `);
}

/* ---------- Leads list ---------- */
async function leadsReport(): Promise<string> {
  const leads = await fetchLeads(30);
  const rows = leads.slice(0, 200).map(l => [
    l.createdAt?.toDate?.()?.toLocaleDateString('en-GB') || '—',
    l.company || '—',
    l.country || '—',
    (l.leadType || '').replace('_', ' '),
    l.product || '—',
    l.quantity || '—',
    l.status || '—'
  ]);

  return layout('Leads Report · Last 30 days', `
    <section class="hero">
      <div class="eyebrow">Sales · CRM Snapshot</div>
      <h1>Leads · Last 30 days</h1>
      <p class="subtitle">${leads.length} total inquir${leads.length === 1 ? 'y' : 'ies'}</p>
      <div class="meta">Generated ${new Date().toLocaleString('en-GB')}</div>
    </section>
    <section>
      ${table(['Date', 'Company', 'Country', 'Type', 'Product', 'Quantity', 'Status'], rows)}
      ${leads.length > 200 ? `<p class="note">Showing 200 of ${leads.length}. Export full CSV from Admin → Export.</p>` : ''}
    </section>
  `);
}

/* ---------- Monthly export report ---------- */
async function monthlyReport(): Promise<string> {
  const leads = await fetchLeads(30);
  const won = leads.filter(l => l.status === 'won').length;
  const byCountry = topGroup(leads, l => l.country);
  const byProduct = topGroup(leads, l => l.product);

  return layout('Monthly Export Report', `
    <section class="hero">
      <div class="eyebrow">Operations · Monthly</div>
      <h1>Monthly Export Brief</h1>
      <p class="subtitle">Rolling 30-day operational snapshot</p>
      <div class="meta">Generated ${new Date().toLocaleString('en-GB')}</div>
    </section>
    <section>
      <h2>Key indicators</h2>
      <div class="kpis">
        ${kpi('Inquiries', leads.length)}
        ${kpi('Deals won', won)}
        ${kpi('Conversion', leads.length ? ((won / leads.length) * 100).toFixed(1) + '%' : '0%')}
        ${kpi('Active markets', byCountry.length)}
      </div>
    </section>
    <section>
      <h2>Markets</h2>
      ${table(['Country', 'Inquiries'], byCountry.slice(0, 12).map(([k, c]) => [k || '—', String(c)]))}
    </section>
    <section>
      <h2>Product demand</h2>
      ${table(['Product', 'Inquiries'], byProduct.slice(0, 10).map(([k, c]) => [k || '—', String(c)]))}
    </section>
  `);
}

/* ============================================================
   PDF renderer (optional)
============================================================ */
async function renderPdf(html: string): Promise<Buffer> {
  const chromium = (await import('@sparticuz/chromium')).default;
  const puppeteer = await import('puppeteer-core');
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
  });
  await browser.close();
  return Buffer.from(pdf);
}

/* ============================================================
   View helpers
============================================================ */
function layout(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8" />
<title>${title} · Gazgan Marmo</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }
  *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter','Helvetica Neue',Arial,sans-serif; color: #0a0a0a; line-height: 1.55; font-size: 12px; }
  .container { max-width: 780px; margin: 0 auto; padding: 32px 0; }
  .hero { border-bottom: 1px solid #e6e6e6; padding-bottom: 28px; margin-bottom: 36px; }
  .eyebrow { font-size: 9px; letter-spacing: .28em; text-transform: uppercase; color: #b08d4f; font-weight: 600; margin-bottom: 14px; }
  h1 { font-family: 'Georgia','Cormorant Garamond',serif; font-size: 34px; font-weight: 400; letter-spacing: -.01em; line-height: 1.1; }
  h1 em { color: #b08d4f; }
  .subtitle { color: #555; font-size: 13px; margin-top: 8px; }
  .meta { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #888; margin-top: 14px; }
  section { margin-top: 30px; page-break-inside: avoid; }
  h2 { font-family: 'Georgia',serif; font-size: 20px; font-weight: 500; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e6e6e6; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-top: 1px solid #e6e6e6; border-left: 1px solid #e6e6e6; }
  .kpi { padding: 16px 18px; border-right: 1px solid #e6e6e6; border-bottom: 1px solid #e6e6e6; }
  .kpi-value { font-family: 'Georgia',serif; font-size: 26px; font-weight: 400; color: #0a0a0a; }
  .kpi-label { font-size: 9px; letter-spacing: .22em; text-transform: uppercase; color: #888; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 9px 12px; border-bottom: 1px solid #efefef; text-align: left; font-size: 11px; }
  th { font-size: 9px; letter-spacing: .2em; text-transform: uppercase; color: #888; font-weight: 600; background: #fafaf8; }
  tr:last-child td { border-bottom: 0; }
  .report-foot { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e6e6e6; font-size: 9px; color: #888; text-align: center; line-height: 1.8; }
  .note { font-size: 10px; color: #888; margin-top: 12px; font-style: italic; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body><div class="container">${body}</div></body></html>`;
}

function kpi(label: string, value: number | string): string {
  return `<div class="kpi"><div class="kpi-value">${value}</div><div class="kpi-label">${escape(label)}</div></div>`;
}

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return '<p class="note">No data.</p>';
  return `<table><thead><tr>${headers.map(h => `<th>${escape(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${escape(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function topGroup<T>(arr: T[], pick: (x: T) => string | undefined): [string | undefined, number][] {
  const m = new Map<string | undefined, number>();
  arr.forEach(x => { const k = pick(x); m.set(k, (m.get(k) || 0) + 1); });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function pct(n: number, total: number): string {
  if (!total) return '0%';
  return ((n / total) * 100).toFixed(1) + '%';
}

function escape(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)
  );
}
