# FanHoard Loading System Contract & Test Plan

- **System Described**: Central Loading Framework (FVL / FLV), Standalone Spinner Subsystem (`fvl-spinner.js`), Discover Page Lifecycle, and Search System Consumer Integration
- **Entry Files**: `assets/js/loading-system/fvl.js` (Full Orchestrator) & `assets/js/loading-system/fvl-spinner.js` (Standalone Subsystem)
- **Dependencies**: `assets/css/loading-system.css`, `assets/js/nav-core-early.js`, `assets/js/nav-core-modules/router.js`, `assets/js/search-system/search-modules/search-controller.js`
- **Verification**: `npm run test` (runs Vitest loading suite) | `npx playwright test`

---

## 1. System Overview & Problem Analysis

The FanHoard loading ecosystem provides a unified loading indicator framework across initial application boot, SPA route transitions, category switching, search index preparation, and component-level widget indicators.

An analysis of execution logs and browser harness runs identified five primary architectural issues in legacy loading behavior:

1. **Multi-Overlay Boot Competition**: During initial load and refresh, three concurrent overlay mechanisms (`nc-early-overlay` in `nav-core-early.js`, `fv-boot-loader` in `discover/index.html`, and FVL fullscreen mount/unmount in `init.js`) competed for screen dominance, producing visible UI flickering.
2. **Navigation Controls Obscured**: Category switches (such as clicking "Symbols") applied `body.fvl-nav-mode.nav-loading`, setting header navigation opacity to `0.4` and `pointer-events: none` while dimming the whole page instead of targeting the scoped content container (`#content-loading`).
3. **Unlocalized Early Loading Flash**: `nav-core-early.js` hardcoded an unlocalized `<div id="nc-early-msg">Loading…</div>` element at `top:0, left:0, z-index:99999` prior to locale initialization by `FvLang` or `FVL`.
4. **Search Race Conditions**:
   - `_scheduleFuseUpgrade(q, type)` in `search-controller.js` locked `type` in a closure during index construction, causing `checkFuse()` to execute with stale type filters if the user switched categories mid-build.
   - `__pendingSearch` in `search.js` only captured `{ q, type }`, omitting `category`. Draining pending searches reset category state to `'all'` and produced duplicate history entries.
5. **Modal Backdrop Interactions**: `.fp-overlay` in `popup.css` maintained `z-index: 500` across the full viewport, capturing click events when hidden or inactive unless explicitly isolated.

---

## 2. Loading System Contracts & Handshake Specifications

### 2.1 Initial Boot Readiness & Lifecycle Rules

- **Single-Phase Boot Lifecycle**: Application startup (Boot/Refresh) executes exactly ONE loading phase from initial page fetch until target content DOM in `#content-container` is ready to render.
- **Cleanup Handshake**: Upon completing asynchronous initialization, `NavCore` / `InitService` performs a single atomic cleanup removing `fv-boot-loader` and `nc-early-overlay`. Opening subsequent fullscreen FVL overlays during the same boot phase is prohibited.
- **Localized Readiness Event**: `fvl.js` dispatches `fvl:ready` as a `CustomEvent` on `window` upon mounting:
  ```javascript
  window.dispatchEvent(new CustomEvent('fvl:ready', { detail: { version: VERSION } }));
  ```
- **Global Aliases & Namespace Contract**: `fvl.js` registers frozen API references:
  - `window.FVL` (Primary global API)
  - `window.FLV` (Canonical alias pointing directly to `window.FVL`)
  - Backward compatibility proxies automatically installed for `window.showInstantLoadingOverlay`, `window.removeInstantLoadingOverlay`, and `window.NavCoreModules.LoadingService`.

### 2.2 Scoped Loading Modes & Display Contract

FVL supports four distinct operational display modes:

| Mode | Target Element | Z-Index | Primary Usage |
| :--- | :--- | :--- | :--- |
| `fullscreen` | Viewport (`body`) | `17000` (`--fv-z-fullscreen-overlay`) | Initial cold boot & full app resets |
| `scoped` | Container selector (`#content-loading`) | `1600` (`--fv-z-scoped-overlay`) | Category switching & partial view updates |
| `inline` | Button/Element handle | `0` (Normal DOM Flow) | In-place button spinners |
| `topbar` | Top edge indicator | `17500` (`--fv-z-topbar`) | Silent background fetch operations |

#### API Call Contract Examples
```javascript
// Fullscreen mode (default)
const handle = FVL.show({ message: 'Loading content...' });
handle.hide();

// Scoped container loading (Header nav remains interactive)
FVL.scoped({ target: '#content-loading', overlay: false });

// Inline button spinner
FVL.inline({ target: '#submit-btn' });
```

