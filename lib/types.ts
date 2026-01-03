// Talent and Project Types for Talent Manager App

// Custom category type - user can add/edit/delete categories
export interface Category {
  id: string;
  name: string;
  nameAr?: string; // Arabic name
  order: number;
}

// Gender type for filtering
export type Gender = 'male' | 'female';

export interface SocialMedia {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  snapchat?: string;
  other?: string;
}

// Custom fields for talent
export interface TalentCustomFields {
  height?: string; // e.g., "175 cm"
  weight?: string; // e.g., "70 kg"
  age?: number;
  hairColor?: string;
  eyeColor?: string;
  languages?: string[]; // e.g., ["Arabic", "English"]
  nationality?: string;
  location?: string;
  experience?: string; // Years of experience
}

// Booking/Event for talent calendar
export interface TalentBooking {
  id: string;
  talentId: string;
  title: string;
  location?: string;
  startDate: string; // ISO date string
  endDate: string;
  allDay: boolean;
  notes?: string;
  projectId?: string; // Link to project if applicable
  createdAt: string;
}

export interface Talent {
  id: string;
  name: string;
  categoryId: string; // Reference to custom category
  gender: Gender;
  photos: string[]; // Array of photo URIs
  profilePhoto: string; // Main profile photo URI
  phoneNumbers: string[];
  socialMedia: SocialMedia;
  pricePerProject: number;
  currency: string; // KWD, USD, etc.
  notes: string;
  createdAt: string;
  updatedAt?: string;
  lastPhotoUpdate: string;
  // New fields
  customFields?: TalentCustomFields;
  rating?: number; // 1-5 stars
  tags?: string[]; // e.g., ["VIP", "Available Now"]
  isFavorite?: boolean;
}

export interface ProjectTalent {
  talentId: string;
  customPrice?: number; // Override price for this project
  bookingId?: string; // Link to booking
  notes?: string; // Per-talent notes within project
}

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'negotiating' | 'cancelled' | 'postponed';

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  talents: ProjectTalent[];
  profitMarginPercent: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  // New fields
  pdfTemplate?: 'client' | 'internal' | 'invoice';
}

export interface AppSettings {
  monthlyReminderEnabled: boolean;
  reminderDayOfMonth: number; // 1-28
  defaultProfitMargin: number;
  defaultCurrency: string;
  lastReminderDate: string | null;
  // New settings
  viewMode?: 'grid' | 'list';
  sortBy?: 'name' | 'price' | 'date' | 'rating';
  sortOrder?: 'asc' | 'desc';
  darkMode?: boolean;
  whatsappMessage?: string; // Custom WhatsApp message template
}

// Predefined tags
export const PREDEFINED_TAGS = [
  'VIP',
  'Available Now',
  'New',
  'Top Rated',
  'Experienced',
  'Beginner',
  'International',
  'Local',
];

// Helper function to generate unique IDs
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Default categories based on Cast Services presentation
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Actors', nameAr: 'ممثلين', order: 1 },
  { name: 'Influencers', nameAr: 'مؤثرين', order: 2 },
  { name: 'Models', nameAr: 'عارضين', order: 3 },
  { name: 'Extra', nameAr: 'كومبارس', order: 4 },
];

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  monthlyReminderEnabled: true,
  reminderDayOfMonth: 1,
  defaultProfitMargin: 15,
  defaultCurrency: 'KWD',
  lastReminderDate: null,
  viewMode: 'grid',
  sortBy: 'name',
  sortOrder: 'asc',
  darkMode: false,
  whatsappMessage: 'مرحباً {name}، أتواصل معك بخصوص فرصة عمل...',
};

// Currency options
export const CURRENCIES = [
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
];

// Project status options with labels and colors
export const PROJECT_STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Draft', color: '#9CA3AF' },
  { value: 'negotiating', label: 'Negotiating', color: '#F59E0B' },
  { value: 'active', label: 'Active', color: '#3B82F6' },
  { value: 'completed', label: 'Completed', color: '#22C55E' },
  { value: 'postponed', label: 'Postponed', color: '#8B5CF6' },
  { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
];

// PDF template options
export const PDF_TEMPLATES = [
  { value: 'client', label: 'Client Presentation', description: 'Professional layout for clients' },
  { value: 'internal', label: 'Internal List', description: 'Simple list for internal use' },
  { value: 'invoice', label: 'Invoice', description: 'Invoice format with payment details' },
];
