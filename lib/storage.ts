import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Talent, 
  Project, 
  AppSettings, 
  Category,
  TalentBooking,
  DEFAULT_SETTINGS, 
  DEFAULT_CATEGORIES,
  generateId 
} from './types';

const STORAGE_KEYS = {
  TALENTS: '@talent_manager_talents',
  PROJECTS: '@talent_manager_projects',
  SETTINGS: '@talent_manager_settings',
  CATEGORIES: '@talent_manager_categories',
  BOOKINGS: '@talent_manager_bookings',
};

// ============ CATEGORIES ============

export async function getCategories(): Promise<Category[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (data) {
      return JSON.parse(data);
    }
    // Initialize with default categories
    const defaultCats = DEFAULT_CATEGORIES.map((cat, index) => ({
      ...cat,
      id: generateId() + index,
    }));
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCats));
    return defaultCats;
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
}

export async function saveCategory(category: Omit<Category, 'id'>): Promise<Category> {
  const categories = await getCategories();
  const newCategory: Category = {
    ...category,
    id: generateId(),
  };
  categories.push(newCategory);
  await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  return newCategory;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
  const categories = await getCategories();
  const index = categories.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  categories[index] = { ...categories[index], ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  return categories[index];
}

export async function deleteCategory(id: string): Promise<boolean> {
  const categories = await getCategories();
  const filtered = categories.filter(c => c.id !== id);
  if (filtered.length === categories.length) return false;
  
  await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
  return true;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find(c => c.id === id) || null;
}

// ============ BOOKINGS ============

export async function getBookings(): Promise<TalentBooking[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting bookings:', error);
    return [];
  }
}

export async function getBookingsByTalentId(talentId: string): Promise<TalentBooking[]> {
  const bookings = await getBookings();
  return bookings.filter(b => b.talentId === talentId);
}

export async function saveBooking(booking: Omit<TalentBooking, 'id' | 'createdAt'>): Promise<TalentBooking> {
  const bookings = await getBookings();
  const newBooking: TalentBooking = {
    ...booking,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  bookings.push(newBooking);
  await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  return newBooking;
}

export async function updateBooking(id: string, updates: Partial<TalentBooking>): Promise<TalentBooking | null> {
  const bookings = await getBookings();
  const index = bookings.findIndex(b => b.id === id);
  if (index === -1) return null;
  
  bookings[index] = { ...bookings[index], ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  return bookings[index];
}

export async function deleteBooking(id: string): Promise<boolean> {
  const bookings = await getBookings();
  const filtered = bookings.filter(b => b.id !== id);
  if (filtered.length === bookings.length) return false;
  
  await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(filtered));
  return true;
}

// ============ TALENTS ============

export async function getTalents(): Promise<Talent[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TALENTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting talents:', error);
    return [];
  }
}

export async function saveTalent(talent: Omit<Talent, 'id' | 'createdAt' | 'lastPhotoUpdate'>): Promise<Talent> {
  const talents = await getTalents();
  const newTalent: Talent = {
    ...talent,
    id: generateId(),
    createdAt: new Date().toISOString(),
    lastPhotoUpdate: new Date().toISOString(),
  };
  talents.push(newTalent);
  await AsyncStorage.setItem(STORAGE_KEYS.TALENTS, JSON.stringify(talents));
  return newTalent;
}

export async function updateTalent(id: string, updates: Partial<Talent>): Promise<Talent | null> {
  const talents = await getTalents();
  const index = talents.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  talents[index] = { ...talents[index], ...updates };
  await AsyncStorage.setItem(STORAGE_KEYS.TALENTS, JSON.stringify(talents));
  return talents[index];
}

export async function deleteTalent(id: string): Promise<boolean> {
  const talents = await getTalents();
  const filtered = talents.filter(t => t.id !== id);
  if (filtered.length === talents.length) return false;
  
  await AsyncStorage.setItem(STORAGE_KEYS.TALENTS, JSON.stringify(filtered));
  // Also delete related bookings
  const bookings = await getBookings();
  const filteredBookings = bookings.filter(b => b.talentId !== id);
  await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(filteredBookings));
  return true;
}

export async function getTalentById(id: string): Promise<Talent | null> {
  const talents = await getTalents();
  return talents.find(t => t.id === id) || null;
}

export async function markTalentPhotoUpdated(id: string): Promise<Talent | null> {
  return updateTalent(id, { lastPhotoUpdate: new Date().toISOString() });
}

// ============ PROJECTS ============

export async function getProjects(): Promise<Project[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting projects:', error);
    return [];
  }
}

export async function saveProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const projects = await getProjects();
  const newProject: Project = {
    ...project,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.push(newProject);
  await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  return newProject;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const projects = await getProjects();
  const index = projects.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  return projects[index];
}

export async function deleteProject(id: string): Promise<boolean> {
  const projects = await getProjects();
  const filtered = projects.filter(p => p.id !== id);
  if (filtered.length === projects.length) return false;
  
  await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
  return true;
}

export async function getProjectById(id: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find(p => p.id === id) || null;
}

// ============ SETTINGS ============

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  return updated;
}

// ============ UTILITIES ============

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.TALENTS,
    STORAGE_KEYS.PROJECTS,
    STORAGE_KEYS.SETTINGS,
    STORAGE_KEYS.CATEGORIES,
    STORAGE_KEYS.BOOKINGS,
  ]);
}

// Calculate project costs
export function calculateProjectCosts(
  talents: Talent[],
  projectTalents: { talentId: string; customPrice?: number }[],
  profitMarginPercent: number
): { subtotal: number; profit: number; total: number } {
  const subtotal = projectTalents.reduce((sum, pt) => {
    const talent = talents.find(t => t.id === pt.talentId);
    if (!talent) return sum;
    const price = pt.customPrice ?? talent.pricePerProject;
    return sum + price;
  }, 0);
  
  const profit = subtotal * (profitMarginPercent / 100);
  const total = subtotal + profit;
  
  return { subtotal, profit, total };
}

// Check if talent needs photo update (older than 30 days)
export function needsPhotoUpdate(talent: Talent): boolean {
  const lastUpdate = new Date(talent.lastPhotoUpdate);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff >= 30;
}

// Get currency symbol
export function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    KWD: 'KD',
    USD: '$',
    SAR: 'SR',
    AED: 'AED',
  };
  return symbols[code] || code;
}
