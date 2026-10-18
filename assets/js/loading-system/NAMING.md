# FanHoard Loading System Naming Standard

- **System Described**: CSS Class, DOM Element, and Token Naming Standard for FVL v3.0.8
- **Entry File**: `assets/css/loading-system.css`
- **Dependencies**: `assets/js/loading-system/fvl-modules/renderer.js`, `spinner.js`
- **Verification**: `npm test`

---

## 1. Naming Principles & Namespace Discipline

1. **Strict Namespace Prefix**: All CSS classes and DOM attributes generated or used by the loading system MUST begin with the `fvl-` prefix (e.g. `.fvl-fullscreen`, `data-fvl-id`, `--fvl-spinner-color`).
2. **BEM Methodology**:
   - **Block**: Standalone component container (e.g. `.fvl`, `.fvl-spinner`).
   - **Element**: Internal child structural elements (e.g. `.fvl-track`, `.fvl-arc`, `.fvl-msg`, `.fvl-sub`).
   - **Modifier**: Variant state or size modifier (e.g. `.fvl-spinner--sm`, `.fvl-spinner--determinate`, `.fvl-entering`, `.fvl-shown`, `.fvl-leaving`).
3. **Opt-In Variant Class Pattern**: New Material spinner variants MUST use double-hyphen modifier classes (`.fvl-spinner--sm`, `.fvl-spinner--md`, `.fvl-spinner--lg`, `.fvl-spinner--xl`, `.fvl-spinner--determinate`) and NEVER override default `.fvl-spinner` dimensions unless explicitly requested.

---

## 2. CSS Class & Element Dictionary

### 2.1 Mode Containers

| Class Name | Display Mode | Purpose & Behavior |
| :--- | :--- | :--- |
| `.fvl` | Base | Primary loading overlay base container (`position: fixed`/`absolute`, `z-index: 99999`) |
| `.fvl-fullscreen` | Fullscreen | Fixed viewport overlay covering entire browser window |
| `.fvl-scoped` | Scoped | Absolute overlay scoped within parent container (`position: relative`) |
| `.fvl-scoped-overlay` | Scoped Backdrop | Semi-transparent background mask behind scoped spinner |
| `.fvl-inline` | Inline | Lightweight inline spinner layout for buttons and cards |
| `.fvl-topbar` | Topbar | Top-edge progress line bar (`height: 3px`) |

### 2.2 Lifecycle Transition Classes

| Class Name | Phase | Purpose |
| :--- | :--- | :--- |
| `.fvl-entering` | Enter | Initial state during rAF transition setup (`opacity: 0`) |
| `.fvl-shown` | Active | Active visible state (`opacity: 1`, `pointer-events: auto`) |
| `.fvl-leaving` | Exit | Transitioning out state (`opacity: 0`, transition CSS active) |

### 2.3 Spinner Structure & Variants

| Class Name / Variable | Type | Purpose |
| :--- | :--- | :--- |
| `.fvl-spinner` | Block | Outer SVG wrapper container (default 64px fullscreen, 40px scoped, 18px inline) |
| `.fvl-track` | Element | Background SVG circle ring (`stroke: rgba(...)`, r=22) |
| `.fvl-arc` | Element | Animated foreground SVG stroke arc (`stroke: var(--fvl-spinner-color)`) |
| `.fvl-spinner--sm` | Modifier | Opt-in small size (16px × 16px) |
| `.fvl-spinner--md` | Modifier | Opt-in medium size (24px × 24px) |
| `.fvl-spinner--lg` | Modifier | Opt-in large size (40px × 40px) |
| `.fvl-spinner--xl` | Modifier | Opt-in extra large size (64px × 64px) |
| `.fvl-spinner--determinate` | Modifier | Opt-in progress mode (disables continuous rotation animation) |
| `--fvl-spinner-color` | CSS Variable | Color token for spinner arc stroke |
| `--fvl-spinner-track-color` | CSS Variable | Color token for background track stroke |

### 2.4 Pre-Boot & Legacy DOM IDs

| ID / Attribute | Location | Purpose |
| :--- | :--- | :--- |
| `#fv-boot-loader` | `index.html` / `nav-core-early.js` | Pre-rendered synchronous HTML bootloader |
| `#nc-early-overlay` | `nav-core-early.js` | Early navigation overlay shim |
| `#content-loading` | `router.js` | Router content section loader target |
| `data-fvl-id` | Overlay Element | Unique instance identifier assigned by state engine |
| `data-fvl-mode` | Overlay Element | Active mode identifier (`fullscreen`, `scoped`, `inline`, `topbar`) |
