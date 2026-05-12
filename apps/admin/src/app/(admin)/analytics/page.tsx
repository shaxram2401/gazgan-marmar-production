import { adminDb } from '@/lib/firebase.admin';
import Topbar from '@/components/layout/Topbar';
import { Card } from '@/components/ui';
import { Lead, CatalogVersion } from '@/types';
import AnalyticsCharts from './AnalyticsCharts';
import { TrendingUp, MessageCircle, Download, Target, DollarSign, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface LeadDoc extends Lead { createdAt?: { toDate?: () => Date } }

async function getAnalytics() {
  const since90 = new Date(); since90.setDate(since90.getDate() - 90);
  const since30 = new Date(); since30.setDate(since30.getDate() - 30);

  const [leadsSnap, catalogSnap, waSnap, dlSnap] = await Promise.all([
    adminDb.collection('inquiries').where('createdAt', '>=', since90).orderBy('createdAt', 'asc').get(),
    adminDb.collection('catalogVersions').get(),
    adminDb.collection('eventLogs').where('event', '==', 'whatsapp_click').where('createdAt', '>=', since30).count().get().catch(() => ({ data: () => ({ count: 0 }) })),
    adminDb.collection('eventLogs').where('event', '==', 'catalog_download').where('createdAt', '>=', since30).count().get().catch(() => ({ data: () => ({ count: 0 }) }))
  ]);

  const leads = leadsSnap.docs.map(d => {
    const data = d.data() as LeadDoc;
    return { ...data, _date: data.createdAt?.toDate?.() ?? new Date() };
  });

  /* Time series: last 12 weeks */
  const weeks: { label: string; count: number; new: number; won: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(); start.setDate(start.getDate() - i * 7 - 6);
    const end = new Date(); end.setDate(end.getDate() - i * 7);
    const slice = leads.filter(l => l._date >= start && l._date <= end);
    weeks.push({
      label: `W${12 - i}`,
      count: slice.length,
      new: slice.filter(l => l.status === 'new').length,
      won: slice.filter(l => l.status === 'won').length
    });
  }

  /* Top countries */
  const byCountry = new Map<string, number>();
  leads.forEach(l => byCountry.set(l.country, (byCountry.get(l.country) || 0) + 1));
  const topCountries = [...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([country, count]) => ({ country, count }));

  /* Top products */
  const byProduct = new Map<string, number>();
  leads.forEach(l => byProduct.set(l.product, (byProduct.get(l.product) || 0) + 1));
  const topProducts = [...byProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([product, count]) => ({ product, count }));

  /* Lead type distribution */
  const byType = new Map<string, number>();
  leads.forEach(l => byType.set(l.leadType, (byType.get(l.leadType) || 0) + 1));
  const typeDistribution = [...byType.entries()].map(([type, count]) => ({ type: type.replace('_', ' '), count }));

  /* Conversion stats */
  const total = leads.length;
  const won = leads.filter(l => l.status === 'won').length;
  const qualified = leads.filter(l => ['qualified', 'negotiation', 'won'].includes(l.status)).length;
  const conversion = total ? ((won / total) * 100).toFixed(1) : '0.0';
  const qualificationRate = total ? ((qualified / total) * 100).toFixed(1) : '0.0';

  /* Status distribution */
  const byStatus = new Map<string, number>();
  leads.forEach(l => byStatus.set(l.status, (byStatus.get(l.status) || 0) + 1));
  const statusDistribution = [...byStatus.entries()].map(([status, count]) => ({ status, count }));

  /* Catalog */
  const catalog = catalogSnap.docs.map(d => d.data() as CatalogVersion);
  const totalDownloads = catalog.reduce((s, v) => s + (v.downloadCount || 0), 0);

  /* WhatsApp / catalog clicks (last 30d) */
  const whatsappClicks = waSnap.data().count;
  const catalogDownloads30d = dlSnap.data().count;

  return {
    weeks, topCountries, topProducts, typeDistribution, statusDistribution,
    total, conversion, qualificationRate, won, qualified,
    totalDownloads, whatsappClicks, catalogDownloads30d
  };
}

export default async function Page() {
  const a = await getAnalytics();

  const kpis = [
    { label: 'Leads · 90d', value: a.total, icon: TrendingUp, tone: 'text-blue-600' },
    { label: 'Qualified Rate', value: `${a.qualificationRate}%`, icon: Target, tone: 'text-amber-600' },
    { label: 'Conversion Rate', value: `${a.conversion}%`, icon: DollarSign, tone: 'text-emerald-600' },
    { label: 'Deals Won', value: a.won, icon: Users, tone: 'text-gold' },
    { label: 'WhatsApp · 30d', value: a.whatsappClicks, icon: MessageCircle, tone: 'text-emerald-600' },
    { label: 'Catalog Downloads', value: a.totalDownloads, icon: Download, tone: 'text-purple-600' }
  ];

  return (
    <>
      <Topbar title="Analytics" subtitle="Insights · Last 90 days" />
      <div className="px-6 md:px-10 py-8 space-y-8">
        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 border-t border-l border-line">
          {kpis.map(k => (
            <div key={k.label} className="bg-white border-r border-b border-line p-6">
              <div className="flex items-center justify-between mb-6">
                <k.icon size={18} strokeWidth={1.5} className={k.tone} />
              </div>
              <div className="font-serif text-3xl font-light text-ink leading-none">{k.value}</div>
              <div className="text-[10px] tracking-[.26em] uppercase text-muted mt-3">{k.label}</div>
            </div>
          ))}
        </div>

        {a.total === 0 ? (
          <Card>
            <div className="text-center py-20">
              <TrendingUp size={28} className="mx-auto text-muted mb-3" strokeWidth={1.5} />
              <h3 className="font-serif text-2xl text-ink">No data yet</h3>
              <p className="text-sm text-muted mt-2">Analytics will populate once leads start coming in.</p>
            </div>
          </Card>
        ) : (
          <AnalyticsCharts
            weeks={a.weeks}
            topCountries={a.topCountries}
            topProducts={a.topProducts}
            typeDistribution={a.typeDistribution}
            statusDistribution={a.statusDistribution}
          />
        )}
      </div>
    </>
  );
}
