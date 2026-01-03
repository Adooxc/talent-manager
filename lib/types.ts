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
  currency: string; // KWD only
  notes: string;
  createdAt: string;
  updatedAt?: string;
  lastPhotoUpdate: string;
  // Extended fields
  customFields?: TalentCustomFields;
  rating?: number; // 1-5 stars
  tags?: string[]; // e.g., ["VIP", "Available Now"]
  isFavorite?: boolean;
  isArchived?: boolean; // For archiving inactive talents
}

// Project phase type
export type ProjectPhase = 'preparation' | 'shooting' | 'post_production' | 'delivery' | 'completed';

// Project file attachment
export interface ProjectAttachment {
  id: string;
  name: string;
  uri: string;
  type: 'contract' | 'document' | 'image' | 'other';
  uploadedAt: string;
}

// Payment record
export interface ProjectPayment {
  id: string;
  amount: number;
  date: string;
  method?: string; // cash, transfer, etc.
  notes?: string;
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
  // Extended fields
  pdfTemplate?: 'client' | 'internal' | 'invoice';
  phase?: ProjectPhase;
  attachments?: ProjectAttachment[];
  payments?: ProjectPayment[];
  totalPaid?: number;
  clientName?: string;
  clientPhone?: string;
}

// Message template type
export interface MessageTemplate {
  id: string;
  name: string;
  nameAr?: string;
  content: string;
  contentAr?: string;
  type: 'job_offer' | 'booking_confirmation' | 'thank_you' | 'reminder' | 'custom';
}

// Conversation log entry
export interface ConversationLog {
  id: string;
  talentId: string;
  date: string;
  notes: string;
  type?: 'call' | 'whatsapp' | 'meeting' | 'other';
}

// App theme colors
export type ThemeColor = 'indigo' | 'blue' | 'green' | 'purple' | 'pink' | 'orange' | 'red';

// Font size options
export type FontSize = 'small' | 'medium' | 'large';

// Language options
export type AppLanguage = 'en' | 'ar';

