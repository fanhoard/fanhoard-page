import { describe, it, expect, beforeEach } from 'vitest';
import { PreferenceStore } from '../src/stores/PreferenceStore';

describe('Preference storage & LocalStorage sync', () => {
  beforeEach(() => {
    PreferenceStore.clear();
  });

  it('loads default preferences when unset', () => {
    const prefs = PreferenceStore.getPreferences();
    expect(prefs.lang).toBe('en');
    expect(prefs.theme).toBe('dark');
  });

  it('sets theme and updates preferences in localStorage', () => {
    PreferenceStore.setPreferences({ theme: 'light' });
    expect(PreferenceStore.getPreferences().theme).toBe('light');
    expect(localStorage.getItem('fv_theme')).toBe('light');
  });

  it('updates language preference and triggers subscribers', () => {
    let notifiedLang = '';
    const unsub = PreferenceStore.subscribe((updated) => {
      notifiedLang = updated.lang;
    });

    PreferenceStore.setPreferences({ lang: 'th' });
    expect(notifiedLang).toBe('th');
    unsub();
  });

  it('clears preferences on clear() call', () => {
    PreferenceStore.setPreferences({ theme: 'light', lang: 'th' });
    PreferenceStore.clear();
    const prefs = PreferenceStore.getPreferences();
    expect(prefs.lang).toBe('en');
    expect(prefs.theme).toBe('dark');
  });
});
