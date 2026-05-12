import { adminDb } from '@/lib/firebase.admin';
import Topbar from '@/components/layout/Topbar';
import { Card, Badge } from '@/components/ui';
import { ActivityLog } from '@/types';
import ActivityFilters from './ActivityFilters';
import { relativeTime, formatDate } from '@/lib/utils';
import { History } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getLogs(action?: string, resource?: string): Promise<(ActivityLog & { createdAt: string })[]> {
  let q: FirebaseFirestore.Query = adminDb.collection('auditLogs');
  if (action && action !== 'all') q = q.where('action', '==', action);
  if (resource && resource !== 'all') q = q.where('resource', '==', resource);
  q = q.orderBy('createdAt', 'desc').limit(200);
  const snap = await q.get();
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id, ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString()
    } as ActivityLog & { createdAt: string };
  });
}

const ACTION_TONE: Record<string, 'green' | 'blue' | 'red' | 'amber' | 'gold' | 'neutral'> = {
  create: 'green', update: 'blue', delete: 'red',
  login: 'neutral', logout: 'neutral', upload: 'gold', role_change: 'amber'
};

export default async function Page({ searchParams }: { searchParams: { action?: string; resource?: string } }) {
  const logs = await getLogs(searchParams.action, searchParams.resource);
  return (
    <>
      <Topbar
        title="Activity Log"
        subtitle="Audit · Who did what, when"
        action={<div className="text-right">
          <div className="font-serif text-3xl text-ink leading-none">{logs.length}</div>
          <div className="text-[10px] tracking-[.28em] uppercase text-muted mt-1">Recent Entries</div>
        </div>}
      />

      <div className="px-6 md:px-10 py-8 space-y-6">
        <ActivityFilters action={searchParams.action} resource={searchParams.resource} />

        <Card>
          {logs.length === 0 ? (
            <div className="text-center py-20">
              <History size={28} className="mx-auto text-muted mb-3" strokeWidth={1.5} />
              <h3 className="font-serif text-2xl text-ink">No activity</h3>
              <p className="text-sm text-muted mt-2">Audit events will appear here as admins make changes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] tracking-[.22em] uppercase text-muted border-b border-line">
                    <th className="text-left font-medium px-6 py-3">Actor</th>
                    <th className="text-left font-medium px-6 py-3">Action</th>
                    <th className="text-left font-medium px-6 py-3">Module</th>
                    <th className="text-left font-medium px-6 py-3">Target</th>
                    <th className="text-left font-medium px-6 py-3">When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} className="border-b border-line last:border-0 hover:bg-paper">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-ink text-white font-serif flex items-center justify-center text-xs">
                            {l.actorEmail[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-ink truncate">{l.actorName || l.actorEmail}</div>
                            <div className="text-xs text-muted truncate">{l.actorEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge tone={ACTION_TONE[l.action] || 'neutral'}>{l.action.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-6 py-4 text-ink capitalize">{l.resource}</td>
                      <td className="px-6 py-4">
                        <div className="text-ink">{l.resourceLabel || l.resourceId || '—'}</div>
                        {l.resourceId && l.resourceLabel && <div className="text-xs text-muted font-mono mt-0.5">{l.resourceId}</div>}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted whitespace-nowrap" title={formatDate(l.createdAt, true)}>
                        {relativeTime(l.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
