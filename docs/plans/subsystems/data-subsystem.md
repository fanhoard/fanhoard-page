# Data Subsystem Plan

**Subsystem Name:** Data Models, Schemas & Validation  
**Scope:** `fanhoard/fanhoard-page` & `Jeffy2600II/community-fanhoard`  

---

## 1. Target Data Architecture

The Data Subsystem manages static data assets, application configurations, and runtime API payload structures across the FanHoard platform.

### Data Flow & Storage Layers
```
[ Static JSON Files ] (assets/db/con-data/*.json, assets/json/*.json)
       │
       ▼
[ Zod Runtime Validator ] (src/schemas/data.ts)
       │
       ▼
[ TypeScript Interfaces ] (src/types/data.ts)
       │
       ▼
[ Data Services / Stores ] (SymbolDataService, LanguageStore)
```

### Static Data Repositories
1. **Symbol Databases (`assets/db/con-data/*.json`)**: Contain symbol characters, category tags, unicode hex points, search keywords, and popularity ranks.
2. **Category Configuration (`assets/json/buttons.json`)**: Defines quick navigation categories, icons, and localized name keys.
3. **Release & Stage Data (`assets/json/whats-new.json`, `current-stage.json`)**: Stores application changelogs and product roadmap milestones.

---

## 2. TypeScript Interfaces & Zod Runtime Schemas

### Symbol Database Schema
```typescript
import { z } from 'zod';

export const SymbolItemSchema = z.object({
  id: z.string(),
  char: z.string(),
  name: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  unicode: z.string().optional(),
  popular: z.boolean().default(false)
});

export const SymbolGroupSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  symbols: z.array(SymbolItemSchema)
});

export type SymbolItem = z.infer<typeof SymbolItemSchema>;
export type SymbolGroup = z.infer<typeof SymbolGroupSchema>;
```

### Category Config Schema
```typescript
export const CategoryConfigSchema = z.object({
  id: z.string(),
  icon: z.string(),
  nameKey: z.string(),
  dbGroupId: z.string(),
  routeUrl: z.string()
});

export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;
```

---

## 3. Migration & Refactoring Steps

1. **Phase 1: Validation Tooling**:
   - Create `scripts/validate-data.ts` using Zod schemas to scan and validate every JSON file under `assets/db/con-data/` and `assets/json/`.
   - Add `npm run validate:data` script in `package.json`.
2. **Phase 3: Runtime Data Service**:
   - Create `src/services/SymbolDataService.ts` wrapping fetch routines with Zod parsing and memory caching.
   - Replace untyped fetch calls in `assets/js/con-data-service/con-data-service.js`.
3. **Verification**:
   - Run `npm run validate:data`: confirm 100% of static JSON files pass schema validation without errors.
