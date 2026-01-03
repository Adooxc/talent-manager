// Talent and Project Types for Talent Manager App

export type TalentCategory = 'model' | 'artist' | 'both';

export interface SocialMedia {
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  other?: string;
}

export interface Talent {
  id: string;
  name: string;
  category: TalentCategory;
  photos: string[]; // Array of photo URIs
  profilePhoto: string; // Main profile photo URI
  phoneNumbers: string[];
  socialMedia: SocialMedia;
  pricePerProject: number;
  notes: string;
  createdAt: string;
  lastPhotoUpdate: string;
}

export interface ProjectTalent {
  talentId: string;
  customPrice?: number; // Override price for this project
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
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  monthlyReminderEnabled: boolean;
  reminderDayOfMonth: number; // 1-28
  defaultProfitMargin: number;
  lastReminderDate: string | null;
}

// Helper function to generate unique IDs
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  monthlyReminderEnabled: true,
  reminderDayOfMonth: 1,
  defaultProfitMargin: 15,
  lastReminderDate: null,
};
