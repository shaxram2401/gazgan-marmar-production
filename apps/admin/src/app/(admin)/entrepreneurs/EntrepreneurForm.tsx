'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { Switch, FormRow } from '@/components/ui/Extras';
import ImageUpload from '@/components/ui/ImageUpload';
import { entrepreneurSchema, EntrepreneurInput } from '@/lib/schemas';
import { Entrepreneur } from '@/types';
import { toast } from 'sonner';
import { X } from 'lucide-react';

export default function EntrepreneurForm({ item, onClose, onSaved }: {
  item?: Entrepreneur; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!item;
  const [countries, setCountries] = useState<string[]>(item?.exportCountries || []);
  const [draft, setDraft] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<EntrepreneurInput>({
    resolver: zodResolver(entrepreneurSchema),
    defaultValues: {
      companyName: item?.companyName || '',
      ownerName: item?.ownerName || '',
      phone: item?.phone || '',
      email: item?.email || '',
      exportCountries: item?.exportCountries || [],
      specialization: item?.specialization || '',
      factoryImage: item?.factoryImage || '',
      location: item?.location || '',
      bio: item?.bio || '',
      priority: item?.priority ?? 0,
      featured: item?.featured ?? false,
      active: item?.active ?? true
    }
  });

  const factoryImage = watch('factoryImage');

  function addCountry() {
    const c = draft.trim();
    if (!c) return;
    if (countries.includes(c)) { toast.error('Already added'); return; }
    const next = [...countries, c];
    setCountries(next);
    setValue('exportCountries', next, { shouldValidate: true });
    setDraft('');
  }

  function removeCountry(c: string) {
    const next = countries.filter(x => x !== c);
    setCountries(next);
    setValue('exportCountries', next, { shouldValidate: true });
  }

  async function onSubmit(data: EntrepreneurInput) {
    const payload = { ...data, exportCountries: countries };
    const url = isEdit ? `/api/entrepreneurs/${item!.id}` : '/api/entrepreneurs';
    const r = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (r.ok) { toast.success(isEdit ? 'Updated' : 'Created'); onSaved(); }
    else { const e = await r.json(); toast.error(e.error?.formErrors?.[0] || 'Save failed'); }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Entrepreneur' : 'New Entrepreneur'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <ImageUpload value={factoryImage || ''} onChange={(u) => setValue('factoryImage', u)} folder="entrepreneurs" label="Factory / Company Image" aspect="aspect-[16/10]" />

        <FormRow cols={2}>
          <Input label="Company Name *" {...register('companyName')} error={errors.companyName?.message} />
          <Input label="Owner / Director *" {...register('ownerName')} error={errors.ownerName?.message} />
        </FormRow>

        <FormRow cols={2}>
          <Input label="Phone *" {...register('phone')} error={errors.phone?.message} placeholder="+998 90 ..." />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
        </FormRow>

        <FormRow cols={2}>
          <Input label="Specialization *" {...register('specialization')} error={errors.specialization?.message} placeholder="White Marble · Slabs" />
          <Input label="Location" {...register('location')} error={errors.location?.message} placeholder="Gazgan, Navoiy" />
        </FormRow>

        <div>
          <label className="block text-[10px] tracking-[.24em] uppercase text-muted mb-2 font-medium">Export Countries *</label>
          <div className="flex gap-2 mb-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCountry(); } }}
              placeholder="Type country and press Enter"
              className="flex-1 h-11 px-3 bg-white border border-line text-sm focus:outline-none focus:border-ink"
            />
            <Button type="button" variant="secondary" onClick={addCountry}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {countries.map(c => (
              <span key={c} className="inline-flex items-center gap-2 px-3 py-1 bg-paper border border-line text-xs">
                {c}
                <button type="button" onClick={() => removeCountry(c)}><X size={12} /></button>
              </span>
            ))}
          </div>
          {errors.exportCountries && <p className="mt-2 text-xs text-red-600">{errors.exportCountries.message}</p>}
        </div>

        <Textarea label="Bio / Notes" rows={3} {...register('bio')} error={errors.bio?.message} />

        <FormRow cols={3}>
          <Input label="Priority Order" type="number" {...register('priority')} error={errors.priority?.message} />
          <Switch checked={watch('featured')} onChange={(v) => setValue('featured', v)} label="Featured" />
          <Switch checked={watch('active')} onChange={(v) => setValue('active', v)} label="Active" />
        </FormRow>

        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save Changes' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
