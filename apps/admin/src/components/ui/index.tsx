'use client';
import { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode, forwardRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

/* ---------- Button ---------- */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }, ref) => {
    const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-sm' };
    const variants = {
      primary:   'bg-ink text-white hover:bg-graphite',
      secondary: 'bg-white text-ink border border-line hover:border-ink',
      ghost:     'bg-transparent text-ink hover:bg-paper',
      danger:    'bg-red-600 text-white hover:bg-red-700',
      gold:      'bg-gold text-white hover:bg-gold-dark'
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium tracking-wide uppercase text-[11px]',
          'transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-gold/40 focus:ring-offset-1',
          sizes[size], variants[variant], className
        )}
        {...rest}
      >
        {loading && <Spinner size={14} />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

/* ---------- Input ---------- */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...rest }, ref) => (
    <div className="w-full">
      {label && <label className="block text-[10px] tracking-[.24em] uppercase text-muted mb-2 font-medium">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full h-11 px-3 bg-white border border-line text-sm text-ink',
          'focus:outline-none focus:border-ink transition-colors',
          error && 'border-red-500',
          className
        )}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...rest }, ref) => (
    <div className="w-full">
      {label && <label className="block text-[10px] tracking-[.24em] uppercase text-muted mb-2 font-medium">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full min-h-[100px] px-3 py-2 bg-white border border-line text-sm text-ink',
          'focus:outline-none focus:border-ink transition-colors resize-y',
          error && 'border-red-500',
          className
        )}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, children, ...rest }, ref) => (
    <div className="w-full">
      {label && <label className="block text-[10px] tracking-[.24em] uppercase text-muted mb-2 font-medium">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full h-11 px-3 bg-white border border-line text-sm text-ink',
          'focus:outline-none focus:border-ink transition-colors',
          error && 'border-red-500',
          className
        )}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

/* ---------- Card ---------- */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('bg-white border border-line', className)}>{children}</div>;
}
export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-6 py-5 border-b border-line flex items-center justify-between', className)}>{children}</div>;
}
export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}
export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="font-serif text-2xl text-ink">{children}</h3>;
}

/* ---------- Badge ---------- */
export function Badge({ children, tone = 'neutral', className }: {
  children: ReactNode;
  tone?: 'neutral' | 'gold' | 'green' | 'red' | 'blue' | 'amber';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-paper text-ink border-line',
    gold:    'bg-gold/10 text-gold-dark border-gold/30',
    green:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    red:     'bg-red-50 text-red-700 border-red-200',
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200'
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-[10px] tracking-[.18em] uppercase border font-medium', tones[tone], className)}>
      {children}
    </span>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title?: string; children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className={cn('bg-white w-full max-h-[90vh] overflow-y-auto animate-slide-up', widths[size])} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="px-8 py-5 border-b border-line flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="font-serif text-2xl text-ink">{title}</h2>
            <button onClick={onClose} className="w-9 h-9 border border-line hover:bg-ink hover:text-white transition-colors flex items-center justify-center">
              <X size={16} />
            </button>
          </div>
        )}
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Spinner ---------- */
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity=".2" />
      <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="text-center py-20 px-6">
      {icon && <div className="inline-flex w-14 h-14 items-center justify-center border border-line text-muted mb-5">{icon}</div>}
      <h3 className="font-serif text-2xl text-ink">{title}</h3>
      {description && <p className="text-sm text-muted mt-2 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
