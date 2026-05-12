'use client';
import { Modal, Button } from './index';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

/* ConfirmDialog */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true, loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel?: string; danger?: boolean; loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-muted mb-8 leading-relaxed">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

/* Switch */
export function Switch({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string; description?: string;
}) {
  return (
    <label className="flex items-start gap-4 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 mt-0.5 transition-colors',
          checked ? 'bg-gold' : 'bg-line'
        )}
        role="switch"
        aria-checked={checked}
      >
        <span className={cn(
          'inline-block h-5 w-5 bg-white shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        )} style={{ marginTop: 2 }} />
      </button>
      {(label || description) && (
        <div className="flex-1">
          {label && <div className="text-sm font-medium text-ink">{label}</div>}
          {description && <div className="text-xs text-muted mt-0.5">{description}</div>}
        </div>
      )}
    </label>
  );
}

/* SearchBar */
export function SearchBar({ value, onChange, placeholder = 'Search...' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-80">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" strokeWidth={1.5} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-3 bg-white border border-line text-sm focus:outline-none focus:border-ink transition-colors"
      />
    </div>
  );
}

/* FormRow helper */
export function FormRow({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  const grid = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-3' }[cols];
  return <div className={cn('grid gap-5', grid)}>{children}</div>;
}
