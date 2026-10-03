# FanHoard Search System Polish & Navigation Polish v3.2.6

## What changed in v3.2.6 (Search System Polish)

Elevated the search system (overlay, input bar, suggestion list, keyboard navigation, and virtual scroll rendering) to top-platform standards:

1. **Overlay Transitions & Dark-Mode Compatibility**: Added smooth 180ms `cubic-bezier(0.16, 1, 0.3, 1)` opacity and transform transitions when opening and closing the search overlay (`.search-overlay-active`), and updated overlay styling to consume CSS variables (`var(--surface-base, #ffffff)`).
2. **Suggestion List Keyboard Navigation & Focus Polish**: Refined suggestion row interactions with `:focus-visible` highlight indicators (`border-left` brand primary accent) and hover states. Pressing `ArrowUp` on the first suggestion item gracefully returns focus to the search input, while `ArrowDown` from the search input enters the suggestion list seamlessly.
3. **Screen Reader Live Announcements & Accessibility**: Guaranteed live result feedback for screen readers by dynamically creating a polite `#searchLiveAnnouncer` element if missing, announcing filtered result counts and empty search states automatically.
4. **Cleaner Event Delegation & Input Handling**: Eliminated inline `onkeydown` handler overwrites on search inputs during suggestion renders, consolidating input keyboard events inside the central `input-bar` service.
5. **Automated Search Polish Test Suite**: Added `tests/search-polish.test.ts` covering search overlay behavior, suggestion list keyboard navigation, live announcer element creation, and event delegation.

## Files in v3.2.6

| File | Status | Purpose |
|---|---|---|
| `assets/js/search-system/search-modules/input-bar.js` | MODIFIED | Consolidated input keyboard events and input handling delegation. |
| `assets/js/search-system/search-modules/overlay.js` | MODIFIED | Smooth overlay open/close transitions and surface-base dark mode compatibility. |
| `assets/js/search-system/search-modules/rendering.js` | MODIFIED | Live accessibility announcer integration and rendering performance polish. |
| `assets/js/search-system/search-modules/suggestions.js` | MODIFIED | Focus-visible indicators, ArrowUp/ArrowDown suggestion list navigation. |
| `assets/js/search-system/search-system.css` | MODIFIED | Transition curves, focus rings, hover states, and live announcer CSS styling. |
| `tests/search-polish.test.ts` | NEW | Unit test suite for search overlay, suggestions, keyboard navigation, and live announcer. |
| `assets/md/en/current.md` | MODIFIED | Release notes for v3.2.6 in English. |
| `assets/md/th/current.md` | MODIFIED | Release notes for v3.2.6 in Thai. |
| `CHANGES.md` | MODIFIED | Release changelog covering v3.2.6 search polish and v3.2.5 navigation polish in English. |
| `PATCH_NOTES.md` | MODIFIED | Release patch summary covering v3.2.6 search polish and v3.2.5 navigation polish in Thai. |

---

## Retrospective Documentation: v3.2.5 Navigation Polish

*Note: v3.2.5 release notes were published to history (`assets/md/*/releases/v3.2.5.md`), but its `CHANGES.md` and `PATCH_NOTES.md` file entries were omitted during that release. They are formally documented below as part of v3.2.6.*

### What changed in v3.2.5 (Navigation Polish)

1. **Keyboard Arrow Navigation & ARIA Semantics**: Integrated W3C ARIA tablist/tab roles with roving tabindex (`tabindex="0/-1"`) and `aria-selected` state tracking across main and sub-navigation categories. Supported `ArrowRight`, `ArrowLeft`, `Home`, and `End` keys for keyboard navigation.
2. **Silky Transitions & Brand Focus Rings**: Unified navigation transitions using smooth `180ms cubic-bezier(0.16, 1, 0.3, 1)` easing curves, added crisp `:focus-visible` outlines matching the brand primary palette, and refined active tab indicator sliding animations.
3. **Mobile Touch Targets & Active Category Centering**: Guaranteed 44px minimum touch targets across all viewport sizes and added automated smooth horizontal scrolling to center active main and sub-navigation tabs in mobile viewports.
4. **Language Switch Label Sync Fix**: Resolved a label desynchronization bug in `updateButtonsLanguage` by using canonical `data-url` key mapping instead of array position indices, ensuring correct multilingual tab labels.

### Files in v3.2.5

| File | Status | Purpose |
|---|---|---|
| `assets/js/nav-core-modules/buttons.js` | MODIFIED | Canonical `data-url` key mapping fix for `updateButtonsLanguage`. |
| `assets/js/modern-navigation.js` | MODIFIED | ARIA tablist/tab, roving tabindex, keyboard arrow navigation, and active category scroll-centering. |
| `assets/css/nav-core.css` | MODIFIED | Navigation transitions, focus rings, and active category styles. |
| `assets/css/nav-core-ext.css` | MODIFIED | Extended navigation menu layout and animation refinements. |
| `assets/css/top-navigation-bar.css` | MODIFIED | Header navigation bar styling and transition timing. |
| `tests/navigation-polish.test.ts` | NEW | Unit tests for ARIA navigation, keyboard movement, and language label synchronization. |

---

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
