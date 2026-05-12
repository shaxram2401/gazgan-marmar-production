'use client';
import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Entrepreneur } from '@/types';
import { Card, Button, Badge } from '@/components/ui';
import { SearchBar, ConfirmDialog } from '@/components/ui/Extras';
import { Plus, Pencil, Trash2, Star, Users, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import EntrepreneurForm from './EntrepreneurForm';

export default function EntrepreneursClient({ initial }: { initial: Entrepreneur[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [edit, setEdit] = useState<Entrepreneur | null>(null);
  const [creating, setCreating] = useState(false);
  const [del, setDel] = useState<Entrepreneur | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => initial.filter(e => {
    if (filter === 'active' && !e.active) return false;
    if (filter === 'inactive' && e.active) return false;
    if (filter === 'featured' && !e.featured) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!e.companyName.toLowerCase().includes(q) && !e.ownerName.toLowerCase().includes(q) && !e.specialization.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [initial, query, filter]);

  function toggleField(item: Entrepreneur, field: 'featured' | 'active') {
    start(async () => {
      const r = await fetch(`/api/entrepreneurs/${item.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !item[field] })
      });
      if (r.ok) { toast.success('Updated'); router.refresh(); } else toast.error('Failed');
    });
  }

  function confirmDelete() {
    if (!del) return;
    start(async () => {
      const r = await fetch(`/api/entrepreneurs/${del.id}`, { method: 'DELETE' });
      if (r.ok) { toast.success('Deleted'); setDel(null); router.refresh(); } else toast.error('Delete failed');
    });
  }

  const filters = [
    { v: 'all', l: 'All' }, { v: 'active', l: 'Active' },
    { v: 'inactive', l: 'Inactive' }, { v: 'featured', l: 'Featured' }
  ] as const;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-line p-5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <SearchBar value={query} onChange={setQuery} placeholder="Search company, owner, specialization..." />
          <div className="flex gap-2">
            {filters.map(f => (
              <button key={f.v} onClick={() => setFilter(f.v)}
                className={`px-3 py-2 text-[10px] tracking-[.22em] uppercase border transition-colors ${
                  filter === f.v ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:border-ink'
                }`}>{f.l}</button>
            ))}
          </div>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={14} /> Add Entrepreneur</Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-20">
            <Users size={28} className="mx-auto text-muted mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-2xl text-ink">No entrepreneurs</h3>
            <p className="text-sm text-muted mt-2">{query ? 'Try a different search.' : 'Add the first alliance member.'}</p>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(e => (
            <Card key={e.id} className="group hover:border-ink transition-colors flex flex-col">
              <div className="aspect-[16/10] bg-paper overflow-hidden relative">
                {e.factoryImage ? (
                  <img src={e.factoryImage} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted text-xs uppercase tracking-widest">No image</div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  {e.featured && <Badge tone="gold">Featured</Badge>}
                  <Badge tone={e.active ? 'green' : 'neutral'}>{e.active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 bg-ink/80 text-gold text-xs flex items-center justify-center font-mono">
                  #{e.priority}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-serif text-xl text-ink leading-tight">{e.companyName}</h3>
                <p className="text-xs text-muted mt-1">{e.ownerName}</p>
                <div className="mt-3 text-[11px] tracking-[.18em] uppercase text-ink/80 border border-line inline-block px-2 py-1 self-start">{e.specialization}</div>
                <div className="mt-3 space-y-1.5 text-xs text-muted">
                  <div className="flex items-center gap-2"><Phone size={12} /> {e.phone}</div>
                  {e.location && <div className="flex items-center gap-2"><MapPin size={12} /> {e.location}</div>}
                </div>
                {e.exportCountries?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {e.exportCountries.slice(0, 4).map(c => <span key={c} className="text-[10px] tracking-wider uppercase text-muted">{c}</span>).reduce((a, b, i) => i === 0 ? [b] : [...a, <span key={`s${i}`} className="text-line">·</span>, b], [] as React.ReactNode[])}
                    {e.exportCountries.length > 4 && <span className="text-[10px] text-gold">+{e.exportCountries.length - 4}</span>}
                  </div>
                )}
                <div className="mt-auto pt-4 border-t border-line flex items-center justify-between">
                  <div className="flex gap-2">
                    <button onClick={() => toggleField(e, 'featured')} disabled={pending} className="p-1.5 hover:bg-paper">
                      <Star size={14} className={e.featured ? 'text-gold fill-gold' : 'text-line'} />
                    </button>
                    <button onClick={() => toggleField(e, 'active')} disabled={pending} className="text-[10px] tracking-[.2em] uppercase text-muted hover:text-ink">
                      {e.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEdit(e)} className="p-2 border border-transparent hover:border-line"><Pencil size={13} /></button>
                    <button onClick={() => setDel(e)} className="p-2 border border-transparent hover:border-red-200 hover:bg-red-50"><Trash2 size={13} className="text-red-600" /></button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {creating && <EntrepreneurForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); router.refresh(); }} />}
      {edit && <EntrepreneurForm item={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); router.refresh(); }} />}
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={confirmDelete}
                     title="Delete entrepreneur?" message={`This will permanently remove "${del?.companyName}" from the alliance.`} loading={pending} />
    </div>
  );
}
