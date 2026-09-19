# Page Plan 10: Release Notes & What's New (`/platform/whats_new/`)

**Target Path:** `platform/whats_new/index.html`  
**Route URL:** `/platform/whats_new/`  

---

## 1. Technical Assessment Findings

1. **Dead Script References**:
   - Line 6: `<script src="/assets/js/lang-sync.js"></script>` (404 error).
   - Line 88: `<script src="/fanhoard-console-bridge.js"></script>` (404 error).
2. **Redundant Network Refetching**: Selecting a release version fetches corresponding Markdown file from server on every click without client-side caching.

---

## 2. Target Design & Refactoring Steps

1. **Phase 1 Fixes**:
   - Delete line 6 (`lang-sync.js`) and line 88 (`fanhoard-console-bridge.js`) from `platform/whats_new/index.html`.
2. **Phase 3 & 5 Markdown Cache Service**:
   - Create `src/services/ReleaseCacheService.ts` caching parsed Markdown documents in memory and `sessionStorage`.
   - Toggling between release versions loads cached content instantly.
3. **Verification**:
   - Toggle release versions in release changelog viewer: verify network tab shows zero repeated fetches for previously loaded release notes.
