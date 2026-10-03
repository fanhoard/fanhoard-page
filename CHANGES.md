# FanHoard FVL Polish & Stability Foundation v3.2.0

## What changed

The FVL (FanHoardVerse Loader) system and site-wide stability infrastructure have been polished and reinforced with robust scroll-locking, centered spinner layouts, overlay accessibility controls, reduced motion compliance, and mechanical defect fixes across key navigation, search, data, popup, and layout modules:

1. **Scroll-Lock Architecture & Exact Restoration**: `ScrollLockManager` ref-counts active overlays, calculates scrollbar width compensation (`--fvl-scrollbar-width`), preserves exact original `body` inline styles, and restores original inline styles and scroll Y position when all overlays are hidden.
2. **Centered Mounted Spinners**: Standalone and scoped mounted spinners default to container centering (`opts.center = true`), preventing spinners from pinning to the top-left corner.
3. **Overlay Details Polish**: Added `role="dialog"` and `aria-modal="true"` for fullscreen overlays, focus trapping and focus restoration, `Escape` key dismissal, and `@media (prefers-reduced-motion: reduce)` CSS overrides.
4. **Site-Wide Stability Fixes**: Resolved 10 mechanical high/medium defects including popstate navigation race guards, homepage fetch error fallbacks, `AbortError` exception safety, focus trap listener leak prevention, passive scroll listener cleanup, rAF window resize throttling, search data loader HTTP status validation, deduplicated language event listeners, and reduced motion CSS overrides.

## Files in this release

| File | Status | Purpose |
|---|---|---|
| `assets/js/loading-system/fvl-modules/utils.js` | MODIFIED | Implemented `ScrollLockManager` with ref-counting, scrollbar width compensation, non-destructive `body` style preservation/restoration, and iOS touch prevention. |
| `assets/js/loading-system/fvl-modules/engine.js` | MODIFIED | Enabled auto scroll-lock for fullscreen & viewport-covering overlays; added overlay ARIA modal attributes, focus trap/restore, and Escape key listener. |
| `assets/js/loading-system/fvl-modules/renderer.js` | MODIFIED | Set ARIA roles (`role="dialog"`, `aria-modal="true"`, `role="progressbar"`) and applied default spinner centering class (`.fvl-spinner--center`). |
| `assets/js/loading-system/fvl-modules/config.js` | MODIFIED | Set `lockScroll: true` by default for the `fullscreen` preset. |
| `assets/js/loading-system/fvl-spinner.js` | MODIFIED | Set default `center: true` option for standalone `FVLSpinner` and added alignment options (`left`, `center`, `right`). |
| `assets/css/loading-system.css` | MODIFIED | Added CSS rules `.fvl-spinner--center`, `.fvl-spinner-wrapper`, and `@media (prefers-reduced-motion: reduce)` stroke animation overrides. |
| `assets/js/nav-core-modules/router.js` | MODIFIED | Added `_navSequenceId` sequence guard to `popstate` handler to eliminate async route validation race conditions. |
| `assets/js/home.js` | MODIFIED | Wrapped `fetchIdOrder` category fetch in `try...catch` returning `[]` fallback array, and deduplicated `fv:langchange` listener reference. |
| `assets/js/nav-core-modules/data.js` | MODIFIED | Caught `AbortError` exceptions in `_enqueueFetch` to return `{ ok: false, aborted: true }` without throwing uncaught rejections. |
| `assets/js/popup-modules/a11y.js` | MODIFIED | Added `_activeTraps` registry and cleaned up existing `keydown` handlers before installing focus traps to eliminate memory leaks. |
| `assets/js/nav-core-modules/content.js` | MODIFIED | Added `{ passive: true }` to scroll listener and exposed `_cleanupScrollPersist()` cleanup method. |
| `assets/js/nav-core-modules/init.js` | MODIFIED | Throttled window resize listener via `requestAnimationFrame` (`_resizeRaf`) to eliminate layout thrashing. |
| `assets/js/search-system/search-modules/data-loader.js` | MODIFIED | Validated `r.ok` status before calling `r.json()` in fallback loader to prevent JSON syntax errors on HTTP 404/500 responses. |
| `assets/css/search.css` | MODIFIED | Added `@media (prefers-reduced-motion: reduce)` overrides for search modal, backdrop, and result transitions. |
| `assets/css/about.css` | MODIFIED | Added `@media (prefers-reduced-motion: reduce)` overrides disabling modal card floating animations. |
| `assets/css/layout.css` | MODIFIED | Added `@media (prefers-reduced-motion: reduce)` overrides disabling smooth scroll behavior and layout transitions. |
| `tests/loading-contract.test.ts` | MODIFIED | Added unit test coverage for FVL scroll-lock ref counting, scrollbar compensation, style restoration, spinner centering, ARIA, focus trap, Escape key, and reduced motion. |
| `tests/stability-defects.test.ts` | **NEW** | Unit test suite covering all 10 site-wide stability and mechanical defect fixes. |
| `fanhoard-docs/02-Search-System.md` | MODIFIED | Updated search system documentation with data-loader HTTP validation and reduced motion overrides. |
| `fanhoard-docs/03-Navigation-And-Content.md` | MODIFIED | Updated nav & content documentation with popstate sequence guard, scroll persist cleanup, rAF resize throttling, home error fallbacks, and data abort safety. |
| `fanhoard-docs/05-Content-Data-Service.md` | MODIFIED | Updated data service documentation with `AbortError` exception safety details. |
| `fanhoard-docs/06-Popup-System.md` | MODIFIED | Updated popup system documentation with active focus trap registry and listener leak prevention (v1.2.0). |
| `fanhoard-docs/07-Loading-System.md` | MODIFIED | Comprehensive FVL documentation updated with `ScrollLockManager`, spinner centering, accessibility controls, and Version History v3.2.0. |
| `fanhoard-docs/14-System-Design-And-UX.md` | MODIFIED | System UX documentation updated with reduced motion compliance across all system stylesheets. |
| `fanhoard-docs/15-Loading-Contract-And-Test-Plan.md` | MODIFIED | System contract and test plan updated with FVL Scroll-Lock & Centering contracts (Section 2.9), test seam (Seam 8), and Implementation Slice 8. |

