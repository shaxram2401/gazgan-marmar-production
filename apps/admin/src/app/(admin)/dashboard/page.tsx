import Link from 'next/link';
import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';
import Topbar from '@/components/layout/Topbar';
import { Card, Badge } from '@/components/ui';
import { Package, Users, Image as ImgIcon, Inbox, Globe, ArrowUpRight, ChevronRight, Quote } from 'lucide-react';
import { Lead, LeadStatus } from '@/types';
import { relativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getStats() {
  const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(); startOfMonth.setDate(1);

  const [
    products, entrepreneurs, gallery, testimonials, countries,
    leadsTotal, leadsNew, leadsWeek, leadsMonth, recentLeads
  ] = await Promise.all([
    adminDb.collection('products').count().get(),
    adminDb.collection('entrepreneurs').count().get(),
    adminDb.collection('gallery').count().get(),
    adminDb.collection('testimonials').count().get(),
    adminDb.collection('exportCountries').count().get(),
    adminDb.collection('inquiries').count().get(),
    adminDb.collection('inquiries').where('status', '==', 'new').count().get(),
    adminDb.collection('inquiries').where('createdAt', '>=', startOfWeek).count().get(),
    adminDb.collection('inquiries').where('createdAt', '>=', startOfMonth).count().get(),
    adminDb.collection('inquiries').orderBy('createdAt', 'desc').limit(8).get()
  ]);

  return {
    products: products.data().count,
    entrepreneurs: entrepreneurs.data().count,
    gallery: gallery.data().count,
    testimonials: testimonials.data().count,
    countries: countries.data().count,
    leads: {
      total: leadsTotal.data().count,
      new: leadsNew.data().count,
      week: leadsWeek.data().count,
      month: leadsMonth.data().count
    },
    recent: recentLeads.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.submittedAt
      } as Lead & { createdAt: string };
    })
  };
}

const statusToneMap: Record<LeadStatus, 'amber' | 'blue' | 'gold' | 'green' | 'red' | 'neutral'> = {
  new: 'amber', in_review: 'blue', qualified: 'gold',
  negotiation: 'blue', won: 'green', lost: 'red', spam: 'neutral'
};

export default async function DashboardPage() {
  const admin = await getCurrentAdmin();
  const s = await getStats();

  const cards = [
    { label: 'Products',      value: s.products,      icon: Package, href: '/products',      tone: 'text-blue-600' },
    { label: 'Entrepreneurs', value: s.entrepreneurs, icon: Users,   href: '/entrepreneurs', tone: 'text-purple-600' },
    { label: 'Gallery Items', value: s.gallery,       icon: ImgIcon, href: '/gallery',       tone: 'text-emerald-600' },
    { label: 'Testimonials',  value: s.testimonials,  icon: Quote,   href: '/testimonials',  tone: 'text-amber-600' },
    { label: 'Export Countries', value: s.countries,  icon: Globe,   href: '/countries',     tone: 'text-rose-600' },
    { label: 'Total Leads',   value: s.leads.total,   icon: Inbox,   href: '/leads',         tone: 'text-gold' }
  ];

  return (
    <>
      <Topbar
        title={`Good day${admin?.displayName ? ', ' + admin.displayName.split(' ')[0] : ''}.`}
        subtitle="Overview · Live"
        action={
          <Link href="/leads" className="hidden sm:inline-flex items-center gap-2 px-5 h-10 bg-ink text-white text-[11px] tracking-[.24em] uppercase hover:bg-graphite transition-colors">
            View All Leads <ArrowUpRight size={14} />
          </Link>
        }
      />

      <div className="px-6 md:px-10 py-8 space-y-10">
        {/* Lead pulse strip */}
        <div className="bg-ink text-white px-8 py-6 flex flex-wrap gap-8 items-center justify-between">
          <div>
            <div className="text-[10px] tracking-[.3em] uppercase text-gold mb-1">Lead pulse · last 7 days</div>
            <div className="font-serif text-4xl font-light">
              {s.leads.week}<span className="text-gold text-2xl"> · </span>
              <span className="text-white/60 text-2xl">new inquiries</span>
            </div>
          </div>
          <div className="flex gap-10">
            <div>
              <div className="text-[10px] tracking-[.28em] uppercase text-white/50">New</div>
              <div className="font-serif text-3xl text-gold mt-1">{s.leads.new}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[.28em] uppercase text-white/50">This Month</div>
              <div className="font-serif text-3xl mt-1">{s.leads.month}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[.28em] uppercase text-white/50">All Time</div>
              <div className="font-serif text-3xl mt-1">{s.leads.total}</div>
            </div>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 border-t border-l border-line">
          {cards.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="group bg-white border-r border-b border-line p-6 hover:bg-paper transition-colors"
            >
              <div className="flex items-center justify-between mb-6">
                <c.icon size={18} strokeWidth={1.5} className={c.tone} />
                <ChevronRight size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="font-serif text-4xl font-light text-ink leading-none">{c.value}</div>
              <div className="text-[10px] tracking-[.26em] uppercase text-muted mt-3">{c.label}</div>
            </Link>
          ))}
        </div>

        {/* Recent Leads */}
        <Card>
          <div className="px-6 py-5 border-b border-line flex items-center justify-between">
            <div>
              <h3 className="font-serif text-2xl text-ink">Recent Leads</h3>
              <p className="text-xs text-muted mt-1">Latest 8 export inquiries received</p>
            </div>
            <Link href="/leads" className="text-[11px] tracking-[.24em] uppercase text-gold hover:underline">
              View all →
            </Link>
          </div>

          {s.recent.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Inbox size={28} className="mx-auto text-muted mb-3" strokeWidth={1.5} />
              <p className="text-sm text-muted">No inquiries yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] tracking-[.22em] uppercase text-muted border-b border-line">
                    <th className="text-left font-medium px-6 py-3">Name</th>
                    <th className="text-left font-medium px-6 py-3">Country</th>
                    <th className="text-left font-medium px-6 py-3">Product</th>
                    <th className="text-left font-medium px-6 py-3">Lead Type</th>
                    <th className="text-left font-medium px-6 py-3">Status</th>
                    <th className="text-right font-medium px-6 py-3">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recent.map((l) => (
                    <tr key={l.id} className="border-b border-line last:border-0 hover:bg-paper transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/leads/${l.id}`} className="font-medium text-ink hover:text-gold">
                          {l.name}
                        </Link>
                        <div className="text-xs text-muted mt-0.5">{l.company}</div>
                      </td>
                      <td className="px-6 py-4 text-ink">{l.country}</td>
                      <td className="px-6 py-4 text-ink">{l.product}</td>
                      <td className="px-6 py-4">
                        <Badge tone="neutral">{l.leadType?.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={statusToneMap[l.status] || 'neutral'}>{l.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-muted">
                        {relativeTime(l.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
