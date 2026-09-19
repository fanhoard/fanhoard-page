import { PreferenceStore } from './PreferenceStore';

export type Language = 'en' | 'th';
export type Dictionary = Record<string, string>;
export type LanguageListener = (lang: Language, dictionary: Dictionary) => void;

export class LanguageStore {
  private static instance: LanguageStore;
  private currentLang: Language = 'en';
  private dictionaries: Record<Language, Dictionary> = {
    en: {},
    th: {}
  };
  private listeners: Set<LanguageListener> = new Set();

  private constructor() {
    const prefs = PreferenceStore.getPreferences();
    this.currentLang = prefs.lang;

    // Keep preference store in sync
    PreferenceStore.subscribe((updated) => {
      if (updated.lang !== this.currentLang) {
        this.setLang(updated.lang, false);
      }
    });
  }

  public static getInstance(): LanguageStore {
    if (!LanguageStore.instance) {
      LanguageStore.instance = new LanguageStore();
    }
    return LanguageStore.instance;
  }

  /**
   * Get currently active language locale code.
   */
  public getLang(): Language {
    return this.currentLang;
  }

  /**
   * Set active language locale code and optionally sync with PreferenceStore.
   */
  public setLang(lang: Language, updatePrefs = true): void {
    if (this.currentLang === lang && updatePrefs === false) {
      return;
    }

    this.currentLang = lang;

    if (updatePrefs) {
      PreferenceStore.setPreferences({ lang });
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(
          new CustomEvent('fv:langchange', { detail: { lang, dictionary: this.getDictionary() } })
        );
        window.dispatchEvent(
          new CustomEvent('languageChange', { detail: { language: lang, dictionary: this.getDictionary() } })
        );
      } catch (_) {}
    }

    this.notifySubscribers();
  }

  /**
   * Load i18n translation key-value mappings for a language.
   */
  public loadDictionary(lang: Language, dictionary: Dictionary): void {
    this.dictionaries[lang] = {
      ...this.dictionaries[lang],
      ...dictionary
    };

    if (this.currentLang === lang) {
      this.notifySubscribers();
    }
  }

  /**
   * Get dictionary for active language or specified language.
   */
  public getDictionary(lang?: Language): Dictionary {
    const target = lang || this.currentLang;
    return this.dictionaries[target] || {};
  }

  /**
   * Translate key with optional default fallback text.
   */
  public t(key: string, fallback?: string): string {
    const dict = this.getDictionary();
    if (key in dict) {
      return dict[key];
    }
    // Fallback to English dictionary if active is TH
    if (this.currentLang !== 'en' && key in this.dictionaries.en) {
      return this.dictionaries.en[key];
    }
    return fallback !== undefined ? fallback : key;
  }

  /**
   * Subscribe to language or dictionary state changes.
   */
  public subscribe(listener: LanguageListener): () => void {
    this.listeners.add(listener);
    // Fire initial state
    listener(this.currentLang, this.getDictionary());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifySubscribers(): void {
    const dict = this.getDictionary();
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentLang, dict);
      } catch (err) {
        console.error('[LanguageStore] Subscriber error:', err);
      }
    });
  }

  /**
   * Reset store singleton state (useful for unit testing).
   */
  public static resetInstance(): void {
    if (LanguageStore.instance) {
      LanguageStore.instance.listeners.clear();
      LanguageStore.instance.currentLang = 'en';
      LanguageStore.instance.dictionaries = { en: {}, th: {} };
    }
    LanguageStore.instance = new LanguageStore();
  }
}

export const languageStore = LanguageStore.getInstance();
