import Link from 'next/link';
import { adminDb } from '@/lib/firebase.admin';
import Topbar from '@/components/layout/Topbar';
import { Card, Badge } from '@/components/ui';
import { Lead, LeadStatus } from '@/types';
import { relativeTime } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import LeadFilters from './LeadFilters';

export const dynamic = 'force-dynamic';

const STATUS_TONES: Record<LeadStatus, 'amber' | 'blue' | 'gold' | 'green' | 'red' | 'neutral'> = {
  new: 'amber', in_review: 'blue', qualified: 'gold',
  negotiation: 'blue', won: 'green', lost: 'red', spam: 'neutral'
};

async function getLeads(status?: string, leadType?: string) {
  let q: FirebaseFirestore.Query = adminDb.collection('inquiries');
  if (status && status !== 'all') q = q.where('status', '==', status);
  if (leadType && leadType !== 'all') q = q.where('leadType', '==', leadType);
  q = q.orderBy('createdAt', 'desc').limit(100);
  const snap = await q.get();
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.submittedAt
    } as Lead & { createdAt: string };
  });
}

export default async function LeadsPage({
  searchParams
}: {
  searchParams: { status?: string; type?: string };
}) {
  const leads = await getLeads(searchParams.status, searchParams.type);

  return (
    <>
      <Topbar
        title="Export Leads"
        subtitle="B2B Inquiries"
        action={
          <div className="text-right">
            <div className="font-serif text-3xl text-ink leading-none">{leads.length}</div>
            <div className="text-[10px] tracking-[.28em] uppercase text-muted mt-1">Showing</div>
          </div>
        }
      />

      <div className="px-6 md:px-10 py-8 space-y-6">
        <LeadFilters status={searchParams.status} type={searchParams.type} />

        <Card>
          {leads.length === 0 ? (
            <div className="text-center py-20 px-6">
              <Inbox size={28} className="mx-auto text-muted mb-3" strokeWidth={1.5} />
              <h3 className="font-serif text-2xl text-ink">No leads match filters</h3>
              <p className="text-sm text-muted mt-2">Try clearing filters above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] tracking-[.22em] uppercase text-muted border-b border-line">
                    <th className="text-left font-medium px-6 py-3">Name / Company</th>
                    <th className="text-left font-medium px-6 py-3">Country</th>
                    <th className="text-left font-medium px-6 py-3">Product · Qty</th>
                    <th className="text-left font-medium px-6 py-3">Lead Type</th>
                    <th className="text-left font-medium px-6 py-3">Status</th>
                    <th className="text-left font-medium px-6 py-3">Priority</th>
                    <th className="text-right font-medium px-6 py-3">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(l => (
                    <tr key={l.id} className="border-b border-line last:border-0 hover:bg-paper transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/leads/${l.id}`} className="font-medium text-ink hover:text-gold">
                          {l.name}
                        </Link>
                        <div className="text-xs text-muted mt-0.5">{l.company}</div>
                      </td>
                      <td className="px-6 py-4 text-ink">{l.country}</td>
                      <td className="px-6 py-4">
                        <div className="text-ink">{l.product}</div>
                        <div className="text-xs text-muted">{l.quantity}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone="neutral">{l.leadType?.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={STATUS_TONES[l.status] || 'neutral'}>{l.status}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={l.priority === 'urgent' ? 'red' : l.priority === 'high' ? 'amber' : 'neutral'}>
                          {l.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-muted whitespace-nowrap">
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
