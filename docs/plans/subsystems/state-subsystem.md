# State Subsystem Plan

**Subsystem Name:** Client State, i18n & Local Storage  
**Scope:** `fanhoard/fanhoard-page`  

---

## 1. Target State Management Architecture

The State Subsystem eliminates global `window` namespace pollution (`window.M`, `window.LanguageService`) by introducing clean ES Module singleton state stores.

### State Store Overview
```
[ User Action ]
       │
       ▼
┌───────────────────────────┐
│     State Stores          │
├───────────────────────────┤
│ - LanguageStore           │ ──► Manages en/th dictionaries & locale switching
│ - PreferenceStore         │ ──► Persists fv_lang & fv_theme with Zod schema validation
│ - SearchStore             │ ──► Holds search query, category filters, scroll index
└───────────────────────────┘
       │
       ▼ Dispatches state change events
[ Subscriber UI Components ] (Header, SearchGrid, SettingsCard)
```

---

## 2. Store Implementations

### PreferenceStore (`src/stores/PreferenceStore.ts`)
```typescript
import { z } from 'zod';

export const PreferenceSchema = z.object({
  lang: z.enum(['en', 'th']).default('en'),
  theme: z.enum(['dark', 'light', 'system']).default('dark')
});

export type UserPreferences = z.infer<typeof PreferenceSchema>;

export class PreferenceStore {
  private static STORAGE_KEY = 'fv_preferences';

  static getPreferences(): UserPreferences {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return PreferenceSchema.parse({});
      return PreferenceSchema.parse(JSON.parse(raw));
    } catch (_) {
      return PreferenceSchema.parse({});
    }
  }

  static setPreferences(prefs: Partial<UserPreferences>): void {
    const current = this.getPreferences();
    const updated = PreferenceSchema.parse({ ...current, ...prefs });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('fv:preference-change', { detail: updated }));
  }
}
```

---

## 3. Migration Steps

1. **Phase 3: Store Construction**: Build `LanguageStore.ts`, `PreferenceStore.ts`, and `SearchStore.ts` under `src/stores/`.
2. **Phase 3: Purge Window Leaks**: Remove `window.M` and `window.LanguageService` assignments.
3. **Verification**: Run unit tests in `tests/stores/` verifying state store persistence and event dispatching.