### 2.3 Flexible Display Mode Options Contract

Every FVL mode supports flexible options for text suppression, chromeless framing, and slot mounting:

- **`spinnerOnly: true`**: Omits text wrapper containers (`.fvl-text`, `.fvl-msg`, `.fvl-sub`). Sets root container `aria-label` (falling back to `opts.message` or `'Loading'`) to maintain accessibility.
- **`chromeless: true`**: Removes background overlay backdrop, borders, and shadows by adding `.fvl-chromeless` modifier class.
- **`bare: true`**: Shorthand equivalent to `{ spinnerOnly: true, chromeless: true }`. Applies both `.fvl-bare` and `.fvl-chromeless` modifier classes.
- **`targetSlot`**: Accepts a selector string or `HTMLElement` child slot inside the target container. Mounts the loader into the sub-slot while preserving the parent target container's `aria-busy="true"` state.

### 2.4 Standalone Spinner Subsystem Contract (`fvl-spinner.js`)

- **Zero-Dependency Isolation**: `assets/js/loading-system/fvl-spinner.js` operates independently without requiring `fvl.js` or `FVLModules`.
- **Style Auto-Injection Contract**: Injects critical CSS (`@_fvl_spin` keyframes and `.fvl-spinner` rules) into `<style id="fvl-spinner-styles">` if `loading-system.css` is not linked.
- **Namespace & Aliases**: Exposes global `window.FVLSpinner` and sets `window.FVL.spinner = window.FVLSpinner`.
- **Instance Handle Capabilities**:
  - `element`: Direct reference to the root `.fvl-spinner` DOM element.
  - `setSize(size)`: Supports `'sm'`, `'md'`, `'lg'`, `'xl'` presets or numeric pixel values.
  - `setColor(color)` / `setTrackColor(trackColor)`: Sets CSS custom properties `--fvl-spinner-color` and `--fvl-spinner-track-color`.
  - `setSpeed(speed)`: Sets speed preset (`'fast'`, `'normal'`, `'slow'`).
  - `setStrokeWidth(width)`: Sets stroke preset (`'thin'`, `'medium'`, `'thick'`) or numeric pixel width.
  - `updateProgress(value)`: Sets determinate mode and updates SVG stroke-dashoffset (0..100%).
  - `mount(target)` / `unmount()` / `destroy()`: DOM lifecycle control methods.

### 2.5 ARIA Accessibility & Reduced Motion Standards

- **Container ARIA Contract**: Every loader container must specify `role="status"` and `aria-live="polite"`. Inner SVG spinner elements must specify `aria-hidden="true"`.
- **Target Busy State**: When scoped or inline loading starts, the target element receives `aria-busy="true"`. Upon completion or error, `aria-busy="false"` is restored.
- **Reduced Motion Support**: CSS animations in `loading-system.css` respect user preferences:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .fvl-spinner {
      animation: none !important;
      transition: none !important;
    }
  }
  ```

### 2.6 Cancellation & Race Prevention

- **In-flight Request Abort**: Navigating between categories or executing new search queries must abort active `Fetch` requests via `AbortController.abort()` and destroy active FVL instances bound to that request.
- **Dynamic Filter Resolution**: `checkFuse()` in `search-controller.js` reads current filter state directly from `State.selectedType` at execution time rather than referencing stale closure variables.
- **Pending Search Envelope Contract**: `window.__pendingSearch` captures full query context (`{ q: string, type: string, category: string }`). Queue draining dispatches through `doSearch(null, true)` once to prevent duplicate browser history entries.

### 2.7 Error Boundary & Recovery Contract

- **Network / Timeout Failure State**: If asynchronous fetch fails, FVL clears active indicators immediately and renders an inline error boundary inside the content container with `aria-live="assertive"` and a localized Retry action button.
- **Backdrop Pointer-Events Isolation**: Non-active or hidden modal overlays (`aria-hidden="true"`) specify `pointer-events: none` to prevent blocking click events on underlying UI controls.

---

### 2.8 Discover Page Content Transition Contracts

- **Point A (Tab/Category Switch Navigation)**: `router.navigateTo()` and `ContentService.clearContent()` must mount a bare FVL spinner (`{ bare: true, size: 'md' }`) into `#content-loading` and set `aria-busy="true"` on the container.
- **Point B (Feed / Category Refresh)**: `ContentService.renderFeed()` must invoke `clearContent()`, which cleans the container and mounts the bare FVL spinner, checking for existing spinner elements (`!ctr.querySelector('.fvl-spinner')`) before mounting to prevent double-spinner duplication.
- **10s Safety Fallback Timer**: The `#content-loading` container must utilize a 10-second safety timeout (`_fvlSafetyTimer`) to auto-clear active spinners and reset `aria-busy` to `"false"` if network requests or content transitions stall indefinitely.
- **Point C (Infinite Scroll Pagination)**: Infinite scroll triggers on `#nc-feed-sentinel` and `#nc-lazy-sentinel` must set `aria-busy="true"` and mount a standalone fast small spinner (`FVLSpinner.mount(sentinel, { size: 'sm', speed: 'fast' })`). The spinner handle must be unconditionally cleaned up in a `finally` block using `spinnerHandle.destroy()` to guarantee exception safety.
- **Point D (Search & URE Pending State)**:
  - `SearchController.doSearch()` (when `!docsReady`) must set `aria-busy="true"` and mount a bare FVL spinner inside `#searchResults` instead of static placeholder text.
  - `RenderingService.renderResults()` (when `!window.URE`) must set `aria-busy="true"` and mount a bare FVL spinner inside `#searchResults` until `window.URE` loads.
  - Upon rendering search results, `aria-busy` must be updated to `"false"` and active spinners unmounted.

