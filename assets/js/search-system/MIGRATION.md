# Search System Migration Guide (v2.x to v3.0.0)

- **System Described**: FanHoard Search System Migration & Modular Architecture Refactor
- **Entry File**: `assets/js/search-system/search.js`
- **Dependencies**: `assets/js/search-system/search-modules/*`, `assets/js/search-system/search-system.css`
- **Verification**: `npm test`

---

## 1. Overview of Architecture Migration

The FanHoard v3.0.0 search system refactors the legacy 2-file architecture (`search-engine.js` + `search-ui.js`) into a single self-loading entry point (`assets/js/search-system/search.js`) paired with a modularized sub-service directory (`assets/js/search-system/search-modules/`).

### Architectural Comparison

#### Legacy Architecture (v2.x)
In v2.x, HTML files required manual inclusion of two separate standalone scripts in order:

```
assets/js/
├── search-engine.js            # Standalone Search Engine
└── search-ui.js                # Search UI & Event Orchestrator
```

```html
<!-- Legacy Inclusion Pattern (v2.x) -->
<script defer src="/assets/js/search-engine.js"></script>
<script defer src="/assets/js/search-ui.js"></script>
```

#### Modular Architecture (v3.0.0)
In v3.0.0, HTML files load a single orchestrating entry point (`search.js`) that automatically loads all 14 modular sub-services in 5 parallel phases:

```
assets/js/search-system/
├── search.js                    # Auto-loader & Primary Entry Point
├── search-system.css            # Supplemental Badge & UI CSS
└── search-modules/              # 14 Specialized Sub-Service Modules
    ├── types.js
    ├── config.js
    ├── state.js
    ├── utils.js
    ├── virtual-scroll.js
    ├── url-history.js
    ├── keyboard.js
    ├── rendering.js
    ├── suggestions.js
    ├── input-bar.js
    ├── overlay.js
    ├── discovery.js
    ├── engine.js                # Modular Search Engine Core
    └── search-service.js        # Search Orchestrator & ConDataService Bridge
```

```html
<!-- Modular Inclusion Pattern (v3.0.0) -->
<script defer src="/assets/js/search-system/search.js"></script>
```

---

## 2. HTML Migration Protocol

To migrate HTML pages from v2.x to v3.0.0, execute the following steps:

1. **Replace Legacy Script Tags**: Remove `search-engine.js` and `search-ui.js` tags and replace them with the unified `search.js` script tag:

```html
<!-- BEFORE (v2.x) -->
<script defer src="/assets/js/search-engine.js"></script>
<script defer src="/assets/js/search-ui.js"></script>

<!-- AFTER (v3.0.0) -->
<script defer src="/assets/js/ure/ure.js"></script>
<script defer src="/assets/js/search-system/search.js"></script>
```

2. **Verify Loading Order**: Ensure `ure.js` precedes `search.js` so that `RenderingService` can leverage URE for result card rendering.
3. **Automatic CSS Injection**: Do not manually link `search-system.css`. The entry point `search.js` injects `search-system.css` automatically via DOM `<link>` insertion during boot.

---

## 3. Sub-Module Breakdown & Load Phases

`assets/js/search-system/search.js` executes module loading across 5 sequential phases:

| Phase | Loaded Modules | Purpose |
| :--- | :--- | :--- |
| **Phase 1** | `types.js`, `config.js`, `state.js` | Foundation constants, JSDoc typedefs, shared state store |
| **Phase 2** | `utils.js`, `virtual-scroll.js` | String normalization helpers, fallback virtual scroll engine |
| **Phase 3** | `url-history.js`, `keyboard.js`, `rendering.js`, `suggestions.js`, `input-bar.js` | Keyboard management, rendering, suggestion engine, input bar widgets |
| **Phase 4** | `overlay.js`, `discovery.js` | Fullscreen overlay manager and discovery related content service |
| **Phase 5** | `engine.js`, `search-service.js` | Modular search engine core and search service orchestrator |

---

## 4. Key Performance & Algorithmic Enhancements in v3.0.0

### 4.1 Modular Search Engine (`search-modules/engine.js`)
The search engine is no longer a monolithic file. It is instantiated inside `SearchModules.SearchEngine` and exposes the exact same public API as v2.x (`window.SearchEngine`).

### 4.2 Candidate Bucket Indexing for Short Queries
For query strings where `nq.length <= 3`, `SearchEngine` uses `_bucketIndex.get(firstChar)` to immediately retrieve candidate documents rather than scanning the entire document set:

```javascript
// Candidate bucket index fast-path (search-modules/engine.js:616)
if (nq.length <= 3 && _bucketIndex) {
  const firstChar = nq.charAt(0);
  if (_bucketIndex.has(firstChar)) {
    candidates = _bucketIndex.get(firstChar);
  }
}
```

### 4.3 Capped LRU Query Cache
`SearchEngine` maintains an LRU result cache (`_resultCache`) capped at `50` entries (`RESULT_CACHE_CAP = 50`). When the cache exceeds capacity, the oldest entry is evicted:

```javascript
// LRU result cache capping (search-modules/engine.js:908)
if (_resultCache.size >= RESULT_CACHE_CAP) {
  const oldestKey = _resultCache.keys().next().value;
  _resultCache.delete(oldestKey);
}
```

### 4.4 Early Prefetch & Stashed Query Resolution
During script loading, `search.js` initiates an early prefetch Promise targeting `ConDataService.getAssembled()`. If user queries occur prior to data assembly, `SearchService` stashes the query in `window.__pendingSearch` and executes it immediately upon boot completion.

---

## 5. Backward Compatibility & Public API Mapping

The public global APIs remain 100% backward-compatible with v2.x integrations:

| Public Global API | v2.x Reference | v3.0.0 Provider Module |
| :--- | :--- | :--- |
| `window.SearchEngine.search(q, type)` | `search-engine.js` | `search-modules/engine.js` |
| `window.SearchEngine.querySuggestions(q, max)` | `search-engine.js` | `search-modules/engine.js` |
| `window.__searchUI.init()` | `search-ui.js` | `search-modules/search-service.js` |
| `window.__searchUI.getState()` | `search-ui.js` | `search-modules/state.js` |
| `window.__searchUI.getConfig()` | `search-ui.js` | `search-modules/config.js` |
