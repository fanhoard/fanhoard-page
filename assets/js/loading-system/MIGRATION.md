# FVL Loading System Migration Guide (v1.0 / v2.x to v3.0.8)

- **System Described**: FanHoard Loading System (FVL) Refactoring & Modular Architecture Migration
- **Entry File**: `assets/js/loading-system/fvl.js`
- **Dependencies**: `assets/js/loading-system/fvl-modules/*`, `assets/css/loading-system.css`
- **Verification**: `npm test`

---

## 1. Architectural Evolution

### Legacy Architecture (v1.0 / v2.x)

In v1.0 / v2.x, `fvl.js` was a monolithic legacy IIFE file. All logic (config, state, renderer, animator, engine, compat) was bundled inside one monolithic closure.

```
assets/js/loading-system/
└── fvl.js                             # Monolithic legacy IIFE file
```

### Modular Architecture (v3.0.8)

In v3.0.8, `fvl.js` is streamlined into an orchestrator and self-loading entry point that loads 9 modular sub-services in 4 parallel phases:

```
assets/js/loading-system/
├── fvl.js                             # Orchestrator entry point (LOAD_PHASES)
└── fvl-modules/                       # 9 Modular Submodules
    ├── namespace.js                   # Window namespace registry
    ├── types.js                       # JSDoc type definitions
    ├── config.js                      # Configuration & z-index constants
    ├── utils.js                       # DOM & option resolution helpers
    ├── state.js                       # Instance registry & event bus
    ├── renderer.js                    # DOM builders for display modes
    ├── animator.js                    # Double-rAF transition drivers
    ├── spinner.js                     # Material spinner variant subsystem
    └── engine.js                      # Lifecycle engine & handshake
```

---

## 2. Phased Loading Mechanism (`LOAD_PHASES`)

`fvl.js` orchestrates module loading through 4 phases:

```javascript
var LOAD_PHASES = [
  ['namespace.js', 'types.js', 'config.js'],
  ['utils.js', 'state.js'],
  ['renderer.js', 'animator.js', 'spinner.js'],
  ['engine.js']
];
```

1. **Phase 1**: Base namespace and configuration parameters.
2. **Phase 2**: Helper functions and state management maps.
3. **Phase 3**: Rendering templates, animation controllers, and spinner engine.
4. **Phase 4**: Orchestrator lifecycle engine, handshake guard, and global `window.FVL` freeze.

For testing in Node.js / JSDOM, `fvl.js` resolves modules synchronously without network roundtrips.

---

## 3. Public API & Backward Compatibility Guarantees

All public API contracts and legacy proxies remain 100% backward compatible:

1. **`window.FVL` API**: Public methods (`show`, `hide`, `scoped`, `inline`, `topbar`, `hideAll`, `isShowing`, `getActiveCount`, `on`, `off`, `readinessHandshake`, `boot`) operate with identical signatures and return values.
2. **`LoadingService` Proxy**: `NavCoreModules.LoadingService` delegates seamlessly to `FVL`.
3. **Global Shortcuts**: `window.showInstantLoadingOverlay`, `window.removeInstantLoadingOverlay`, `window.FLV` alias remain intact.
4. **HTML Bootloader**: `#fv-boot-loader` handshake and transition handoff remain byte-identical.

---

## 4. Adopting Material Spinner Variants

Existing callers do not require any changes. To adopt the new Material spinner capabilities in new UI components:

```javascript
// Example 1: Show medium determinate spinner with custom color
FVL.show({
  mode: 'scoped',
  target: document.querySelector('.my-card'),
  spinner: {
    size: 'md',
    determinate: true,
    progress: 25,
    color: '#3b82f6'
  }
});

// Example 2: Standalone inline spinner in a custom button
var spinner = FVL.Spinner.create({
  size: 'sm',
  color: 'var(--fv-color-primary)'
});
myButton.appendChild(spinner.element);
```
