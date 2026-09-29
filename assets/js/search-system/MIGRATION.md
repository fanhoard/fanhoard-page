# Search System Migration Guide (v3.0 to v3.1.0 Overhaul)

- **System Described**: FanHoard Search System Architecture Refactor & Refresh Bug Fix
- **Entry File**: `assets/js/search-system/search.js`
- **Dependencies**: `assets/js/search-system/search-modules/*`, `assets/js/search-system/search-system.css`
- **Verification**: `npm test`, `npm run type-check`, `npm run lint`

---

## 1. Architectural Evolution

The v3.1.0 refactor simplifies the search system architecture from 15 files and a 5-phase dynamic script injection engine into **8 consolidated ES Modules** with static imports and private state encapsulation.

### Module Consolidation Mapping

| Legacy v3.0 Module | Consolidated v3.1.0 ES Module | Key Changes |
| :--- | :--- | :--- |
| `types.js` + `config.js` | `search-modules/config.js` | Merged JSDoc types into config exports |
| `utils.js` + `virtual-scroll.js` | `search-modules/utils.js` | Unified stateless helpers & fallback VScroll |
| `overlay.js` + `rendering.js` + `input-bar.js` + `keyboard.js` | `search-modules/ui.js` | Unified UI controller & URE render guards |
| `discovery.js` + `suggestions.js` | `search-modules/suggestions.js` | Merged autocomplete & related discovery cards |
| `state.js` + `search-service.js` | `search-modules/search-service.js` | Encapsulated private state store & orchestrator |
| `url-history.js` | `search-modules/url-history.js` | Simplified via native `URLSearchParams` |
| `engine.js` | `search-modules/engine.js` | Bucket index fast-path & LRU cache |
| `search.js` | `search.js` | Standard ESM entry point & global facade |

---

## 2. Key Bug Fixes in v3.1.0

### Refresh Bug Resolution
- **Problem**: Query text remained in `#searchInput` on reload (`/search/?q=...`), but search results vanished due to script loading races with `ure.js`, data fetch timeouts, category resets, and placeholder DOM overwrites.
- **Fixes Applied**:
  1. `RenderingService` now awaits `ensureURE()` before attempting `URE.mount()`.
  2. Data loading in `SearchService.init()` is event-driven and awaits `ConDataService.getAssembled()`.
  3. Filter state (`selectedCategory`, `selectedType`) is preserved across URL search executions.
  4. Initial search results are never overwritten by empty placeholder assignments.

---

## 3. HTML Inclusion Pattern

Replace legacy script tags with ES Module loading:

```html
<!-- BEFORE (v3.0.0) -->
<script defer src="/assets/js/ure/ure.js"></script>
<script defer src="/assets/js/search-system/search.js"></script>

<!-- AFTER (v3.1.0) -->
<script defer src="/assets/js/ure/ure.js"></script>
<script type="module" src="/assets/js/search-system/search.js"></script>
```
