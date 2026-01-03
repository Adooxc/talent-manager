import AsyncStorage from '@react-native-async-storage/async-storage';
import { Talent, Project, AppSettings, DEFAULT_SETTINGS, generateId } from './types';

const STORAGE_KEYS = {
  TALENTS: '@talent_manager_talents',
  PROJECTS: '@talent_manager_projects',
  SETTINGS: '@talent_manager_settings',
};

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
