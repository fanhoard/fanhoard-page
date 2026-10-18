# FanHoard Loading System (FVL)

- **System Described**: FanHoard Loading System (FVL) v3.0.8 Modular Architecture & Service Contracts
- **Entry File**: `assets/js/loading-system/fvl.js`
- **Modules Directory**: `assets/js/loading-system/fvl-modules/`
- **Dependencies**: `assets/css/loading-system.css`, `assets/js/nav-core-modules/loading.js` (proxy shim)
- **Verification**: `npm test`

---

## 1. System Architecture & 4-Phase Model

The FanHoard Loading System (FVL) provides aerospace-grade, deterministic, zero-dependency loading indicators across all FanHoard pages. It operates as a self-loading orchestrator (`assets/js/loading-system/fvl.js`) that dynamically loads 9 specialized sub-modules in 4 sequential phases:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 4: Lifecycle Engine Layer                                         │
│   engine.js (Show/Hide lifecycle, readiness handshake, scroll lock)    │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 3: DOM, Animation & Spinner Layer                                 │
│   renderer.js (4 display modes) • animator.js (Transitions)             │
│   spinner.js (Material spinner variants & progress engine)             │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 2: Utilities & State Layer                                        │
│   utils.js (DOM helpers, opts merging) • state.js (Instances & bus)     │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 1: Core Foundation Layer                                          │
│   namespace.js • types.js • config.js (Z-index, timing, tokens)         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & File Map

```
assets/js/loading-system/
├── fvl.js                              # Orchestrator & self-loading entry point
├── README.md                           # Architecture & contract documentation
├── NAMING.md                           # Class, ID, & token naming standards
├── MIGRATION.md                        # Refactoring & adoption migration guide
└── fvl-modules/                        # 9 Specialized Sub-Service Modules
    ├── namespace.js                    # FVLModules registry setup
    ├── types.js                        # JSDoc type definitions
    ├── config.js                       # Frozen constants, z-index, timing
    ├── utils.js                        # DOM manipulation & option resolution
    ├── state.js                        # Instance maps & event bus
    ├── renderer.js                     # DOM builders for 4 display modes
    ├── animator.js                     # Double-rAF enter/exit animations
    ├── spinner.js                      # Material spinner variant subsystem
    └── engine.js                       # Lifecycle orchestrator & auto-theme
```

---

## 3. Load Phase Execution Sequence

When loaded in the browser, `fvl.js` executes parallel phase loading via `LOAD_PHASES`:

- **Phase 1**: `['namespace.js', 'types.js', 'config.js']` — Establishes module registry and configuration.
- **Phase 2**: `['utils.js', 'state.js']` — Initializes helper utilities and state management.
- **Phase 3**: `['renderer.js', 'animator.js', 'spinner.js']` — Mounts DOM construction, animation drivers, and Material spinner subsystem.
- **Phase 4**: `['engine.js']` — Boots the lifecycle engine, registers global `window.FVL` (frozen), and fires `fvl:ready`.

In Node.js / JSDOM environment, `fvl.js` synchronously resolves module requirements for testing.

---

## 4. Public API & Global Contracts

### `window.FVL` Public Interface

```javascript
window.FVL = Object.freeze({
  _initialized: true,
  VERSION: '3.0.8',
  show: function(opts) {},             // Show overlay/spinner
  hide: function(id) {},               // Hide overlay by ID
  scoped: function(target, opts) {},   // Show scoped overlay on container
  inline: function(target, opts) {},   // Append inline spinner
  topbar: function(opts) {},           // Trigger top progress bar
  hideAll: function() {},              // Hide all active loaders
  isShowing: function(id) {},          // Check if loader is active
  getActiveCount: function(mode) {},   // Count active loaders
  on: function(event, handler) {},     // Event listener registration
  off: function(event, handler) {},    // Event listener deregistration
  readinessHandshake: function(o) {},  // Pre-boot bootloader sync
  boot: function(opts) {},             // Primary boot sequence
  Spinner: Spinner,                    // Material spinner variant API
  _internals: { ... }                  // Internal refs for tests
});
```

### Global Aliases & Proxies

- `window.FLV`: Alias for `window.FVL` (retained for backward compatibility).
- `window.showInstantLoadingOverlay`: Global shortcut for instant boot overlay.
- `window._navCore_contentLoadingManager`: Global proxy bridge for `NavCoreModules.LoadingService`.

---

## 5. Material Spinner Variant Subsystem (Opt-In API)

The Material spinner subsystem (`fvl-modules/spinner.js`) provides flexible spinner rendering while keeping the default spinner DOM byte-identical for existing pages.

### Sizes

- `sm`: 16px × 16px (`.fvl-spinner--sm`)
- `md`: 24px × 24px (`.fvl-spinner--md`)
- `lg`: 40px × 40px (`.fvl-spinner--lg`)
- `xl`: 64px × 64px (`.fvl-spinner--xl`)
- Numeric (e.g., `size: 32`): Applies explicit inline width/height `32px`.

### Modes & Progress

- **Indeterminate** (default): Rotates continuous SVG ring (`.fvl-arc`).
- **Determinate**: Set `determinate: true` and `progress: 0..100`. Programmatically call `spinnerInstance.updateProgress(percent)` or `FVL.Spinner.updateProgress(el, percent)`.

### Color Tokens

- Color override via `--fvl-spinner-color`: `color: 'var(--fv-color-primary)'` or CSS color value.
- Track color via `--fvl-spinner-track-color`.

### Standalone Programmatic API

```javascript
var spinner = FVL.Spinner.create({
  size: 'md',
  determinate: true,
  progress: 45,
  color: '#0066ff'
});

document.body.appendChild(spinner.element);
spinner.updateProgress(80);
spinner.destroy();
```

### Scoped Empty-Target Fallback (v3.0.9)

The scoped overlay is absolutely positioned inside its target. During a route
swap the target (`#content-loading`) is emptied before the fetch completes, so
its height collapses to 0 — and the spinner collapsed with it, leaving a blank
content area. FVL now guards against this:

- While a scoped loader is shown, if the target's height is below
  `CONFIG.SCOPED_EMPTY_MIN_HEIGHT.THRESHOLD_PX` (240px), FVL holds
  `min-height: 60vh` (`SCOPED_EMPTY_MIN_HEIGHT.MIN_HEIGHT`) on the target so
  the spinner stays visible.
- The target's original inline `min-height` is restored on hide. If several
  scoped instances share one target, they inherit the original backup so the
  last one to hide restores the true pre-fallback value.
- Computed-style lookups use `target.ownerDocument.defaultView` so attach and
  restore also work in sandboxed/test windows.
- Zero effect when the target already has content (height ≥ threshold):
  pages without the empty-target situation render byte-identically.

Covered by `tests/loading-scoped-fallback.test.ts`.

---

## 6. Verification & Test Suite

All FVL contracts and module boundaries are verified via Vitest:
- `tests/loading-contract.test.ts` (11 contract tests)
- `tests/loading-spinner.test.ts` (6 spinner variant tests)
