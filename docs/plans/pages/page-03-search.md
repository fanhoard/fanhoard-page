# Page Plan 03: Global Search & Directory (`/search/`)

**Target Path:** `search/index.html`  
**Route URL:** `/search/`  

---

## 1. Current Problems from Technical Assessment

1. **Dead Script References**:
   - Line 23: `<script src="/assets/js/lang-sync.js"></script>` (404 error).
   - Line 125: `<script src="/fanhoard-console-bridge.js"></script>` (404 error).
2. **Suppressed Focus Rings**: `assets/css/search.css` applies `outline: none` on search input and filter pills without high-contrast focus replacements.
3. **Missing Screen Reader Announcements**: Search results update dynamically without an `aria-live` polite region, leaving screen reader users unaware of result counts or query status.
4. **Unminified Fuse.js Search Engine**: `assets/js/search-system/fuse.js` loaded as raw unminified 25KB script tag.

---

## 2. Target Design

### Architecture & Component Structure
- **`SearchInput.ts`**: Sticky debounced search input with query parameter sync (`?q=...`).
- **`CategoryFilterPills.ts`**: Category filter buttons (`emojis`, `symbols`, `text-art`).
- **`VirtualSearchResultGrid.ts`**: High-performance virtual scroll grid rendering Fuse.js match hits.
- **`AriaAnnouncer.ts`**: Hidden `aria-live="polite"` region announcing hit count updates.

### TypeScript Interfaces
```typescript
interface SearchState {
  query: string;
  activeCategory: string;
  results: SymbolItem[];
  totalHits: number;
}
```

---

## 3. Exact Refactoring Steps

1. **Phase 1 Fixes**:
   - Remove line 23 (`lang-sync.js`) and line 125 (`fanhoard-console-bridge.js`) from `search/index.html`.
2. **Phase 3 Typed Search Engine**:
   - Wrap Fuse.js search matcher inside typed `src/services/SearchEngineService.ts`.
   - Add Zod validation for search query parameters.
3. **Phase 4 Accessibility & UI**:
   - Restore `:focus-visible` rings on search input element (`outline: 3px solid var(--fv-focus-ring)`).
   - Add `<div id="search-announcer" class="sr-only" aria-live="polite"></div>` to `search/index.html`.
   - Update `SearchEngineService` to write result counts ("Found 24 symbols for 'star'") to `#search-announcer`.
4. **Phase 5 Vite Bundling**:
   - Bundle `src/pages/search.ts` with Vite, bundling Fuse.js into a single minified web module.
5. **Verification**:
   - Type query in search box: verify screen reader announcer updates in DOM.
   - Verify keyboard `Tab` highlights input and filter buttons with visible focus ring.
   - Test virtual scroll performance with 10,000 symbol items: 60 FPS scroll.
