# FanHoard Search System

- **System Described**: FanHoard Search System v3.0.0 Architecture & Service Contracts
- **Entry File**: `assets/js/search-system/search.js`
- **Dependencies**: `assets/js/search-system/search-system.css`, `assets/js/search-system/search-modules/*`, `ConDataService`, `URE`
- **Verification**: `npm test`

---

## 1. System Architecture & 5-Layer Model

The FanHoard search system provides aerospace-grade, deterministic, low-latency search capabilities across all FanHoard pages. It operates as a self-loading entry point (`assets/js/search-system/search.js`) that dynamically loads 16 modular sub-services in 5 sequential phases.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 5: UI Layer                                                       │
│   OverlayService  •  UIService  •  SuggestionService  •  Discovery     │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 4: Service Orchestration Layer                                    │
│   SearchController (Manages search execution, debouncing, history)    │
│   DataLoader (Manages data fetching retries & late-data watching)     │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 3: Search & Query Layer                                          │
│   SearchEngine (search, querySuggestions, queryRelated)                 │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 2: Indexing & Ingestion Layer                                    │
│   EngineData (Data flattening, type/category indexing)                │
│   Bucket Index (Map<char, SearchDoc[]>) • Fuse.js • Type/Cat Index     │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 1: Data Ingestion Layer                                          │
│   ConDataService (Prefetched) → db.min.json Fallback                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & File Map

```
assets/js/search-system/
├── search.js                    # Primary Entry Point (Slim Orchestrator & Auto-loader)
├── search-system.css            # Supplemental Styles & Badge Definitions
├── MIGRATION.md                 # Migration Guide from Legacy Search Scripts
├── NAMING.md                    # DOM & CSS Class Naming Conventions
├── README.md                    # Architecture & Contract Specifications
└── search-modules/              # 16 Sub-Service Modules
    ├── types.js                 # JSDoc Type Definitions & Enums
    ├── config.js                # Immutable Configuration (Object.freeze)
    ├── state.js                 # Shared Mutable State Store (Encapsulated Accessors)
    ├── utils.js                 # Stateless Helpers, String Normalizer & Canonical Escaper
    ├── virtual-scroll.js        # Legacy Virtual Scroll Engine (Fallback)
    ├── url-history.js           # Two-Stack Browser History Sync
    ├── keyboard.js              # KeyboardService, GapBasedKeyboardService, KeyboardAutoToggleService
    ├── rendering.js             # URE-Backed Result Rendering Service
    ├── suggestions.js           # Multi-Source Suggestion Engine
    ├── input-bar.js             # IconSlotService, ClearBtnService, UIService
    ├── overlay.js               # Fullscreen Search Overlay Controller
    ├── discovery.js             # Related Content Discovery Engine
    ├── engine-data.js           # Raw Data Normalization & Document Flattening Engine
    ├── data-loader.js           # Resilient Data Loader & Exponential Backoff Retry Service
    ├── engine.js                # Modular Search Engine Core & Query Scorer
    └── search-controller.js     # Search Orchestrator & Lifecycle Manager
```

---

## 3. Module Loading Order & Phase Sequence

The entry point `assets/js/search-system/search.js` loads all 16 modules in 5 sequential phases. Scripts within the same phase execute in parallel, while each phase must resolve completely before the subsequent phase starts:

```
Phase 1 (Foundation):    types.js, config.js, state.js
                               │
                               ▼
Phase 2 (Utilities):     utils.js, virtual-scroll.js
                               │
                               ▼
Phase 3 (Features):      url-history.js, keyboard.js, rendering.js, suggestions.js, input-bar.js
                               │
                               ▼
Phase 4 (Data/Overlay):  overlay.js, discovery.js, engine-data.js, data-loader.js
                               │
                               ▼
Phase 5 (Engine Core):   engine.js, search-controller.js
```

---

## 4. Key System Invariants & Performance Constants

