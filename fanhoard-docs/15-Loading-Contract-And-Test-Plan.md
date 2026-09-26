# FanHoard Loading System Contract & Test Plan

- **System Described**: Central Loading Framework (FVL / FLV), Discover Page Lifecycle, In-Flow Contextual Loading Contract, and Search System Consumer Integration
- **Entry File**: `assets/js/loading-system/fvl.js`
- **Dependencies**: `assets/css/loading-system.css`, `assets/css/loading.css`, `assets/js/nav-core-early.js`, `assets/js/nav-core-modules/router.js`, `assets/js/search-system/search-modules/search-service.js`
- **Verification**: `npm run test` (runs Vitest loading contract suite) | `npm run test:e2e` (runs Playwright E2E suite)

---

## 1. System Overview & Problem Analysis

The FanHoard loading ecosystem provides a unified loading indicator framework across initial application boot, SPA route transitions, category switching, and search index preparation.

During architectural analysis and Phase A/G refactoring, five primary loading system issues and doc-vs-code conflicts were identified and resolved:

1. **Multi-Overlay Boot Competition**: During initial load and refresh, competing overlay mechanisms (`nc-early-overlay` in `nav-core-early.js`, `fv-boot-loader` in `discover/index.html`, and FVL fullscreen mount/unmount in `init.js`) previously caused UI flickering. Resolved via atomic boot handshake in `init.js` and `nav-core-early.js`.
2. **Navigation Controls Obscured (Doc-vs-Code Resolution)**: Legacy documentation described category switches applying `body.fvl-nav-mode.nav-loading` with header opacity `0.4` and `pointer-events: none`. In the refactored architecture, `assets/js/nav-core-modules/router.js` and `assets/js/nav-core-modules/loading.js` render route loading in-flow inside `#content-loading` using `boundary` mode. Header navigation links remain `opacity: 1.0` and fully interactive (`pointer-events: auto`) without dimming or blocking backdrops.
3. **Unlocalized Early Loading Flash**: `nav-core-early.js` previously hardcoded an unlocalized early text element. Resolved by removing inline hardcoded strings and deferring messaging to `FvLang` and `FVL`.
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

### 2.2 In-Flow Contextual Boundary & Display Modes Contract

FVL supports 5 operational display modes. Contextual in-flow `boundary` mode is the default for route and content loading:

| Mode | Target Element | Position Strategy | Z-Index | Scroll Lock | Primary Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`boundary`** (Default) | Container selector (`#content-loading`) | In-Flow (`static` / `relative`) | `0` (Normal Flow) | **No** (`false`) | SPA route changes, feed loading, category switching |
| **`scoped`** | Container selector | Overlay (`absolute`) | `1600` | **No** (`false`) | Card/section isolated updates |
| **`inline`** | Button / inline element | In-Flow (`inline-flex`) | `0` | **No** (`false`) | In-place button spinners |
| **`topbar`** | Viewport top edge | Fixed (`fixed` top) | `17500` | **No** (`false`) | Silent background fetch operations |
| **`fullscreen`** | App root (`body`) | Overlay (`fixed` inset 0) | `17000` | Optional | Initial cold boot & fatal error exceptions |

#### API Call Contract Examples
```javascript
// Contextual in-flow boundary loading (default for route transitions)
const handle = FVL.show({ mode: 'boundary', target: '#content-loading', message: 'Loading items...' });
handle.hide();

// LoadingService proxy mapping
LoadingService.showInContent('Loading discover feed...');
LoadingService.hideFromContent();

// Scoped container overlay
FVL.scoped({ target: '#card-id', message: 'Updating...' });

// Inline button spinner
FVL.inline({ target: '#submit-btn' });
```

### 2.3 ARIA Accessibility & Reduced Motion Standards

