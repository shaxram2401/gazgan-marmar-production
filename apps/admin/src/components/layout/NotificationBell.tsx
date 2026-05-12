'use client';
import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { relativeTime, cn } from '@/lib/utils';
import { Notification } from '@/types';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<(Notification & { createdAt?: string })[]>([]);
  const unread = items.filter(i => !i.read).length;

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(15));
    return onSnapshot(q, snap => {
      setItems(snap.docs.map(d => {
        const data = d.data();
        const ts = data.createdAt as Timestamp | undefined;
        return { id: d.id, ...(data as Notification), createdAt: ts?.toDate?.()?.toISOString() };
      }));
    });
  }, []);

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ action: 'markAllRead' }), headers: { 'Content-Type': 'application/json' } });
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="relative p-2 hover:bg-white/5 transition-colors" aria-label="Notifications">
        <Bell size={18} strokeWidth={1.5} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-gold text-ink text-[10px] font-bold flex items-center justify-center rounded-full">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-full ml-2 -top-4 z-40 w-[360px] bg-white text-ink border border-line shadow-soft animate-slide-up">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <h3 className="font-serif text-lg">Notifications</h3>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[10px] tracking-[.22em] uppercase text-gold hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-muted">No notifications yet.</div>
              ) : items.map(n => (
                <Link
                  key={n.id}
                  href={n.link || '#'}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block px-5 py-3 border-b border-line last:border-0 hover:bg-paper transition-colors',
                    !n.read && 'bg-gold/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink">{n.title}</div>
                      <div className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</div>
                      <div className="text-[10px] tracking-[.18em] uppercase text-muted mt-1.5">
                        {relativeTime(n.createdAt)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-line text-center">
              <Link href="/dashboard" onClick={() => setOpen(false)} className="text-[10px] tracking-[.24em] uppercase text-muted hover:text-ink">
                View All Activity →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
