import { adminDb } from '@/lib/firebase.admin';
import { getCurrentAdmin } from '@/lib/auth.server';
import Topbar from '@/components/layout/Topbar';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';
import type { Settings } from '@/types';

export const dynamic = 'force-dynamic';

const DEFAULTS: Settings = {
  contact: {
    whatsapp: '998901112233', phone: '+998901112233',
    email: 'export@gazganmarmo.uz', emailFallback: 'sales@gazganmarmo.uz',
    telegram: 'gazgan_marmo',
    addressLine1: 'Gazgan, Navoiy Region',
    addressLine2: 'Uzbekistan',
    workingHours: 'Mon — Sat · 09:00 — 18:00'
  },
  seo: { title: 'Gazgan Marmo', description: '', keywords: '' },
  social: {},
  leadRouting: {
    investor: 'ir@gazganmarmo.uz', buyer: 'export@gazganmarmo.uz',
    distributor: 'partners@gazganmarmo.uz', project_owner: 'export@gazganmarmo.uz',
    architect: 'export@gazganmarmo.uz', other: 'export@gazganmarmo.uz'
  }
};

async function getSettings(): Promise<Settings> {
  const snap = await adminDb.collection('settings').doc('global').get();
  return (snap.exists ? snap.data() : DEFAULTS) as Settings;
}

export default async function Page() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.role !== 'super_admin') redirect('/dashboard');
  const settings = await getSettings();
  return (
    <>
      <Topbar title="Settings" subtitle="Configuration · Site-wide preferences" />
      <div className="px-6 md:px-10 py-8"><SettingsClient initial={settings} /></div>
    </>
  );
}
