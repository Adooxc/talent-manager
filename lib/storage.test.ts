import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getTalents,
  saveTalent,
  updateTalent,
  deleteTalent,
  getTalentById,
  getProjects,
  saveProject,
  updateProject,
  deleteProject,
  getProjectById,
  getSettings,
  saveSettings,
  getCategories,
  saveCategory,
  getBookings,
  saveBooking,
  calculateProjectCosts,
  needsPhotoUpdate,
} from './storage';
import { Talent, Project, DEFAULT_SETTINGS } from './types';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    multiRemove: vi.fn(),
  },
}));

describe('Storage Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Talents', () => {
    it('should return empty array when no talents exist', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      const talents = await getTalents();
      expect(talents).toEqual([]);
    });

    it('should save a new talent', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      const newTalent = await saveTalent({
        name: 'Test Model',
        categoryId: 'cat-1',
        gender: 'female',
        photos: ['photo1.jpg'],
        profilePhoto: 'photo1.jpg',
        phoneNumbers: ['+1234567890'],
        socialMedia: { instagram: '@testmodel' },
        pricePerProject: 1000,
        currency: 'KWD',
        notes: 'Test notes',
      });

      expect(newTalent.id).toBeDefined();
      expect(newTalent.name).toBe('Test Model');
      expect(newTalent.gender).toBe('female');
      expect(newTalent.createdAt).toBeDefined();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should get talent by ID', async () => {
      const mockTalent: Talent = {
        id: 'test-id',
        name: 'Test Model',
        categoryId: 'cat-1',
        gender: 'male',
        photos: ['photo1.jpg'],
        profilePhoto: 'photo1.jpg',
        phoneNumbers: [],
        socialMedia: {},
        pricePerProject: 1000,
        currency: 'KWD',
        notes: '',
        createdAt: new Date().toISOString(),
        lastPhotoUpdate: new Date().toISOString(),
      };
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify([mockTalent]));

      const talent = await getTalentById('test-id');
      expect(talent).toBeDefined();
      expect(talent?.name).toBe('Test Model');
    });

    it('should return null for non-existent talent ID', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify([]));
      const talent = await getTalentById('non-existent');
      expect(talent).toBeNull();
    });

    it('should update a talent', async () => {
      const mockTalent: Talent = {
        id: 'test-id',
        name: 'Test Model',
        categoryId: 'cat-1',
        gender: 'female',
        photos: ['photo1.jpg'],
        profilePhoto: 'photo1.jpg',
        phoneNumbers: [],
        socialMedia: {},
        pricePerProject: 1000,
        currency: 'KWD',
        notes: '',
        createdAt: new Date().toISOString(),
        lastPhotoUpdate: new Date().toISOString(),
      };
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify([mockTalent]));
      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      const updated = await updateTalent('test-id', { name: 'Updated Name' });
      expect(updated?.name).toBe('Updated Name');
    });

    it('should delete a talent', async () => {
      const mockTalent: Talent = {
        id: 'test-id',
        name: 'Test Model',
        categoryId: 'cat-1',
        gender: 'male',
        photos: ['photo1.jpg'],
        profilePhoto: 'photo1.jpg',
        phoneNumbers: [],
        socialMedia: {},
        pricePerProject: 1000,
        currency: 'KWD',
        notes: '',
        createdAt: new Date().toISOString(),
        lastPhotoUpdate: new Date().toISOString(),
      };
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify([mockTalent]));
      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      const result = await deleteTalent('test-id');
      expect(result).toBe(true);
    });
  });

  describe('Projects', () => {
    it('should return empty array when no projects exist', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      const projects = await getProjects();
      expect(projects).toEqual([]);
    });

    it('should save a new project', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      const newProject = await saveProject({
        name: 'Test Project',
        description: 'Test description',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        status: 'draft',
        talents: [{ talentId: 'talent-1' }],
        profitMarginPercent: 15,
        currency: 'KWD',
      });

      expect(newProject.id).toBeDefined();
      expect(newProject.name).toBe('Test Project');
      expect(newProject.createdAt).toBeDefined();
    });

    it('should get project by ID', async () => {
      const mockProject: Project = {
        id: 'project-id',
        name: 'Test Project',
        description: '',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        status: 'active',
        talents: [],
        profitMarginPercent: 15,
        currency: 'KWD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify([mockProject]));

      const project = await getProjectById('project-id');
      expect(project).toBeDefined();
      expect(project?.name).toBe('Test Project');
    });
  });

  describe('Settings', () => {
    it('should return default settings when none exist', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      const settings = await getSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should save settings', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      const updated = await saveSettings({ defaultProfitMargin: 20 });
      expect(updated.defaultProfitMargin).toBe(20);
    });
  });

  describe('Categories', () => {
    it('should initialize with default categories when none exist', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      const categories = await getCategories();
      expect(categories.length).toBe(4);
      expect(categories[0].name).toBe('Actors');
    });

    it('should save a new category', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify([]));
      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      const newCategory = await saveCategory({
        name: 'New Category',
        nameAr: 'فئة جديدة',
        order: 5,
      });

      expect(newCategory.id).toBeDefined();
      expect(newCategory.name).toBe('New Category');
    });
  });

  describe('Bookings', () => {
    it('should return empty array when no bookings exist', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      const bookings = await getBookings();
      expect(bookings).toEqual([]);
    });

    it('should save a new booking', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      const newBooking = await saveBooking({
        talentId: 'talent-1',
        title: 'Photo Shoot',
        location: 'Studio A',
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T14:00:00Z',
        allDay: false,
        notes: 'Test booking',
      });

      expect(newBooking.id).toBeDefined();
      expect(newBooking.title).toBe('Photo Shoot');
      expect(newBooking.createdAt).toBeDefined();
    });
  });

  describe('calculateProjectCosts', () => {
    it('should calculate costs correctly', () => {
      const talents: Talent[] = [
        {
          id: 'talent-1',
          name: 'Model 1',
          categoryId: 'cat-1',
          gender: 'female',
          photos: [],
          profilePhoto: '',
          phoneNumbers: [],
          socialMedia: {},
          pricePerProject: 1000,
          currency: 'KWD',
          notes: '',
          createdAt: '',
          lastPhotoUpdate: '',
        },
        {
          id: 'talent-2',
          name: 'Model 2',
          categoryId: 'cat-1',
          gender: 'male',
          photos: [],
          profilePhoto: '',
          phoneNumbers: [],
          socialMedia: {},
          pricePerProject: 2000,
          currency: 'KWD',
          notes: '',
          createdAt: '',
          lastPhotoUpdate: '',
        },
      ];

      const projectTalents = [
        { talentId: 'talent-1' },
        { talentId: 'talent-2', customPrice: 2500 },
      ];

      const costs = calculateProjectCosts(talents, projectTalents, 20);

      expect(costs.subtotal).toBe(3500); // 1000 + 2500
      expect(costs.profit).toBe(700); // 3500 * 0.20
      expect(costs.total).toBe(4200); // 3500 + 700
    });

    it('should handle empty talents list', () => {
      const costs = calculateProjectCosts([], [], 15);
      expect(costs.subtotal).toBe(0);
      expect(costs.profit).toBe(0);
      expect(costs.total).toBe(0);
    });
  });

  describe('needsPhotoUpdate', () => {
    it('should return true for talents not updated in 30+ days', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35);

      const talent: Talent = {
        id: 'test',
        name: 'Test',
        categoryId: 'cat-1',
        gender: 'female',
        photos: [],
        profilePhoto: '',
        phoneNumbers: [],
        socialMedia: {},
        pricePerProject: 0,
        currency: 'KWD',
        notes: '',
        createdAt: '',
        lastPhotoUpdate: oldDate.toISOString(),
      };

      expect(needsPhotoUpdate(talent)).toBe(true);
    });

    it('should return false for recently updated talents', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10);

      const talent: Talent = {
        id: 'test',
        name: 'Test',
        categoryId: 'cat-1',
        gender: 'male',
        photos: [],
        profilePhoto: '',
        phoneNumbers: [],
        socialMedia: {},
        pricePerProject: 0,
        currency: 'KWD',
        notes: '',
        createdAt: '',
        lastPhotoUpdate: recentDate.toISOString(),
      };

      expect(needsPhotoUpdate(talent)).toBe(false);
    });
  });
});
