# FanHoard Loading System Contract & Test Plan

- **System Described**: Central Loading Framework (FVL / FLV), Discover Page Lifecycle, and Search System Consumer Integration
- **Entry File**: `assets/js/loading-system/fvl.js`
- **Dependencies**: `assets/css/loading-system.css`, `assets/js/nav-core-early.js`, `assets/js/nav-core-modules/router.js`, `assets/js/search-system/search-modules/search-service.js`
- **Verification**: `npm run test` (runs Vitest loading suite) | `npx playwright test`

---

## 1. System Overview & Problem Analysis

The FanHoard loading ecosystem provides a unified loading indicator framework across initial application boot, SPA route transitions, category switching, and search index preparation.

An analysis of execution logs and browser harness runs identified five primary architectural issues in legacy loading behavior:

1. **Multi-Overlay Boot Competition**: During initial load and refresh, three concurrent overlay mechanisms (`nc-early-overlay` in `nav-core-early.js`, `fv-boot-loader` in `discover/index.html`, and FVL fullscreen mount/unmount in `init.js`) competed for screen dominance, producing visible UI flickering.
2. **Navigation Controls Obscured**: Category switches (such as clicking "Symbols") applied `body.fvl-nav-mode.nav-loading`, setting header navigation opacity to `0.4` and `pointer-events: none` while dimming the whole page instead of targeting the scoped content container (`#content-loading`).
3. **Unlocalized Early Loading Flash**: `nav-core-early.js` hardcoded an unlocalized `<div id="nc-early-msg">Loading…</div>` element at `top:0, left:0, z-index:99999` prior to locale initialization by `FvLang` or `FVL`.
4. **Search Race Conditions**:
   - `_scheduleFuseUpgrade(q, type)` in `search-service.js` locked `type` in a closure during index construction, causing `checkFuse()` to execute with stale type filters if the user switched categories mid-build.
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

### 2.3 ARIA Accessibility & Reduced Motion Standards

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

### 2.4 Cancellation & Race Prevention

- **In-flight Request Abort**: Navigating between categories or executing new search queries must abort active `Fetch` requests via `AbortController.abort()` and destroy active FVL instances bound to that request.
- **Dynamic Filter Resolution**: `checkFuse()` in `search-service.js` reads current filter state directly from `State.selectedType` at execution time rather than referencing stale closure variables.
- **Pending Search Envelope Contract**: `window.__pendingSearch` captures full query context (`{ q: string, type: string, category: string }`). Queue draining dispatches through `doSearch(null, true)` once to prevent duplicate browser history entries.

### 2.5 Error Boundary & Recovery Contract

- **Network / Timeout Failure State**: If asynchronous fetch fails, FVL clears active indicators immediately and renders an inline error boundary inside the content container with `aria-live="assertive"` and a localized Retry action button.
- **Backdrop Pointer-Events Isolation**: Non-active or hidden modal overlays (`aria-hidden="true"`) specify `pointer-events: none` to prevent blocking click events on underlying UI controls.

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

### 3.2 End-to-End Browser Test Seams (Playwright)

- **Seam 3: `e2e/discover-loading-contract.spec.ts`**
  - Confirms single-phase overlay boot sequence on initial page load.
  - Confirms header navigation remains visible (`opacity: 1`) and clickable during scoped category switches.
  - Confirms hardcoded top-left loading text does not flash during cold start.
- **Seam 4: `e2e/search-consumer-races.spec.ts`**
  - Rapidly toggles search type filters during index initialization to verify final search results match active filter state.

---

## 4. Implementation Slices Plan

| Slice | Scope | Target Files | Related Tests |
| :--- | :--- | :--- | :--- |
| **Slice 1** | **Central Loader Architecture & API Unification**: Unify z-index tokens, update `aria-busy`, enforce `prefers-reduced-motion`, and register `window.FLV` alias | `assets/js/loading-system/fvl.js`<br>`assets/css/loading-system.css`<br>`assets/js/nav-core-modules/loading.js` | `vitest run tests/loading-contract.test.ts` |
| **Slice 2** | **Discover Boot Lifecycle & i18n Cleanup**: Consolidate boot loader into single phase; eliminate hardcoded `#nc-early-msg` text | `assets/js/nav-core-early.js`<br>`data/verse/discover/index.html`<br>`assets/js/nav-core-modules/init.js` | `npx playwright test e2e/discover-loading-contract.spec.ts` |
| **Slice 3** | **Scoped Action Loading & Nav Isolation**: Remove `body.fvl-nav-mode.nav-loading` on button click in favor of scoped content loading | `assets/js/nav-core-modules/router.js`<br>`assets/css/loading-system.css` | `npx playwright test e2e/discover-loading-contract.spec.ts` |
| **Slice 4** | **Search Race Conditions & Category Preservation**: Resolve closure bug in `_scheduleFuseUpgrade` and preserve `category` in `__pendingSearch` | `assets/js/search-system/search-modules/search-service.js`<br>`assets/js/search-system/search.js` | `vitest run tests/search-races.test.ts`<br>`npx playwright test e2e/search-consumer-races.spec.ts` |
| **Slice 5** | **Popup Backdrop Pointer Isolation**: Apply `pointer-events: none` on inactive `.fp-overlay` containers | `assets/css/popup.css` | `vitest run tests/popup-backdrop.test.ts` |

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

- [`07-Loading-System.md`](./07-Loading-System.md) — Detailed FVL architecture and module specifications
- [`02-Search-System.md`](./02-Search-System.md) — Two-tier search engine architecture
- [`03-Navigation-And-Content.md`](./03-Navigation-And-Content.md) — Nav-Core SPA routing and boot lifecycle
- [`docs/engineering/ai-docs-guide.md`](../docs/engineering/ai-docs-guide.md) — FanHoard AI-first documentation guide
