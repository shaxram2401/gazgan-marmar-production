'use client';
import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { Card, Button, Badge } from '@/components/ui';
import { SearchBar, ConfirmDialog } from '@/components/ui/Extras';
import { Plus, Pencil, Trash2, Star, Package } from 'lucide-react';
import { toast } from 'sonner';
import ProductForm from './ProductForm';
import { relativeTime } from '@/lib/utils';

const CATEGORIES = ['all', 'White Marble', 'Black Marble', 'Granite', 'Travertine', 'Decorative', 'Other'];

export default function ProductsClient({ initial }: { initial: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [edit, setEdit] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [del, setDel] = useState<Product | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    return initial.filter(p => {
      if (cat !== 'all' && p.category !== cat) return false;
      if (query) {
        const q = query.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [initial, query, cat]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  function toggle(product: Product, field: 'featured' | 'exportAvailable') {
    start(async () => {
      const r = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !product[field] })
      });
      if (r.ok) { toast.success('Updated'); router.refresh(); }
      else toast.error('Failed');
    });
  }

  function confirmDelete() {
    if (!del) return;
    start(async () => {
      const r = await fetch(`/api/products/${del.id}`, { method: 'DELETE' });
      if (r.ok) { toast.success('Deleted'); setDel(null); router.refresh(); }
      else toast.error('Delete failed');
    });
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white border border-line p-5 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <SearchBar value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search products..." />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => { setCat(c); setPage(1); }}
                className={`px-3 py-2 text-[10px] tracking-[.2em] uppercase border transition-colors ${
                  cat === c ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-line hover:border-ink'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={14} /> Add Product</Button>
      </div>

      {/* Table */}
      <Card>
        {paged.length === 0 ? (
          <div className="text-center py-20">
            <Package size={28} className="mx-auto text-muted mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-2xl text-ink">No products</h3>
            <p className="text-sm text-muted mt-2">{query || cat !== 'all' ? 'Try clearing filters.' : 'Add your first product to start.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[.22em] uppercase text-muted border-b border-line">
                  <th className="text-left font-medium px-6 py-3 w-20">#</th>
                  <th className="text-left font-medium px-6 py-3">Product</th>
                  <th className="text-left font-medium px-6 py-3">Category</th>
                  <th className="text-center font-medium px-6 py-3">Featured</th>
                  <th className="text-center font-medium px-6 py-3">Export</th>
                  <th className="text-center font-medium px-6 py-3">Order</th>
                  <th className="text-right font-medium px-6 py-3">Updated</th>
                  <th className="text-right font-medium px-6 py-3 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(p => (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-paper transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 bg-paper overflow-hidden">
                        {p.image && <img src={p.image} alt="" className="w-full h-full object-cover" loading="lazy" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink">{p.title}</div>
                      <div className="text-xs text-muted mt-0.5">/{p.slug}</div>
                    </td>
                    <td className="px-6 py-4"><Badge tone="gold">{p.category}</Badge></td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => toggle(p, 'featured')} disabled={pending} className="inline-flex">
                        <Star size={16} className={p.featured ? 'text-gold fill-gold' : 'text-line'} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => toggle(p, 'exportAvailable')} disabled={pending}>
                        <Badge tone={p.exportAvailable ? 'green' : 'neutral'}>
                          {p.exportAvailable ? 'Yes' : 'No'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center text-ink font-mono text-xs">{p.order}</td>
                    <td className="px-6 py-4 text-right text-xs text-muted whitespace-nowrap">{relativeTime(p.updatedAt as unknown as string)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEdit(p)} className="p-2 hover:bg-paper border border-transparent hover:border-line">
                          <Pencil size={14} className="text-ink" />
                        </button>
                        <button onClick={() => setDel(p)} className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200">
                          <Trash2 size={14} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-line flex items-center justify-between text-xs">
            <span className="text-muted">Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border border-line hover:border-ink disabled:opacity-40 uppercase tracking-wider">Prev</button>
              <span className="px-3 py-1.5 border border-ink bg-ink text-white">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 border border-line hover:border-ink disabled:opacity-40 uppercase tracking-wider">Next</button>
            </div>
          </div>
        )}
      </Card>

      {/* Forms */}
      {creating && <ProductForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); router.refresh(); }} />}
      {edit && <ProductForm product={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); router.refresh(); }} />}

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={confirmDelete}
        title="Delete product?"
        message={`This will permanently remove "${del?.title}" from the catalog. This action cannot be undone.`}
        loading={pending}
      />
    </div>
  );
}
