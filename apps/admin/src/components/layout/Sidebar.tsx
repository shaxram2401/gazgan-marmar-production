'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, Users, Image, Quote, Globe, Inbox,
  FileText, Settings, BarChart3, LogOut, Shield, History, Bell
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { canRead } from '@/lib/permissions.client';
import NotificationBell from './NotificationBell';

const nav = [
  { href: '/dashboard',     label: 'Overview',      icon: LayoutDashboard, resource: '*' },
  { href: '/leads',         label: 'Leads',         icon: Inbox,           resource: 'leads' },
  { href: '/products',      label: 'Products',      icon: Package,         resource: 'products' },
  { href: '/entrepreneurs', label: 'Entrepreneurs', icon: Users,           resource: 'entrepreneurs' },
  { href: '/gallery',       label: 'Gallery',       icon: Image,           resource: 'gallery' },
  { href: '/testimonials',  label: 'Testimonials',  icon: Quote,           resource: 'testimonials' },
  { href: '/countries',     label: 'Export Map',    icon: Globe,           resource: 'countries' },
  { href: '/catalog',       label: 'Catalog PDF',   icon: FileText,        resource: 'catalog' },
  { href: '/analytics',     label: 'Analytics',     icon: BarChart3,       resource: 'analytics' },
  { href: '/activity',      label: 'Activity Log',  icon: History,         resource: '*' },
  { href: '/users',         label: 'Team & Roles',  icon: Shield,          resource: 'users' },
  { href: '/settings',      label: 'Settings',      icon: Settings,        resource: 'settings' }
];

export default function Sidebar() {
  const path = usePathname();
  const { admin, signOut } = useAuth();
  if (!admin) return null;

  return (
    <aside className="hidden md:flex w-64 bg-ink text-white flex-col h-screen sticky top-0">
      <div className="px-6 py-7 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="w-9 h-9 border border-white flex items-center justify-center font-serif italic text-lg">G</span>
          <div>
            <div className="font-serif text-base tracking-[.18em] uppercase">Gazgan Marmo</div>
            <div className="text-[10px] tracking-[.22em] uppercase text-white/40 mt-0.5">Admin Console</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-0.5 overflow-y-auto">
        {nav.filter(i => canRead(admin.role, i.resource)).map(item => {
          const active = path === item.href || path.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-[13px] tracking-wide transition-colors',
                active ? 'bg-white/10 text-white border-l-2 border-gold' : 'text-white/65 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={16} strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-white font-serif text-sm shrink-0">
            {admin.email[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs truncate">{admin.displayName || admin.email}</div>
            <div className="text-[10px] tracking-[.18em] uppercase text-gold mt-0.5">{admin.role.replace('_', ' ')}</div>
          </div>
          <NotificationBell />
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] tracking-[.22em] uppercase text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={14} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
