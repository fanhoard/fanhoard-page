import { z } from 'zod';
import {
  LocalizedStringSchema,
  SymbolItemSchema,
  SymbolCategoryFileSchema,
  CategoryReferenceSchema,
  SymbolGroupIndexSchema,
  MasterIndexSchema,
  ButtonItemSchema,
  ButtonConfigSchema,
  StageFeatureSchema,
  StageItemSchema,
  StageConfigSchema,
  VersionConfigSchema,
  ReleaseVersionSchema,
  ReleaseManifestSchema
} from '../schemas/data';

export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
export type SymbolItem = z.infer<typeof SymbolItemSchema>;
export type SymbolCategoryFile = z.infer<typeof SymbolCategoryFileSchema>;
export type CategoryReference = z.infer<typeof CategoryReferenceSchema>;
export type SymbolGroupIndex = z.infer<typeof SymbolGroupIndexSchema>;
export type MasterIndex = z.infer<typeof MasterIndexSchema>;
export type ButtonItem = z.infer<typeof ButtonItemSchema>;
export type ButtonConfig = z.infer<typeof ButtonConfigSchema>;
export type StageFeature = z.infer<typeof StageFeatureSchema>;
export type StageItem = z.infer<typeof StageItemSchema>;
export type StageConfig = z.infer<typeof StageConfigSchema>;
export type VersionConfig = z.infer<typeof VersionConfigSchema>;
export type ReleaseVersion = z.infer<typeof ReleaseVersionSchema>;
export type ReleaseManifest = z.infer<typeof ReleaseManifestSchema>;
