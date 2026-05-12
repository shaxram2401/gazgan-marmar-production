'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, Button, Input, Textarea } from '@/components/ui';
import { FormRow } from '@/components/ui/Extras';
import ImageUpload from '@/components/ui/ImageUpload';
import { settingsSchema, SettingsInput } from '@/lib/schemas';
import { Phone, Search, Share2, Scale, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Settings } from '@/types';

const TABS = [
  { id: 'contact', label: 'Contact', icon: Phone },
  { id: 'seo', label: 'SEO & Tracking', icon: Search },
  { id: 'social', label: 'Social', icon: Share2 },
  { id: 'legal', label: 'Legal', icon: Scale },
  { id: 'routing', label: 'Lead Routing', icon: Inbox }
] as const;

type TabId = typeof TABS[number]['id'];

export default function SettingsClient({ initial }: { initial: Settings }) {
  const [tab, setTab] = useState<TabId>('contact');

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      contact: { ...initial.contact },
      seo: {
        title: initial.seo?.title || '',
        description: initial.seo?.description || '',
        keywords: initial.seo?.keywords || '',
        ogImage: initial.seo?.ogImage || '',
        googleAnalyticsId: (initial.seo as Record<string, string>)?.googleAnalyticsId || '',
        metaPixelId: (initial.seo as Record<string, string>)?.metaPixelId || '',
        googleSearchConsole: (initial.seo as Record<string, string>)?.googleSearchConsole || '',
        yandexVerification: (initial.seo as Record<string, string>)?.yandexVerification || ''
      },
      social: { ...initial.social },
      legal: {
        companyName: (initial as unknown as { legal?: Record<string, string> }).legal?.companyName || 'Gazgan Marmo Alliance LLC',
        taxId: (initial as unknown as { legal?: Record<string, string> }).legal?.taxId || '',
        exportLicense: (initial as unknown as { legal?: Record<string, string> }).legal?.exportLicense || '',
        jurisdiction: (initial as unknown as { legal?: Record<string, string> }).legal?.jurisdiction || 'Republic of Uzbekistan'
      },
      leadRouting: { ...initial.leadRouting }
    }
  });

  async function onSubmit(data: SettingsInput) {
    const r = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (r.ok) toast.success('Settings saved');
    else { const e = await r.json(); toast.error(e.error?.formErrors?.[0] || 'Save failed'); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Tab nav */}
        <Card className="h-fit lg:sticky lg:top-6">
          <div className="p-2">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wide text-left transition-colors',
                    active ? 'bg-ink text-white' : 'text-ink hover:bg-paper'
                  )}
                >
                  <Icon size={15} strokeWidth={1.5} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Panel */}
        <Card>
          <div className="px-6 py-5 border-b border-line flex items-center justify-between">
            <h3 className="font-serif text-2xl text-ink">{TABS.find(t => t.id === tab)?.label}</h3>
            <Button type="submit" loading={isSubmitting}>Save Changes</Button>
          </div>
          <div className="p-6 space-y-6">
            {tab === 'contact' && (
              <>
                <FormRow cols={2}>
                  <Input label="WhatsApp Number *" {...register('contact.whatsapp')} error={errors.contact?.whatsapp?.message} placeholder="998901112233" />
                  <Input label="Phone *" {...register('contact.phone')} error={errors.contact?.phone?.message} placeholder="+998 90 111 22 33" />
                </FormRow>
                <FormRow cols={2}>
                  <Input label="Primary Email *" {...register('contact.email')} error={errors.contact?.email?.message} />
                  <Input label="Fallback Email" {...register('contact.emailFallback')} error={errors.contact?.emailFallback?.message} />
                </FormRow>
                <FormRow cols={2}>
                  <Input label="Telegram Username *" {...register('contact.telegram')} error={errors.contact?.telegram?.message} placeholder="gazgan_marmo" />
                  <Input label="Working Hours" {...register('contact.workingHours')} placeholder="Mon — Sat · 09:00 — 18:00" />
                </FormRow>
                <FormRow cols={1}>
                  <Input label="Address Line 1 *" {...register('contact.addressLine1')} error={errors.contact?.addressLine1?.message} />
                  <Input label="Address Line 2" {...register('contact.addressLine2')} />
                </FormRow>
              </>
            )}

            {tab === 'seo' && (
              <>
                <Input label="Site Title *" {...register('seo.title')} error={errors.seo?.title?.message} />
                <Textarea label="Meta Description *" rows={3} {...register('seo.description')} error={errors.seo?.description?.message} />
                <Input label="Keywords (comma-separated)" {...register('seo.keywords')} />
                <ImageUpload value={watch('seo.ogImage') || ''} onChange={(u) => setValue('seo.ogImage', u)} folder="seo" label="OG / Social Share Image (1200×630)" aspect="aspect-[1200/630]" />
                <div className="pt-4 border-t border-line">
                  <div className="text-[10px] tracking-[.28em] uppercase text-gold mb-4 font-medium">Tracking Codes</div>
                  <FormRow cols={2}>
                    <Input label="Google Analytics 4 ID" {...register('seo.googleAnalyticsId')} placeholder="G-XXXXXXXXXX" />
                    <Input label="Meta (Facebook) Pixel ID" {...register('seo.metaPixelId')} placeholder="123456789012345" />
                  </FormRow>
                  <FormRow cols={2}>
                    <Input label="Google Search Console" {...register('seo.googleSearchConsole')} placeholder="verification token" />
                    <Input label="Yandex Webmaster" {...register('seo.yandexVerification')} placeholder="verification token" />
                  </FormRow>
                </div>
              </>
            )}

            {tab === 'social' && (
              <>
                <FormRow cols={2}>
                  <Input label="Instagram URL" {...register('social.instagram')} placeholder="https://instagram.com/gazganmarmo" />
                  <Input label="LinkedIn URL" {...register('social.linkedin')} placeholder="https://linkedin.com/company/gazgan-marmo" />
                </FormRow>
                <FormRow cols={2}>
                  <Input label="YouTube URL" {...register('social.youtube')} />
                  <Input label="Facebook URL" {...register('social.facebook')} />
                </FormRow>
              </>
            )}

            {tab === 'legal' && (
              <>
                <FormRow cols={2}>
                  <Input label="Registered Company Name *" {...register('legal.companyName')} />
                  <Input label="Tax ID / INN" {...register('legal.taxId')} placeholder="308XXXXXXX" />
                </FormRow>
                <FormRow cols={2}>
                  <Input label="Export License №" {...register('legal.exportLicense')} placeholder="UZ-EXP-2024-1142" />
                  <Input label="Jurisdiction" {...register('legal.jurisdiction')} placeholder="Republic of Uzbekistan" />
                </FormRow>
              </>
            )}

            {tab === 'routing' && (
              <div className="space-y-5">
                <p className="text-sm text-muted">
                  Map each lead type to the email address that should be notified. Used by the public website to set <code className="bg-paper px-1.5 py-0.5">assignedToEmail</code> on inbound inquiries.
                </p>
                {(['investor', 'buyer', 'distributor', 'project_owner', 'architect', 'other'] as const).map(k => (
                  <div key={k} className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-3">
                    <div className="text-sm font-medium text-ink uppercase tracking-wide">{k.replace('_', ' ')}</div>
                    <Input {...register(`leadRouting.${k}` as const)} placeholder={`${k}@gazganmarmo.uz`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </form>
  );
}
