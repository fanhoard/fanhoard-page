import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LanguageStore } from '../../src/stores/LanguageStore';
import { PreferenceStore } from '../../src/stores/PreferenceStore';

describe('LanguageStore', () => {
  beforeEach(() => {
    PreferenceStore.clear();
    localStorage.clear();
    LanguageStore.resetInstance();
  });

  it('initializes with default locale from PreferenceStore', () => {
    const store = LanguageStore.getInstance();
    expect(store.getLang()).toBe('en');
  });

  it('updates language and syncs with PreferenceStore', () => {
    const store = LanguageStore.getInstance();
    store.setLang('th');

    expect(store.getLang()).toBe('th');
    expect(PreferenceStore.getPreferences().lang).toBe('th');
  });

  it('loads dictionary and translates keys using t()', () => {
    const store = LanguageStore.getInstance();
    store.loadDictionary('en', { welcome: 'Welcome to FanHoard', cat_emoji: 'Emoji' });
    store.loadDictionary('th', { welcome: 'ยินดีต้อนรับสู่ FanHoard' });

    store.setLang('en');
    expect(store.t('welcome')).toBe('Welcome to FanHoard');

    store.setLang('th');
    expect(store.t('welcome')).toBe('ยินดีต้อนรับสู่ FanHoard');

    // Fallback to English dictionary if missing in Thai
    expect(store.t('cat_emoji')).toBe('Emoji');

    // Fallback parameter if missing in all dictionaries
    expect(store.t('unknown_key', 'Default')).toBe('Default');
  });

  it('notifies subscribers on language or dictionary change', () => {
    const store = LanguageStore.getInstance();
    const listener = vi.fn();

    const unsubscribe = store.subscribe(listener);
    expect(listener).toHaveBeenCalledWith('en', {});

    store.loadDictionary('en', { key: 'value' });
    expect(listener).toHaveBeenLastCalledWith('en', { key: 'value' });

    store.setLang('th');
    expect(listener).toHaveBeenLastCalledWith('th', {});

    unsubscribe();
  });
});
