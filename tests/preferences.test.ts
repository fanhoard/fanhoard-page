import { describe, it, expect, beforeEach } from 'vitest';
import { PreferenceStore } from '../src/stores/PreferenceStore';
import fs from 'fs';
import path from 'path';

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

describe('Settings Page PLSys Integration & Non-Blocking State', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const plsysCode = fs.readFileSync(path.resolve(__dirname, '../assets/js/loading-system/plsys.js'), 'utf-8');
    eval(plsysCode);
  });

  it('executes setting preference changes optimistically without blocking overlays', async () => {
    document.body.innerHTML = `
      <div id="fv-app" class="fv-app fv-page-shell" data-page="setting">
        <main id="fv-main">
          <div id="language-selector-container">
            <button id="language-button">English</button>
          </div>
        </main>
      </div>
    `;

    const langBtn = document.getElementById('language-button') as HTMLButtonElement;
    langBtn.focus();

    let persistCalled = false;
    const savePreferenceRemote = () => new Promise((resolve) => {
      setTimeout(() => {
        persistCalled = true;
        resolve({ success: true, lang: 'th' });
      }, 50);
    });

    const langContainer = document.getElementById('language-selector-container') as HTMLElement;
    
    // Apply optimistic update immediately while PLSys revalidates in background
    PreferenceStore.setPreferences({ lang: 'th' });
    langBtn.textContent = 'ไทย';

    const loadPromise = (window as any).PLSys.load(
      langContainer,
      savePreferenceRemote,
      (res: any) => {
        // Confirmed saved
      },
      { key: 'setting:lang:save' }
    );

    expect(PreferenceStore.getPreferences().lang).toBe('th');
    expect(document.activeElement).toBe(langBtn); // Interactive & focus maintained
    expect(document.querySelector('.fvl-fullscreen')).toBeNull(); // No blocking overlay

    await loadPromise;
    expect(persistCalled).toBe(true);
    expect(langContainer.getAttribute('aria-busy')).toBe('false');
  });
});