### 2.9 Polish Round: Scroll-Lock, Centering, & Accessibility Contracts

- **Scroll Lock Contract (`ScrollLockManager`)**:
  - Automatically locks scrolling when `fullscreen` overlay is active, `lockScroll: true` is configured, or scoped overlay is mounted on a viewport-covering element (`body`, `documentElement`, `#app`, `#main`, `#root`, `.fvl-viewport-covering`).
  - Enforces dual-container locking on both `document.documentElement` (`html`) and `document.body` with `overflow: hidden` and `overscroll-behavior: none` (plus `position: fixed`, `top: -${scrollY}px`, `width: 100%` on body), resolving viewport scrolling leaks on modern HTML5 layouts.
  - Intercepts non-passive `wheel`, `touchmove`, and navigation `keydown` events (Space, PageUp, PageDown, End, Home, Arrow keys) on `document`, preventing default scrolling gestures outside `.fvl-scrollable` containers and editable form fields (`INPUT`, `TEXTAREA`, `SELECT`, `isContentEditable`).
  - Fullscreen overlays specify `touch-action: none` and `overscroll-behavior: none` via stylesheet classes and inline styles.
  - Synchronizes scroll lock engagement when Nav-Core/LoadingService adopts early boot loader DOM elements, safely releasing lock state upon readiness handshake.
  - Utilizes a module-level reference counter (`lockCount`) to support nested overlays and rapid show-hide cycles without losing scroll position or prematurely unlocking.
  - Dynamically calculates scrollbar width (`window.innerWidth - document.documentElement.clientWidth`), sets `--fvl-scrollbar-width` CSS variable on `documentElement`, and applies `paddingRight` compensation to `body` to prevent horizontal layout shift.
  - Preserves exact original inline styles for both `documentElement` (`overflow`, `overscrollBehavior`) and `body` (`position`, `top`, `width`, `overflow`, `paddingRight`, `overscrollBehavior`, `hasStyleAttr`).
  - Unconditionally detaches event listeners, restores original inline styles on both elements, and restores original scroll Y position (`window.scrollTo(0, savedScrollY)`) when `lockCount` returns to `0`.
- **Mounted Spinner Centering & Alignment Contract**:
  - Mounted spinners (`FVLSpinner.mount`, `FVLSpinner.create`, and FVL renderer) default to container centering (`opts.center = true`), rendering centered rather than pinned to the top-left.
  - Supports alignment option (`align: 'left' | 'center' | 'right'`) and explicit opt-out via `{ center: false }`.
- **Overlay ARIA, Focus Trap, & Motion Controls Contract**:
  - Fullscreen overlays receive `role="dialog"` and `aria-modal="true"`; sibling DOM nodes receive `aria-hidden="true"` during display and are restored on hide.
  - Scoped overlays receive `role="progressbar"` and `aria-busy="true"`.
  - Focus management captures `activeElement` before display, sets `tabindex="-1"` on overlay container and focuses it, traps `Tab` / `Shift+Tab` cycling within active overlay, and restores focus to original element on hide.
  - Keyboard dismissal listens for `Escape` keypress when `closable !== false`, triggering `onClose` / `onCancel` callbacks and hiding overlay.
  - `@media (prefers-reduced-motion: reduce)` in `loading-system.css` disables stroke rotation animations (`animation: none !important`) and enforces fixed dash array.

