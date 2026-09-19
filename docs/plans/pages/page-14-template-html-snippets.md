# Page Plan 14: Shared HTML Template Snippets (`assets/template-html/`)

**Target Path:** `assets/template-html/` (`footer-template.html`, `intro-template.html`, `home-template.html`)  

---

## 1. Technical Assessment Findings

1. **Broken Legal Links in Footer**: Lines 29–30 in `footer-template.html` link to `/platform/privacy` and `/platform/license` which return 404 errors across all localized routes.
2. **Unsafe `innerHTML` Template Loading**: `assets/js/footer-template.js:31` assigns raw HTML text into container elements via `innerHTML`.

---

## 2. Target Design & Refactoring Steps

1. **Phase 1 Fixes**:
   - Update `footer-template.html` lines 29–30: Ensure hrefs point to `/platform/privacy/` and `/platform/license/`.
2. **Phase 4 & 5 Safe Template Loader**:
   - Build `src/components/TemplateLoader.ts`: Uses `DOMParser.parseFromString()` to parse HTML snippets safely before appending nodes to DOM.
   - Automatically injects active route highlighting (`.is-active`) on current page nav links.
3. **Verification**:
   - Verify footer links on all 34 localized production routes load valid privacy and license pages.
