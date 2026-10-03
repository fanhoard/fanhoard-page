# FanHoard Hardened Version Notes & Update Notification Pipeline v3.2.4

## What changed

Hardened the end-to-end version notes pipeline and release management system to top-platform standards:

1. **Language Validation & Robust Fallback**: Updated `assets/js/version-core.js` to validate `window.FvLang.lang` against `SUPPORTED_LANGS` (`['en', 'th']`), ensuring unsupported UI languages (e.g. Japanese, Chinese) fall back safely to English instead of triggering 404 network fetch errors for missing current.md files.
2. **Localized Date Formatting in Modals**: Fixed release date evaluation in `buildContent()` so ISO timestamps are properly converted to localized date strings in both English and Thai rather than evaluating to an empty string.
3. **Modal Accessibility (A11y)**: Upgraded update notification modal markup to include semantic `<h2>` headings for version titles, explicit `ariaLabel` and `ariaDescribedBy` attributes on dialog instances, and `type="button"` on dismiss actions.
4. **Dynamic Loader Cache Busting**: Updated release tool configuration (`scripts/update-version.js`) to target canonical dynamic loaders (`assets/js/search-system/search.js` and `assets/js/loading-system/fvl.js`), ensuring asset version queries are injected into all dynamic loaders during `npm run release`.
5. **Automated Pipeline Test Suite**: Created `tests/version-pipeline.test.ts` to enforce release artifact structure, index manifest integrity, dynamic loader patterns, and `version-core.js` defensive behavior.

## Files in this release

| File | Status | Purpose |
|---|---|---|
| `assets/js/version-core.js` | MODIFIED | Hardened language validation, network fallback, localized date formatting, and modal A11y. |
| `scripts/update-version.js` | MODIFIED | Fixed dynamic loader list targeting `search-system/search.js` and `loading-system/fvl.js`. |
| `assets/md/en/current.md` | MODIFIED | Release notes for v3.2.4 in English. |
| `assets/md/th/current.md` | MODIFIED | Release notes for v3.2.4 in Thai. |
| `tests/version-pipeline.test.ts` | NEW | Unit tests for version pipeline standards and update-version / version-core contract verification. |
| `CHANGES.md` | MODIFIED | Updated release changelog in English for v3.2.4. |
| `PATCH_NOTES.md` | MODIFIED | Updated patch summary notes in Thai for v3.2.4. |

---

# FanHoard Unified Scroll-Lock Core v3.2.3

## What changed

Unified all overlay scroll-locking mechanisms (loading screens, popups, and search overlay) into a single reference-counted scroll-lock authority (`ScrollLockCore` / `ScrollLockManager`):

1. **Shared Scroll-Lock Core**: Extracted canonical scroll-lock logic into `assets/js/loading-system/fvl-modules/scroll-lock-core.js`, exposing `window.ScrollLockCore`. Supports owner-tagged reference counting, `data-scroll-locked` DOM attribute management on `<html>`, `allowScrollIn` selector registration, `releaseAll` owner teardown, and DOM style restoration on `reset()`.
2. **Unified Overlay Integration**: Updated loader (`fvl.js`, `engine.js`, `nav-core-modules/loading.js`), `popup.js` / `popup-modules/state.js`, and `search.js` / `search-modules/overlay.js` to route all lock/unlock operations through `ScrollLockCore` with owner tags ('fvl', 'popup', 'search') and fail-soft fallback.
3. **Stacked Overlay Protection**: Prevents stacked overlays (e.g., popup over fullscreen loading screen) from breaking each other's scroll lock when one overlay is closed. Background scroll remains locked until all active overlays release their reference counts.
4. **Contract & Browser E2E Tests**: Added 8 unit contract tests in `tests/scroll-lock-core.test.ts` for reference counting, owner tags, and DOM reset behavior. Added 3 Playwright real-browser e2e tests in `e2e/scroll-lock.spec.ts` covering fullscreen loading, stacked overlay composition, and search overlay lock/unlock cycles.

---

# FanHoard Fullscreen Scroll-Lock Inversion Fix & Release Notes Update v3.2.2

## What changed

The FVL (FanHoardVerse Loader) fullscreen scroll-lock implementation and developer documentation have been updated to resolve an inverted scroll-lock bug and ensure strict lock/unlock call-pair invariance across all boot adoption and loading lifecycles.
