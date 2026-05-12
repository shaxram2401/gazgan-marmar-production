'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Textarea, Button } from '@/components/ui';
import { relativeTime } from '@/lib/utils';
import { toast } from 'sonner';

interface Note { text: string; author: string; authorEmail: string; createdAt: string }

export default function LeadNotes({ leadId, notes, adminEmail, adminName }: {
  leadId: string; notes: Note[]; adminEmail: string; adminName: string;
}) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [pending, start] = useTransition();

  function add() {
    if (!text.trim()) return;
    start(async () => {
      const r = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() })
      });
      if (r.ok) { setText(''); toast.success('Note added'); router.refresh(); }
      else toast.error('Failed');
    });
  }

  return (
    <Card>
      <div className="px-6 py-5 border-b border-line">
        <h3 className="font-serif text-2xl">Notes &amp; Activity</h3>
      </div>
      <div className="p-6">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={`Add a note as ${adminName}...`} />
        <div className="mt-3 flex justify-end">
          <Button onClick={add} loading={pending} disabled={!text.trim()}>Add Note</Button>
        </div>

        <div className="mt-6 space-y-4">
          {notes.length === 0 && <p className="text-sm text-muted text-center py-6">No notes yet.</p>}
          {notes.map((n, i) => (
            <div key={i} className="border-l-2 border-gold pl-4 py-1">
              <div className="text-sm text-ink whitespace-pre-wrap">{n.text}</div>
              <div className="text-[10px] tracking-[.18em] uppercase text-muted mt-1.5">
                {n.author} · {relativeTime(n.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
