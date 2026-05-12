'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Modal, Button, Input, Textarea, Select } from '@/components/ui';
import { Switch, FormRow } from '@/components/ui/Extras';
import ImageUpload from '@/components/ui/ImageUpload';
import { productSchema, ProductInput } from '@/lib/schemas';
import { Product } from '@/types';
import { slugify } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProductForm({ product, onClose, onSaved }: {
  product?: Product; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!product;
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title || '',
      category: product?.category || 'White Marble',
      slug: product?.slug || '',
      description: product?.description || '',
      image: product?.image || '',
      exportAvailable: product?.exportAvailable ?? true,
      featured: product?.featured ?? false,
      order: product?.order ?? 0,
      seoTitle: product?.seoTitle || '',
      seoDescription: product?.seoDescription || ''
    }
  });

  const title = watch('title');
  const slug = watch('slug');
  const image = watch('image');

  // Auto-generate slug from title if empty (on create only)
  useEffect(() => {
    if (!isEdit && title && !slug) setValue('slug', slugify(title));
  }, [title, slug, isEdit, setValue]);

  async function onSubmit(data: ProductInput) {
    const url = isEdit ? `/api/products/${product!.id}` : '/api/products';
    const r = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (r.ok) { toast.success(isEdit ? 'Updated' : 'Created'); onSaved(); }
    else { const e = await r.json(); toast.error(e.error?.formErrors?.[0] || 'Save failed'); }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Product' : 'New Product'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <ImageUpload value={image} onChange={(u) => setValue('image', u, { shouldValidate: true })} folder="products" label="Product Image *" />
        {errors.image && <p className="-mt-3 text-xs text-red-600">{errors.image.message}</p>}

        <FormRow cols={2}>
          <Input label="Title *" {...register('title')} error={errors.title?.message} />
          <Select label="Category *" {...register('category')} error={errors.category?.message}>
            <option>White Marble</option><option>Black Marble</option>
            <option>Granite</option><option>Travertine</option>
            <option>Decorative</option><option>Other</option>
          </Select>
        </FormRow>

        <FormRow cols={2}>
          <Input label="Slug *" {...register('slug')} error={errors.slug?.message} placeholder="white-marble" />
          <Input label="Display Order" type="number" {...register('order')} error={errors.order?.message} />
        </FormRow>

        <Textarea label="Description *" rows={5} {...register('description')} error={errors.description?.message} />

        <FormRow cols={2}>
          <Switch checked={watch('featured')} onChange={(v) => setValue('featured', v)}
                  label="Featured" description="Highlight on home page collection." />
          <Switch checked={watch('exportAvailable')} onChange={(v) => setValue('exportAvailable', v)}
                  label="Export Available" description="Visible to international buyers." />
        </FormRow>

        <div className="pt-6 border-t border-line">
          <div className="text-[10px] tracking-[.28em] uppercase text-gold mb-4 font-medium">SEO · Optional</div>
          <FormRow cols={1}>
            <Input label="SEO Title (≤ 70)" {...register('seoTitle')} error={errors.seoTitle?.message} />
            <Textarea label="SEO Description (≤ 160)" rows={2} {...register('seoDescription')} error={errors.seoDescription?.message} />
          </FormRow>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save Changes' : 'Create Product'}</Button>
        </div>
      </form>
    </Modal>
  );
}
