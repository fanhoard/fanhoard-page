# Page Plan 08: Platform About Page (`/platform/about/`)

**Target Path:** `platform/about/index.html`  
**Route URL:** `/platform/about/`  

---

## 1. Technical Assessment Findings

1. **Dead Script References**:
   - Line 11: `<script src="/assets/js/lang-sync.js"></script>` (404 error).
   - Line 93: `<script src="/fanhoard-console-bridge.js"></script>` (404 error).
2. **Global Broken Footer Links**: Footer template references `/platform/privacy` and `/platform/license` which do not exist in the repository, throwing 404s.

---

## 2. Target Design & Refactoring Steps

1. **Phase 1 Fixes**:
   - Delete line 11 (`lang-sync.js`) and line 93 (`fanhoard-console-bridge.js`) from `platform/about/index.html`.
   - Create `/platform/privacy/index.html` and `/platform/license/index.html` legal documentation pages.
2. **Phase 4 Content & Design Refactoring**:
   - Update mission statement and tech stack highlights card with active FanHoard architecture details.
3. **Phase 5 Vite Bundling**:
   - Bundle `src/pages/about.ts` via Vite.
4. **Verification**:
   - Verify zero 404 errors on page load and test footer links to privacy/license pages.
