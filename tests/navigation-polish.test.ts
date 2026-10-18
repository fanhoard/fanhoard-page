import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Navigation System Polish & Accessibility (S3 Polish Suite)', () => {

  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    localStorage.clear();

    delete (window as any).NavCoreModules;

    const buttonsCode = fs.readFileSync(
      path.resolve(__dirname, '../assets/js/nav-core-modules/buttons.js'),
      'utf-8'
    );

    (window as any).NavCoreModules = {
      CONFIG: {
        DOM: {
          SUB_NAV_ID: 'sub-nav',
          SUB_NAV_CLASS: 'sub-nav-inner',
          SUB_BUTTONS_ID: 'sub-buttons-container',
          NAV_LIST_ID: 'nav-list',
          HEADER_TAG: 'header',
          CONTENT_LOADING_ID: 'content-loading',
        },
        ALL_BUTTON: { URL: '_all', EN_LABEL: 'All', TH_LABEL: 'ทั้งหมด' },
        PATHS: { BUTTONS_CONFIG: '/assets/json/buttons.json' },
      },
      State: {
        elements: {
          header: null,
          navList: null,
          subButtonsContainer: null,
          contentLoading: null,
        },
        buttons: { config: null, buttonMap: new Map() },
        isBootstrapping: false,
      },
      Utils: {},
      DataService: {
        getCached: () => null,
        setCache: () => {},
        fetchWithRetry: async () => ({
          mainButtons: [
            { url: '_all', en_label: 'All', th_label: 'ทั้งหมด' },
            {
              url: 'emojis',
              en_label: 'Emojis',
              th_label: 'อิโมจิ',
              subButtons: [
                { url: 'smileys', en_label: 'Smileys', th_label: 'สไมลีย์', isDefault: true },
                { url: 'animals', en_label: 'Animals', th_label: 'สัตว์' },
              ]
            },
            { url: 'symbols', en_label: 'Symbols', th_label: 'สัญลักษณ์' },
          ]
        }),
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

    // Setup DOM elements expected by InitService
    const header = document.createElement('header');
    const navList = document.createElement('ul');
    navList.id = 'nav-list';
    header.appendChild(navList);
    document.body.appendChild(header);

    const subNav = document.createElement('div');
    subNav.id = 'sub-nav';
    const subNavInner = document.createElement('div');
    subNavInner.className = 'sub-nav-inner';
    const subButtons = document.createElement('div');
    subButtons.id = 'sub-buttons-container';
    subNavInner.appendChild(subButtons);
    subNav.appendChild(subNavInner);
    document.body.appendChild(subNav);

    (window as any).NavCoreModules.State.elements.header = header;
    (window as any).NavCoreModules.State.elements.navList = navList;
    (window as any).NavCoreModules.State.elements.subButtonsContainer = subButtons;

    const runButtons = new Function('window', 'document', 'localStorage', buttonsCode);
    runButtons(window, document, window.localStorage);
  });

  it('renders main buttons with proper ARIA tablist/tab roles, aria-selected, and controls', async () => {
    const ButtonService = (window as any).NavCoreModules.ButtonService;
    await ButtonService.loadConfig();

    const navList = document.getElementById('nav-list');
    expect(navList?.getAttribute('role')).toBe('tablist');
    expect(navList?.getAttribute('aria-label')).toBe('Content categories');

    const buttons = navList?.querySelectorAll('button');
    expect(buttons?.length).toBeGreaterThan(0);

    buttons?.forEach(btn => {
      expect(btn.getAttribute('role')).toBe('tab');
      expect(btn.getAttribute('aria-controls')).toBe('content-loading');
      expect(btn.hasAttribute('aria-selected')).toBe(true);
      expect(btn.hasAttribute('tabindex')).toBe(true);
    });

    // Default active button (_all)
    const activeBtn = navList?.querySelector('button.active');
    expect(activeBtn).not.toBeNull();
    expect(activeBtn?.getAttribute('aria-selected')).toBe('true');
    expect(activeBtn?.getAttribute('tabindex')).toBe('0');
  });

  it('renders sub-buttons with proper ARIA tablist/tab roles and toggles aria-hidden on sub-nav', async () => {
    const ButtonService = (window as any).NavCoreModules.ButtonService;
    const SubNavService = (window as any).NavCoreModules.SubNavService;

    const subBtns = [
      { url: 'sub1', en_label: 'Sub 1', th_label: 'ซับ 1', isDefault: true },
      { url: 'sub2', en_label: 'Sub 2', th_label: 'ซับ 2' },
    ];

    await ButtonService.renderSubButtons(subBtns, 'emojis', 'en');

    const subNav = document.getElementById('sub-nav');
    expect(subNav?.getAttribute('role')).toBe('navigation');
    expect(subNav?.getAttribute('aria-label')).toBe('Sub navigation');
    expect(subNav?.getAttribute('aria-hidden')).toBe('false');

    const container = document.getElementById('sub-buttons-container');
    expect(container?.getAttribute('role')).toBe('tablist');

    const activeSub = container?.querySelector('.button-sub.active');
    expect(activeSub?.getAttribute('aria-selected')).toBe('true');
    expect(activeSub?.getAttribute('tabindex')).toBe('0');

    SubNavService.hideSubNav();
    expect(subNav?.getAttribute('aria-hidden')).toBe('true');
    expect(subNav?.style.display).toBe('none');
  });

  it('navigates main buttons via Arrow keys (ArrowRight / ArrowLeft / Home / End)', async () => {
    const ButtonService = (window as any).NavCoreModules.ButtonService;
    await ButtonService.loadConfig();

    const navList = document.getElementById('nav-list');
    const buttons = Array.from(navList?.querySelectorAll('button') || []);
    expect(buttons.length).toBe(3);

    // Focus first button
    buttons[0].focus();

    // Fire ArrowRight event
    const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    navList?.dispatchEvent(rightEvent);

    expect(document.activeElement).toBe(buttons[1]);
    expect(buttons[1].classList.contains('active')).toBe(true);
    expect(buttons[1].getAttribute('aria-selected')).toBe('true');

    // Fire ArrowLeft event
    const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
    navList?.dispatchEvent(leftEvent);

    expect(document.activeElement).toBe(buttons[0]);
    expect(buttons[0].classList.contains('active')).toBe(true);

    // Fire End event
    const endEvent = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
    navList?.dispatchEvent(endEvent);

    expect(document.activeElement).toBe(buttons[2]);

    // Fire Home event
    const homeEvent = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
    navList?.dispatchEvent(homeEvent);

    expect(document.activeElement).toBe(buttons[0]);
  });

  it('updates language labels using data-url matching safely', async () => {
    const ButtonService = (window as any).NavCoreModules.ButtonService;
    await ButtonService.loadConfig();

    const navList = document.getElementById('nav-list');
    let buttons = Array.from(navList?.querySelectorAll('button') || []);
    expect(buttons[0].textContent).toBe('All');
    expect(buttons[1].textContent).toBe('Emojis');

    // Switch language to Thai
    ButtonService.updateButtonsLanguage('th');

    buttons = Array.from(navList?.querySelectorAll('button') || []);
    expect(buttons[0].textContent).toBe('ทั้งหมด');
    expect(buttons[1].textContent).toBe('อิโมจิ');
  });

});
