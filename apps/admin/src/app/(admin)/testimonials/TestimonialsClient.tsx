'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Testimonial } from '@/types';
import { Card, Button, Badge, Modal, Input, Textarea, Select } from '@/components/ui';
import { Switch, FormRow, ConfirmDialog, SearchBar } from '@/components/ui/Extras';
import ImageUpload from '@/components/ui/ImageUpload';
import { testimonialSchema, TestimonialInput } from '@/lib/schemas';
import { Plus, Pencil, Trash2, Star, Quote } from 'lucide-react';
import { toast } from 'sonner';
import { truncate } from '@/lib/utils';

export default function TestimonialsClient({ initial }: { initial: Testimonial[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [edit, setEdit] = useState<Testimonial | null>(null);
  const [creating, setCreating] = useState(false);
  const [del, setDel] = useState<Testimonial | null>(null);
  const [pending, start] = useTransition();

  const filtered = initial.filter(t => {
    if (!query) return true;
    const q = query.toLowerCase();
    return t.clientName.toLowerCase().includes(q) || t.company.toLowerCase().includes(q) || t.country.toLowerCase().includes(q);
  });

  function toggleField(t: Testimonial, field: 'active' | 'featured') {
    start(async () => {
      const r = await fetch(`/api/testimonials/${t.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !t[field] })
      });
      if (r.ok) { toast.success('Updated'); router.refresh(); } else toast.error('Failed');
    });
  }

  function confirmDelete() {
    if (!del) return;
    start(async () => {
      const r = await fetch(`/api/testimonials/${del.id}`, { method: 'DELETE' });
      if (r.ok) { toast.success('Deleted'); setDel(null); router.refresh(); } else toast.error('Delete failed');
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-line p-5 flex items-center gap-4 justify-between">
        <SearchBar value={query} onChange={setQuery} placeholder="Search client, company, country..." />
        <Button onClick={() => setCreating(true)}><Plus size={14} /> Add Testimonial</Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-20">
            <Quote size={28} className="mx-auto text-muted mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-2xl text-ink">No testimonials</h3>
            <p className="text-sm text-muted mt-2">Add the first buyer quote.</p>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(t => (
            <Card key={t.id} className="p-6 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="text-gold">{'★'.repeat(t.rating)}<span className="text-line">{'★'.repeat(5 - t.rating)}</span></div>
                <div className="flex gap-1">
                  {t.featured && <Badge tone="gold">Featured</Badge>}
                  <Badge tone={t.active ? 'green' : 'neutral'}>{t.active ? 'Active' : 'Hidden'}</Badge>
                </div>
              </div>
              <p className="font-serif text-lg text-ink italic leading-relaxed mb-5 flex-1">{truncate(t.review, 180)}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-line">
                <div className="w-10 h-10 bg-ink text-white flex items-center justify-center font-serif rounded-full overflow-hidden">
                  {t.avatar ? <img src={t.avatar} alt="" className="w-full h-full object-cover" /> : t.clientName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink text-sm truncate">{t.clientName}</div>
                  <div className="text-xs text-muted truncate">{t.company} · {t.country}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between pt-3 border-t border-line">
                <div className="flex gap-2">
                  <button onClick={() => toggleField(t, 'featured')} disabled={pending} className="p-1.5 hover:bg-paper">
                    <Star size={14} className={t.featured ? 'text-gold fill-gold' : 'text-line'} />
                  </button>
                  <button onClick={() => toggleField(t, 'active')} disabled={pending}
                          className="text-[10px] tracking-[.22em] uppercase text-muted hover:text-ink">
                    {t.active ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEdit(t)} className="p-2 border border-transparent hover:border-line"><Pencil size={13} /></button>
                  <button onClick={() => setDel(t)} className="p-2 border border-transparent hover:border-red-200 hover:bg-red-50"><Trash2 size={13} className="text-red-600" /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {creating && <TestimonialForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); router.refresh(); }} />}
      {edit && <TestimonialForm item={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); router.refresh(); }} />}
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={confirmDelete}
                     title="Delete testimonial?" message={`Remove quote from "${del?.clientName}"?`} loading={pending} />
    </div>
  );
}

function TestimonialForm({ item, onClose, onSaved }: { item?: Testimonial; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!item;
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<TestimonialInput>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      clientName: item?.clientName || '',
      company: item?.company || '',
      country: item?.country || '',
      review: item?.review || '',
      rating: item?.rating ?? 5,
      avatar: item?.avatar || '',
      featured: item?.featured ?? false,
      active: item?.active ?? true,
      order: item?.order ?? 0
    }
  });

  async function onSubmit(data: TestimonialInput) {
    const r = await fetch(isEdit ? `/api/testimonials/${item!.id}` : '/api/testimonials', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (r.ok) { toast.success(isEdit ? 'Updated' : 'Created'); onSaved(); }
    else toast.error('Save failed');
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Testimonial' : 'New Testimonial'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <ImageUpload value={watch('avatar') || ''} onChange={(u) => setValue('avatar', u)} folder="testimonials" label="Avatar (optional)" aspect="aspect-square" />
        <FormRow cols={2}>
          <Input label="Client Name *" {...register('clientName')} error={errors.clientName?.message} />
          <Input label="Company *" {...register('company')} error={errors.company?.message} />
        </FormRow>
        <FormRow cols={2}>
          <Input label="Country *" {...register('country')} error={errors.country?.message} />
          <Select label="Rating *" {...register('rating')} error={errors.rating?.message}>
            <option value={5}>★★★★★ (5)</option>
            <option value={4}>★★★★☆ (4)</option>
            <option value={3}>★★★☆☆ (3)</option>
            <option value={2}>★★☆☆☆ (2)</option>
            <option value={1}>★☆☆☆☆ (1)</option>
          </Select>
        </FormRow>
        <Textarea label="Review *" rows={5} {...register('review')} error={errors.review?.message} />
        <FormRow cols={3}>
          <Input label="Sort Order" type="number" {...register('order')} error={errors.order?.message} />
          <Switch checked={watch('featured')} onChange={(v) => setValue('featured', v)} label="Featured" />
          <Switch checked={watch('active')} onChange={(v) => setValue('active', v)} label="Active" />
        </FormRow>
        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
