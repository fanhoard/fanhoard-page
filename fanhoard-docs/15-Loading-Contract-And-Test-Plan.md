# FanHoard Loading System Contract & Test Plan

- **System Described**: Central Loading Framework (FVL / FLV v2), Discover Page In-Flow Boot Lifecycle, Typed Loading v2 Contract, and Test Suite Seams
- **Entry File**: `assets/js/loading-system/fvl.js` (VERSION = '2.0.0')
- **Dependencies**: `assets/css/loading-system.css`, `assets/css/loading.css`, `assets/js/nav-core-early.js`, `assets/js/nav-core-modules/router.js`, `assets/js/nav-core-modules/content.js`
- **Verification**: `npx vitest run tests/loading-contract.test.ts` (unit contract) | `npx playwright test --workers=1` (E2E suite)

---

## 1. System Overview & Problem Analysis

The FanHoard loading ecosystem provides a unified loading indicator framework across initial application boot, SPA route transitions, category switching, and search index preparation.

In Round 2, the system was upgraded to **Typed Loading v2**, resolving four critical issues identified during Round 1 feedback:

1. **Cover Overlay Perception**: Legacy boot overlays (`#fv-boot-loader` at body root) rendered as fixed viewport covers (`position: fixed; inset: 0; z-index: 500`), obscuring header navigation. Resolved by relocating `#fv-boot-loader` into an **SSG pre-placed in-flow slot** inside `#content-loading` (`data-fvl-type="page"`).
2. **Mobile URL-Bar Viewport Gaps**: Fixed overlays on mobile devices left visible gaps exposing moving background content when browser address bars toggled. Resolved by rendering contextual loaders (`page`, `content`, `component`) in normal document flow and styling global overlays with CSS dynamic viewport units (`100dvh` with `100vh` fallback).
3. **Post-Load Snap-to-Top Defect**: Unconditional `window.scrollTo(0, 0)` calls during content teardown caused jarring scroll resets after data fetches. Resolved by introducing `skipScroll: true` on same-route data refreshes and preserving `window.scrollY`.
4. **Header Navigation Obscured**: Header and navigation controls are unblocked (`opacity: 1.0`, `pointer-events: auto`) during loading, allowing instant interaction while content region fetches data.

---

## 2. Loading System Contracts & Handshake Specifications

### 2.1 Initial Boot Readiness & Lifecycle Rules

- **SSG In-Flow Boot Slot**: Initial static HTML boot loader (`#fv-boot-loader`) is pre-rendered inside `<div id="content-loading">` in `data/verse/discover/index.html` with class `fvl-root fvl-page` and attribute `data-fvl-type="page"`.
- **Unblocked Shell Contract**: The application header, branding, logo, search input, and navigation bar render directly in SSG HTML unblocked. Users can interact with header controls immediately on first paint.
- **Atomic Readiness Handshake**: Upon JavaScript initialization (`InitService.start()`), `FVL.readinessHandshake()` or `LoadingService.showInContent()` smoothly replaces or fades out `#fv-boot-loader` in-flow without layout jumps or screen flashing.
- **Global Aliases**: `fvl.js` registers frozen API references `window.FVL` and alias `window.FLV`.

### 2.2 Typed v2 Display Modes Contract

FVL v2 enforces 4 core typed loading categories alongside legacy mode mapping:

| Type | Target Element | Position Strategy | Z-Index | Min-Height Reservation | Scroll Lock | Primary Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`page`** | Container (`#content-loading`) | In-Flow (`static` / `relative`) | `0` | `calc(100dvh - 120px)` | **No** (`false`) | Full SPA route changes, primary view loading |
| **`content`** | Section container | In-Flow (`relative`) | `0` | `180px` | **No** (`false`) | Feed section updates, category switching |
| **`component`** | Element / Button | Inline (`inline-flex` / `static`) | `0` | Natural element size | **No** (`false`) | In-place button spinners, micro widgets |
| **`global`** | App root (`body`) | Viewport Overlay (`fixed` inset 0) | `17000` | `100dvh` (fallback `100vh`) | Optional | Cold app boot & fatal error exceptions |
| **`topbar`** | Viewport top edge | Fixed top bar (`fixed` top:0) | `17500` | `3px` height | **No** (`false`) | Background fetch indicator |

#### Legacy Mode Mapping Table
```javascript
'fullscreen'  ──>  'global'
'scoped'      ──>  'content'
'boundary'    ──>  'page'
'inline'      ──>  'component'
```

#### API Signature Examples
```javascript
// Typed API Shortcuts
FVL.page('#content-loading', { message: 'Loading page...' });
FVL.content('#comments-list', { message: 'Updating comments...' });
FVL.component('#submit-btn');
FVL.global('Critical system task...');

// LoadingService proxy mapping
LoadingService.showInContent('Loading discover feed...'); // Maps to type: 'page' inside #content-loading
LoadingService.hideFromContent();                        // Teardown page loader
```

### 2.3 ARIA Accessibility & Container Attributes