| Invariant / Rule | Enforcing File & Location | Value / Code Reference |
| :--- | :--- | :--- |
| **LRU Result Cache Cap** | `search-modules/engine.js:122` | `RESULT_CACHE_CAP = 50` |
| **Short Query Early-Exit** | `search-modules/engine.js` | `nq.length <= 3` uses `_bucketIndex` lookup |
| **Data Fetch Timeout** | `search-modules/config.js:57` | `conDataServiceWaitMs: 1200` |
| **Early Prefetch Window** | `search.js` | 40 attempts × 20ms = 800ms window |
| **Debounce Interval** | `search-modules/config.js:56` | `debounceMs: 150` |
| **Escape Key Handling** | `search-modules/overlay.js` | Centralized via `OverlayService.close('escape')` |
| **Structured Log Catches**| All search-modules | `console.warn('[SearchModule:<name>]', e)` |

### Grounded Code Examples

#### 4.1 LRU Result Cache Cap (`engine.js`)
```javascript
/** PF-02: Query result cache (Map, capped at 50 entries). */
const RESULT_CACHE_CAP = 50;

if (_resultCache.size >= RESULT_CACHE_CAP) {
  const oldestKey = _resultCache.keys().next().value;
  _resultCache.delete(oldestKey);
}
```

#### 4.2 Candidate Bucket Index Fast-Path (`engine.js`)
```javascript
/** PF-04: Candidate bucket index Map: char -> SearchDoc[] */
let _bucketIndex = new Map();

// Fast-path candidate retrieval for short queries (<= 3 characters)
if (nq.length <= 3 && _bucketIndex) {
  const firstChar = nq.charAt(0);
  if (_bucketIndex.has(firstChar)) {
    candidates = _bucketIndex.get(firstChar);
  }
}
```

#### 4.3 Soft Keyboard Detection & Gap Throttling (`keyboard.js`)
```javascript
const GapBasedKeyboardService = {
  isGapExpired:      () => (Date.now() - State.lastKeyboardToggleTime) >= CONFIG.TIMING.keyboardGapMinMs,
  isRecoveryExpired: () => (Date.now() - State.lastKeyboardToggleTime) >= CONFIG.TIMING.keyboardGapRecoveryMs,
  recordToggle:      () => { State.lastKeyboardToggleTime = Date.now(); },
};
```

---

## 5. Public API Contracts

### 5.1 HTML Inclusion
Single-line inclusion in HTML document `<head>` or body:

```html
<script defer src="/assets/js/ure/ure.js"></script>
<script defer src="/assets/js/search-system/search.js"></script>
```

### 5.2 `window.SearchEngine` Interface
```javascript
window.SearchEngine = {
  init(data, options): Promise<boolean>,
  search(query, typeFilter): { results: SearchDoc[], keywords: Keyword[] },
  querySuggestions(query, maxCount): Suggestion[],
  queryRelated(query, maxCount): RelatedItem[],
  generateAllKeywords(): Keyword[],
  _internals: {
    getDocs(): SearchDoc[],
    getTypeIndex(): Map<string, SearchDoc[]>,
    getCategoryIndex(): Map<string, SearchDoc[]>,
    getFuse(): Fuse|null,
    isFuseReady(): boolean
  }
};
```

### 5.3 `window.__searchUIController` Interface
```javascript
window.__searchUIController = {
  init(): void,
  destroy(): void,
  getState(): StateObject,
  getConfig(): ConfigObject,
  querySuggestions(query): Suggestion[]
};
```

---

## 6. Development Standards & Compliance

- **ES Specifications**: IIFE design pattern, strictly `'use strict'`, no ES modules (`import`/`export`), no external framework dependencies (React, jQuery, Vue).
- **Encapsulated State Accessors**: State properties are accessed and modified via method helpers on `State` (e.g. `State.setWrapperParent()`, `State.getSavedScrollY()`, `State.clearTimeouts()`).
- **Structured Log Safety**: Catch blocks log structured warnings (`console.warn('[SearchModule:<name>]', e)`) while preserving exact fallback return contracts.
- **DOM & CSS Standard**: Refer strictly to [`NAMING.md`](./NAMING.md) for BEM and DOM element conventions.
- **Migration & History**: Refer to [`MIGRATION.md`](./MIGRATION.md) for upgrade history from legacy search scripts.
