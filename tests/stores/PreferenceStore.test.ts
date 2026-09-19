import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PreferenceStore } from '../../src/stores/PreferenceStore';

describe('PreferenceStore', () => {
  beforeEach(() => {
    PreferenceStore.clear();
    localStorage.clear();
  });

  it('returns default preferences when storage is empty', () => {
    const prefs = PreferenceStore.getPreferences();
    expect(prefs).toEqual({ lang: 'en', theme: 'dark' });
  });

  it('saves and retrieves preferences correctly', () => {
    PreferenceStore.setPreferences({ lang: 'th', theme: 'light' });
    const prefs = PreferenceStore.getPreferences();
    expect(prefs).toEqual({ lang: 'th', theme: 'light' });
  });

  it('handles partial updates without losing existing settings', () => {
    PreferenceStore.setPreferences({ lang: 'th', theme: 'dark' });
    PreferenceStore.setPreferences({ theme: 'light' });
    const prefs = PreferenceStore.getPreferences();
    expect(prefs).toEqual({ lang: 'th', theme: 'light' });
  });

  it('notifies subscribers on change', () => {
    const listener = vi.fn();
    const unsubscribe = PreferenceStore.subscribe(listener);

    PreferenceStore.setPreferences({ lang: 'th' });
    expect(listener).toHaveBeenCalledWith({ lang: 'th', theme: 'dark' });

    unsubscribe();
    PreferenceStore.setPreferences({ theme: 'light' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('handles corrupted JSON in localStorage gracefully', () => {
    localStorage.setItem('fv_preferences', 'invalid-json{{');
    const prefs = PreferenceStore.getPreferences();
    expect(prefs).toEqual({ lang: 'en', theme: 'dark' });
  });

  it('reads legacy fv_lang and fv_theme items if fv_preferences is missing', () => {
    localStorage.setItem('fv_lang', 'th');
    localStorage.setItem('fv_theme', 'light');
    const prefs = PreferenceStore.getPreferences();
    expect(prefs).toEqual({ lang: 'th', theme: 'light' });
  });
});
