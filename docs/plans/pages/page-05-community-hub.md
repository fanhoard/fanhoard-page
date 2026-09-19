# Page Plan 05: Community Overview Hub (`/community/`)

**Target Path:** `community/index.html`  
**Route URL:** `/community/`  

---

## 1. Current Problems from Technical Assessment

1. **Dead Script References**:
   - Line 6: `<script src="/assets/js/lang-sync.js"></script>` (404 error).
   - Line 72: `<script src="/fanhoard-console-bridge.js"></script>` (404 error).
2. **Missing Structured Metadata**: Lacks Open Graph and Schema.org structured metadata for social sharing and Discord community embeds.

---

## 2. Target Design

### Architecture & Component Structure
- **`DiscordInviteBanner.ts`**: Interactive card with online user counter and direct Discord invite link.
- **`QuickActionCards.ts`**: Navigation shortcuts to Contact Form (`/community/contact/`) and Bug Report Form (`/community/report/`).
- **`MetadataHead.ts`**: Dynamic OpenGraph and Schema.org structured data generator.

---

## 3. Exact Refactoring Steps

1. **Phase 1 Fixes**:
   - Delete line 6 (`lang-sync.js`) and line 72 (`fanhoard-console-bridge.js`) from `community/index.html`.
2. **Phase 4 Metadata & a11y**:
   - Add Open Graph meta tags (`og:title`, `og:description`, `og:image`, `og:url`) and Schema.org JSON-LD markup to `<head>`.
3. **Phase 5 Vite Bundling**:
   - Bundle `src/pages/community.ts` using Vite.
4. **Verification**:
   - Confirm 0 HTTP 404 network errors in DevTools.
   - Test Open Graph preview generation using social card tools.