export interface AppSettings {
  monthlyReminderEnabled: boolean;
  reminderDayOfMonth: number; // 1-28
  defaultProfitMargin: number;
  defaultCurrency: string;
  lastReminderDate: string | null;
  // View settings
  viewMode?: 'grid' | 'list';
  sortBy?: 'name' | 'price' | 'date' | 'rating';
  sortOrder?: 'asc' | 'desc';
  // Theme settings
  darkMode?: boolean;
  themeColor?: ThemeColor;
  fontSize?: FontSize;
  language?: AppLanguage;
  // Communication settings
  whatsappMessage?: string; // Custom WhatsApp message template
  messageTemplates?: MessageTemplate[];
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

// Default message templates
export const DEFAULT_MESSAGE_TEMPLATES: Omit<MessageTemplate, 'id'>[] = [
  {
    name: 'Job Offer',
    nameAr: 'عرض عمل',
    content: 'Hi {name}, I have an exciting opportunity for you. Are you available on {date}?',
    contentAr: 'مرحباً {name}، لدي فرصة عمل مميزة لك. هل أنت متاح في {date}؟',
    type: 'job_offer',
  },
  {
    name: 'Booking Confirmation',
    nameAr: 'تأكيد الحجز',
    content: 'Hi {name}, your booking for {project} on {date} is confirmed. Location: {location}',
    contentAr: 'مرحباً {name}، تم تأكيد حجزك لمشروع {project} في {date}. الموقع: {location}',
    type: 'booking_confirmation',
  },
  {
    name: 'Thank You',
    nameAr: 'شكراً',
    content: 'Thank you {name} for your great work on {project}! Looking forward to working with you again.',
    contentAr: 'شكراً {name} على عملك الرائع في {project}! نتطلع للعمل معك مرة أخرى.',
    type: 'thank_you',
  },
  {
    name: 'Reminder',
    nameAr: 'تذكير',
    content: 'Hi {name}, just a reminder about your booking tomorrow at {time}. Please confirm your attendance.',
    contentAr: 'مرحباً {name}، تذكير بموعدك غداً الساعة {time}. يرجى تأكيد حضورك.',
    type: 'reminder',
  },
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
  themeColor: 'indigo',
  fontSize: 'medium',
  language: 'en',
  whatsappMessage: 'مرحباً {name}، أتواصل معك بخصوص فرصة عمل...',
  messageTemplates: [],
};

// Currency - KWD only
export const CURRENCIES = [
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
];

// Helper to get currency symbol
export function getCurrencySymbol(code?: string): string {
  return 'KD';
}

// Theme color options
export const THEME_COLORS: { value: ThemeColor; label: string; color: string }[] = [
  { value: 'indigo', label: 'Indigo', color: '#6366F1' },
  { value: 'blue', label: 'Blue', color: '#3B82F6' },
  { value: 'green', label: 'Green', color: '#22C55E' },
  { value: 'purple', label: 'Purple', color: '#8B5CF6' },
  { value: 'pink', label: 'Pink', color: '#EC4899' },
  { value: 'orange', label: 'Orange', color: '#F97316' },
  { value: 'red', label: 'Red', color: '#EF4444' },
];

// Font size multipliers
export const FONT_SIZES: { value: FontSize; label: string; multiplier: number }[] = [
  { value: 'small', label: 'Small', multiplier: 0.85 },
  { value: 'medium', label: 'Medium', multiplier: 1 },
  { value: 'large', label: 'Large', multiplier: 1.15 },
];

// Project status options with labels and colors
export const PROJECT_STATUSES: { value: ProjectStatus; label: string; labelAr: string; color: string }[] = [
  { value: 'draft', label: 'Draft', labelAr: 'مسودة', color: '#9CA3AF' },
  { value: 'negotiating', label: 'Negotiating', labelAr: 'قيد التفاوض', color: '#F59E0B' },
  { value: 'active', label: 'Active', labelAr: 'نشط', color: '#3B82F6' },
  { value: 'completed', label: 'Completed', labelAr: 'مكتمل', color: '#22C55E' },
  { value: 'postponed', label: 'Postponed', labelAr: 'مؤجل', color: '#8B5CF6' },
  { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغي', color: '#EF4444' },
];

// Project phase options
export const PROJECT_PHASES: { value: ProjectPhase; label: string; labelAr: string; color: string }[] = [
  { value: 'preparation', label: 'Preparation', labelAr: 'التحضير', color: '#F59E0B' },
  { value: 'shooting', label: 'Shooting', labelAr: 'التصوير', color: '#3B82F6' },
  { value: 'post_production', label: 'Post Production', labelAr: 'ما بعد الإنتاج', color: '#8B5CF6' },
  { value: 'delivery', label: 'Delivery', labelAr: 'التسليم', color: '#22C55E' },
  { value: 'completed', label: 'Completed', labelAr: 'مكتمل', color: '#6B7280' },
];

// PDF template options
export const PDF_TEMPLATES = [
  { value: 'client', label: 'Client Presentation', description: 'Professional layout for clients' },
  { value: 'internal', label: 'Internal List', description: 'Simple list for internal use' },
  { value: 'invoice', label: 'Invoice', description: 'Invoice format with payment details' },
];

// Quotation type
export type QuotationStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';

export interface Quotation {
  id: string;
  projectId?: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  tax?: number;
  total: number;
  validUntil: string;
  status: QuotationStatus;
  notes?: string;
  createdAt: string;
  sentAt?: string;
}

// Invoice type
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId?: string;
  quotationId?: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  tax?: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  dueDate: string;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
}

// Quotation status options
export const QUOTATION_STATUSES: { value: QuotationStatus; label: string; labelAr: string; color: string }[] = [
  { value: 'draft', label: 'Draft', labelAr: 'مسودة', color: '#9CA3AF' },
  { value: 'sent', label: 'Sent', labelAr: 'مرسل', color: '#3B82F6' },
  { value: 'viewed', label: 'Viewed', labelAr: 'تمت المشاهدة', color: '#8B5CF6' },
  { value: 'accepted', label: 'Accepted', labelAr: 'مقبول', color: '#22C55E' },
  { value: 'rejected', label: 'Rejected', labelAr: 'مرفوض', color: '#EF4444' },
  { value: 'expired', label: 'Expired', labelAr: 'منتهي', color: '#6B7280' },
];

// Invoice status options
export const INVOICE_STATUSES: { value: InvoiceStatus; label: string; labelAr: string; color: string }[] = [
  { value: 'draft', label: 'Draft', labelAr: 'مسودة', color: '#9CA3AF' },
  { value: 'sent', label: 'Sent', labelAr: 'مرسل', color: '#3B82F6' },
  { value: 'viewed', label: 'Viewed', labelAr: 'تمت المشاهدة', color: '#8B5CF6' },
  { value: 'partial', label: 'Partial', labelAr: 'مدفوع جزئياً', color: '#F59E0B' },
  { value: 'paid', label: 'Paid', labelAr: 'مدفوع', color: '#22C55E' },
  { value: 'overdue', label: 'Overdue', labelAr: 'متأخر', color: '#EF4444' },
  { value: 'cancelled', label: 'Cancelled', labelAr: 'ملغي', color: '#6B7280' },
];

// Arabic translations for UI
export const AR_TRANSLATIONS: Record<string, string> = {
  // Navigation
  'Talents': 'المواهب',
  'Projects': 'المشاريع',
  'Dashboard': 'لوحة التحكم',
  'Updates': 'التحديثات',
  'Settings': 'الإعدادات',
  // Common
  'Add': 'إضافة',
  'Edit': 'تعديل',
  'Delete': 'حذف',
  'Save': 'حفظ',
  'Cancel': 'إلغاء',
  'Search': 'بحث',
  'Filter': 'فلتر',
  'Sort': 'ترتيب',
  'All': 'الكل',
  'None': 'لا شيء',
  // Gender
  'Male': 'رجال',
  'Female': 'نساء',
  'Men': 'رجال',
  'Women': 'نساء',
  // Talent
  'Name': 'الاسم',
  'Phone': 'الهاتف',
  'Price': 'السعر',
  'Rating': 'التقييم',
  'Category': 'التصنيف',
  'Notes': 'ملاحظات',
  'Favorites': 'المفضلة',
  'Archived': 'الأرشيف',
  // Project
  'Status': 'الحالة',
  'Start Date': 'تاريخ البداية',
  'End Date': 'تاريخ النهاية',
  'Total': 'المجموع',
  'Profit': 'الربح',
  'Revenue': 'الإيرادات',
  // Settings
  'Dark Mode': 'الوضع الداكن',
  'Language': 'اللغة',
  'Theme Color': 'لون التطبيق',
  'Font Size': 'حجم الخط',
  'Backup': 'نسخ احتياطي',
  'Restore': 'استعادة',
};
