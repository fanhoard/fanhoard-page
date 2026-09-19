import { z } from 'zod';

export const LocalizedStringSchema = z.object({
  en: z.string(),
  th: z.string()
});

export const SymbolItemSchema = z.object({
  api: z.string(),
  text: z.string(),
  name: z.union([LocalizedStringSchema, z.string()]).optional(),
  description: z.union([LocalizedStringSchema, z.string()]).optional(),
  image: z.string().optional(),
  link: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  unicode: z.string().optional(),
  popular: z.boolean().optional()
});

export const SymbolCategoryFileSchema = z.object({
  id: z.string(),
  kind: z.string().optional(),
  name: LocalizedStringSchema,
  data: z.array(SymbolItemSchema)
});

export const CategoryReferenceSchema = z.object({
  id: z.string(),
  name: LocalizedStringSchema,
  file: z.string()
});

export const SymbolGroupIndexSchema = z.object({
  id: z.string(),
  kind: z.string().optional(),
  name: LocalizedStringSchema,
  categories: z.array(CategoryReferenceSchema)
});

export const MasterIndexSchema = z.object({
  categories: z.array(CategoryReferenceSchema)
});

export const ButtonItemSchema = z.object({
  en_label: z.string(),
  th_label: z.string(),
  isDefault: z.boolean().optional(),
  jsonFile: z.string(),
  url: z.string()
});

export const ButtonConfigSchema = z.object({
  mainButtons: z.array(ButtonItemSchema)
});

export const StageFeatureSchema = z.object({
  feature: LocalizedStringSchema
});

export const StageItemSchema = z.object({
  stage_number: z.number(),
  version: z.string(),
  features: z.array(StageFeatureSchema)
});

export const StageConfigSchema = z.object({
  current_stage: z.number(),
  stages: z.array(StageItemSchema)
});

export const VersionConfigSchema = z.object({
  version: z.string()
});

export const ReleaseVersionSchema = z.object({
  version: z.string(),
  date: z.string(),
  hasDetails: z.boolean()
});

export const ReleaseManifestSchema = z.object({
  versions: z.array(ReleaseVersionSchema),
  updatedAt: z.string()
});
