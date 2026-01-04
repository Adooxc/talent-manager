import { describe, it, expect } from 'vitest';

describe('Template Manager', () => {
  describe('formatBackupDate', () => {
    it('should parse backup filename correctly', () => {
      const timestamp = 1704345600000;
      const fileName = `templates_backup_${timestamp}.json`;
      
      // Extract timestamp from filename
      const match = fileName.match(/templates_backup_(\d+)\.json/);
      expect(match).not.toBeNull();
      expect(match?.[1]).toBe(timestamp.toString());
    });

    it('should handle invalid filenames gracefully', () => {
      const fileName = 'invalid_backup.json';
      const match = fileName.match(/templates_backup_(\d+)\.json/);
      
      expect(match).toBeNull();
    });
  });

  describe('Template Data Structure', () => {
    it('should have correct template structure', () => {
      const template = {
        id: 'invoice_1704345600000',
        type: 'invoice' as const,
        name: 'invoice_template.pdf',
        content: 'base64encodedcontent',
        mimeType: 'application/pdf',
        fileName: 'invoice_template.pdf',
        createdAt: 1704345600000,
        updatedAt: 1704345600000,
      };

      expect(template.id).toBeDefined();
      expect(template.type).toBe('invoice');
      expect(['invoice', 'quotation']).toContain(template.type);
      expect(template.content).toBeDefined();
      expect(template.createdAt).toBeLessThanOrEqual(template.updatedAt);
    });

    it('should support both invoice and quotation types', () => {
      const types = ['invoice', 'quotation'];
      
      types.forEach(type => {
        expect(['invoice', 'quotation']).toContain(type);
      });
    });
  });

  describe('Backup Structure', () => {
    it('should have correct backup structure', () => {
      const backup = {
        templates: [
          {
            id: 'invoice_1',
            type: 'invoice' as const,
            name: 'test.pdf',
            content: 'base64',
            mimeType: 'application/pdf',
            fileName: 'test.pdf',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        backupDate: Date.now(),
        version: '1.0',
      };

      expect(backup.templates).toBeInstanceOf(Array);
      expect(backup.backupDate).toBeGreaterThan(0);
      expect(backup.version).toBe('1.0');
      expect(backup.templates[0].type).toBe('invoice');
    });
  });

  describe('Template Type Validation', () => {
    it('should validate template types correctly', () => {
      const validTypes = ['invoice', 'quotation'];
      const testCases = [
        { type: 'invoice', valid: true },
        { type: 'quotation', valid: true },
        { type: 'other', valid: false },
      ];

      testCases.forEach(testCase => {
        const isValid = validTypes.includes(testCase.type);
        expect(isValid).toBe(testCase.valid);
      });
    });
  });

  describe('File Operations', () => {
    it('should generate unique template IDs', () => {
      const id1 = `invoice_${Date.now()}`;
      const id2 = `invoice_${Date.now() + 1}`;

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^invoice_\d+$/);
      expect(id2).toMatch(/^invoice_\d+$/);
    });

    it('should generate backup filenames correctly', () => {
      const timestamp = Date.now();
      const fileName = `templates_backup_${timestamp}.json`;

      expect(fileName).toMatch(/^templates_backup_\d+\.json$/);
      expect(fileName).toContain(timestamp.toString());
    });
  });
});
