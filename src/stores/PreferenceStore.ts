import { z } from 'zod';

export const PreferenceSchema = z.object({
  lang: z.enum(['en', 'th']).default('en'),
  theme: z.enum(['dark', 'light', 'system']).default('dark')
});

export type UserPreferences = z.infer<typeof PreferenceSchema>;

type PreferenceListener = (prefs: UserPreferences) => void;

export class PreferenceStore {
  private static STORAGE_KEY = 'fv_preferences';
  private static listeners: Set<PreferenceListener> = new Set();

  /**
   * Read stored preferences, validating with Zod.
   * Falls back gracefully to default values if unset or invalid.
   */
  static getPreferences(): UserPreferences {
    if (typeof localStorage === 'undefined') {
      return PreferenceSchema.parse({});
    }

    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return PreferenceSchema.parse(parsed);
      }

      // Check legacy standalone items fallback
      const legacyLang = localStorage.getItem('fv_lang');
      const legacyTheme = localStorage.getItem('fv_theme');
      if (legacyLang || legacyTheme) {
        const fallback = PreferenceSchema.parse({
          lang: legacyLang === 'th' || legacyLang === 'en' ? legacyLang : undefined,
          theme: legacyTheme === 'dark' || legacyTheme === 'light' || legacyTheme === 'system' ? legacyTheme : undefined
        });
        this.setPreferences(fallback);
        return fallback;
      }
    } catch (_) {
      // Fallback on corrupt JSON
    }

    return PreferenceSchema.parse({});
  }

  /**
   * Update preferences partially or completely, persist to localStorage,
   * and emit change events to subscribers and window event listeners.
   */
  static setPreferences(prefs: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences();
    const updated = PreferenceSchema.parse({ ...current, ...prefs });

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem('fv_lang', updated.lang);
        localStorage.setItem('fv_theme', updated.theme);
      } catch (err) {
        console.warn('[PreferenceStore] Failed to write to localStorage:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('fv:preference-change', { detail: updated })
        );
      } catch (_) {}
    }

    this.listeners.forEach((listener) => {
      try {
        listener(updated);
      } catch (e) {
        console.error('[PreferenceStore] Subscriber error:', e);
      }
    });

    return updated;
  }

  /**
   * Subscribe to preference updates.
   * Returns an unsubscribe function.
   */
  static subscribe(listener: PreferenceListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Clear subscribers and state (used primarily for testing).
   */
  static clear(): void {
    this.listeners.clear();
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem('fv_lang');
        localStorage.removeItem('fv_theme');
      } catch (_) {}
    }
  }
}
