'use client';
import { useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase.client';
import { Card, Button, Input, Textarea, Badge, Modal } from '@/components/ui';
import { ConfirmDialog, FormRow } from '@/components/ui/Extras';
import { FileText, Upload, Download, Trash2, Check, Loader2, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, relativeTime } from '@/lib/utils';
import type { CatalogVersion } from '@/types';

export default function CatalogClient({ initial, active }: { initial: CatalogVersion[]; active: CatalogVersion | null }) {
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [del, setDel] = useState<CatalogVersion | null>(null);
  const [pending, start] = useTransition();
  const totalDownloads = initial.reduce((s, v) => s + (v.downloadCount || 0), 0);

  function setActive(v: CatalogVersion) {
    if (v.active) return;
    start(async () => {
      const r = await fetch(`/api/catalog/${v.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'activate' }) });
      if (r.ok) { toast.success(`${v.version} is now active`); router.refresh(); } else toast.error('Failed');
    });
  }

  function confirmDelete() {
    if (!del) return;
    start(async () => {
      const r = await fetch(`/api/catalog/${del.id}`, { method: 'DELETE' });
      if (r.ok) {
        // Also delete the file from storage
        try { await deleteObject(ref(storage, del.fileUrl)); } catch {}
        toast.success('Deleted'); setDel(null); router.refresh();
      } else {
        const e = await r.json();
        toast.error(e.error || 'Delete failed');
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-line">
        <Stat label="Versions" value={initial.length} />
        <Stat label="Active Version" value={active?.version || '—'} accent small />
        <Stat label="Total Downloads" value={totalDownloads.toLocaleString()} />
        <Stat label="Last Updated" value={active?.uploadedAt ? formatDate(active.uploadedAt as unknown as string) : '—'} small />
      </div>

      {/* Active version card */}
      {active ? (
        <Card>
          <div className="px-6 py-5 border-b border-line flex items-center justify-between">
            <div>
              <div className="text-[10px] tracking-[.3em] uppercase text-gold mb-1.5">Currently Active</div>
              <h3 className="font-serif text-3xl text-ink">{active.version}</h3>
            </div>
            <Button onClick={() => setUploadOpen(true)}><Upload size={14} /> Upload New Version</Button>
          </div>
          <div className="p-6 grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-4 p-5 bg-paper border border-line">
                <div className="w-14 h-16 bg-ink text-gold flex items-center justify-center font-serif text-2xl">
                  PDF
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink truncate">{active.fileName}</div>
                  <div className="text-xs text-muted mt-1">
                    {formatFileSize(active.fileSize)} {active.pageCount ? ` · ${active.pageCount} pages` : ''}
                  </div>
                </div>
                <a href={active.fileUrl} target="_blank" rel="noopener" className="p-3 hover:bg-white border border-line">
                  <ExternalLink size={16} />
                </a>
              </div>
              {active.notes && (
                <div className="p-5 bg-paper border border-line">
                  <div className="text-[10px] tracking-[.24em] uppercase text-muted mb-2">Release Notes</div>
                  <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{active.notes}</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <PublicLink url={active.fileUrl} />
              <div className="p-5 border border-line">
                <div className="text-[10px] tracking-[.24em] uppercase text-muted mb-2">Downloads</div>
                <div className="font-serif text-4xl text-gold font-light">{(active.downloadCount || 0).toLocaleString()}</div>
                <div className="text-xs text-muted mt-2">All-time public downloads</div>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-16">
            <FileText size={32} className="mx-auto text-muted mb-4" strokeWidth={1.5} />
            <h3 className="font-serif text-2xl text-ink">No catalog uploaded yet</h3>
            <p className="text-sm text-muted mt-2 mb-6">Upload your first export catalog PDF.</p>
            <Button onClick={() => setUploadOpen(true)}><Upload size={14} /> Upload Catalog</Button>
          </div>
        </Card>
      )}

      {/* Version history */}
      {initial.length > 0 && (
        <Card>
          <div className="px-6 py-5 border-b border-line">
            <h3 className="font-serif text-2xl text-ink">Version History</h3>
            <p className="text-xs text-muted mt-1">All catalog releases · {initial.length} version{initial.length === 1 ? '' : 's'}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[.22em] uppercase text-muted border-b border-line">
                  <th className="text-left font-medium px-6 py-3">Version</th>
                  <th className="text-left font-medium px-6 py-3">File</th>
                  <th className="text-left font-medium px-6 py-3">Size</th>
                  <th className="text-left font-medium px-6 py-3">Downloads</th>
                  <th className="text-left font-medium px-6 py-3">Uploaded</th>
                  <th className="text-left font-medium px-6 py-3">By</th>
                  <th className="text-right font-medium px-6 py-3 w-44">Actions</th>
                </tr>
              </thead>
              <tbody>
                {initial.map(v => (
                  <tr key={v.id} className="border-b border-line last:border-0 hover:bg-paper">
                    <td className="px-6 py-4">
                      <div className="font-medium text-ink">{v.version}</div>
                      {v.active && <Badge tone="gold" className="mt-1">Active</Badge>}
                    </td>
                    <td className="px-6 py-4 text-ink max-w-xs truncate">{v.fileName}</td>
                    <td className="px-6 py-4 text-ink">{formatFileSize(v.fileSize)}</td>
                    <td className="px-6 py-4 text-gold font-mono">{v.downloadCount || 0}</td>
                    <td className="px-6 py-4 text-xs text-muted whitespace-nowrap">{relativeTime(v.uploadedAt as unknown as string)}</td>
                    <td className="px-6 py-4 text-xs text-muted truncate max-w-[160px]">{v.uploadedByEmail}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {!v.active && (
                          <button onClick={() => setActive(v)} disabled={pending}
                            className="px-3 py-1.5 text-[10px] tracking-[.18em] uppercase border border-line hover:bg-ink hover:text-white">
                            Activate
                          </button>
                        )}
                        <a href={v.fileUrl} target="_blank" rel="noopener" className="p-2 hover:bg-paper border border-transparent hover:border-line">
                          <Download size={14} />
                        </a>
                        {!v.active && (
                          <button onClick={() => setDel(v)} className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200">
                            <Trash2 size={14} className="text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onDone={() => { setUploadOpen(false); router.refresh(); }} />}
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={confirmDelete}
                     title="Delete catalog version?" message={`This will permanently delete "${del?.version}" and its PDF file.`} loading={pending} />
    </div>
  );
}

function Stat({ label, value, accent, small }: { label: string; value: string | number; accent?: boolean; small?: boolean }) {
  return (
    <div className="bg-white border-r border-b border-line p-6">
      <div className={`font-serif font-light leading-none ${small ? 'text-2xl' : 'text-4xl'} ${accent ? 'text-gold' : 'text-ink'}`}>{value}</div>
      <div className="text-[10px] tracking-[.26em] uppercase text-muted mt-3">{label}</div>
    </div>
  );
}

function PublicLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="p-5 border border-line">
      <div className="text-[10px] tracking-[.24em] uppercase text-muted mb-2">Public Download URL</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-[11px] text-ink bg-paper px-2 py-1.5 truncate">{url}</code>
        <button onClick={copy} className="p-2 border border-line hover:bg-paper">
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [notes, setNotes] = useState('');
  const [pageCount, setPageCount] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast.error('Select a PDF file'); return; }
    if (!version.trim()) { toast.error('Version label required'); return; }
    if (file.type !== 'application/pdf') { toast.error('PDF files only'); return; }
    if (file.size > 50 * 1024 * 1024) { toast.error('Max 50 MB'); return; }

    setUploading(true);
    try {
      const safeName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]+/gi, '-').toLowerCase()}`;
      const r = ref(storage, `catalog/${safeName}`);
      const task = uploadBytesResumable(r, file, { contentType: 'application/pdf' });

      await new Promise<void>((resolve, reject) => {
        task.on('state_changed',
          (s) => setProgress((s.bytesTransferred / s.totalBytes) * 100),
          reject,
          () => resolve()
        );
      });

      const url = await getDownloadURL(task.snapshot.ref);

      const res = await fetch('/api/catalog', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: version.trim(),
          fileName: file.name,
          fileUrl: url,
          fileSize: file.size,
          pageCount: pageCount ? Number(pageCount) : undefined,
          notes: notes.trim() || undefined,
          active: true
        })
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error?.formErrors?.[0] || 'Save failed');
      }
      toast.success(`Catalog ${version} uploaded and activated`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal open onClose={uploading ? () => {} : onClose} title="Upload Catalog Version" size="md">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="block text-[10px] tracking-[.24em] uppercase text-muted mb-2 font-medium">PDF File *</label>
          <div onClick={() => inputRef.current?.click()}
               className="border-2 border-dashed border-line bg-paper py-8 px-5 cursor-pointer hover:bg-white hover:border-ink transition-colors text-center">
            {file ? (
              <div>
                <FileText size={24} className="mx-auto text-gold mb-2" />
                <div className="text-sm font-medium text-ink">{file.name}</div>
                <div className="text-xs text-muted mt-1">{formatFileSize(file.size)}</div>
              </div>
            ) : (
              <>
                <Upload size={22} className="mx-auto text-muted mb-2" strokeWidth={1.5} />
                <div className="text-sm text-ink">Click to select PDF</div>
                <div className="text-[10px] tracking-[.22em] uppercase text-muted mt-1">Max 50 MB</div>
              </>
            )}
          </div>
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden"
                 onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>

        <FormRow cols={2}>
          <Input label="Version Label *" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="2026.IX" required />
          <Input label="Page Count" type="number" value={pageCount} onChange={(e) => setPageCount(e.target.value)} placeholder="96" />
        </FormRow>

        <Textarea label="Release Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Added new black marble lines..." />

        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Uploading...</span>
              <span className="text-ink font-mono">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-line">
              <div className="h-full bg-gold transition-[width] duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          <Button type="button" variant="secondary" onClick={onClose} disabled={uploading}>Cancel</Button>
          <Button type="submit" loading={uploading}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : null}
            Upload & Activate
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
}
