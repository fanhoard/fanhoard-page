# Page Plan 04: User Preferences & Settings (`/setting/`)

**Target Path:** `setting/index.html`  
**Route URL:** `/setting/`  

---

## 1. Current Problems from Technical Assessment

1. **Dead Script References**:
   - Line 9: `<script src="/assets/js/lang-sync.js"></script>` (404 error).
   - Line 10: `<script src="/assets/js/lang-coordinator.js"></script>` (404 error).
   - Line 187: `<script src="/assets/js/Intelligent-system.js"></script>` (404 error).
   - Line 192: `<script src="/fanhoard-console-bridge.js"></script>` (404 error).
2. **Unvalidated LocalStorage State**: Preference values (`fv_lang`, `fv_theme`) are read raw from `localStorage` without fallback or runtime schema validation.
3. **Missing Save Confirmation Feedback**: Changing language or theme toggles updates state silently without visual toast feedback confirming preference saving.

---

## 2. Target Design

### Architecture & Component Structure
- **`LanguageSelectorCard.ts`**: Radio toggle card for selecting active language (`English` / `ไทย`).
- **`ThemeToggleCard.ts`**: Theme selector card (`Dark`, `Light`, `System Default`).
- **`StorageResetUtility.ts`**: Clear cached preference data with confirmation modal.
- **`ToastNotification.ts`**: Feedback toast confirming preference updates.

### State & Validation Interfaces
```typescript
interface UserPreferences {
  lang: 'en' | 'th';
  theme: 'dark' | 'light' | 'system';
}
```

---

## 3. Exact Refactoring Steps

1. **Phase 1 Fixes**:
   - Purge lines 9, 10, 187, and 192 from `setting/index.html` (deleting all 4 missing script tags).
2. **Phase 3 State Store Integration**:
   - Connect settings controls to `src/stores/PreferenceStore.ts`.
   - Validate stored preferences using Zod schema (`PreferencesSchema`).
3. **Phase 4 UI Toast Feedback**:
   - Integrate `ToastNotification.ts` component to display "Preferences saved successfully" upon preference toggle.
4. **Phase 5 Vite Bundling**:
   - Bundle `src/pages/setting.ts` into a minified Vite module.
5. **Verification**:
   - Toggle theme and language in settings: verify toast notification appears and preference persists across page reloads.
   - Verify DevTools console shows 0 HTTP 404 script errors.
