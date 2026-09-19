# Page Plan 11: Verse Discover Feed (`/data/verse/discover/`)

**Target Path:** `data/verse/discover/index.html`  
**Route URL:** `/data/verse/discover/`  

---

## 1. Technical Assessment Findings

1. **Dead Script Reference**: Line 261 contains `<script src="/assets/js/lang-sync.js"></script>` (404 error).
2. **Layout Thrashing & Full Subtree DOM Re-renders**: `assets/js/nav-core-modules/content.js:560` replaces entire `innerHTML` of container elements on every pagination step, causing severe layout thrashing and dropped frames during infinite scrolling.

---

## 2. Target Design & Refactoring Steps

1. **Phase 1 Fixes**:
   - Remove line 261 (`lang-sync.js`) from `data/verse/discover/index.html`.
2. **Phase 5 Feed Engine Optimization**:
   - Build `src/components/DiscoverFeed.ts`:
     - Use `DocumentFragment` batch appending for pagination nodes.
     - Implement DOM node recycling / virtual scroll list recycling for symbol items.
     - Use `IntersectionObserver` for scroll threshold trigger.
3. **Verification**:
   - Scroll infinitely through discover feed: verify frame rate holds steady 60 FPS in Chrome Performance profiler with 0 DOM re-render layout thrashing.
