'use client';
import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase.client';
import { Upload, X, Image as ImgIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ImageUpload({
  value, onChange, folder, label = 'Image', accept = 'image/*', aspect = 'aspect-[4/3]'
}: {
  value: string;
  onChange: (url: string) => void;
  folder: 'products' | 'entrepreneurs' | 'gallery' | 'testimonials' | 'seo' | 'catalog';
  label?: string;
  accept?: string;
  aspect?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (file.size > 8 * 1024 * 1024) { toast.error('Image must be < 8 MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Image files only'); return; }
    setUploading(true);
    try {
      const name = `${Date.now()}-${file.name.replace(/[^a-z0-9.]+/gi, '-').toLowerCase()}`;
      const r = ref(storage, `${folder}/${name}`);
      await uploadBytes(r, file, { contentType: file.type });
      const url = await getDownloadURL(r);
      onChange(url);
      toast.success('Image uploaded');
    } catch (e) {
      toast.error('Upload failed');
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  async function clear() {
    if (value && value.includes('firebasestorage.googleapis.com')) {
      try { await deleteObject(ref(storage, value)); } catch {}
    }
    onChange('');
  }

  return (
    <div>
      <label className="block text-[10px] tracking-[.24em] uppercase text-muted mb-2 font-medium">{label}</label>
      {value ? (
        <div className={cn('relative group bg-paper border border-line overflow-hidden', aspect)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button type="button" onClick={() => inputRef.current?.click()}
                    className="px-4 py-2 bg-white text-ink text-[10px] tracking-[.22em] uppercase">
              Replace
            </button>
            <button type="button" onClick={clear}
                    className="px-4 py-2 bg-red-600 text-white text-[10px] tracking-[.22em] uppercase">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragging(false);
            const f = e.dataTransfer.files?.[0]; if (f) upload(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-3 py-12 transition-colors',
            dragging ? 'border-gold bg-gold/5' : 'border-line bg-paper hover:bg-white hover:border-ink'
          )}
        >
          {uploading ? <Loader2 className="animate-spin text-gold" size={22} /> : <ImgIcon size={22} className="text-muted" strokeWidth={1.5} />}
          <div className="text-sm text-ink font-medium">{uploading ? 'Uploading...' : 'Drop image or click to upload'}</div>
          <div className="text-[10px] tracking-[.22em] uppercase text-muted">PNG · JPG · WebP · Max 8MB</div>
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden"
             onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
    </div>
  );
}
