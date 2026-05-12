'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Select, Input, Button } from '@/components/ui';
import { toast } from 'sonner';

const STATUSES = ['new', 'in_review', 'qualified', 'negotiation', 'won', 'lost', 'spam'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export default function LeadActions({ leadId, status, priority, assignedToEmail }: {
  leadId: string; status: string; priority: string; assignedToEmail: string;
}) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [p, setP] = useState(priority);
  const [a, setA] = useState(assignedToEmail);
  const [pending, start] = useTransition();

  async function save() {
    start(async () => {
      const r = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: s, priority: p, assignedToEmail: a })
      });
      if (r.ok) { toast.success('Lead updated'); router.refresh(); }
      else toast.error('Update failed');
    });
  }

  return (
    <Card>
      <div className="px-6 py-5 border-b border-line">
        <h3 className="font-serif text-xl">Workflow</h3>
      </div>
      <div className="p-6 space-y-4">
        <Select label="Status" value={s} onChange={(e) => setS(e.target.value)}>
          {STATUSES.map(x => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}
        </Select>
        <Select label="Priority" value={p} onChange={(e) => setP(e.target.value)}>
          {PRIORITIES.map(x => <option key={x} value={x}>{x}</option>)}
        </Select>
        <Input label="Assigned to (email)" value={a} onChange={(e) => setA(e.target.value)} placeholder="sales@gazganmarmo.uz" />
        <Button onClick={save} loading={pending} className="w-full">Save Changes</Button>
      </div>
    </Card>
  );
}
