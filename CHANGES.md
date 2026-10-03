# FanHoard FVL Flexible Loading & Standalone Spinner Subsystem v3.1.0

## What changed

The FVL (FanHoardVerse Loader) system has been upgraded to support flexible display options (`spinnerOnly`, `bare`, `chromeless`, `targetSlot`) across all 4 display modes (`fullscreen`, `scoped`, `inline`, `topbar`) and now includes a standalone, zero-dependency spinner subsystem (`fvl-spinner.js`).

## Files in this package

| File | Status | Purpose |
|---|---|---|
| `assets/js/loading-system/fvl-spinner.js` | **NEW** | Standalone Material Spinner subsystem with zero dependencies on `fvl.js` or `LOAD_PHASES`. Self-injects critical CSS (`#fvl-spinner-styles`). Exports `window.FVLSpinner` and sets `window.FVL.spinner`. |
| `assets/js/loading-system/fvl-modules/spinner.js` | MODIFIED | Updated to delegate spinner rendering and variant operations to `FVLSpinner`. |
| `assets/js/loading-system/fvl-modules/renderer.js` | MODIFIED | DOM builders updated across all 4 display modes to support `spinnerOnly`, `bare`, and `chromeless` options, omitting message containers when opted out. |
| `assets/js/loading-system/fvl-modules/engine.js` | MODIFIED | Added target slot resolution (`targetSlot`) to mount spinners inside nested DOM elements while maintaining parent container `aria-busy` tracking. |
| `assets/css/loading-system.css` | MODIFIED | Added CSS modifier classes for `.fvl-bare`, `.fvl-chromeless`, `.fvl-spinner--speed-*`, and `.fvl-spinner--stroke-*`. |
| `tests/loading-spinner-standalone.test.ts` | **NEW** | Vitest suite for zero-dependency standalone spinner mounting, CSS auto-injection, factory methods, variants, progress offsets, and instance cleanup. |
| `tests/loading-spinner-only.test.ts` | **NEW** | Vitest suite for `spinnerOnly`, `bare`, `chromeless`, and `targetSlot` options across all 4 FVL display modes. |
| `fanhoard-docs/07-Loading-System.md` | MODIFIED | Comprehensive FVL documentation updated with mode options, standalone spinner guide, updated API section, and Version History v3.1.0. |
| `fanhoard-docs/15-Loading-Contract-And-Test-Plan.md` | MODIFIED | System contract and test plan updated with flexible options, standalone spinner contracts, test seams (Seams 3 & 4), and Implementation Slice 6. |

## How to install

### Option A — Apply directly in repository

The files are already located in their respective directories under `assets/js/loading-system/`, `assets/css/`, `tests/`, and `fanhoard-docs/`.

### Option B — Script Inclusion

```html
<!-- Full FVL Orchestrator -->
<script defer src="/assets/js/loading-system/fvl.js?v=3.1.0"></script>

<!-- Standalone Spinner Subsystem (Zero dependencies) -->
<script defer src="/assets/js/loading-system/fvl-spinner.js?v=3.1.0"></script>
```

## How it works (architectural summary)

### 1. Standalone Spinner Subsystem (`fvl-spinner.js`)

`fvl-spinner.js` operates independently without requiring `fvl.js` or `LOAD_PHASES`.
- Auto-injects critical `@keyframes _fvl_spin` and spinner styles into `<style id="fvl-spinner-styles">` if `loading-system.css` is not linked.
- Exposes static factory and lifecycle methods on `window.FVLSpinner`:
  - `FVLSpinner.create(opts)`
  - `FVLSpinner.mount(target, opts)`
  - `FVLSpinner.applyVariant(el, opts)`
  - `FVLSpinner.updateProgress(el, value)`
  - `FVLSpinner.renderSVG()`
- Returns a rich handle object allowing interactive property manipulation (`setSize`, `setColor`, `setTrackColor`, `setSpeed`, `setStrokeWidth`, `updateProgress`, `mount`, `unmount`, `destroy`).

### 2. Flexible Mode Options (`spinnerOnly`, `bare`, `chromeless`, `targetSlot`)

- **`spinnerOnly: true`**: Suppresses text wrapper elements (`.fvl-text`, `.fvl-msg`, `.fvl-sub`). Applies accessible `aria-label` on the root container.
- **`chromeless: true`**: Removes overlay backdrop background, container borders, padding, and shadows (`.fvl-chromeless`).
- **`bare: true`**: Shorthand equivalent to `{ spinnerOnly: true, chromeless: true }` (`.fvl-bare` and `.fvl-chromeless`).
- **`targetSlot`**: Selector or `HTMLElement` specifying a child slot inside the target container where the loader is inserted, while the parent container maintains `aria-busy="true"` state.

## Validation

- **Vitest Test Suite (`npx vitest run tests/loading-*.test.ts`)**: 5 test files, 35/35 tests passed.
- **Full Project Vitest Suite (`npx vitest run`)**: 25 test files, 143/143 tests passed.
- **TypeScript Check (`npm run type-check`)**: 0 errors.
- **ESLint (`npm run lint`)**: 0 errors.
