# Page Plan 09: Product Roadmap (`/platform/roadmap/`)

**Target Path:** `platform/roadmap/index.html`  
**Route URL:** `/platform/roadmap/`  

---

## 1. Technical Assessment Findings

1. **Dead Script References**:
   - Line 6: `<script src="/assets/js/lang-sync.js"></script>` (404 error).
   - Line 105: `<script src="/fanhoard-console-bridge.js"></script>` (404 error).
2. **Unhandled Fetch Failure**: `roadmap.js` fetches `assets/json/current-stage.json` without fallback error UI if file fails to load.

---

## 2. Target Design & Refactoring Steps

1. **Phase 1 Fixes**:
   - Delete line 6 (`lang-sync.js`) and line 105 (`fanhoard-console-bridge.js`) from `platform/roadmap/index.html`.
2. **Phase 3 & 4 Component Refactoring**:
   - Build `src/components/RoadmapTimeline.ts` with typed `StageConfig` interface.
   - Add skeleton loader state and error boundary fallback if `current-stage.json` fails to fetch.
3. **Phase 5 Vite Bundling**:
   - Bundle `src/pages/roadmap.ts` via Vite.
4. **Verification**:
   - Verify timeline renders phase tags (`Completed`, `In Progress`, `Planned`) cleanly with zero 404 network errors.
