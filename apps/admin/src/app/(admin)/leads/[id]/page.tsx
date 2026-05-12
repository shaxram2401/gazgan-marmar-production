import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';
import Topbar from '@/components/layout/Topbar';
import { Card, Badge } from '@/components/ui';
import { Lead, LeadNote } from '@/types';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Mail, MessageCircle, Phone } from 'lucide-react';
import LeadActions from './LeadActions';
import LeadNotes from './LeadNotes';

export const dynamic = 'force-dynamic';

/**
 * Serialized note shape — what we hand to the client component.
 * Firestore Timestamps are replaced with ISO strings so the data is
 * safe to cross the server → client boundary.
 */
type SerializedNote = Omit<LeadNote, 'createdAt'> & { createdAt: string };

/**
 * Serialized lead shape returned to the React tree.
 * Same idea — every Timestamp becomes a string.
 */
type SerializedLead = Omit<Lead, 'createdAt' | 'updatedAt' | 'notes'> & {
  createdAt: string;
  updatedAt: string | null;
  notes: SerializedNote[];
};

/* Minimal structural shape for an Admin SDK Timestamp value we read. */
type MaybeTimestamp = { toDate?: () => Date } | undefined;
function tsToIso(v: MaybeTimestamp): string | null {
  const d = v?.toDate?.();
  return d ? d.toISOString() : null;
}

async function getLead(id: string): Promise<SerializedLead | null> {
  const snap = await adminDb.collection('inquiries').doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() ?? {};

  const rawNotes = Array.isArray(data.notes) ? (data.notes as Array<Record<string, unknown>>) : [];
  const notes: SerializedNote[] = rawNotes.map((n) => ({
    text: String(n.text ?? ''),
    author: String(n.author ?? ''),
    authorEmail: String(n.authorEmail ?? ''),
    createdAt:
      tsToIso(n.createdAt as MaybeTimestamp) ?? new Date().toISOString()
  }));

  return {
    ...(data as Omit<Lead, 'createdAt' | 'updatedAt' | 'notes'>),
    id: snap.id,
    createdAt:
      tsToIso(data.createdAt as MaybeTimestamp) ??
      (typeof data.submittedAt === 'string' ? data.submittedAt : new Date().toISOString()),
    updatedAt: tsToIso(data.updatedAt as MaybeTimestamp),
    notes
  };
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, admin] = await Promise.all([getLead(params.id), getCurrentAdmin()]);
  if (!lead) notFound();

  const waLink = `https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`;
  const mailLink = `mailto:${lead.email}?subject=Re: Export Inquiry — ${encodeURIComponent(lead.company)}`;

  return (
    <>
      <Topbar
        title={lead.name}
        subtitle={`Lead · ${lead.company}`}
        action={
          <Link href="/leads" className="inline-flex items-center gap-2 px-4 h-10 border border-line text-[11px] tracking-[.24em] uppercase hover:bg-paper">
            <ArrowLeft size={14} /> Back
          </Link>
        }
      />

      <div className="px-6 md:px-10 py-8 grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="px-6 py-5 border-b border-line flex items-center justify-between">
              <h3 className="font-serif text-2xl">Inquiry Details</h3>
              <div className="flex gap-2">
                <Badge tone="amber">{lead.status?.replace('_', ' ')}</Badge>
                <Badge tone={lead.priority === 'urgent' ? 'red' : 'neutral'}>{lead.priority}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6">
              <Field label="Name" value={lead.name} />
              <Field label="Company" value={lead.company} />
              <Field label="Country" value={lead.country} />
              <Field label="Lead Type" value={lead.leadType?.replace('_', ' ')} />
              <Field label="Email" value={<a href={mailLink} className="text-gold hover:underline">{lead.email}</a>} />
              <Field label="WhatsApp" value={<a href={waLink} target="_blank" rel="noopener" className="text-gold hover:underline">{lead.whatsapp}</a>} />
              <Field label="Product" value={lead.product} />
              <Field label="Quantity" value={lead.quantity} />
              <Field label="Incoterm" value={lead.incoterm || '—'} />
              <Field label="Source" value={lead.source} />
              <Field label="Received" value={formatDate(lead.createdAt, true)} />
              <Field label="Language" value={lead.language || '—'} />
            </div>
            {lead.message && (
              <div className="px-6 py-5 border-t border-line">
                <div className="text-[10px] tracking-[.24em] uppercase text-muted mb-2">Message</div>
                <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{lead.message}</p>
              </div>
            )}
          </Card>

          <LeadNotes leadId={lead.id} notes={lead.notes || []} adminEmail={admin?.email || ''} adminName={admin?.displayName || admin?.email || ''} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <div className="px-6 py-5 border-b border-line">
              <h3 className="font-serif text-xl">Quick Contact</h3>
            </div>
            <div className="p-6 space-y-2">
              <a href={waLink} target="_blank" rel="noopener"
                 className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">
                <MessageCircle size={16} /> WhatsApp
              </a>
              <a href={mailLink}
                 className="flex items-center gap-3 px-4 py-3 border border-line hover:border-ink transition-colors">
                <Mail size={16} /> Email
              </a>
              <a href={`tel:${lead.whatsapp}`}
                 className="flex items-center gap-3 px-4 py-3 border border-line hover:border-ink transition-colors">
                <Phone size={16} /> Call
              </a>
            </div>
          </Card>

          <LeadActions leadId={lead.id} status={lead.status} priority={lead.priority} assignedToEmail={lead.assignedToEmail || ''} />

          {(lead.referrer || lead.userAgent) && (
            <Card>
              <div className="px-6 py-5 border-b border-line">
                <h3 className="font-serif text-xl">Metadata</h3>
              </div>
              <div className="p-6 space-y-3 text-xs text-muted break-all">
                {lead.page && <div><span className="text-ink">Page:</span> {lead.page}</div>}
                {lead.referrer && <div><span className="text-ink">Referrer:</span> {lead.referrer}</div>}
                {lead.userAgent && <div><span className="text-ink">UA:</span> {lead.userAgent}</div>}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-line">
      <div className="text-[10px] tracking-[.24em] uppercase text-muted mb-1.5">{label}</div>
      <div className="text-sm text-ink">{value || '—'}</div>
    </div>
  );
}

