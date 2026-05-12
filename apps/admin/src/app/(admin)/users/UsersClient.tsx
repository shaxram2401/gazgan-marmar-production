'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminUser, Role } from '@/types';
import { Card, Button, Badge, Modal, Input, Select } from '@/components/ui';
import { ConfirmDialog, FormRow, Switch, SearchBar } from '@/components/ui/Extras';
import { Plus, Pencil, Trash2, Shield, Crown, Briefcase, Users as UsersIcon, Check } from 'lucide-react';
import { toast } from 'sonner';
import { relativeTime, cn } from '@/lib/utils';
import { userSchema, UserInput } from '@/lib/schemas';

const ROLE_META: Record<Role, { label: string; icon: typeof Crown; tone: 'gold' | 'blue' | 'green'; color: string }> = {
  super_admin:   { label: 'Super Admin',    icon: Crown,     tone: 'gold',  color: 'text-gold' },
  manager:       { label: 'Manager',        icon: Briefcase, tone: 'blue',  color: 'text-blue-600' },
  sales_manager: { label: 'Sales Manager',  icon: UsersIcon, tone: 'green', color: 'text-emerald-600' }
};

const ALL_RESOURCES = [
  'products', 'entrepreneurs', 'gallery', 'testimonials', 'countries',
  'catalog', 'leads', 'analytics', 'settings', 'users', 'notifications'
];