---

## 3. Test Seams & Test Suites

### 3.1 Unit & Integration Test Seams (Vitest)

- **Seam 1: `tests/loading-contract.test.ts`**
  - Asserts `FVL.show()` lifecycle, DOM injection, and DOM cleanup.
  - Verifies `aria-busy` attribute toggling on target containers.
  - Validates `window.FLV === window.FVL` alias equality and `fvl:ready` event emission.
  - Verifies backward compatibility proxies (`LoadingService.show/hide`).
- **Seam 2: `tests/search-races.test.ts`**
  - Simulates async Fuse.js upgrades and verifies `State.selectedType` is respected over closure parameters.
  - Verifies `window.__pendingSearch` retains `category` state during queue processing.
- **Seam 3: `tests/loading-spinner-standalone.test.ts`**
  - Asserts zero-dependency `FVLSpinner` standalone mounting without initializing `fvl.js`.
  - Asserts `<style id="fvl-spinner-styles">` auto-injection into document `<head>`.
  - Asserts factory static methods (`create`, `mount`, `applyVariant`, `updateProgress`, `renderSVG`).
  - Asserts instance handle methods (`setSize`, `setColor`, `setTrackColor`, `setSpeed`, `setStrokeWidth`, `updateProgress`, `unmount`, `destroy`).
- **Seam 4: `tests/loading-spinner-only.test.ts`**
  - Asserts `spinnerOnly`, `bare`, and `chromeless` options across all 4 modes (`fullscreen`, `scoped`, `inline`, `topbar`).
  - Verifies message DOM node suppression and root `aria-label` setting.
  - Verifies modifier class application (`.fvl-bare`, `.fvl-chromeless`).
  - Verifies `targetSlot` resolution inside target DOM containers.

- **Seam 7: `tests/discover-loading-integration.test.ts`**
  - Asserts mounting of bare FVL spinner in `#content-loading` and setting `aria-busy="true"` on `clearContent()`.
  - Asserts double-spinner protection on duplicate `clearContent()` calls.
  - Asserts active spinner removal and setting `aria-busy="false"` when `_appendFeedGroups` completes rendering.
  - Asserts 10-second safety fallback timer auto-clean if fetch stalls.
  - Asserts standalone `FVLSpinner` mounting on sentinel during infinite scroll and cleanup in `finally` block even if fetch throws error.
  - Asserts mounting of bare FVL spinner in `#searchResults` while waiting for `window.URE` in `renderResults()`.

- **Seam 8: `tests/loading-contract.test.ts`**
  - Asserts `ScrollLockManager` engages dual-container scroll lock on both `html` (`documentElement.style.overflow === hidden`) and `body` (`body.style.position === fixed`) across all `fullscreen` and viewport-covering show entry paths, incrementing `lockCount`.
  - Asserts non-passive event listeners (`wheel`, `touchmove`, `keydown`) call `e.preventDefault()` on scroll gestures outside `.fvl-scrollable` containers and editable input fields.
  - Asserts early boot loader adoption sync and release behavior.
  - Asserts scrollbar width calculation and `--fvl-scrollbar-width` CSS variable setting.
  - Asserts exact restoration of original `documentElement` and `body` inline styles and scroll position when `lockCount` returns to 0.
  - Asserts default centering (`opts.center !== false`) applies `.fvl-spinner--center` class and alignment option overrides.
  - Asserts ARIA attributes (`role="dialog"`, `aria-modal="true"`, `role="progressbar"`, `aria-busy="true"`).
  - Asserts focus trapping within active overlay and focus restoration on overlay hide.
  - Asserts `Escape` key handler triggers overlay dismissal when `closable !== false`.
### 3.2 End-to-End Browser Test Seams (Playwright)

- **Seam 5: `e2e/discover-loading-contract.spec.ts`**
  - Confirms single-phase overlay boot sequence on initial page load.
  - Confirms header navigation remains visible (`opacity: 1`) and clickable during scoped category switches.
  - Confirms hardcoded top-left loading text does not flash during cold start.
- **Seam 6: `e2e/search-consumer-races.spec.ts`**
  - Rapidly toggles search type filters during index initialization to verify final search results match active filter state.

---

## 4. Implementation Slices Plan

