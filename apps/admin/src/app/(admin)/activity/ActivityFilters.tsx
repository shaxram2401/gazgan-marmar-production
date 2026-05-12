'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const ACTIONS = ['all', 'create', 'update', 'delete', 'upload', 'login', 'role_change'];
const RESOURCES = ['all', 'products', 'entrepreneurs', 'gallery', 'testimonials', 'countries', 'catalog', 'leads', 'settings', 'users'];

export default function ActivityFilters({ action, resource }: { action?: string; resource?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function setFilter(key: 'action' | 'resource', val: string) {
    const sp = new URLSearchParams(params.toString());
    if (val === 'all') sp.delete(key); else sp.set(key, val);
    router.push(`/activity${sp.toString() ? '?' + sp.toString() : ''}`);
  }

  return (
    <div className="bg-white border border-line p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] tracking-[.26em] uppercase text-muted w-20">Action</span>
        {ACTIONS.map(s => (
          <button key={s} onClick={() => setFilter('action', s)}
            className={cn(
              'px-3 py-1.5 text-[10px] tracking-[.2em] uppercase border transition-colors',
              (action || 'all') === s ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:border-ink'
            )}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] tracking-[.26em] uppercase text-muted w-20">Module</span>
        {RESOURCES.map(s => (
          <button key={s} onClick={() => setFilter('resource', s)}
            className={cn(
              'px-3 py-1.5 text-[10px] tracking-[.2em] uppercase border transition-colors',
              (resource || 'all') === s ? 'bg-gold text-white border-gold' : 'bg-white text-ink border-line hover:border-gold'
            )}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
