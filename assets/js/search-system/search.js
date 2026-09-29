// @ts-check
/**
 * @file search.js
 * Primary ES Module entry point and global facade for FanHoard search system.
 *
 * @module search
 */

import { CONFIG } from './search-modules/config.js';
import {
  LanguageService,
  DOMService,
  StringService,
  StorageService,
  NotificationService,
  HighlightService,
  VirtualScrollEngine,
} from './search-modules/utils.js';
import { SearchEngine } from './search-modules/engine.js';
import { SearchAssistService, ReadyAssistService, DiscoveryAssistService, SearchAssist, SuggestionService, ReadyModeService, DiscoveryService } from './search-modules/search-assist.js';
import {
  UIService,
  OverlayService,
  RenderingService,
  FilterService,
  IconSlotService,
  ClearBtnService,
  KeyboardService,
  KeyboardAutoToggleService,
} from './search-modules/ui.js';
import { URLService } from './search-modules/url-history.js';
import { SearchService, State } from './search-modules/search-service.js';

// Inject search-system.css automatically if missing
function injectCSS() {
  if (typeof document === 'undefined') return;
  const cssId = 'search-system-css';
  if (!document.getElementById(cssId)) {
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.href = '/assets/js/search-system/search-system.css';
    document.head.appendChild(link);
  }
}

/** @type {EventListener|null} */
let beforeUnloadHandler = null;

function bindBeforeUnload() {
  if (typeof window === 'undefined') return;
  if (!beforeUnloadHandler) {
    beforeUnloadHandler = () => SearchService.destroy();
    window.addEventListener('beforeunload', beforeUnloadHandler);
  }
}

function unbindBeforeUnload() {
  if (typeof window === 'undefined') return;
  if (beforeUnloadHandler) {
    window.removeEventListener('beforeunload', beforeUnloadHandler);
    beforeUnloadHandler = null;
  }
}

// Global facade window attachments
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.SearchEngine = SearchEngine;

  // @ts-ignore
  window.SearchModules = window.SearchModules || {};
  // @ts-ignore
  Object.assign(window.SearchModules, {
    CONFIG,
    SearchAssistService,
    ReadyAssistService,
    DiscoveryAssistService,
    SearchAssist,
    LanguageService,
    DOMService,
    StringService,
    StorageService,
    NotificationService,
    HighlightService,
    VirtualScrollEngine,
    SearchEngine,
    SuggestionService,
    ReadyModeService,
    DiscoveryService,
    UIService,
    OverlayService,
    RenderingService,
    FilterService,
    IconSlotService,
    ClearBtnService,
    KeyboardService,
    KeyboardAutoToggleService,
    URLService,
    SearchService,
    State,
  });

  bindBeforeUnload();

  // @ts-ignore
  window.__searchUI = {
    get _initialized() {
      return SearchService._initialized;
    },
    set _initialized(val) {
      SearchService._initialized = val;
    },
    init: () => SearchService.init(),
    destroy: () => {
      unbindBeforeUnload();
      SearchService.destroy();
    },
    getState: () => ({ ...State }),
    getConfig: () => CONFIG,
  };
}

// Auto-boot on DOM ready
if (typeof document !== 'undefined') {
  injectCSS();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SearchService.init());
  } else {
    SearchService.init();
  }
}

export {
  CONFIG,
  LanguageService,
  DOMService,
  StringService,
  StorageService,
  NotificationService,
  HighlightService,
  VirtualScrollEngine,
  SearchEngine,
  SuggestionService,
  ReadyModeService,
  DiscoveryService,
  UIService,
  OverlayService,
  RenderingService,
  FilterService,
  IconSlotService,
  ClearBtnService,
  KeyboardService,
  KeyboardAutoToggleService,
  URLService,
  SearchService,
  State,
};