export default function UsersClient({ initial, currentUid, permissions }: {
  initial: AdminUser[]; currentUid: string;
  permissions: Record<Role, { read: string[]; write: string[] }>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [edit, setEdit] = useState<AdminUser | null>(null);
  const [del, setDel] = useState<AdminUser | null>(null);
  const [pending, start] = useTransition();

  const filtered = initial.filter(u => !query || u.email.toLowerCase().includes(query.toLowerCase()) || (u.displayName || '').toLowerCase().includes(query.toLowerCase()));

  function confirmDelete() {
    if (!del) return;
    start(async () => {
      const r = await fetch(`/api/users/${del.uid}`, { method: 'DELETE' });
      if (r.ok) { toast.success('User removed'); setDel(null); router.refresh(); }
      else { const e = await r.json(); toast.error(e.error || 'Failed'); }
    });
  }

  return (
    <div className="space-y-8">
      {/* Role permission matrix */}
      <Card>
        <div className="px-6 py-5 border-b border-line">
          <h3 className="font-serif text-2xl text-ink flex items-center gap-3"><Shield size={20} className="text-gold" /> Role Permissions</h3>
          <p className="text-xs text-muted mt-1">Read &amp; write access matrix per role. Enforced on server &amp; Firestore rules.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left font-medium px-6 py-3 text-[10px] tracking-[.22em] uppercase text-muted">Module</th>
                {(Object.keys(permissions) as Role[]).map(r => (
                  <th key={r} className="font-medium px-4 py-3 text-[10px] tracking-[.22em] uppercase text-muted">
                    <div className="flex items-center gap-2 justify-center">
                      {(() => { const Ic = ROLE_META[r].icon; return <Ic size={13} className={ROLE_META[r].color} />; })()}
                      {ROLE_META[r].label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_RESOURCES.map(res => (
                <tr key={res} className="border-b border-line last:border-0">
                  <td className="px-6 py-3 text-ink capitalize">{res}</td>
                  {(Object.keys(permissions) as Role[]).map(r => {
                    const canRead  = permissions[r].read.includes('*')  || permissions[r].read.includes(res);
                    const canWrite = permissions[r].write.includes('*') || permissions[r].write.includes(res);
                    return (
                      <td key={r} className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <PermDot active={canRead} label="R" />
                          <PermDot active={canWrite} label="W" />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Users list */}
      <div className="space-y-6">
        <div className="bg-white border border-line p-5 flex items-center gap-4 justify-between">
          <SearchBar value={query} onChange={setQuery} placeholder="Search by email or name..." />
          <Button onClick={() => setCreating(true)}><Plus size={14} /> Add Team Member</Button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[.22em] uppercase text-muted border-b border-line">
                  <th className="text-left font-medium px-6 py-3">User</th>
                  <th className="text-left font-medium px-6 py-3">Role</th>
                  <th className="text-center font-medium px-6 py-3">Status</th>
                  <th className="text-left font-medium px-6 py-3">Last Login</th>
                  <th className="text-left font-medium px-6 py-3">Created</th>
                  <th className="text-right font-medium px-6 py-3 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const meta = ROLE_META[u.role];
                  const Icon = meta.icon;
                  const self = u.uid === currentUid;
                  return (
                    <tr key={u.uid} className="border-b border-line last:border-0 hover:bg-paper">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-ink text-white font-serif flex items-center justify-center text-sm">
                            {u.email[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-ink flex items-center gap-2">
                              {u.displayName || u.email}
                              {self && <Badge tone="gold">You</Badge>}
                            </div>
                            <div className="text-xs text-muted">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2">
                          <Icon size={14} className={meta.color} />
                          <span className="text-sm">{meta.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge tone={u.active ? 'green' : 'neutral'}>{u.active ? 'Active' : 'Disabled'}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted whitespace-nowrap">{u.lastLoginAt ? relativeTime(u.lastLoginAt as unknown as string) : 'Never'}</td>
                      <td className="px-6 py-4 text-xs text-muted whitespace-nowrap">{relativeTime(u.createdAt as unknown as string)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEdit(u)} className="p-2 hover:bg-paper border border-transparent hover:border-line"><Pencil size={14} /></button>
                          {!self && <button onClick={() => setDel(u)} className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200"><Trash2 size={14} className="text-red-600" /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {creating && <UserForm onClose={() => setCreating(false)} onSaved={() => { setCreating(false); router.refresh(); }} />}
      {edit && <UserForm user={edit} self={edit.uid === currentUid} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); router.refresh(); }} />}
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={confirmDelete}
                     title="Remove team member?" message={`This will permanently remove ${del?.email} and revoke all access.`} loading={pending} />
    </div>
  );
}

function PermDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={cn(
      'inline-flex items-center justify-center w-7 h-7 text-[10px] font-bold border',
      active ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-paper border-line text-line'
    )}>
      {active ? <Check size={12} /> : label}
    </span>
  );
}

function UserForm({ user, self, onClose, onSaved }: { user?: AdminUser; self?: boolean; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!user;
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<UserInput>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: user?.email || '',
      displayName: user?.displayName || '',
      role: user?.role || 'manager',
      active: user?.active ?? true,
      password: ''
    }
  });

  async function onSubmit(data: UserInput) {
    const payload = { ...data };
    if (isEdit && !payload.password) delete payload.password;
    const r = await fetch(isEdit ? `/api/users/${user!.uid}` : '/api/users', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (r.ok) { toast.success(isEdit ? 'User updated' : 'Team member added'); onSaved(); }
    else { const e = await r.json(); toast.error(typeof e.error === 'string' ? e.error : 'Save failed'); }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Team Member' : 'Add Team Member'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormRow cols={2}>
          <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} disabled={isEdit} />
          <Input label="Display Name *" {...register('displayName')} error={errors.displayName?.message} />
        </FormRow>
        <Select label="Role *" {...register('role')} error={errors.role?.message} disabled={self}>
          <option value="super_admin">Super Admin — full access</option>
          <option value="manager">Manager — content management</option>
          <option value="sales_manager">Sales Manager — leads only</option>
        </Select>
        {self && <p className="-mt-3 text-xs text-muted">You cannot change your own role.</p>}
        <Input label={isEdit ? 'New Password (leave blank to keep)' : 'Password *'} type="password" {...register('password')} error={errors.password?.message} placeholder={isEdit ? '••••••••' : 'Min 8 characters'} />
        <Switch checked={watch('active')} onChange={(v) => setValue('active', v)} label="Active" description={self ? 'You cannot deactivate yourself.' : 'Disabled users cannot sign in.'} />
        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save Changes' : 'Create User'}</Button>
        </div>
      </form>
    </Modal>
  );
}
