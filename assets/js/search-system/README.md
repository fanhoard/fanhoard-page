# FanHoard Search System

- **System Described**: FanHoard Search System v3.1.0 Architecture & Service Contracts
- **Entry File**: `assets/js/search-system/search.js`
- **Dependencies**: `assets/js/search-system/search-system.css`, `assets/js/search-system/search-modules/*`, `ConDataService`, `URE`
- **Verification**: `npm test`, `npm run type-check`, `npm run lint`

---

## 1. System Architecture & Simplified ES Module Design

The FanHoard search system provides deterministic, low-latency search capabilities across all FanHoard pages. Following the v3.1.0 overhaul, it operates as a simplified ES Module system (`assets/js/search-system/search.js`) comprising 8 consolidated ES modules with static imports, replacing the legacy 14-file 5-phase dynamic script injection engine.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 5: UI Layer                                                       │
│   ui.js (Overlay, Rendering, Input Bar, Soft Keyboard) • search-assist.js │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 4: Service Orchestration & State                                  │
│   search-service.js (Private state store, data loading, URL sync)       │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 3: Search & Query Engine                                          │
│   engine.js (search, queryAssist, queryRelated)                    │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 2: Indexing & Utilities                                          │
│   config.js (Frozen config + types) • utils.js (DOM, string, vscroll)  │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 1: Data Ingestion Layer                                          │
│   ConDataService (Prefetched) → db.min.json Fallback                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & File Map

```
assets/js/search-system/
├── search.js                    # ES Module Entry Point & Facade
├── search-system.css            # Supplemental Styles & Badge Definitions
├── MIGRATION.md                 # Migration Guide from Legacy Search System
├── NAMING.md                    # DOM & CSS Class Naming Conventions
├── README.md                    # Architecture & Contract Specifications
└── search-modules/              # 7 Core ESM Sub-Modules (8 total search files)
    ├── config.js                # Immutable Configuration & JSDoc Typedefs (merged types.js)
    ├── utils.js                 # Stateless Helpers, Text Normalizer & Fallback VScroll
    ├── engine.js                # Search Engine Core & Bucket Index
    ├── ui.js                    # Unified UI Controller (merged overlay, rendering, input-bar, keyboard)
    ├── search-assist.js           # Multi-Source Search Assist Subsystem (merged discovery.js)
    ├── url-history.js           # Native URLSearchParams & Browser History Sync
    └── search-service.js        # Search Orchestrator & Private State Store (merged state.js)
```

---

## 3. ES Module Loading & Boot Sequence

All modules use standard ES module imports (`import ... from '...'`). Dynamic script injection and 5-phase Promise loading loops have been eliminated.

1. **Static Import Resolution**: Dependencies resolve statically at load time.
2. **Data & URE Readiness**: `SearchService.init()` awaits `ConDataService` data assembly and verifies `window.URE` readiness before rendering initial results.
3. **URL Search Hydration**: Restores query, category, and type parameters from `window.location.search` without race conditions or timeouts.

---

## 4. Refresh Bug Resolution & Technical Safeguards

1. **URE Readiness Guard**: `RenderingService.renderResults()` awaits `ensureURE()` (listening for `ure:ready` or checking `window.URE`), preventing `TypeError: window.URE.mount is not a function` during page load/refresh.
2. **Event-Driven Data Readiness**: Replaced fixed retry polling (3.6s timeout) with async data loading via `ConDataService.getAssembled()` / `SearchEngine.init()`.
3. **Preserved Filter State**: `doSearch()` preserves active category and type filters passed from URL state instead of forcibly resetting category to `'all'`.
4. **No Initial Placeholder Overwrite**: Removed synchronous DOM resets in `init()`, preventing mounted search results from being overwritten by placeholder HTML.

---

## 5. Key System Invariants & Performance Constants

| Invariant / Rule | Enforcing File & Location | Value / Code Reference |
| :--- | :--- | :--- |
| **LRU Result Cache Cap** | `search-modules/engine.js` | `RESULT_CACHE_CAP = 50` |
| **Short Query Early-Exit** | `search-modules/engine.js` | `nq.length <= 3` uses `_bucketIndex` lookup |
| **Debounce Interval** | `search-modules/config.js` | `debounceMs: 150` |
| **Keyboard Gap Threshold** | `search-modules/config.js` | `keyboardGapMinMs: 300` |
| **Suggestion Limit** | `search-modules/config.js` | `suggestionMax: 6` |

---

## 6. Public API Contracts

### 6.1 HTML Inclusion
Standard ES module script tag in HTML `<head>`:

```html
<script defer src="/assets/js/ure/ure.js"></script>
<script type="module" src="/assets/js/search-system/search.js"></script>
```

### 6.2 `window.SearchEngine` Interface
```javascript
window.SearchEngine = {
  init(data, options): Promise<boolean>,
  search(query, typeFilter): { results: SearchDoc[], keywords: Keyword[] },
  queryAssist(query, maxCount): Suggestion[],
  queryRelated(query, maxCount): RelatedItem[],
  generateAllKeywords(): Keyword[]
};
```

### 6.3 `window.__searchUI` Interface
```javascript
window.__searchUI = {
  init(): Promise<void>,
  destroy(): void,
  getState(): StateObject,
  getConfig(): ConfigObject
};
```
