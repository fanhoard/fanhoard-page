# FanHoard Typed Loading System v2 Architecture (PLSys / FVL v2.0.0)

## What changed

The central loading system (FVL / PLSys) has been upgraded to **Typed Loading Architecture v2**. Callers now explicitly declare the loading scope (`type: 'page' | 'content' | 'component' | 'global'`) via `FVL.show({ type })` or typed API shortcuts (`FVL.page`, `FVL.content`, `FVL.component`, `FVL.global`).

Key architectural improvements in Typed v2:
1. **SSG In-Flow Boot Slot**: Initial boot loading (`#fv-boot-loader`) moved from a root viewport overlay into an SSG pre-placed in-flow slot inside `#content-loading` (`data-fvl-type="page"`). Application header and navigation controls render unblocked and 100% interactive on first paint.
2. **Scroll Preservation Rule**: Same-route data refreshes preserve vertical scroll position (`window.scrollY`). Contextual loading teardown NEVER snaps page scroll to top. Cross-route navigation explicitly resets scroll to top.
3. **Mobile Dynamic Viewport Resilience**: Contextual in-flow loaders sit in normal document flow with layout reservation (`min-height: calc(100dvh - 120px)`), eliminating mobile URL-bar cover gaps and background scroll leaks. Exceptional `global` overlays use dynamic viewport units (`100dvh` with `100vh` fallback).
4. **100% Backward Compatibility**: Legacy options (`fullscreen`, `scoped`, `boundary`, `inline`) automatically normalize to typed v2 categories.

## Files in this package

| File | Status | Purpose |
|---|---|---|
| `fvl.js` | MODIFIED | FVL v2 central loader engine — added typed API (`page`, `content`, `component`, `global`), `data-fvl-type` attributes, legacy normalization, and scroll preservation in `_cleanup` |
| `loading-system.css` | MODIFIED | Added typed CSS rules (`.fvl-page`, `.fvl-content`, `.fvl-component`, `.fvl-global`), min-height reservations, `100dvh` viewport fallback, and aligned version to `v2.0.0` |
| `loading.css` | MODIFIED | Layout min-height reservation rules for `#content-loading` container (`calc(100dvh - 120px)`) |
| `loading.js` | MODIFIED | `LoadingService` proxy — mapped requests explicitly to typed v2 API (`type: 'page'`, `type: 'content'`) inside `#content-loading` |
| `router.js` | MODIFIED | SPA router — updated fallback route transitions to use `type: 'page'` inside `#content-loading` |
| `content.js` | MODIFIED | Content renderer — added `skipScroll: true` on same-route data refreshes to preserve `window.scrollY` |
| `init.js` | MODIFIED | Early initialization — mapped early loading to `LoadingService.showInContent()` (`type: 'page'`) |
| `nav-core-early.js` | MODIFIED | Boot loader guard — converted `#nc-early-overlay` to in-flow slot inside `#content-loading` |
| `utils.js` | MODIFIED | Fatal error overlay — explicitly typed as `'global'` (`Utils.showErrorFullscreen`) |
| `discover/index.html` | MODIFIED | Discover feed — relocated `#fv-boot-loader` into SSG in-flow slot inside `#content-loading` with `data-fvl-type="page"` |
| `loading-contract.test.ts` | MODIFIED | Added unit contract assertions for typed API shortcuts (`FVL.page`, `FVL.content`, `FVL.component`, `FVL.global`), `data-fvl-type` attributes, and scroll preservation |
| `loading-contextual.spec.ts` | MODIFIED | Playwright E2E test suite verifying in-flow boot, mobile URL-bar resilience, header clickability, and scroll preservation |
| `07-Loading-System.md` | MODIFIED | Updated internal documentation for typed v2 architecture, in-flow boot design, scroll preservation, and anti-patterns case study |
| `15-Loading-Contract-And-Test-Plan.md` | MODIFIED | Updated contract specification, typed display modes table, test seams, and implementation plan |

## Architectural summary

### Typed v2 Display Modes Breakdown

```
Typed Modes:
  - type: 'page'      ──> In-flow route slot (#content-loading), min-height: calc(100dvh - 120px), z-index: 0, lockScroll: false
  - type: 'content'   ──> In-flow section boundary, min-height: 180px, z-index: 0, lockScroll: false
  - type: 'component' ──> Inline element / button spinner, z-index: 0, lockScroll: false
  - type: 'global'    ──> Viewport overlay (100dvh), z-index: 17000, reserved strictly for cold boot / fatal errors
  - type: 'topbar'    ──> Fixed top progress bar, z-index: 17500, height: 3px

Legacy Mode Mapping:
  - 'fullscreen'  ──>  'global'
  - 'scoped'      ──>  'content'
  - 'boundary'    ──>  'page'
  - 'inline'      ──>  'component'
```

---

# FanHoard Feed System v2.1 — Per-User Persistent Discovery Feed

## What changed

The discover-page feed now randomizes content **per user** (per browser) and
persists the randomized order in `localStorage` for a configurable TTL
(default 30 minutes). Within the TTL window, every refresh / re-visit shows the
same feed — so it feels "delivered" rather than "re-rolled every time". After
TTL expires, a fresh seed is generated → new feed rotation.

The user also resumes scrolling exactly where they left off, even after closing
the tab and coming back within the TTL window.