- **Target Busy State**: When `FVL.show({ type: 'page', target })` or `FVL.page(target)` is invoked, the target container receives `aria-busy="true"`. Upon teardown (`FVL.hide()`), `aria-busy="false"` is restored.
- **Type Attribute Contract**: Root loader element receives `data-fvl-type` corresponding to its category (`page`, `content`, `component`, `global`, `topbar`).
- **Accessibility Roles**: Loader root specifies `role="status"` and `aria-live="polite"`. Inner SVG elements specify `aria-hidden="true"`.

### 2.4 Scroll Preservation & Mobile Viewport Contract

- **Scroll Preservation Rule**:
  - Same-route data refreshes pass `skipScroll: true` to `content.js` `clearContent()`, preserving `window.scrollY`.
  - Contextual loader teardown (`_cleanup` for `page`, `content`, `component`) NEVER invokes `window.scrollTo`.
  - Cross-route navigation explicitly invokes `window.scrollTo({ top: 0, behavior: 'smooth' })`.
- **Dynamic Mobile Viewport Contract**:
  - Contextual in-flow loaders sit in normal document flow, eliminating address bar URL gaps on mobile.
  - Global overlays use CSS dynamic viewport units (`100dvh` with `100vh` fallback).

### 2.5 Cancellation, Concurrency & Ref Counting

- **Per-Boundary Reference Counting**: Concurrent requests targeting the same DOM container increment `_boundaryRefs[targetSelector]`. The loader unmounts only when all active requests settle (`_boundaryRefs === 0`).
- **Monotonic Token Protection**: Each `FVL.show()` generates a monotonic integer `requestId`. Stale completions from superseded requests are safely dropped.
- **Route-Change Teardown**: Navigation events invoke `LoadingService._forceReset()`, which calls `FVL.clearAllBoundaryRefs()` to purge active boundary instances and reset `aria-busy="false"`.

---

## 3. Test Seams & Test Suites

### 3.1 Unit & Contract Test Seams (Vitest)

- **Seam: `tests/loading-contract.test.ts`**
  - Verifies `FVL.page`, `FVL.content`, `FVL.component`, and `FVL.global` typed API shortcuts export correctly.
  - Asserts `type: 'page'` mounts in-flow inside `#content-loading` with `data-fvl-type="page"`, `z-index: 0`, and zero `position: fixed`/`absolute`.
  - Asserts legacy modes (`fullscreen`, `scoped`, `boundary`, `inline`) normalize to typed categories.
  - Asserts target `aria-busy="true"` on show and `aria-busy="false"` on hide.
  - Verifies contextual loader teardown does NOT invoke `window.scrollTo` (scroll position preserved).
  - Verifies per-boundary ref counting and route-change cleanup (`FVL.clearAllBoundaryRefs()`).

### 3.2 End-to-End Browser Test Seams (Playwright)

- **Seam: `e2e/loading-contextual.spec.ts`**
  - Confirms SSG in-flow boot slot renders inside `#content-loading` on initial paint.
  - Confirms page scrolls freely (`window.scrollY` moves) during contextual loading.
  - Confirms header navigation links (`.fv-nav a`) remain 100% interactive during content loading.
  - Confirms mobile URL bar viewport resize (667px -> 600px) creates no fixed gaps or background scroll leaks.
  - Confirms scroll position is preserved across same-route load completions (no snap-to-top).
  - Confirms route transitions mid-load do not leave orphaned loaders.

---

## 4. Implementation Slices Plan

| Slice | Scope | Target Files | Status | Related Tests |
| :--- | :--- | :--- | :--- | :--- |
| **Slice 1** | **Typed v2 Core & CSS Engine**: Implement explicit typed API (`page`, `content`, `component`, `global`), `data-fvl-type` attributes, 100dvh CSS rules, and scroll preservation | `assets/js/loading-system/fvl.js`<br>`assets/css/loading-system.css`<br>`assets/css/loading.css` | **COMPLETED** | `npx vitest run tests/loading-contract.test.ts` |
| **Slice 2** | **SSG In-Flow Boot Slot & Consumer Migration**: Move `#fv-boot-loader` inside `#content-loading` in SSG HTML, update route loaders, preserve scroll in `content.js` | `data/verse/discover/index.html`<br>`assets/js/nav-core-modules/loading.js`<br>`assets/js/nav-core-modules/router.js`<br>`assets/js/nav-core-modules/content.js`<br>`assets/js/nav-core-early.js` | **COMPLETED** | `npx vitest run`<br>`npx playwright test --workers=1` |
| **Slice 3** | **Unit & E2E Test Suite Expansion**: Assert typed API, in-flow boot, mobile URL-bar resilience, and scroll position preservation | `tests/loading-contract.test.ts`<br>`e2e/loading-contextual.spec.ts` | **COMPLETED** | `npm run test`<br>`npm run test:e2e` |
| **Slice 4** | **Documentation & Release Notes Update**: SSOT documentation alignment across `07-Loading-System.md`, `15-Loading-Contract-And-Test-Plan.md`, and release notes | `fanhoard-docs/07-Loading-System.md`<br>`fanhoard-docs/15-Loading-Contract-And-Test-Plan.md`<br>`CHANGES.md`<br>`PATCH_NOTES.md` | **COMPLETED** | `node scripts/validate-release.js --ci` |
