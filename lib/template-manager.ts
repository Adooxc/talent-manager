import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export interface TemplateData {
  id: string;
  type: 'invoice' | 'quotation';
  name: string;
  content: string; // base64 encoded file content
  mimeType: string;
  fileName: string;
  createdAt: number;
  updatedAt: number;
}

export interface TemplateBackup {
  templates: TemplateData[];
  backupDate: number;
  version: string;
}

const STORAGE_KEY = 'app_templates';
const BACKUP_DIR = FileSystem.documentDirectory + 'template_backups/';

/**
 * Initialize backup directory
 */
export async function initializeBackupDir() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error initializing backup directory:', error);
  }
}

/**
 * Save a template (invoice or quotation)
 */
export async function saveTemplate(
  type: 'invoice' | 'quotation',
  fileName: string,
  base64Content: string,
  mimeType: string
): Promise<TemplateData> {
  try {
    const templates = await getAllTemplates();
    
    const template: TemplateData = {
      id: `${type}_${Date.now()}`,
      type,
      name: fileName,
      content: base64Content,
      mimeType,
      fileName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    templates.push(template);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    
    return template;
  } catch (error) {
    console.error('Error saving template:', error);
    throw error;
  }
}

/**
 * Get all templates
 */
export async function getAllTemplates(): Promise<TemplateData[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting templates:', error);
    return [];
  }
}

/**
 * Get templates by type
 */
export async function getTemplatesByType(type: 'invoice' | 'quotation'): Promise<TemplateData[]> {
  try {
    const templates = await getAllTemplates();
    return templates.filter(t => t.type === type);
  } catch (error) {
    console.error('Error getting templates by type:', error);
    return [];
  }
}

/**
 * Get a single template by ID
 */
export async function getTemplate(id: string): Promise<TemplateData | null> {
  try {
    const templates = await getAllTemplates();
    return templates.find(t => t.id === id) || null;
  } catch (error) {
    console.error('Error getting template:', error);
    return null;
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<boolean> {
  try {
    const templates = await getAllTemplates();
    const filtered = templates.filter(t => t.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    return false;
  }
}

/**
 * Create a backup of all templates
 */
export async function createTemplateBackup(): Promise<string> {
  try {
    await initializeBackupDir();
    
    const templates = await getAllTemplates();
    const backup: TemplateBackup = {
      templates,
      backupDate: Date.now(),
      version: '1.0',
    };

    const fileName = `templates_backup_${Date.now()}.json`;
    const filePath = BACKUP_DIR + fileName;
    
    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(backup, null, 2)
    );

    return filePath;
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
}

/**
 * Get list of backup files
 */
export async function getBackupList(): Promise<string[]> {
  try {
    await initializeBackupDir();
    const files = await FileSystem.readDirectoryAsync(BACKUP_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();
  } catch (error) {
    console.error('Error getting backup list:', error);
    return [];
  }
}

/**
 * Restore templates from a backup file
 */
export async function restoreFromBackup(fileName: string): Promise<boolean> {
  try {
    const filePath = BACKUP_DIR + fileName;
    const content = await FileSystem.readAsStringAsync(filePath);
    const backup: TemplateBackup = JSON.parse(content);
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(backup.templates));
    return true;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    return false;
  }
}

/**
 * Delete a backup file
 */
export async function deleteBackup(fileName: string): Promise<boolean> {
  try {
    const filePath = BACKUP_DIR + fileName;
    await FileSystem.deleteAsync(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting backup:', error);
    return false;
  }
}

/**
 * Export backup file for sharing
 */
export async function exportBackup(fileName: string): Promise<boolean> {
  try {
    const filePath = BACKUP_DIR + fileName;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (!fileInfo.exists) {
      throw new Error('Backup file not found');
    }

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Export Template Backup',
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error exporting backup:', error);
    return false;
  }
}

/**
 * Get file size in MB
 */
export async function getBackupFileSize(fileName: string): Promise<number> {
  try {
    const filePath = BACKUP_DIR + fileName;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (fileInfo.exists && fileInfo.size) {
      return fileInfo.size / (1024 * 1024); // Convert to MB
    }
    
    return 0;
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
}

/**
 * Format backup file name to readable date
 */
export function formatBackupDate(fileName: string): string {
  try {
    const match = fileName.match(/templates_backup_(\d+)\.json/);
    if (match) {
      const timestamp = parseInt(match[1], 10);
      const date = new Date(timestamp);
      return date.toLocaleString('ar-SA');
    }
  } catch (error) {
    console.error('Error formatting backup date:', error);
  }
  return fileName;
}
