// @ts-check
/**
 * @file config.js
 * Compile-time constants and JSDoc type definitions for FanHoard search system.
 *
 * Rules:
 *  • Nothing mutates — every value is Object.freeze()'d.
 *  • No dependencies on other modules.
 *  • Change a value here and every module sees it immediately.
 *
 * @module config
 */

// ── JSDoc Type Definitions ─────────────────────────────────────────────────

/**
 * @typedef {Object} TimingConfig
 * @property {number} debounceMs
 * @property {number} toastDisplayMs
 * @property {number} toastFadeMs
 * @property {number} focusDelayMs
 * @property {number} transitionDelayMs
 * @property {number} keyboardDetectionDelayMs
 * @property {number} keyboardGapMinMs
 * @property {number} keyboardGapRecoveryMs
 * @property {number} keyboardIdleTimeMs
 * @property {number} conDataServiceWaitMs
 * @property {number} conDataServicePollMs
 * @property {number} urlSearchRetryMs
 * @property {number} urlSearchMaxRetries
 */

/**
 * @typedef {Object} DiscoveryConfig
 * @property {number} maxRelatedItems
 * @property {number} sampleTopN
 * @property {number} minResultsForDiscovery
 * @property {number} emptyStateMaxItems
 * @property {Readonly<{sameType: number, sameCategory: number, tokenOverlap: number}>} weights
 */

/**
 * @typedef {Object} LangWeightConfig
 * @property {number} dominanceRatio
 * @property {number} minCharsForDominance
 * @property {'auto'|'th'|'en'} fallback
 */

/**
 * @typedef {Object} SearchDoc
 * @property {string} id
 * @property {string} [name]
 * @property {Record<string, string>} [i18nName]
 * @property {string} [api]
 * @property {string} [type]
 * @property {string} [category]
 * @property {string[]} [keywords]
 * @property {string} [itemName]
 * @property {Record<string, string>} [itemI18n]
 * @property {string} [typeName]
 * @property {Record<string, string>} [typeI18n]
 * @property {string} [categoryName]
 * @property {Record<string, string>} [categoryI18n]
 */

/**
 * @typedef {Object} KeywordEntry
 * @property {string} keyword
 * @property {SearchDoc} doc
 * @property {number} [weight]
 */

/**
 * @typedef {Object} NameEntry
 * @property {string} id
 * @property {string} name
 * @property {Record<string, string>} [i18n]
 */

/**
 * @typedef {Object} Suggestion
 * @property {string} text
 * @property {number} [source]
 * @property {SearchDoc} [doc]
 * @property {string} [badge]
 */

/**
 * @typedef {Object} DiscoveryItem
 * @property {string} id
 * @property {SearchDoc} doc
 * @property {number} score
 * @property {string} [reason]
 */

/**
 * @typedef {Object} QueryLanguageInfo
 * @property {'th'|'en'} language
 * @property {number} thaiChars
 * @property {number} latinChars
 * @property {string} reason
 * @property {boolean} confident
 */

/**
 * @typedef {Object} SearchState
 * @property {any} apiData
 * @property {KeywordEntry[]} allKeywordsCache
 * @property {SearchDoc[]} currentResults
 * @property {SearchDoc[]} currentFilteredResults
 * @property {string} selectedType
 * @property {string} selectedCategory
 * @property {any} lastCommittedSearchState
 * @property {DiscoveryItem[]} currentDiscovery
 * @property {boolean} discoveryActive
 * @property {any} discoveryHandle
 * @property {boolean} overlayOpen
 * @property {boolean} overlayTransitioning
 * @property {boolean} overlayHistoryPushed
 * @property {any} preOverlayState
 * @property {number|null} overlayOpenedAt
 * @property {number} _savedScrollY
 * @property {number|null} debounceTimeout
 * @property {number|null} scrollIdleTimer
 * @property {boolean} isScrollingActive
 * @property {number} lastKeyboardToggleTime
 * @property {boolean} isSoftKeyboardOpen
 * @property {Set<number>} _timeouts
 */

// ── Timing & Limits ────────────────────────────────────────────────────────

/** @type {TimingConfig} */
export const TIMING = Object.freeze({
  debounceMs: 120,
  toastDisplayMs: 1400,
  toastFadeMs: 250,
  focusDelayMs: 30,
  transitionDelayMs: 300,
  keyboardDetectionDelayMs: 100,
  keyboardGapMinMs: 300,
  keyboardGapRecoveryMs: 800,
  keyboardIdleTimeMs: 500,
  conDataServiceWaitMs: 1200,
  conDataServicePollMs: 20,
  urlSearchRetryMs: 120,
  urlSearchMaxRetries: 30,
});

