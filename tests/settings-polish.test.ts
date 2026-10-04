import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Settings System & Theme Core Polish', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
    document.body.innerHTML = '';
  });

  it('ThemeCore initializes default theme and persists changes', async () => {
     // @ts-ignore
    await import('../assets/js/setting-system/theme-core.js');

    const ThemeCore = (window as any).ThemeCore;
    expect(ThemeCore).toBeDefined();

    // Default theme follows the OS (v3 white-first: matches site-wide CSS behavior)
    expect(ThemeCore.getTheme()).toBe('system');

    // Change theme to light
    const effective = ThemeCore.setTheme('light', { transition: false });
    expect(effective).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('fv_theme')).toBe('light');

    // JSON fv_preferences should be synced
    const prefs = JSON.parse(localStorage.getItem('fv_preferences') || '{}');
    expect(prefs.theme).toBe('light');
  });

  it('ThemeCore dispatches fv:themechange events on theme toggle', async () => {
     // @ts-ignore
    await import('../assets/js/setting-system/theme-core.js');
    const ThemeCore = (window as any).ThemeCore;

    const listener = vi.fn();
    window.addEventListener('fv:themechange', listener);

    ThemeCore.setTheme('light', { transition: false });
    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls[0][0].detail.theme).toBe('light');
  });

  it('SettingUI orchestrates auto-update and theme switches', async () => {
    document.body.innerHTML = `
      <div id="theme-toggle-btn">
        <input type="checkbox" id="theme-switch" role="switch" />
        <span id="theme-desc"></span>
      </div>
      <div id="auto-update-toggle-btn">
        <input type="checkbox" id="auto-update-switch" role="switch" />
      </div>
      <button id="language-button"></button>
    `;

    // Stub PopupSystem.toast
    const toastSpy = vi.fn();
    (window as any).PopupSystem = {
      toast: Object.assign(toastSpy, { success: toastSpy })
    };

     // @ts-ignore
    await import('../assets/js/setting-system/theme-core.js');
     // @ts-ignore
    await import('../assets/js/setting-system/setting-ui.js');

    const SettingUI = (window as any).SettingUI;
    expect(SettingUI).toBeDefined();

    const autoSwitch = document.getElementById('auto-update-switch') as HTMLInputElement;
    expect(autoSwitch.checked).toBe(true);

    // Toggle auto-update switch
    autoSwitch.checked = false;
    autoSwitch.dispatchEvent(new Event('change'));

    expect(localStorage.getItem('fv_noupdate')).toBe('1');
    expect(toastSpy).toHaveBeenCalled();
  });

  it('back-to-top creates accessible button with type=button and aria-label', async () => {
     // @ts-ignore
    await import('../assets/js/back-to-top.js');

    // Dispatch DOMContentLoaded
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const btt = document.getElementById('back-to-top') as HTMLButtonElement;
    expect(btt).not.toBeNull();
    expect(btt.type).toBe('button');
    expect(btt.getAttribute('aria-label')).toBe('Back to top');
  });
});
