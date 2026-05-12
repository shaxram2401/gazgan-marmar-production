'use client';
import { Menu } from 'lucide-react';

export default function Topbar({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="bg-white border-b border-line px-6 md:px-10 py-6 flex items-start justify-between gap-6">
      <div>
        {subtitle && <div className="text-[10px] tracking-[.3em] uppercase text-gold mb-2 font-medium">{subtitle}</div>}
        <h1 className="font-serif text-3xl md:text-4xl text-ink font-light leading-tight">{title}</h1>
      </div>
      {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
    </header>
  );
}
