# FanHoard Localization System Polish v3.2.9

## What changed in v3.2.9 (Localization System Polish)

Elevated the FanHoard localization system, language picker overlay UX, central FvLang core API, link prefix manager, and translation engine to top-platform standards:

1. **Accessible Language Picker Overlay UX (`assets/js/lang-modules/ui.js`)**:
   Upgraded language picker options to semantic `<button type="button">` elements in a `role="listbox"` container with `role="option"`, `aria-selected`, active checkmark indicators (`✓`), high-contrast focus rings (`outline: 2px solid #00FFAA`), smooth 180ms cubic-bezier transition curves, and keyboard arrow/enter navigation within the dialog.
2. **Deduplicated Central Language Core API (`assets/js/lang-core.js`)**:
   Surgically removed 257 lines of duplicate IIFE code in `assets/js/lang-core.js`, reducing script bundle size while preserving instant synchronous language resolution (`window.FvLang`), event listener dispatching (`fv:langchange`), and `localStorage` synchronization.
3. **Synchronized Smart Link Language Prefix Manager (`assets/js/lang-links.js`)**:
   Updated `lang-links.js` to listen to both `languageChange` and `fv:langchange` global events, ensuring internal link hrefs and dynamic DOM mutations maintain accurate language prefixes across all interaction pathways.
4. **Preserved HTML Structure & Attribute Restoration (`assets/js/lang-modules/translator.js`)**:
   Enhanced `TranslatorService` (`storeOriginalContent` and `resetToEnglishContent`) to store `data-original-html`, `data-original-placeholder`, `data-original-title`, and `data-original-aria-label`. Resetting to English now accurately restores child elements, icons, SVG slots, and translatable input attributes without layout degradation or content loss.
5. **Automated Localization Test Suite (`tests/localization-polish.test.ts`)**:
   Created dedicated unit test suite validating central API event dispatching, option markup semantics, keyboard focus, and content restoration (215/215 unit tests green across 34 test files).

## Files in v3.2.9

| File | Status | Purpose |
|---|---|---|
| `assets/js/lang-core.js` | MODIFIED | Removed duplicated IIFE code block, reducing bundle size while keeping FvLang API synchronous. |
| `assets/js/lang-modules/ui.js` | MODIFIED | Polished language overlay options with ARIA listbox roles, keyboard navigation, and checkmark indicators. |
| `assets/js/lang-links.js` | MODIFIED | Added `fv:langchange` event listener for link prefix synchronization. |
| `assets/js/lang-modules/translator.js` | MODIFIED | Enhanced original content storage to capture innerHTML, placeholders, titles, and aria-labels. |
| `tests/localization-polish.test.ts` | NEW | Unit test suite for localization polish, FvLang API, option semantics, and content restoration. |
| `assets/md/en/current.md` | MODIFIED | Release notes for v3.2.9 in English. |
| `assets/md/th/current.md` | MODIFIED | Release notes for v3.2.9 in Thai. |
| `CHANGES.md` | MODIFIED | Release changelog covering v3.2.9 localization system polish in English. |
| `PATCH_NOTES.md` | MODIFIED | Release patch notes covering v3.2.9 localization system polish in Thai. |