- **Container ARIA Contract**: Every loader container must specify `role="status"` and `aria-live="polite"`. Inner SVG spinner elements must specify `aria-hidden="true"`.
- **Target Busy State**: When boundary, scoped, or inline loading starts, the target container receives `aria-busy="true"`. Upon completion or error, `aria-busy="false"` is restored.
- **Reduced Motion Support**: CSS animations in `loading-system.css` respect user preferences:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .fvl-spinner {
      animation: none !important;
      transition: none !important;
    }
  }
  ```

### 2.4 Cancellation, Concurrency & Race Prevention

- **Per-Boundary Reference Counting**: Concurrent async requests targeting the same DOM container increment `_boundaryRefs`. The loading boundary unmounts only when all active requests complete (`_boundaryRefs === 0`).
- **Monotonic Token Protection**: Each `FVL.show()` invocation generates a monotonic integer `requestId`. Stale completions from superseded async requests are safely dropped.
- **Route-Change Teardown**: Navigation events invoke `LoadingService._forceReset()`, which calls `FVL.clearAllBoundaryRefs()` to purge active boundary instances, cancel pending timers, and reset `aria-busy="false"`.

---

## 3. Test Seams & Test Suites

### 3.1 Unit & Contract Test Seams (Vitest)

- **Seam 1: `tests/loading-contract.test.ts`**
  - Asserts `FVL.show()` lifecycle, DOM injection, and DOM cleanup.
  - Asserts in-flow boundary mode mounts inside target container (`#content-loading`) in normal document flow.
  - Verifies zero fixed/absolute positioning or body scroll-locking for boundary loads.
  - Verifies per-boundary ref counting across concurrent requests.
  - Verifies stale request guards and route-change teardown via `_forceReset()` / `clearAllBoundaryRefs()`.
  - Verifies `aria-busy` attribute toggling on target containers.
  - Validates `window.FLV === window.FVL` alias equality and `fvl:ready` event emission.
  - Verifies backward compatibility proxies (`LoadingService.showInContent/hideFromContent`).
- **Seam 2: `tests/search-races.test.ts`**
  - Simulates async Fuse.js upgrades and verifies `State.selectedType` is respected over closure parameters.
  - Verifies `window.__pendingSearch` retains `category` state during queue processing.

### 3.2 End-to-End Browser Test Seams (Playwright)

- **Seam 3: `e2e/loading-contextual.spec.ts`**
  - Confirms contextual in-flow loader renders inside `#content-loading` in normal document flow.
  - Confirms document body is freely scrollable (`window.scrollY` moves freely) during loading.
  - Confirms contextual loading element moves naturally with document scroll.
  - Confirms header navigation links (`.fv-nav a`) remain interactive (`pointer-events: auto`, `isEnabled: true`) during content loading.
  - Confirms route transitions mid-load or post-load do not stick or leave orphaned overlays.
  - Confirms contextual loading renders correctly across Mobile (375x667) and Desktop (1280x720) viewports.

---

## 4. Implementation Slices Plan

| Slice | Scope | Target Files | Status | Related Tests |
| :--- | :--- | :--- | :--- | :--- |
| **Slice 1** | **Central Loader Architecture & API Unification**: Add `mode: 'boundary'` in `fvl.js`, per-boundary ref counts, stale request tokens, and `clearAllBoundaryRefs()` | `assets/js/loading-system/fvl.js`<br>`assets/css/loading-system.css`<br>`assets/css/loading.css` | **COMPLETED** | `npx vitest run tests/loading-contract.test.ts` |
| **Slice 2** | **Route & Content Consumer Migration**: Migrate `LoadingService.showInContent`, `router.js`, `init.js`, and `discover/index.html` to in-flow boundary loading | `assets/js/nav-core-modules/loading.js`<br>`assets/js/nav-core-modules/router.js`<br>`assets/js/nav-core-modules/init.js`<br>`data/verse/discover/index.html` | **COMPLETED** | `npx vitest run`<br>`npx playwright test e2e/loading-contextual.spec.ts` |
| **Slice 3** | **Contract & E2E Test Suite Expansion**: Comprehensive unit and Playwright E2E coverage for contextual boundary loading | `tests/loading-contract.test.ts`<br>`e2e/loading-contextual.spec.ts` | **COMPLETED** | `npm run test`<br>`npm run test:e2e` |
| **Slice 4** | **Documentation & Release Notes Update**: SSOT documentation alignment across `07-Loading-System.md`, `15-Loading-Contract-And-Test-Plan.md`, and release notes | `fanhoard-docs/07-Loading-System.md`<br>`fanhoard-docs/15-Loading-Contract-And-Test-Plan.md`<br>`CHANGES.md`<br>`PATCH_NOTES.md` | **COMPLETED** | `node scripts/validate-release.js --ci` |

---

## 5. Assumptions & Risks

### Assumptions
1. Target container elements (e.g. `#content-loading`) exist in the DOM before `LoadingService.showInContent()` is called.
2. Test execution environments (`vitest` with happy-dom and `playwright` headless Chromium) operate without external network dependencies.

### Risks & Mitigations
1. **Target Element Missing**: Calling boundary mode on a non-existent target DOM selector.  
   *Mitigation*: `fvl.js` falls back to mounting inside `#content-loading` or `body` if target selector is not found.
2. **CLS on Fast Connections**: Potential micro-flicker if loading completes in < 50ms.  
   *Mitigation*: `LoadingService` enforces `MIN_VISIBLE_MS = 300ms` minimum display time.

---

## 6. Cross-References

- [`07-Loading-System.md`](./07-Loading-System.md) — Central Loading System Specification
- [`docs/engineering/release-policy.md`](../docs/engineering/release-policy.md) — Release Policy & Update Pipeline