| Slice | Scope | Target Files | Related Tests |
| :--- | :--- | :--- | :--- |
| **Slice 1** | **Central Loader Architecture & API Unification**: Unify z-index tokens, update `aria-busy`, enforce `prefers-reduced-motion`, and register `window.FLV` alias | `assets/js/loading-system/fvl.js`<br>`assets/css/loading-system.css`<br>`assets/js/nav-core-modules/loading.js` | `vitest run tests/loading-contract.test.ts` |
| **Slice 2** | **Discover Boot Lifecycle & i18n Cleanup**: Consolidate boot loader into single phase; eliminate hardcoded `#nc-early-msg` text | `assets/js/nav-core-early.js`<br>`data/verse/discover/index.html`<br>`assets/js/nav-core-modules/init.js` | `npx playwright test e2e/discover-loading-contract.spec.ts` |
| **Slice 3** | **Scoped Action Loading & Nav Isolation**: Remove `body.fvl-nav-mode.nav-loading` on button click in favor of scoped content loading | `assets/js/nav-core-modules/router.js`<br>`assets/css/loading-system.css` | `npx playwright test e2e/discover-loading-contract.spec.ts` |
| **Slice 4** | **Search Race Conditions & Category Preservation**: Resolve closure bug in `_scheduleFuseUpgrade` and preserve `category` in `__pendingSearch` | `assets/js/search-system/search-modules/search-controller.js`<br>`assets/js/search-system/search.js` | `vitest run tests/search-races.test.ts`<br>`npx playwright test e2e/search-consumer-races.spec.ts` |
| **Slice 5** | **Popup Backdrop Pointer Isolation**: Apply `pointer-events: none` on inactive `.fp-overlay` containers | `assets/css/popup.css` | `vitest run tests/popup-backdrop.test.ts` |
| **Slice 6** | **Flexible Spinner & Standalone Subsystem**: Add standalone `fvl-spinner.js` subsystem and support `spinnerOnly`, `bare`, `chromeless`, `targetSlot` options across display modes | `assets/js/loading-system/fvl-spinner.js`<br>`assets/js/loading-system/fvl-modules/renderer.js`<br>`assets/js/loading-system/fvl-modules/engine.js`<br>`assets/css/loading-system.css` | `vitest run tests/loading-spinner-standalone.test.ts`<br>`vitest run tests/loading-spinner-only.test.ts` |

---

| **Slice 7** | **Discover Page & Search FVL Spinner Integration**: Wire FVL bare spinner and standalone `FVLSpinner` across Discover transition points A-D with safety guards | `assets/js/nav-core-modules/content.js`<br>`assets/js/nav-core-modules/loading.js`<br>`assets/js/nav-core-modules/router.js`<br>`assets/js/search-system/search-modules/rendering.js`<br>`assets/js/search-system/search-modules/search-controller.js` | `vitest run tests/discover-loading-integration.test.ts` |
| **Slice 8** | **FVL Polish Foundation & Scroll-Lock Engine**: Implement `ScrollLockManager` with scrollbar compensation, ref-counting, exact style restoration, centered spinner layout defaults, ARIA dialog/progressbar, focus trap/restore, Escape key listener, and reduced motion overrides | `assets/js/loading-system/fvl-modules/utils.js`<br>`assets/js/loading-system/fvl-modules/engine.js`<br>`assets/js/loading-system/fvl-modules/renderer.js`<br>`assets/js/loading-system/fvl-spinner.js`<br>`assets/css/loading-system.css` | `vitest run tests/loading-contract.test.ts` |

---

## 5. Assumptions & Risks

### Assumptions
1. Test execution environments (`vitest` with happy-dom and `playwright` headless Chromium) operate without external service dependencies.
2. Legacy callers using `LoadingService` or `window._navCore_contentLoadingManager` seamlessly route through FVL proxy layers.

### Risks & Mitigations
1. **IIFE Script Execution Timing**: Independent script loading may cause callers to invoke `FVL` before `fvl.js` has finished executing.  
   *Mitigation*: Pre-install lightweight `window.LoadingService` stubs inside `nav-core-early.js`.
2. **Popup Backdrop Selector Collision**: Modifying `.fp-overlay` CSS rules could impact active modal dialogs.  
   *Mitigation*: Target `pointer-events: none` strictly when `aria-hidden="true"` or when `.fp-overlay-active` class is absent.

---

## 6. Cross-References

- [`07-Loading-System.md`](./07-Loading-System.md) — Detailed FVL architecture, standalone subsystem, and module specifications
- [`02-Search-System.md`](./02-Search-System.md) — Two-tier search engine architecture
- [`03-Navigation-And-Content.md`](./03-Navigation-And-Content.md) — Nav-Core SPA routing and boot lifecycle
- [`docs/engineering/ai-docs-guide.md`](../docs/engineering/ai-docs-guide.md) — FanHoard AI-first documentation guide
