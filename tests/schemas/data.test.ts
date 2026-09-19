import { describe, it, expect } from 'vitest';
import {
  LocalizedStringSchema,
  SymbolItemSchema,
  SymbolCategoryFileSchema,
  SymbolGroupIndexSchema,
  MasterIndexSchema,
  ButtonConfigSchema,
  StageConfigSchema,
  VersionConfigSchema,
  ReleaseManifestSchema
} from '../../src/schemas/data';

describe('Data Schemas (Zod)', () => {
  it('validates LocalizedStringSchema correctly', () => {
    const valid = { en: 'Hello', th: 'สวัสดี' };
    expect(LocalizedStringSchema.safeParse(valid).success).toBe(true);

    const invalid = { en: 'Hello' };
    expect(LocalizedStringSchema.safeParse(invalid).success).toBe(false);
  });

  it('validates SymbolItemSchema correctly', () => {
    const validItem = {
      api: 'U+2190',
      text: '←',
      name: { en: 'Left Arrow', th: 'ลูกศรซ้าย' },
      unicode: '2190'
    };
    expect(SymbolItemSchema.safeParse(validItem).success).toBe(true);

    const invalidItem = { api: 'U+2190' }; // missing text
    expect(SymbolItemSchema.safeParse(invalidItem).success).toBe(false);
  });

  it('validates SymbolCategoryFileSchema correctly', () => {
    const validCategory = {
      id: 'arrows',
      name: { en: 'Arrows', th: 'ลูกศร' },
      data: [
        { api: 'U+2190', text: '←' }
      ]
    };
    expect(SymbolCategoryFileSchema.safeParse(validCategory).success).toBe(true);
  });

  it('validates SymbolGroupIndexSchema correctly', () => {
    const validIndex = {
      id: 'symbol',
      name: { en: 'Symbol', th: 'สัญลักษณ์' },
      categories: [
        { id: 'arrows', name: { en: 'Arrows', th: 'ลูกศร' }, file: '/assets/db/con-data/symbol/arrows.json' }
      ]
    };
    expect(SymbolGroupIndexSchema.safeParse(validIndex).success).toBe(true);
  });

  it('validates MasterIndexSchema correctly', () => {
    const validMaster = {
      categories: [
        { id: 'emoji', name: { en: 'Emoji', th: 'อีโมจิ' }, file: 'emoji.json' }
      ]
    };
    expect(MasterIndexSchema.safeParse(validMaster).success).toBe(true);
  });

  it('validates ButtonConfigSchema correctly', () => {
    const validButtons = {
      mainButtons: [
        { en_label: 'Symbols', th_label: 'สัญลักษณ์', jsonFile: '/assets/json/content/symbols.json', url: 'symbols' }
      ]
    };
    expect(ButtonConfigSchema.safeParse(validButtons).success).toBe(true);
  });

  it('validates StageConfigSchema correctly', () => {
    const validStage = {
      current_stage: 1,
      stages: [
        {
          stage_number: 1,
          version: '1.0.0',
          features: [{ feature: { en: 'Launch', th: 'เปิดตัว' } }]
        }
      ]
    };
    expect(StageConfigSchema.safeParse(validStage).success).toBe(true);
  });

  it('validates VersionConfigSchema correctly', () => {
    expect(VersionConfigSchema.safeParse({ version: '2.3.0' }).success).toBe(true);
  });

  it('validates ReleaseManifestSchema correctly', () => {
    const validManifest = {
      versions: [
        { version: '2.3.0', date: '2026-09-19T00:00:00.000Z', hasDetails: true }
      ],
      updatedAt: '2026-09-19T00:00:00.000Z'
    };
    expect(ReleaseManifestSchema.safeParse(validManifest).success).toBe(true);
  });
});
