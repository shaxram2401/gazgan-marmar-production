import { ROLE_PERMISSIONS, Role } from '@/types';
export function canRead(role: Role, resource: string): boolean {
  const r = ROLE_PERMISSIONS[role].read;
  return r.includes('*') || r.includes(resource);
}
export function canWrite(role: Role, resource: string): boolean {
  const w = ROLE_PERMISSIONS[role].write;
  return w.includes('*') || w.includes(resource);
}
