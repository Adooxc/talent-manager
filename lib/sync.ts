import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from './trpc';
import { 
  getTalents, 
  getProjects, 
  getCategories, 
  getBookings, 
  getSettings,
  exportAllData,
  importAllData,
  BackupData
} from './storage';

const SYNC_KEYS = {
  LAST_SYNC: '@talent_manager_last_sync',
  SYNC_PENDING: '@talent_manager_sync_pending',
  USER_ID: '@talent_manager_user_id',
};

export interface SyncStatus {
  lastSyncAt: string | null;
  pendingChanges: boolean;
  isOnline: boolean;
  isSyncing: boolean;
}

let syncStatus: SyncStatus = {
  lastSyncAt: null,
  pendingChanges: false,
  isOnline: true,
  isSyncing: false,
};

// Get current sync status
export async function getSyncStatus(): Promise<SyncStatus> {
  const lastSync = await AsyncStorage.getItem(SYNC_KEYS.LAST_SYNC);
  const pending = await AsyncStorage.getItem(SYNC_KEYS.SYNC_PENDING);
  
  return {
    ...syncStatus,
    lastSyncAt: lastSync,
    pendingChanges: pending === 'true',
  };
}

// Mark that there are pending changes to sync
export async function markPendingSync(): Promise<void> {
  await AsyncStorage.setItem(SYNC_KEYS.SYNC_PENDING, 'true');
  syncStatus.pendingChanges = true;
}

// Clear pending sync flag
async function clearPendingSync(): Promise<void> {
  await AsyncStorage.setItem(SYNC_KEYS.SYNC_PENDING, 'false');
  syncStatus.pendingChanges = false;
}

// Update last sync time
async function updateLastSync(): Promise<void> {
  const now = new Date().toISOString();
  await AsyncStorage.setItem(SYNC_KEYS.LAST_SYNC, now);
  syncStatus.lastSyncAt = now;
}

// Push local data to cloud
export async function pushToCloud(): Promise<{ success: boolean; error?: string }> {
  if (syncStatus.isSyncing) {
    return { success: false, error: 'Sync already in progress' };
  }
  
  syncStatus.isSyncing = true;
  
  try {
    const [talents, projects, categories, bookings, settings] = await Promise.all([
      getTalents(),
      getProjects(),
      getCategories(),
      getBookings(),
      getSettings(),
    ]);
    
    // Transform local data to server format
    const pushData = {
      talents: talents.map(t => ({
        odId: t.id,
        categoryId: parseInt(t.categoryId) || 0,
        name: t.name,
        gender: t.gender as 'male' | 'female',
        profilePhoto: t.profilePhoto || null,
        photos: t.photos || [],
        phoneNumbers: t.phoneNumbers || [],
        socialMedia: t.socialMedia || null,
        pricePerProject: t.pricePerProject.toString(),
        currency: t.currency,
        notes: t.notes || null,
        customFields: t.customFields || null,
        rating: t.rating || null,
        tags: t.tags || [],
        isFavorite: t.isFavorite || false,
      })),
      projects: projects.map(p => ({
        odId: p.id,
        name: p.name,
        description: p.description || null,
        startDate: p.startDate || null,
        endDate: p.endDate || null,
        status: p.status as 'draft' | 'active' | 'completed' | 'negotiating' | 'cancelled' | 'postponed',
        talents: p.talents?.map(pt => ({
          talentId: pt.talentId,
          customPrice: pt.customPrice,
          bookingId: pt.bookingId,
          notes: pt.notes,
        })) || null,
        profitMarginPercent: p.profitMarginPercent.toString(),
        currency: p.currency,
        pdfTemplate: null,
      })),
      categories: categories.map(c => ({
        name: c.name,
        nameAr: c.nameAr || null,
        order: c.order || 0,
      })),
      bookings: bookings.map(b => ({
        odId: b.id,
        talentId: parseInt(b.talentId) || 0,
        title: b.title,
        location: b.location || null,
        startDate: b.startDate,
        endDate: b.endDate,
        allDay: b.allDay || false,
        notes: b.notes || null,
        projectId: b.projectId ? parseInt(b.projectId) : null,
      })),
      settings: {
        monthlyReminderEnabled: settings.monthlyReminderEnabled,
        reminderDayOfMonth: settings.reminderDayOfMonth,
        defaultProfitMargin: settings.defaultProfitMargin.toString(),
        defaultCurrency: settings.defaultCurrency,
        darkMode: false,
        whatsappMessage: null,
      },
    };
    
    // This would use the trpc client to push data
    // For now, we'll just mark as synced
    await updateLastSync();
    await clearPendingSync();
    
    syncStatus.isSyncing = false;
    return { success: true };
  } catch (error) {
    syncStatus.isSyncing = false;
    console.error('Push to cloud failed:', error);
    return { success: false, error: 'Failed to sync with cloud' };
  }
}

// Pull data from cloud
export async function pullFromCloud(): Promise<{ success: boolean; error?: string }> {
  if (syncStatus.isSyncing) {
    return { success: false, error: 'Sync already in progress' };
  }
  
  syncStatus.isSyncing = true;
  
  try {
    // This would use the trpc client to pull data
    // For now, we'll just update the sync time
    await updateLastSync();
    
    syncStatus.isSyncing = false;
    return { success: true };
  } catch (error) {
    syncStatus.isSyncing = false;
    console.error('Pull from cloud failed:', error);
    return { success: false, error: 'Failed to fetch from cloud' };
  }
}

// Full sync (push then pull)
export async function fullSync(): Promise<{ success: boolean; error?: string }> {
  const pushResult = await pushToCloud();
  if (!pushResult.success) {
    return pushResult;
  }
  
  return pullFromCloud();
}

// Export backup to JSON string
export async function createBackup(): Promise<string> {
  const data = await exportAllData();
  return JSON.stringify(data, null, 2);
}

// Import backup from JSON string
export async function restoreBackup(jsonString: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data: BackupData = JSON.parse(jsonString);
    return importAllData(data);
  } catch (error) {
    console.error('Restore backup failed:', error);
    return { success: false, error: 'Invalid backup file format' };
  }
}
