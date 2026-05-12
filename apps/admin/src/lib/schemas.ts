import { z } from 'zod';

export const productSchema = z.object({
  title: z.string().min(2).max(120),
  category: z.enum(['White Marble','Black Marble','Granite','Travertine','Decorative','Other']),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/, 'lowercase, numbers, hyphens'),
  description: z.string().min(10).max(2000),
  image: z.string().url(),
  exportAvailable: z.boolean().default(true),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().min(0).default(0),
  seoTitle: z.string().max(70).optional().or(z.literal('')),
  seoDescription: z.string().max(160).optional().or(z.literal(''))
});
export type ProductInput = z.infer<typeof productSchema>;

export const entrepreneurSchema = z.object({
  companyName: z.string().min(2).max(120),
  ownerName: z.string().min(2).max(120),
  phone: z.string().min(7).max(40),
  email: z.string().email().optional().or(z.literal('')),
  exportCountries: z.array(z.string()).min(1, 'Add at least one country'),
  specialization: z.string().min(2).max(200),
  factoryImage: z.string().url().optional().or(z.literal('')),
  location: z.string().max(160).optional().or(z.literal('')),
  bio: z.string().max(1000).optional().or(z.literal('')),
  priority: z.coerce.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  active: z.boolean().default(true)
});
export type EntrepreneurInput = z.infer<typeof entrepreneurSchema>;

export const gallerySchema = z.object({
  title: z.string().min(2).max(120),
  image: z.string().url(),
  category: z.enum(['quarry','blocks','slabs','factory','shipment','project','other']),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().min(0).default(0)
});
export type GalleryInput = z.infer<typeof gallerySchema>;

export const testimonialSchema = z.object({
  clientName: z.string().min(2).max(120),
  company: z.string().min(2).max(120),
  country: z.string().min(2).max(80),
  review: z.string().min(10).max(800),
  rating: z.coerce.number().int().min(1).max(5),
  avatar: z.string().url().optional().or(z.literal('')),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0)
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

export const countrySchema = z.object({
  country: z.string().min(2).max(80),
  flag: z.string().min(1).max(8),
  tonsPerYear: z.coerce.number().int().min(0).optional(),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0)
});
export type CountryInput = z.infer<typeof countrySchema>;

export const leadUpdateSchema = z.object({
  status: z.enum(['new','in_review','qualified','negotiation','won','lost','spam']).optional(),
  priority: z.enum(['low','normal','high','urgent']).optional(),
  assignedTo: z.string().optional(),
  assignedToEmail: z.string().email().optional().or(z.literal(''))
});
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;

export const settingsSchema = z.object({
  contact: z.object({
    whatsapp: z.string().min(7),
    phone: z.string().min(7),
    email: z.string().email(),
    emailFallback: z.string().email().optional().or(z.literal('')),
    telegram: z.string().min(1),
    addressLine1: z.string().min(2),
    addressLine2: z.string().optional(),
    workingHours: z.string().optional()
  }),
  seo: z.object({
    title: z.string().min(2),
    description: z.string().min(10),
    keywords: z.string().optional().default(''),
    ogImage: z.string().url().optional().or(z.literal('')),
    googleAnalyticsId: z.string().optional().or(z.literal('')),
    metaPixelId: z.string().optional().or(z.literal('')),
    googleSearchConsole: z.string().optional().or(z.literal('')),
    yandexVerification: z.string().optional().or(z.literal(''))
  }),
  social: z.object({
    instagram: z.string().optional().or(z.literal('')),
    linkedin: z.string().optional().or(z.literal('')),
    youtube: z.string().optional().or(z.literal('')),
    facebook: z.string().optional().or(z.literal(''))
  }),
  legal: z.object({
    companyName: z.string().min(2),
    taxId: z.string().optional().or(z.literal('')),
    exportLicense: z.string().optional().or(z.literal('')),
    jurisdiction: z.string().optional().or(z.literal(''))
  }).optional(),
  leadRouting: z.record(z.string(), z.string().email())
});
export type SettingsInput = z.infer<typeof settingsSchema>;

export const catalogSchema = z.object({
  version: z.string().min(1).max(40),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.coerce.number().int().min(1),
  pageCount: z.coerce.number().int().min(1).optional(),
  notes: z.string().max(500).optional().or(z.literal('')),
  active: z.boolean().default(true)
});
export type CatalogInput = z.infer<typeof catalogSchema>;

export const userSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(120),
  role: z.enum(['super_admin', 'manager', 'sales_manager']),
  active: z.boolean().default(true),
  password: z.string().min(8).optional()
});
export type UserInput = z.infer<typeof userSchema>;