/** @type {Readonly<Record<string,number>>} */
export const RENDER = Object.freeze({
  suggestionMax: 8,
  suggestionsFullscreenMax: 30,
  vsOverscanPx: 320,
  vsPoolMax: 40,
  vsEstimatedItemHeight: 96,
});

/** @type {Readonly<DiscoveryConfig>} */
export const DISCOVERY = Object.freeze({
  maxRelatedItems: 60,
  sampleTopN: 8,
  minResultsForDiscovery: 1,
  emptyStateMaxItems: 12,
  weights: Object.freeze({
    sameType: 1.0,
    sameCategory: 1.5,
    tokenOverlap: 0.5,
  }),
});

/** @type {Readonly<LangWeightConfig>} */
export const LANG_WEIGHT = Object.freeze({
  dominanceRatio: 1.5,
  minCharsForDominance: 2,
  fallback: 'auto',
});

/** @type {Readonly<Record<string,string>>} */
export const DOM = Object.freeze({
  suggestionContainerId: 'searchSuggestions',
  overlayContainerId: 'searchOverlayContainer',
  sentinelId: 'search-render-sentinel',
  searchInputId: 'searchInput',
  searchFormId: 'searchForm',
  typeFilterId: 'typeFilter',
  categoryFilterId: 'categoryFilter',
  searchResultsId: 'searchResults',
  copyToastId: 'copyToast',
  clearBtnId: 'search-clear-btn',
  discoveryContainerId: 'searchDiscovery',
  discoverySentinelId: 'search-discovery-sentinel',
});

export const STORAGE = Object.freeze({ historyKey: 'searchHistory_v1', langKey: 'selectedLang' });
export const LANG = Object.freeze({ default: 'en', autoDetect: true });
export const DB = Object.freeze({ path: '/assets/db/db.min.json' });

/** @type {Readonly<Record<string,Record<string,string>>>} */
export const TEXTS = Object.freeze({
  th: {
    all_types: 'ทุกประเภท',
    all_categories: 'ทุกหมวดหมู่',
    not_found: 'ไม่พบผลลัพธ์สำหรับคำค้นนี้',
    not_found_hint: 'ลองดูสิ่งเหล่านี้แทน',
    copy: 'คัดลอก',
    copy_failed: 'คัดลอกไม่สำเร็จ',
    suggestion_label: 'คำค้นที่เกี่ยวข้อง',
    suggestions_for_you: 'อาจเกี่ยวข้อง',
    discovery_label: 'คุณอาจสนใจ',
    discovery_more: 'ยังมีให้สำรวจอีก',
    discovery_hint: 'เลื่อนลงเพื่อดูสิ่งอื่นๆ ต่อ',
    search_result_here: 'ผลลัพธ์การค้นหาจะปรากฏที่นี่',
    search_placeholder: 'ค้นหาข้อมูล...',
    type: 'ประเภท',
    category: 'หมวดหมู่',
    emoji: 'อีโมจิ',
    trending: 'กำลังได้รับความนิยม',
    back: 'ย้อนกลับ',
    clear: 'ล้างคำค้นหา',
    click_to_copy: 'แตะการ์ดเพื่อคัดลอก',
    click_to_copy_demo: 'แตะเพื่อดูตัวอย่างการคัดลอก',
  },
  en: {
    all_types: 'All Types',
    all_categories: 'All Categories',
    not_found: 'No results for this search',
    not_found_hint: 'Try these instead',
    copy: 'Copy',
    copy_failed: 'Failed to copy',
    suggestion_label: 'Related searches',
    suggestions_for_you: 'You might also like',
    discovery_label: 'You might also like',
    discovery_more: 'More to explore',
    discovery_hint: 'Scroll down for more',
    search_result_here: 'Search results will appear here',
    search_placeholder: 'Search information...',
    type: 'Type',
    category: 'Category',
    emoji: 'Emoji',
    trending: 'Trending now',
    back: 'Back',
    clear: 'Clear',
    click_to_copy: 'Tap a card to copy',
    click_to_copy_demo: 'Tap to see a demo',
  },
});

/** @type {Readonly<Record<string,string>>} */
export const Icons = Object.freeze({
  search: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  back: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/></svg>`,
  clear: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
});

export const CONFIG = Object.freeze({
  TIMING,
  RENDER,
  DISCOVERY,
  LANG_WEIGHT,
  DOM,
  STORAGE,
  LANG,
  DB,
  TEXTS,
  Icons,
});

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.SearchModules = window.SearchModules || {};
  // @ts-ignore
  Object.assign(window.SearchModules, {
    CONFIG,
    TIMING,
    RENDER,
    DISCOVERY,
    LANG_WEIGHT,
    DOM,
    STORAGE,
    LANG,
    DB,
    TEXTS,
    Icons,
  });
}
