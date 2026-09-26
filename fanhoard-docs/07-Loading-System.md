# 07 — Loading System (FVL — FanHoardVerse Loader)

- **System Described**: FVL (FanHoardVerse Loader) In-Flow Contextual Loading Architecture, Boundary Modes, Lifecycle, and API
- **Entry File**: `assets/js/loading-system/fvl.js`
- **Dependencies**: `assets/css/loading-system.css`, `assets/css/loading.css`, `assets/js/nav-core-modules/loading.js`
- **Verification**: `npm run test` (runs Vitest loading contract suite) | `npm run test:e2e` (runs Playwright contextual E2E suite)

---

## Table of Contents

1. [System Overview & Architecture Principles](#1-system-overview--architecture-principles)
2. [File and Directory Structure](#2-file-and-directory-structure)
3. [Display Modes & Boundary Hierarchy](#3-display-modes--boundary-hierarchy)
4. [Rendering, Scroll Behavior & Layout Reservation](#4-rendering-scroll-behavior--layout-reservation)
5. [Visual Specification & Timing Guarantees](#5-visual-specification--timing-guarantees)
6. [Public API & Usage Examples](#6-public-api--usage-examples)
7. [Concurrency, Lifecycle & Race Prevention](#7-concurrency-lifecycle--race-prevention)
8. [Migration Notes & Legacy Compatibility](#8-migration-notes--legacy-compatibility)
9. [Prohibited Anti-Patterns](#9-prohibited-anti-patterns)
10. [Doc-vs-Code Conflict Resolutions](#10-doc-vs-code-conflict-resolutions)
11. [Cross-References](#11-cross-references)

---

## 1. System Overview & Architecture Principles

FVL (FanHoardVerse Loader) is FanHoard's central loading system (`assets/js/loading-system/fvl.js`). The system implements a **contextual in-flow loading architecture** that renders loading indicators inside target content containers in normal document flow rather than obscuring the entire viewport with global fixed overlays.

```
+-----------------------------------------------------------------------+
|  HEADER / NAVIGATION BAR (Always visible & interactive)               |
+-----------------------------------------------------------------------+
|  MAIN PAGE CONTAINER (<main> / #content-container)                    |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  IN-FLOW LOADING BOUNDARY (#content-loading)                    |  |
|  |  - Position: static/relative (In Normal Document Flow)         |  |
|  |  - Z-Index: 0 (No Viewport Stacking or Backdrop Overlay)        |  |
|  |  - Scroll: lockScroll = false (Page scrolls freely with document)|  |
|  |  - CLS Protection: min-height: 180px layout reservation        |  |
|  |                                                                 |  |
|  |               ( ( SVG Ring Spinner ) )                          |  |
|  |                   Loading content...                            |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  Adjacent content and controls remain visible and scrollable          |
+-----------------------------------------------------------------------+
|  FOOTER (Reachable while loading)                                     |
+-----------------------------------------------------------------------+
```

### Core Architecture Principles

1. **Boundary DOM Ownership**: The loading indicator mounts directly inside the target boundary container (e.g. `#content-loading`) in normal DOM flow rather than at the application root (`body`).
2. **Decoupled Viewport & Free Scrolling**: Contextual loading does not use `position: fixed`, backdrop overlays, or high `z-index` stacking layers. Page scrolling is never locked (`lockScroll: false`), allowing users to scroll freely while content loads.
3. **Cumulative Layout Shift (CLS) Prevention**: Target containers maintain CSS layout reservation (`min-height: var(--fvl-boundary-min-height, 180px)`), keeping CLS < 0.1 during transitions.
4. **Visual Language Preservation**: In-flow boundaries retain FanHoard's signature SVG ring spinner (static track + animated arc) and theme-aware styling.

---

## 2. File and Directory Structure

```
assets/
├── js/
│   └── loading-system/
│       └── fvl.js                          ← Entry + internal modules (single-file hybrid, VERSION = '1.0.0')
├── css/
│   ├── loading-system.css                  ← Auto-injected stylesheet (.fvl-boundary & spinner keyframes)
│   └── loading.css                         ← Content container layout & min-height reservation
└── js/nav-core-modules/
    └── loading.js                          ← LoadingService proxy mapping route requests to boundary mode

tests/
└── loading-contract.test.ts                ← Vitest unit & contract test suite for boundary loading

e2e/
└── loading-contextual.spec.ts              ← Playwright E2E browser test suite for in-flow behavior
```

---

## 3. Display Modes & Boundary Hierarchy

FVL supports 5 operational display modes. Contextual in-flow `boundary` mode is the primary default for route transitions and content fetching.

### 3.1 Display Modes Overview

| Mode | Target Element | Position Strategy | Z-Index | Scroll Lock | Primary Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`boundary`** (Default) | Container selector (`#content-loading`) | In-Flow (`static` / `relative`) | `0` (Normal Flow) | **No** (`false`) | SPA route changes, feed loading, category switching |
| **`scoped`** | Target card/section | Overlay (`absolute`) | `1600` | **No** (`false`) | Isolated card/widget updates |
| **`inline`** | Button or inline element | In-Flow (`inline-flex`) | `0` | **No** (`false`) | Button spinner states |
| **`topbar`** | Top viewport edge | Fixed (`fixed` top) | `17500` | **No** (`false`) | Background fetch indicator |
| **`fullscreen`** | App root (`body`) | Overlay (`fixed` inset 0) | `17000` | Optional (`true` / `false`) | Cold boot & fatal error boundaries |

### 3.2 Four Boundary Hierarchy Levels

1. **Page-Level Boundary**: Encloses main view containers (`<main>` or `#content-container`). Used during full SPA route transitions to render a page-level loading state inside the content slot.
2. **Content-Level Boundary**: Wraps discrete functional sections (e.g. `#content-loading`, feed cards, search results). Allows adjacent UI elements (header navigation, filter pills) to remain fully interactive.
3. **Component-Level Boundary**: Micro-boundaries attached to isolated UI components (e.g., button handles, autocomplete dropdowns, individual card widgets).
4. **Nested Boundaries**: Hierarchical structure where component/content boundaries operate inside parent page boundaries.
   - **Nearest Boundary Interception Rule**: Async requests bubble up to the nearest registered target container. Only that boundary renders placeholder UI.
   - **Anti-Stacking Rule**: Active child boundaries do NOT trigger parent or global viewport overlays. Parent containers retain resolved interactive states.

### 3.3 Strict Exceptions for Global Fullscreen Overlays

Global viewport blocking overlays (`mode: 'fullscreen'` with `position: fixed` and `z-index: 17000`) are strictly restricted to three exceptional system states:

1. **Initial Application Boot**: Initial static HTML boot loader (`#fv-boot-loader` in `data/verse/discover/index.html`) prior to JS module initialization.
2. **Unrecoverable Fatal Error**: Application crash or fatal boot failure rendering `Utils.showErrorFullscreen()`.
3. **Destructive Modal Workflow**: Critical confirmation dialogs where user interaction with background UI risks data corruption.

---

## 4. Rendering, Scroll Behavior & Layout Reservation

### 4.1 In-Flow Rendering Specification

When `FVL.show({ mode: 'boundary', target: '#content-loading' })` is invoked, `fvl.js` builds and appends `.fvl-boundary` inside the target container:

```html
<!-- Mounted inside #content-loading in normal document flow -->
<div class="fvl-boundary fvl-theme-light" role="status" aria-live="polite">
  <div class="fvl-boundary-inner">
    <div class="fvl-spinner fvl-spinner-md" aria-hidden="true">
      <svg viewBox="0 0 52 52">
        <circle class="fvl-track" cx="26" cy="26" r="22"/>
        <circle class="fvl-arc" cx="26" cy="26" r="22"/>
      </svg>
    </div>
    <div class="fvl-message">Loading content...</div>
  </div>
</div>
```

### 4.2 Scroll Behavior

- `lockScroll` defaults to `false` for boundary mode.
- Document body styles (`position: fixed`, `overflow: hidden`) are NEVER applied during contextual loads.
- The loading boundary moves naturally with document scrolling.
- Header navigation and page footer remain reachable at all times.

### 4.3 CLS Prevention & Layout Reservation

To eliminate Cumulative Layout Shift (CLS) when content finishes loading, target containers specify CSS min-height reservation:

```css
/* File: assets/css/loading.css:12 */
#content-loading {
  min-height: var(--fvl-boundary-min-height, 180px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
```

---

## 5. Visual Specification & Timing Guarantees

### 5.1 SVG Ring Spinner

Boundary loaders utilize FanHoard's signature SVG ring spinner with theme-aware tokens:

```css
/* File: assets/css/loading-system.css:42 */
.fvl-track {
  stroke: var(--fvl-spinner-track, rgba(0, 0, 0, 0.1));
}
.fvl-arc {
  stroke: var(--fvl-spinner-arc, var(--fv-color-primary, #6366f1));
  stroke-dasharray: 88 132;
  animation: _fvl_spin 0.8s linear infinite;
}
```

### 5.2 Timing Guarantees & Flicker Prevention

- **Minimum Display Duration (`MIN_VISIBLE_MS = 300ms`)**: Managed by `LoadingService` in `assets/js/nav-core-modules/loading.js`. Active loading indicators remain visible for at least 300ms to eliminate visual flickering on high-speed network connections.
- **Enter Transition (`140ms`)**: `.fvl-entering` applies double `requestAnimationFrame` opacity fade-in.
- **Leave Transition (`180ms`)**: `.fvl-leaving` applies `180ms` opacity fade-out before DOM unmounting.

---

## 6. Public API & Usage Examples

### 6.1 `FVL.show(opts)` Boundary Form

```javascript
// File: assets/js/loading-system/fvl.js:840
const handle = FVL.show({
  mode: 'boundary',
  target: '#content-loading',
  message: 'Loading discover feed...',
  theme: 'auto'
});

// Hide loader when async operation completes
handle.hide();
```

### 6.2 `FVL.boundary(target, opts)` Shortcut

```javascript
// File: assets/js/loading-system/fvl.js:1395
const handle = FVL.boundary('#content-loading', {
  message: 'Updating collection...'
});
```

### 6.3 `LoadingService` Integration

```javascript
// File: assets/js/nav-core-modules/loading.js:184
// Invoked by router.js during SPA route transitions
LoadingService.showInContent('Loading items...');

// Invoked when view rendering completes
LoadingService.hideFromContent();
```

---

## 7. Concurrency, Lifecycle & Race Prevention

### 7.1 Per-Boundary Reference Counting

To handle concurrent asynchronous requests targeting the same DOM container, `fvl.js` maintains a boundary reference count map (`_boundaryRefs`):

```javascript
// File: assets/js/loading-system/fvl.js:382
// Increment active ref count on show
var currentCount = (_boundaryRefs.get(targetEl) || 0) + 1;
_boundaryRefs.set(targetEl, currentCount);

// Decrement on hide; unmount DOM only when count reaches 0
var remaining = (_boundaryRefs.get(targetEl) || 1) - 1;
if (remaining <= 0) {
  _boundaryRefs.delete(targetEl);
  _cleanup(inst);
} else {
  _boundaryRefs.set(targetEl, remaining);
}
```

### 7.2 Monotonic Request Tokens (Stale-Request Guards)

Every `FVL.show()` invocation generates a monotonic integer request token (`requestId`). If a superseded async request attempts to complete after a newer request has started on the same boundary, the stale completion is safely ignored.

### 7.3 Route-Change Cleanup (`clearAllBoundaryRefs`)

During SPA route transitions, `LoadingService._forceReset()` calls `FVL.clearAllBoundaryRefs()` to purge active timers, clear reference counters, and restore target `aria-busy="false"` states:

```javascript
// File: assets/js/loading-system/fvl.js:442
function clearAllBoundaryRefs() {
  _boundaryRefs.clear();
  _instances.forEach(function(inst) {
    if (inst.mode === 'boundary') {
      _cleanup(inst);
    }
  });
}
```

---

## 8. Migration Notes & Legacy Compatibility

### 8.1 100% Backward Compatibility

All legacy FVL and `LoadingService` API signatures remain fully supported:

- `FVL.show('Message')` (defaults to boundary mode when target exists, or fullscreen fallback)
- `FVL.fullscreen()`, `FVL.scoped()`, `FVL.inline()`, `FVL.topbar()`
- `LoadingService.show()`, `LoadingService.hide()`, `LoadingService.showInContent()`, `LoadingService.hideFromContent()`
- `window.showInstantLoadingOverlay()` / `window.removeInstantLoadingOverlay()`

### 8.2 Developer Migration Checklist

When updating legacy code to use in-flow boundary loading:

1. Ensure the target container element (e.g. `#content-loading`) exists in the target view HTML.
2. Verify target CSS specifies layout reservation (`min-height: 180px`).
3. Replace `FVL.show({ mode: 'fullscreen' })` with `LoadingService.showInContent()` or `FVL.boundary('#content-loading')`.
4. Do NOT set `lockScroll: true` on content/route loaders.

---

## 9. Prohibited Anti-Patterns

| Prohibited Practice | System Impact | Correct Alternative |
| :--- | :--- | :--- |
| **Using `fullscreen` overlay for routine SPA routes** | Obscures navigation bar and locks user scroll | Use `LoadingService.showInContent()` or `FVL.boundary('#content-loading')` |
| **Applying `position: fixed` to boundary targets** | Causes loading UI to break out of document flow | Keep boundary target in normal DOM flow (`position: static` / `relative`) |
| **Setting `lockScroll: true` on contextual loaders** | Prevents users from scrolling while content loads | Keep `lockScroll: false` (default for boundary mode) |
| **Omitting `min-height` on boundary containers** | Causes Cumulative Layout Shift (CLS > 0.1) when loader unmounts | Define `min-height: 180px` or `var(--fvl-boundary-min-height)` on target |
| **Bypassing `_forceReset()` during route changes** | Leaves orphaned loading DOM nodes or stale `aria-busy` attributes | Call `LoadingService._forceReset()` on navigation events |

---

## 10. Doc-vs-Code Conflict Resolutions

1. **Version Header Mismatch Resolution**: `assets/css/loading-system.css` header states `v1.0.0` to match `assets/js/loading-system/fvl.js` (`VERSION = '1.0.0'`).
2. **Navigation Isolation Resolution**: Legacy `body.fvl-nav-mode.nav-loading` dimming rules have been completely removed. `assets/js/nav-core-modules/router.js` ensures header navigation links remain `opacity: 1.0` and fully interactive (`pointer-events: auto`) during content loading.

---

## 11. Cross-References

- [`docs/engineering/release-policy.md`](../docs/engineering/release-policy.md) — FanHoard Release & Update Policy
- [`13-Documentation-Standard.md`](./13-Documentation-Standard.md) — Documentation formatting rules
- [`15-Loading-Contract-And-Test-Plan.md`](./15-Loading-Contract-And-Test-Plan.md) — Loading Contract & Test Plan
