# 07 — Loading System (FVL — FanHoardVerse Loader v2)

- **System Described**: FVL (FanHoardVerse Loader) Typed v2 Architecture, In-Flow Boot Loading, Display Types, Scroll Preservation, and Public API
- **Entry File**: `assets/js/loading-system/fvl.js` (VERSION = '2.0.0')
- **Dependencies**: `assets/css/loading-system.css`, `assets/css/loading.css`, `assets/js/nav-core-modules/loading.js`, `data/verse/discover/index.html`
- **Verification**: `npx vitest run tests/loading-contract.test.ts` (unit contract) | `npx playwright test --workers=1` (E2E suite)

---

## Table of Contents

1. [System Overview & Architecture Principles](#1-system-overview--architecture-principles)
2. [File and Directory Structure](#2-file-and-directory-structure)
3. [Typed v2 Display Modes & Boundary Hierarchy](#3-typed-v2-display-modes--boundary-hierarchy)
4. [In-Flow Boot Loading Design](#4-in-flow-boot-loading-design)
5. [Rendering, Scroll Semantics & Mobile Viewport Behavior](#5-rendering-scroll-semantics--mobile-viewport-behavior)
6. [Visual Specification & Timing Guarantees](#6-visual-specification--timing-guarantees)
7. [Public API & Developer Usage Examples](#7-public-api--developer-usage-examples)
8. [Concurrency, Ref Counting & Race Prevention](#8-concurrency-ref-counting--race-prevention)
9. [Migration Notes & Legacy Compatibility](#9-migration-notes--legacy-compatibility)
10. [Prohibited Anti-Patterns & Round-1 Feedback Case Study](#10-prohibited-anti-patterns--round-1-feedback-case-study)
11. [Doc-vs-Code Conflict Resolutions](#11-doc-vs-code-conflict-resolutions)
12. [Cross-References](#12-cross-references)

---

## 1. System Overview & Architecture Principles

FVL (FanHoardVerse Loader) v2 is FanHoard's central loading system (`assets/js/loading-system/fvl.js`). Upgraded in Round 2 from legacy overlay modes to a **typed in-flow loading architecture**, FVL v2 allows callers to explicitly declare the loading scope (`type: 'page' | 'content' | 'component' | 'global'`).

Instead of obscuring the screen with viewport cover overlays, FVL v2 renders loading indicators in normal document flow directly inside the content boundary. Application headers, navigation menus, and category controls remain unblocked and instantly interactive.

```
+-----------------------------------------------------------------------+
|  HEADER / NAVIGATION BAR (Unblocked, always 100% interactive)          |
+-----------------------------------------------------------------------+
|  MAIN PAGE CONTAINER (<main> / #content-container)                    |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |  TYPED PAGE-LEVEL IN-FLOW SLOT (#content-loading)              |  |
|  |  - data-fvl-type="page"                                         |  |
|  |  - Position: static/relative (In Normal Document Flow)         |  |
|  |  - Z-Index: 0 (No Viewport Overlay or Stacking)                  |  |
|  |  - Scroll: lockScroll = false (Page scrolls freely)             |  |
|  |  - Min-Height: calc(100dvh - 120px) (CLS Protection < 0.1)     |  |
|  |                                                                 |  |
|  |               ( ( SVG Ring Spinner in Brand Teal ) )            |  |
|  |                   Loading content...                            |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
|  Adjacent content and controls remain visible and scrollable          |
+-----------------------------------------------------------------------+
|  FOOTER (Reachable while loading)                                     |
+-----------------------------------------------------------------------+
```

### Core Architecture Principles

1. **Explicit Typed Scope**: Callers declare intent explicitly (`FVL.page()`, `FVL.content()`, `FVL.component()`, `FVL.global()`). Global viewport overlays are strictly exceptional and never a default fallback.
2. **In-Flow DOM Mounting**: Page, content, and component loaders mount directly inside target containers in normal document flow (`position: static` or `relative`, `z-index: 0`).
3. **Unblocked Application Shell**: System chrome (`<header>`, `<nav>`, category controls) renders in unblocked SSG HTML and remains clickable while data fetches execute inside the content slot.
4. **Scroll Preservation Rule**: Same-route data refreshes preserve the user's vertical scroll position (`window.scrollY`). Contextual loading teardown NEVER snaps the page scroll to top. Cross-route navigation explicitly resets scroll to top.
5. **Dynamic Mobile Viewport Compliance**: Contextual loaders sit in document flow, eliminating viewport gaps when browser URL bars hide or show on mobile devices. Exceptional `global` overlays use dynamic viewport units (`100dvh` with `100vh` fallback).

---

## 2. File and Directory Structure

```
assets/
├── js/
│   └── loading-system/
│       └── fvl.js                          ← FVL v2 central loader engine (VERSION = '2.0.0')
├── css/
│   ├── loading-system.css                  ← Typed styles (.fvl-page, .fvl-content, .fvl-component, .fvl-global)
│   └── loading.css                         ← Container layout reservation rules (min-height calc(100dvh - 120px))
└── js/nav-core-modules/
    ├── loading.js                          ← LoadingService proxy mapping requests to typed v2 API
    ├── router.js                           ← SPA router triggering type: 'page' on route transitions
    ├── content.js                          ← Content renderer preserving scrollY via skipScroll
    └── utils.js                            ← Fatal error overlay explicitly typed as 'global'

data/verse/discover/
└── index.html                              ← SSG pre-placed in-flow boot loading slot inside #content-loading

tests/
└── loading-contract.test.ts                ← Vitest unit & contract suite for typed v2 API and scroll preservation

e2e/
└── loading-contextual.spec.ts              ← Playwright E2E browser suite for mobile viewport & scroll behavior
```

---

## 3. Typed v2 Display Modes & Boundary Hierarchy

FVL v2 introduces 4 core typed loading categories alongside legacy progress support.

### 3.1 Typed Display Modes Overview

| Type | Target Element | Position Strategy | Z-Index | Min-Height Reservation | Scroll Lock | Primary Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`page`** | Container (`#content-loading`) | In-Flow (`static` / `relative`) | `0` | `calc(100dvh - 120px)` | **No** (`false`) | Full SPA route changes, primary view loading |
| **`content`** | Section container | In-Flow (`relative`) | `0` | `180px` | **No** (`false`) | Feed section updates, category switching |
| **`component`** | Element / Button | Inline (`inline-flex` / `static`) | `0` | Natural element size | **No** (`false`) | In-place button spinners, micro widgets |
| **`global`** | App root (`body`) | Viewport Overlay (`fixed` inset 0) | `17000` | `100dvh` (fallback `100vh`) | Optional (`true`/`false`) | Cold app boot & fatal error boundaries |
| **`topbar`** | Viewport top edge | Fixed top bar (`fixed` top:0) | `17500` | `3px` height | **No** (`false`) | Background fetch indicator |

### 3.2 Legacy Mode Mapping

For complete backward compatibility, legacy v1.0 mode options automatically normalize to typed v2 categories in `fvl.js` (`_normalizeOptions`):

```javascript
// Legacy mode string -> Typed v2 category mapping
'fullscreen'  ──>  'global'
'scoped'      ──>  'content'
'boundary'    ──>  'page'
'inline'      ──>  'component'
```

### 3.3 Four Boundary Hierarchy Levels

1. **Page-Level Boundary (`type: 'page'`)**: Replaces the main route content slot (`#content-loading`) in-flow. The header navigation and page footer remain interactive.
2. **Content-Level Boundary (`type: 'content'`)**: Operates inside discrete functional sub-sections (e.g. comment lists, search result panels). Adjacent content sections remain interactive.
3. **Component-Level Boundary (`type: 'component'`)**: Micro-boundaries attached directly to isolated UI controls (e.g. submit buttons, autocomplete inputs).
4. **Nested Boundaries**: When child component loaders activate inside an active page or content boundary, each boundary manages its own ref count independently. Child loaders never escalate to stack parent or global overlays.

### 3.4 Strict Exceptions for Global Overlays (`type: 'global'`)

Global blocking viewport overlays (`type: 'global'`) are restricted to three exceptional system states:

1. **Cold Application Bootstrap**: Fallback static HTML overlay before JS initialization.
2. **Fatal Application Error**: Unrecoverable system crash or boot failure (`Utils.showErrorFullscreen()`).
3. **Destructive Workflows**: Critical confirmation dialogs where interacting with background controls risks state corruption.

---

## 4. In-Flow Boot Loading Design

In Round 2, initial application boot loading was redesigned from a global viewport overlay (`position: fixed; inset: 0; z-index: 500`) into an **SSG pre-placed in-flow slot**.

### 4.1 SSG HTML Structure

In `data/verse/discover/index.html`, `#fv-boot-loader` is pre-rendered inside `<div id="content-loading">`:

```html
<!-- Inside <div id="content-loading"> in SSG pre-rendered HTML -->
<div id="fv-boot-loader" class="fvl-root fvl-page" data-fvl-type="page" role="status" aria-live="polite">
  <div class="fvl-boundary-inner">
    <div class="fvl-spinner fvl-spinner-md" aria-hidden="true">
      <svg viewBox="0 0 52 52">
        <circle class="fvl-track" cx="26" cy="26" r="22"/>
        <circle class="fvl-arc" cx="26" cy="26" r="22"/>
      </svg>
    </div>
    <div class="fvl-message">Loading FanHoard...</div>
  </div>
</div>
```

### 4.2 Application Shell Unblocked

Because `#fv-boot-loader` sits inside `#content-loading` in document flow:
- Header branding, logo, search input, and navigation tabs render unblocked on first paint.
- Users can click navigation items or type in search immediately while initial feed data fetches in the background.

### 4.3 Handshake & Unmount Lifecycle

When JavaScript initializes (`InitService.start()`), `FVL.readinessHandshake()` or `LoadingService.showInContent()` smoothly replaces or fades out `#fv-boot-loader` in-flow without layout jumps or screen flashing.

---

## 5. Rendering, Scroll Semantics & Mobile Viewport Behavior

### 5.1 In-Flow DOM & Attribute Contract

When `FVL.show({ type: 'page', target: '#content-loading' })` or `FVL.page('#content-loading')` executes:
- Root element receives class `.fvl-page` and attribute `data-fvl-type="page"`.
- Target element (`#content-loading`) receives attribute `aria-busy="true"`.
- Position strategy is `static` or `relative`, with `z-index: 0`.

```html
<div id="content-loading" aria-busy="true">
  <div class="fvl-root fvl-page fvl-theme-light" data-fvl-type="page" role="status" aria-live="polite">
    <div class="fvl-boundary-inner">
      <div class="fvl-spinner fvl-spinner-md" aria-hidden="true">...</div>
      <div class="fvl-message">Loading...</div>
    </div>
  </div>
</div>
```

### 5.2 Scroll Preservation Rule

- **Same-Route Data Refresh**: When refreshing or switching category filters on the same route, the user's vertical scroll position (`window.scrollY`) is preserved. `content.js` passes `skipScroll: true` during re-renders, and `fvl.js` `_cleanup` of contextual page/content/component loaders never calls `window.scrollTo`.
- **Cross-Route Navigation**: When explicitly navigating to a new route (e.g. `/` to `/search`), `router.js` invokes `window.scrollTo({ top: 0, behavior: 'smooth' })`.
- **No Snap-to-Top Defect**: Completing a contextual load NEVER resets or snaps page scroll to top.

### 5.3 Mobile Viewport Behavior (100dvh)

- **In-Flow Loaders (`page`, `content`, `component`)**: Sit directly in document flow with layout reservation (`min-height: calc(100dvh - 120px)`). Because they are in-flow, mobile URL bar toggles (showing/hiding address bar) do NOT create background gaps or expose hidden scrolling content.
- **Global Viewport Overlays (`global`)**: Styled using CSS dynamic viewport units:
  ```css
  .fvl-global {
    position: fixed;
    inset: 0;
    height: 100vh;
    height: 100dvh; /* Dynamic viewport height adaptation */
    z-index: 17000;
  }
  ```

---

## 6. Visual Specification & Timing Guarantees

### 6.1 SVG Ring Spinner

FVL v2 uses FanHoard's signature SVG ring spinner with CSS custom properties:

```css
.fvl-track {
  stroke: var(--fvl-spinner-track, rgba(0, 0, 0, 0.1));
}
.fvl-arc {
  stroke: var(--fvl-spinner-arc, var(--fv-color-primary, #0d9488)); /* Teal */
  stroke-dasharray: 88 132;
  animation: _fvl_spin 0.8s linear infinite;
}
```

### 6.2 Timing Guarantees & Flicker Prevention

- **Minimum Visible Duration (`MIN_VISIBLE_MS = 300ms`)**: Managed by `LoadingService`. Active loaders remain visible for at least 300ms to eliminate visual flickering on fast networks.
- **Enter Phase (`140ms`)**: Opacity transition from `0` to `1` via `.fvl-entering`.
- **Leave Phase (`180ms`)**: Opacity transition from `1` to `0` via `.fvl-leaving` prior to DOM unmounting.

---

## 7. Public API & Developer Usage Examples

FVL v2 exports a frozen global window object (`window.FVL` and alias `window.FLV`).

### 7.1 Primary Typed API

```javascript
// 1. Explicit Typed FVL.show()
FVL.show({ type: 'page', target: '#content-loading', message: 'Loading page...' });
FVL.show({ type: 'content', target: '#comments-container', message: 'Fetching comments...' });
FVL.show({ type: 'component', target: '#save-btn' });
FVL.show({ type: 'global', message: 'Authenticating...' });

// 2. Typed API Shortcuts
FVL.page('#content-loading', { message: 'Loading items...' });
FVL.content('#feed-section', { message: 'Updating feed...' });
FVL.component('#submit-button');
FVL.global('System updating...');

// 3. Teardown Methods
FVL.hide();                   // Hides default global/page instance
FVL.hide('custom-id');        // Hides specific instance by ID
FVL.hideInstant('custom-id'); // Teardown without leave animation
FVL.hideAll();                // Teardown all active loaders
```

### 7.2 LoadingService Proxy API

```javascript
// NavCore LoadingService Proxy
LoadingService.showInContent('Loading discover feed...'); // Maps to type: 'page', target: '#content-loading'
LoadingService.hideFromContent();                        // Teardown page loader inside #content-loading
```

---

## 8. Concurrency, Ref Counting & Race Prevention

1. **Per-Boundary Reference Counting**: Concurrent requests targeting the same boundary increment `_boundaryRefs[targetSelector]`. The loader unmounts only when all pending requests settle (`_boundaryRefs === 0`).
2. **Monotonic Request Tokens**: Every `FVL.show()` generates a unique integer `requestId`. Out-of-order async responses compare their token against the current active token and drop stale teardown attempts.
3. **Route-Change Teardown**: SPA route navigation triggers `LoadingService._forceReset()`, calling `FVL.clearAllBoundaryRefs()` to purge boundary instances and clear `aria-busy="false"`.

---

## 9. Migration Notes & Legacy Compatibility

### 9.1 Upgrading from Legacy v1.0 / v3.0.3

No code changes are required for existing callers. Legacy calls automatically map to typed v2 semantics:

```javascript
// Legacy v1.0 Call                       ──> Mapped v2 Typed Result
FVL.fullscreen({ message: '...' })         ──> FVL.show({ type: 'global', message: '...' })
FVL.scoped({ target: '#card' })            ──> FVL.show({ type: 'content', target: '#card' })
FVL.boundary({ target: '#content-load' })  ──> FVL.show({ type: 'page', target: '#content-load' })
FVL.inline({ target: '#btn' })             ──> FVL.show({ type: 'component', target: '#btn' })
```

---

## 10. Prohibited Anti-Patterns & Round-1 Feedback Case Study

### 10.1 Case Study: Round-1 Owner Feedback Analysis

In Round 1, the loading system was converted to `boundary` mode but retained `#fv-boot-loader` as a `position: fixed` viewport overlay. This led to four distinct user-perceived defects:

1. **"Loading feels like a plain cover overlay"**: Boot loader used `position: fixed; inset: 0`, covering header navigation and making the app feel frozen.
2. **"Mobile URL-bar gaps expose scrolling background"**: On iOS Safari and Android Chrome, fixed cover overlays without dynamic viewport units (`100dvh`) or body scroll lock left gaps when the URL bar toggled, exposing moving background content.
3. **"Page snaps back to top after load"**: Calling `window.scrollTo(0, 0)` inside render teardown caused jarring scroll jumps after asynchronous fetch completions.
4. **"Page-level loading covers unneeded areas"**: Blocking the whole page prevented users from using navigation menus while waiting for data.

### 10.2 Prohibited Anti-Patterns Table

| Prohibited Anti-Pattern | Why It Fails | Required Typed v2 Pattern |
| :--- | :--- | :--- |
| **Fixed Cover Viewport Loader for Data Fetching** | Creates overlay gaps on mobile URL bar toggle; blocks header interaction. | Use `type: 'page'` mounted in-flow inside `#content-loading`. |
| **`window.scrollTo(0,0)` on Load Completion** | Resets user scroll position on same-route data refresh. | Use `skipScroll: true` and preserve `window.scrollY`. |
| **Root `<body>` Boot Overlay** | Obscures header and navigation chrome during cold boot. | Use SSG pre-placed in-flow boot slot inside `#content-loading`. |
| **Default `position: fixed` Overlay** | Causes z-index conflicts and backdrop scroll leaks. | Restrict `type: 'global'` strictly to auth/fatal exceptions. |

---

## 11. Doc-vs-Code Conflict Resolutions

1. **Version Alignment**: Header version in `assets/css/loading-system.css` updated to `v2.0.0`, matching `assets/js/loading-system/fvl.js` (`VERSION = '2.0.0'`).
2. **Interactive Navigation**: Header navigation (`.fv-nav a`) maintains `opacity: 1.0` and `pointer-events: auto` during loading.
3. **Scroll Reset Resolution**: Disambiguated cross-route navigation (resets scroll) vs same-route refresh (preserves scroll).

---

## 12. Cross-References

- **`fanhoard-docs/15-Loading-Contract-And-Test-Plan.md`**: Detailed contract specifications and test plan.
- **`fanhoard-docs/03-Navigation-And-Content.md`**: SPA Router integration and content rendering rules.
- **`CHANGES.md` & `PATCH_NOTES.md`**: Release notes and patch summary.
