import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('SubNav & Default Sub Button Navigation Contract', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    localStorage.clear();

    delete (window as any).NavCoreModules;

    // Load dependencies and button/router scripts
    const buttonsCode = fs.readFileSync(
      path.resolve(__dirname, '../assets/js/nav-core-modules/buttons.js'),
      'utf-8'
    );

    // Provide mock M namespace for module execution
    (window as any).NavCoreModules = {
      CONFIG: {
        DOM: {
          SUB_NAV_ID: 'sub-nav',
          SUB_NAV_CLASS: 'sub-nav-inner',
          SUB_BUTTONS_ID: 'sub-buttons-container',
          HEADER_TAG: 'header',
        },
        ALL_BUTTON: { URL: '_all', EN_LABEL: 'All', TH_LABEL: 'ทั้งหมด' },
        PATHS: { BUTTONS_CONFIG: '/assets/json/buttons.json' },
      },
      State: {
        elements: {},
        buttons: { config: null, buttonMap: new Map() },
        isBootstrapping: false,
      },
      Utils: {},
      DataService: {
        getCached: () => null,
        setCache: () => {},
        fetchWithRetry: async () => ({}),
      },
      ContentService: {
        clearContent: async () => {},
        renderContent: async () => {},
      },
      RouterService: {
        navigateTo: vi.fn(async () => {}),
        validateUrl: async () => true,
        scrollActiveButtonsIntoView: () => {},
      },
    };

    const runButtons = new Function('window', 'document', 'localStorage', buttonsCode);
    runButtons(window, document, window.localStorage);
  });

  it('synchronously activates default sub button in DOM without scheduling duplicate navigateTo', async () => {
    const ButtonService = (window as any).NavCoreModules.ButtonService;
    const RouterService = (window as any).NavCoreModules.RouterService;

    const subBtns = [
      { url: 'sub1', en_label: 'Sub 1', th_label: 'ซับ 1', isDefault: false },
      { url: 'sub2', en_label: 'Sub 2', th_label: 'ซับ 2', isDefault: true },
    ];

    await ButtonService.renderSubButtons(subBtns, 'symbols', 'en');

    const container = document.getElementById('sub-buttons-container');
    expect(container).not.toBeNull();

    const activeBtn = container?.querySelector('.button-sub.active');
    expect(activeBtn).not.toBeNull();
    expect(activeBtn?.getAttribute('data-url')).toBe('symbols-sub2');

    // Fast-forward any pending macro-tasks/timers to ensure no duplicate navigateTo was scheduled
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(RouterService.navigateTo).not.toHaveBeenCalled();
  });

  it('preserves default sub button selection when subBtns have no explicit isDefault property', async () => {
    const ButtonService = (window as any).NavCoreModules.ButtonService;

    const subBtns = [
      { url: 'first', en_label: 'First', th_label: 'แรก' },
      { url: 'second', en_label: 'Second', th_label: 'สอง' },
    ];

    await ButtonService.renderSubButtons(subBtns, 'main', 'en');

    const container = document.getElementById('sub-buttons-container');
    const activeBtn = container?.querySelector('.button-sub.active');
    expect(activeBtn?.getAttribute('data-url')).toBe('main-first');
  });
});