## How it works (architectural summary)

### 1. FVL Scroll-Lock Manager & Non-Destructive Restore
- `ScrollLockManager` in `assets/js/loading-system/fvl-modules/utils.js` maintains a module-level `lockCount` reference counter.
- On first lock, computes scrollbar width (`window.innerWidth - document.documentElement.clientWidth`), assigns `--fvl-scrollbar-width` on `documentElement`, and applies `paddingRight` compensation to `body` to avoid horizontal layout jumps.
- Saves all original `body` inline styles (`position`, `top`, `width`, `overflow`, `paddingRight`, `hasStyleAttr`) prior to setting `position: fixed`, `top: -${scrollY}px`, `width: 100%`, `overflow: hidden`.
- When `lockCount` returns to `0`, exact original inline styles are restored (or `style` attribute removed if empty) and original scroll Y position restored via `window.scrollTo(0, savedScrollY)`.
- Non-passive `touchmove` listener prevents iOS touch dragging on non-`.fvl-scrollable` elements while locked.

### 2. Centered Mounted Spinner Layout
- CSS modifier classes `.fvl-spinner--center`, `.fvl-spinner-wrapper`, `.fvl-spinner--align-left`, `.fvl-spinner--align-right` added to `assets/css/loading-system.css`.
- `FVLSpinner.create/mount` and FVL renderer apply `.fvl-spinner--center` by default when `opts.center !== false` and `align` is unspecified, keeping mounted spinners centered inside their containers.

### 3. Overlay Accessibility & Reduced Motion
- Fullscreen overlays assign `role="dialog"` and `aria-modal="true"`, toggling `aria-hidden="true"` on sibling DOM elements.
- Scoped overlays assign `role="progressbar"` and `aria-busy="true"`.
- Focus trap captures `activeElement`, focuses overlay root (`tabindex="-1"`), traps `Tab` / `Shift+Tab` cycling, and restores focus on hide.
- `Escape` key handler triggers overlay hide when `closable !== false`.
- `@media (prefers-reduced-motion: reduce)` in `loading-system.css` disables stroke rotation animations.

### 4. Site-Wide Stability & Defect Guards
- `RouterService` guards `popstate` events using `_navSequenceId` counter.
- `home.js` wraps `fetchIdOrder` in `try...catch` with `[]` fallback array and deduplicates `fv:langchange` event listener reference (`_langChangeHandler`).
- `DataService` catches `AbortError` in `_enqueueFetch` and returns `{ ok: false, aborted: true }`.
- `a11y.js` maintains `_activeTraps` registry and unbinds previous `keydown` handlers before registering new focus traps.
- `content.js` uses `{ passive: true }` on scroll listener and exposes `_cleanupScrollPersist()`.
- `init.js` throttles window resize events via `requestAnimationFrame` (`_resizeRaf`).
- `data-loader.js` validates `r.ok` prior to `r.json()` in search fallback fetcher.
- `@media (prefers-reduced-motion: reduce)` blocks added across `search.css`, `about.css`, and `layout.css`.

## Validation

- **Full Project Vitest Suite (`npx vitest run`)**: 27 test files passed, 166/166 tests passed.
- **TypeScript Check (`npm run type-check`)**: 0 errors.
- **ESLint (`npm run lint`)**: 0 errors.
