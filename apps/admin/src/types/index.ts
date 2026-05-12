import { Timestamp } from 'firebase/firestore';

/* ============================================================
   ROLES & USERS
============================================================ */
export type Role = 'super_admin' | 'manager' | 'sales_manager';

export const ROLE_PERMISSIONS: Record<Role, { read: string[]; write: string[] }> = {
  super_admin: {
    read:  ['*'],
    write: ['*']
  },
  manager: {
    read:  ['*'],
    write: ['products','entrepreneurs','gallery','testimonials','countries','catalog','leads','notifications']
  },
  sales_manager: {
    read:  ['leads','products','entrepreneurs','countries','analytics','notifications'],
    write: ['leads','notifications']
  }
};

export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  role: Role;
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
  active: boolean;
}

/* ============================================================
   CONTENT MODELS
============================================================ */
export interface Product {
  id: string;
  title: string;
  category: 'White Marble' | 'Black Marble' | 'Granite' | 'Travertine' | 'Decorative' | 'Other';
  slug: string;
  description: string;
  image: string;
  images?: string[];
  exportAvailable: boolean;
  featured: boolean;
  order: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Entrepreneur {
  id: string;
  companyName: string;
  ownerName: string;
  phone: string;
  email?: string;
  exportCountries: string[];
  specialization: string;
  factoryImage?: string;
  location?: string;
  bio?: string;
  priority: number;
  featured: boolean;
  active: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface GalleryItem {
  id: string;
  title: string;
  image: string;
  category: 'quarry' | 'blocks' | 'slabs' | 'factory' | 'shipment' | 'project' | 'other';
  featured: boolean;
  order: number;
  createdAt?: Timestamp;
}

export interface Testimonial {
  id: string;
  clientName: string;
  company: string;
  country: string;
  review: string;
  rating: 1 | 2 | 3 | 4 | 5;
  avatar?: string;
  featured: boolean;
  active: boolean;
  order: number;
  createdAt?: Timestamp;
}

export interface ExportCountry {
  id: string;
  country: string;
  flag: string;            // emoji or ISO code
  tonsPerYear?: number;
  active: boolean;
  order: number;
}

/* ============================================================
   LEADS / INQUIRIES
============================================================ */
export type LeadType = 'buyer' | 'distributor' | 'project_owner' | 'investor' | 'architect' | 'other';
export type LeadStatus = 'new' | 'in_review' | 'qualified' | 'negotiation' | 'won' | 'lost' | 'spam';
export type LeadPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface LeadNote {
  text: string;
  author: string;
  authorEmail: string;
  createdAt: Timestamp;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  country: string;
  email: string;
  whatsapp: string;
  leadType: LeadType;
  product: string;
  quantity: string;
  incoterm?: string;
  message?: string;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo?: string;       // user uid
  assignedToEmail?: string;
  source: string;
  page?: string;
  referrer?: string | null;
  userAgent?: string;
  language?: string;
  submittedAt: string;       // ISO from client
  createdAt?: Timestamp;     // server
  updatedAt?: Timestamp;
  notes?: LeadNote[];
}

/* ============================================================
   CATALOG (PDF)
============================================================ */
export interface CatalogVersion {
  id: string;
  version: string;            // e.g. "2026.IX"
  fileName: string;
  fileUrl: string;
  fileSize: number;
  pageCount?: number;
  notes?: string;
  uploadedBy: string;
  uploadedByEmail?: string;
  uploadedAt?: Timestamp;
  active: boolean;
  downloadCount: number;
}

/* ============================================================
   NOTIFICATIONS
============================================================ */
export type NotificationType = 'new_lead' | 'new_investor' | 'whatsapp_click' | 'catalog_download' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  meta?: Record<string, unknown>;
  read: boolean;
  createdAt?: Timestamp;
}

/* ============================================================
   ACTIVITY LOG
============================================================ */
export type ActivityAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'upload' | 'role_change';

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  resource: string;        // 'products' | 'leads' | 'settings' | ...
  resourceId?: string;
  resourceLabel?: string;  // human readable
  changes?: Record<string, { from: unknown; to: unknown }>;
  actorUid: string;
  actorEmail: string;
  actorName?: string;
  ip?: string;
  userAgent?: string;
  createdAt?: Timestamp;
}

/* ============================================================
   SETTINGS  (single doc: settings/global)
============================================================ */
export interface Settings {
  contact: {
    whatsapp: string;
    phone: string;
    email: string;
    emailFallback?: string;
    telegram: string;
    addressLine1: string;
    addressLine2?: string;
    workingHours?: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string;
    ogImage?: string;
  };
  social: {
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    facebook?: string;
  };
  leadRouting: Record<LeadType, string>;
  updatedAt?: Timestamp;
}

/* ============================================================
   STATS (dashboard)
============================================================ */
export interface DashboardStats {
  products: number;
  entrepreneurs: number;
  gallery: number;
  testimonials: number;
  countries: number;
  leads: { total: number; new: number; thisWeek: number; thisMonth: number };
}
