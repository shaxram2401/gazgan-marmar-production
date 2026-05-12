'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const STATUSES = ['all', 'new', 'in_review', 'qualified', 'negotiation', 'won', 'lost', 'spam'];
const TYPES = ['all', 'buyer', 'distributor', 'project_owner', 'investor', 'architect', 'other'];

export default function LeadFilters({ status, type }: { status?: string; type?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function setFilter(key: 'status' | 'type', val: string) {
    const sp = new URLSearchParams(params.toString());
    if (val === 'all') sp.delete(key); else sp.set(key, val);
    router.push(`/leads${sp.toString() ? '?' + sp.toString() : ''}`);
  }

  return (
    <div className="bg-white border border-line p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] tracking-[.26em] uppercase text-muted w-20">Status</span>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter('status', s)}
            className={cn(
              'px-3 py-1.5 text-[11px] tracking-wide uppercase border transition-colors',
              (status || 'all') === s
                ? 'bg-ink text-white border-ink'
                : 'bg-white text-ink border-line hover:border-ink'
            )}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] tracking-[.26em] uppercase text-muted w-20">Lead Type</span>
        {TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilter('type', t)}
            className={cn(
              'px-3 py-1.5 text-[11px] tracking-wide uppercase border transition-colors',
              (type || 'all') === t
                ? 'bg-gold text-white border-gold'
                : 'bg-white text-ink border-line hover:border-gold'
            )}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}
