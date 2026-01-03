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
  lastPhotoUpdate: string;
}

export interface ProjectTalent {
  talentId: string;
  customPrice?: number; // Override price for this project
  bookingId?: string; // Link to booking
}

export type ProjectStatus = 'draft' | 'active' | 'completed';

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
}

export interface AppSettings {
  monthlyReminderEnabled: boolean;
  reminderDayOfMonth: number; // 1-28
  defaultProfitMargin: number;
  defaultCurrency: string;
  lastReminderDate: string | null;
}

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
};

// Currency options
export const CURRENCIES = [
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
];
