import { describe, it, expect, beforeEach } from 'vitest';
import { LanguageStore } from '../src/stores/LanguageStore';
import { PreferenceStore } from '../src/stores/PreferenceStore';

describe('i18n translation engine & LanguageStore', () => {
  let store: LanguageStore;

  beforeEach(() => {
    PreferenceStore.clear();
    LanguageStore.resetInstance();
    store = LanguageStore.getInstance();
  });

  it('initializes with default language when no stored preference exists', () => {
    expect(store.getLang()).toBe('en');
  });

  it('switches language and updates preferences', () => {
    store.setLang('th');
    expect(store.getLang()).toBe('th');
    expect(PreferenceStore.getPreferences().lang).toBe('th');
  });

  it('loads dictionary and translates keys with fallback', () => {
    store.loadDictionary('en', { 'app.title': 'FanHoard' });
    expect(store.t('app.title')).toBe('FanHoard');
    expect(store.t('missing.key', 'Fallback')).toBe('Fallback');
  });

  it('falls back to English dictionary when active language lacks translation key', () => {
    store.loadDictionary('en', { 'app.common': 'Common Term' });
    store.setLang('th');
    expect(store.t('app.common')).toBe('Common Term');
  });
});
