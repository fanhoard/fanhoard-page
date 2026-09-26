# FanHoard Contextual Loading System (PLSys / FVL v1.0.0 — In-Flow Architecture)

## What changed

The central loading system (FVL / PLSys) has been refactored from a global viewport-overlay model into an **in-flow contextual loading architecture**. Route transitions, category switching, and content fetching now render inside the loading content area (`#content-loading`) in normal document flow and scroll naturally with the document.

The page remains fully scrollable during contextual loading (`lockScroll: false`), header navigation remains fully interactive (`pointer-events: auto`), and layout min-height reservation (`min-height: 180px`) prevents layout shifts (CLS < 0.1). Global blocking overlays are retained strictly as exceptions for initial app boot (`#fv-boot-loader`) and unrecoverable fatal application errors.

## Files in this package

| File | Status | Purpose |
|---|---|---|
| `fvl.js` | MODIFIED | FVL central loader — added `mode: 'boundary'`, per-boundary ref counter (`_boundaryRefs`), monotonic request tokens (`requestId`), and `clearAllBoundaryRefs()` |
| `loading-system.css` | MODIFIED | Added `.fvl-boundary` styles in normal document flow, min-height layout reservation, and aligned CSS version header to `v1.0.0` |
| `loading.css` | MODIFIED | Layout min-height reservation rules for `#content-loading` container |
| `loading.js` | MODIFIED | `LoadingService` proxy — mapped `show` / `showInContent` / `hideFromContent` to boundary mode and updated `_forceReset()` |
| `router.js` | MODIFIED | SPA router — updated fallback route transitions to use boundary mode inside `#content-loading` |
| `init.js` | MODIFIED | Early initialization — mapped early loading to `LoadingService.showInContent()` |
| `nav-core-early.js` | MODIFIED | Boot guard — added `.fvl-boundary` detection to prevent duplicate early overlays |
| `discover/index.html` | MODIFIED | Discover feed — updated `fvlActive` safety checks to recognize active boundary instances |
| `loading-contract.test.ts` | MODIFIED | Added unit contract assertions for in-flow boundary mounting, zero scroll lock, ref counting, and route cleanup |
| `loading-contextual.spec.ts` | **NEW** | Playwright E2E test suite verifying in-flow loading, scrollability, header clickability, and mobile/desktop behavior |
| `07-Loading-System.md` | MODIFIED | Updated internal documentation for contextual in-flow loading architecture, boundary levels, API, and conflict resolutions |
| `15-Loading-Contract-And-Test-Plan.md` | MODIFIED | Updated contract specification, display modes table, test seams, and nav dimming resolution |

## Architectural summary

### In-Flow Boundary vs Global Overlay Strategy

```
Old (Legacy Overlay):
  - Viewport overlay with fixed positioning (position: fixed, inset: 0)
  - High z-index (z-index: 17000 or 1600)
  - Obscured header navigation and dimmed background UI
  - Locked page scroll on full transitions

New (In-Flow Contextual Boundary):
  - Renders inside target DOM container (#content-loading) in normal document flow
  - Position: static/relative, Z-index: 0
  - Header navigation remains 100% interactive (pointer-events: auto, opacity: 1.0)
  - lockScroll: false — document body scrolls freely, loading container moves with document
  - Target container min-height reservation (min-height: 180px) prevents CLS (< 0.1)
  - Concurrency safety via per-boundary ref counting and monotonic request tokens
  - Route change cleanup via FVL.clearAllBoundaryRefs() and LoadingService._forceReset()
```

### Display Modes Supported

1. `boundary`: Primary in-flow contextual loader for SPA route transitions and content updates.
2. `scoped`: Isolated container overlay (`position: absolute`, z-index 1600).
3. `inline`: Inline element/button spinner (`z-index: 0`).
4. `topbar`: Fixed top progress bar (`z-index: 17500`).
5. `fullscreen`: Global viewport overlay (`z-index: 17000`), reserved strictly for cold app boot and fatal errors.

---

# FanHoard Feed System v2.1 — Per-User Persistent Discovery Feed

## What changed

The discover-page feed now randomizes content **per user** (per browser) and
**persists** the randomized order in `localStorage` for a configurable TTL
(default 30 minutes). Within the TTL window, every refresh / re-visit shows the
same feed — so it feels "delivered" rather than "re-rolled every time". After
TTL expires, a fresh seed is generated → new feed rotation.

The user also resumes scrolling exactly where they left off, even after closing
the tab and coming back within the TTL window.
