'use client';
import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExportCountry } from '@/types';
import { Card, Button, Badge, Modal, Input } from '@/components/ui';
import { Switch, FormRow, ConfirmDialog, SearchBar } from '@/components/ui/Extras';
import { countrySchema, CountryInput } from '@/lib/schemas';
import { Plus, Pencil, Trash2, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function CountriesClient({ initial }: { initial: ExportCountry[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [edit, setEdit] = useState<ExportCountry | null>(null);
  const [creating, setCreating] = useState(false);
  const [del, setDel] = useState<ExportCountry | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() =>
    initial.filter(c => !query || c.country.toLowerCase().includes(query.toLowerCase())),
    [initial, query]);

  function toggleActive(c: ExportCountry) {
    start(async () => {
      const r = await fetch(`/api/countries/${c.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !c.active })
      });
      if (r.ok) { toast.success('Updated'); router.refresh(); } else toast.error('Failed');
    });
  }

  function confirmDelete() {
    if (!del) return;
    start(async () => {
      const r = await fetch(`/api/countries/${del.id}`, { method: 'DELETE' });
      if (r.ok) { toast.success('Deleted'); setDel(null); router.refresh(); } else toast.error('Delete failed');
    });
  }

  const active = initial.filter(c => c.active).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 border-l border-t border-line">
        <Stat label="Total" value={initial.length} />
        <Stat label="Active" value={active} accent />
        <Stat label="Inactive" value={initial.length - active} />
        <Stat label="Total Volume" value={`${initial.reduce((s, c) => s + (c.tonsPerYear || 0), 0)} t/yr`} small />
      </div>

      <div className="bg-white border border-line p-5 flex items-center gap-4 justify-between">
        <SearchBar value={query} onChange={setQuery} placeholder="Search country..." />
        <Button onClick={() => setCreating(true)}><Plus size={14} /> Add Country</Button>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Globe size={28} className="mx-auto text-muted mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-2xl text-ink">No countries</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[.22em] uppercase text-muted border-b border-line">
                  <th className="text-left font-medium px-6 py-3 w-16">Flag</th>
                  <th className="text-left font-medium px-6 py-3">Country</th>
                  <th className="text-left font-medium px-6 py-3">Volume / Year</th>
                  <th className="text-center font-medium px-6 py-3">Status</th>
                  <th className="text-center font-medium px-6 py-3">Order</th>
                  <th className="text-right font-medium px-6 py-3 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-line last:border-0 hover:bg-paper transition-colors">
                    <td className="px-6 py-4 text-2xl">{c.flag}</td>
                    <td className="px-6 py-4 font-medium text-ink">{c.country}</td>
                    <td className="px-6 py-4 text-ink">{c.tonsPerYear ? `${c.tonsPerYear} tons` : '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => toggleActive(c)} disabled={pending}>
                        <Badge tone={c.active ? 'green' : 'neutral'}>{c.active ? 'Active' : 'Inactive'}</Badge>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center text-ink font-mono text-xs">{c.order}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEdit(c)} className="p-2 hover:bg-paper border border-transparent hover:border-line"><Pencil size={14} /></button>
                        <button onClick={() => setDel(c)} className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200"><Trash2 size={14} className="text-red-600" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {creating && <CountryForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); router.refresh(); }} />}
      {edit && <CountryForm item={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); router.refresh(); }} />}
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={confirmDelete}
                     title="Delete country?" message={`Remove "${del?.country}" from the export map?`} loading={pending} />
    </div>
  );
}

function Stat({ label, value, accent, small }: { label: string; value: number | string; accent?: boolean; small?: boolean }) {
  return (
    <div className="bg-white border-r border-b border-line p-6">
      <div className={`font-serif font-light leading-none ${small ? 'text-2xl' : 'text-4xl'} ${accent ? 'text-gold' : 'text-ink'}`}>{value}</div>
      <div className="text-[10px] tracking-[.26em] uppercase text-muted mt-3">{label}</div>
    </div>
  );
}

function CountryForm({ item, onClose, onSaved }: { item?: ExportCountry; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!item;
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<CountryInput>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      country: item?.country || '',
      flag: item?.flag || '',
      tonsPerYear: item?.tonsPerYear,
      active: item?.active ?? true,
      order: item?.order ?? 0
    }
  });

  async function onSubmit(data: CountryInput) {
    const r = await fetch(isEdit ? `/api/countries/${item!.id}` : '/api/countries', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (r.ok) { toast.success(isEdit ? 'Updated' : 'Created'); onSaved(); }
    else toast.error('Save failed');
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Country' : 'New Export Country'} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormRow cols={2}>
          <Input label="Country *" {...register('country')} error={errors.country?.message} placeholder="UAE" />
          <Input label="Flag (emoji) *" {...register('flag')} error={errors.flag?.message} placeholder="🇦🇪" />
        </FormRow>
        <FormRow cols={2}>
          <Input label="Tons / Year" type="number" {...register('tonsPerYear')} error={errors.tonsPerYear?.message} />
          <Input label="Priority Order" type="number" {...register('order')} error={errors.order?.message} />
        </FormRow>
        <Switch checked={watch('active')} onChange={(v) => setValue('active', v)} label="Active" description="Visible on website export map." />
        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
