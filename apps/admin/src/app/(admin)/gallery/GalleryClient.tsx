'use client';
import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GalleryItem } from '@/types';
import { Card, Button, Modal, Input, Select, Badge } from '@/components/ui';
import { Switch, FormRow, ConfirmDialog, SearchBar } from '@/components/ui/Extras';
import ImageUpload from '@/components/ui/ImageUpload';
import { gallerySchema, GalleryInput } from '@/lib/schemas';
import { Plus, Pencil, Trash2, Star, Image as ImgIcon } from 'lucide-react';
import { toast } from 'sonner';

const CATS = ['all', 'quarry', 'blocks', 'slabs', 'factory', 'shipment', 'project', 'other'];

export default function GalleryClient({ initial }: { initial: GalleryItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [edit, setEdit] = useState<GalleryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [del, setDel] = useState<GalleryItem | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => initial.filter(g => {
    if (cat !== 'all' && g.category !== cat) return false;
    if (query && !g.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [initial, query, cat]);

  function toggleFeatured(g: GalleryItem) {
    start(async () => {
      const r = await fetch(`/api/gallery/${g.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !g.featured })
      });
      if (r.ok) { toast.success('Updated'); router.refresh(); } else toast.error('Failed');
    });
  }

  function confirmDelete() {
    if (!del) return;
    start(async () => {
      const r = await fetch(`/api/gallery/${del.id}`, { method: 'DELETE' });
      if (r.ok) { toast.success('Deleted'); setDel(null); router.refresh(); } else toast.error('Delete failed');
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-line p-5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <SearchBar value={query} onChange={setQuery} placeholder="Search by title..." />
          <div className="flex gap-2 flex-wrap">
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-3 py-2 text-[10px] tracking-[.2em] uppercase border transition-colors ${
                  cat === c ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:border-ink'
                }`}>{c}</button>
            ))}
          </div>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={14} /> Add Image</Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-20">
            <ImgIcon size={28} className="mx-auto text-muted mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-2xl text-ink">No images</h3>
            <p className="text-sm text-muted mt-2">Add the first gallery image to begin.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(g => (
            <div key={g.id} className="bg-white border border-line group overflow-hidden">
              <div className="aspect-square bg-paper overflow-hidden relative">
                <img src={g.image} alt={g.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge tone="neutral">{g.category}</Badge>
                  {g.featured && <Badge tone="gold">★</Badge>}
                </div>
                <div className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => toggleFeatured(g)} className="p-2 bg-white">
                    <Star size={14} className={g.featured ? 'text-gold fill-gold' : 'text-ink'} />
                  </button>
                  <button onClick={() => setEdit(g)} className="p-2 bg-white"><Pencil size={14} /></button>
                  <button onClick={() => setDel(g)} className="p-2 bg-red-600 text-white"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="p-3">
                <div className="text-sm font-medium text-ink truncate">{g.title}</div>
                <div className="text-xs text-muted mt-0.5">Order #{g.order}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <GalleryForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); router.refresh(); }} />}
      {edit && <GalleryForm item={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); router.refresh(); }} />}
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={confirmDelete}
                     title="Delete image?" message={`Remove "${del?.title}" from the gallery?`} loading={pending} />
    </div>
  );
}

function GalleryForm({ item, onClose, onSaved }: { item?: GalleryItem; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!item;
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<GalleryInput>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: item?.title || '',
      image: item?.image || '',
      category: item?.category || 'project',
      featured: item?.featured ?? false,
      order: item?.order ?? 0
    }
  });

  const image = watch('image');

  async function onSubmit(data: GalleryInput) {
    const r = await fetch(isEdit ? `/api/gallery/${item!.id}` : '/api/gallery', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (r.ok) { toast.success(isEdit ? 'Updated' : 'Created'); onSaved(); }
    else toast.error('Save failed');
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Image' : 'New Gallery Image'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <ImageUpload value={image} onChange={(u) => setValue('image', u, { shouldValidate: true })} folder="gallery" label="Image *" aspect="aspect-square" />
        {errors.image && <p className="-mt-3 text-xs text-red-600">{errors.image.message}</p>}
        <Input label="Title *" {...register('title')} error={errors.title?.message} />
        <FormRow cols={2}>
          <Select label="Category *" {...register('category')} error={errors.category?.message}>
            <option value="quarry">Quarry</option><option value="blocks">Blocks</option>
            <option value="slabs">Slabs</option><option value="factory">Factory</option>
            <option value="shipment">Shipment</option><option value="project">Project</option>
            <option value="other">Other</option>
          </Select>
          <Input label="Sort Order" type="number" {...register('order')} error={errors.order?.message} />
        </FormRow>
        <Switch checked={watch('featured')} onChange={(v) => setValue('featured', v)} label="Featured" description="Show in featured section of home gallery." />
        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
