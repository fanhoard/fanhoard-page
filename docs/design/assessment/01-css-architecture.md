# FanHoard Main Website — Deep CSS Architecture Assessment

**Date:** September 19, 2026  
**Target Repository:** `github.com/fanhoard/fanhoard-page`  
**Delivered File:** `docs/design/assessment/01-css-architecture.md`  
**Audit Scope:** Complete line-by-line inspection of all 20 CSS files (`assets/css/*.css`), JS layout/style modules (`assets/js/`), and inline markup styles across all 32 bilingual served HTML pages.

---

## 1. Executive Summary & Health Score

The FanHoard main website relies on a zero-framework, static HTML/CSS/JS architecture that yields high speed and lightweight runtime delivery. However, the CSS architecture suffers from severe specificity debt, token fragmentation, escalation wars in z-index layering, and widespread hardcoded color overrides.

### Overall CSS Architecture Health Metrics
- **Total CSS Files:** 20 files
- **Total Line Count:** 4,286 lines
- **Total CSS Payload Size:** 142.2 KB
- **Total `!important` Declarations:** **305** (`footer.css` contains 193 declarations alone; 63.3% of total)
- **Total Hardcoded Colors:** **375** hex/rgba color declarations bypassing `tokens.css`
- **Z-Index Extremes:** Scale ranges from `-2` up to `1,500,000` (`copyNotification.js:54`)
- **FOUC / FOIT At-Risk Pages:** **10 HTML pages** using inline `<body style="opacity:0">`
- **Inline Styles in HTML:** **39 instances** polluting 13 HTML files
- **Non-performant `transition: all`:** **6 declarations** across 3 core UI CSS files
- **Dark Mode Coverage:** **0% token mapping** in `tokens.css` (lacks `@media (prefers-color-scheme: dark)` or `[data-theme="dark"]` token block)
- **Dead / Orphaned Selectors:** **100+ selectors** matching no active HTML/JS elements

---

## 2. Baseline Build & Verification Status

All static SSG builds, schema validations, and unit test suites were verified in the clone (`/tmp/fh-assess-css`):

| Test Suite | Command | Result | Details |
|---|---|---|---|
| **Package Integrity** | `npm install` | **PASSED** | 204 packages installed, 0 vulnerabilities |
| **Static SSG Build** | `npm run build` | **PASSED** | 32 bilingual HTML pages built in 0.27s via Vite + TS SSG |
| **Schema Validation** | `npm run validate` | **PASSED** | 57/57 static data JSON schemas validated; release manifests green |
| **Unit & Integration**| `npx vitest run` | **PASSED** | 16/16 test files passed, 77/77 unit & integration tests green |

---

## 3. Per-File CSS Inventory Table

Complete quantitative audit of all 20 CSS files in `assets/css/`:

| File Name | Lines | Size (KB) | `!important` Count | Max Selector Depth | Max Selector Example | Hardcoded Colors | Duplicated Rule Blocks | Dead Selectors |
|---|---|---|---|---|---|---|---|---|
| `about.css` | 117 | 3.7 | 4 | 2 | `p.content a` | 7 | 3 | 1 |
| `back-to-top.css` | 85 | 2.6 | 0 | 2 | `#back-to-top svg` | 5 | 3 | 0 |
| `bg.css` | 68 | 1.7 | 4 | 1 | `body` | 3 | 3 | 3 |
| `footer.css` | 242 | 11.2 | **193** | 3 | `.footer-minimal .footer-list li` | 17 | 7 | 0 |
| `home.css` | 552 | 16.9 | 18 | 3 | `.text-h .button-h .btn-content` | 46 | 18 | 16 |
| `loading-system.css` | 492 | 21.5 | 7 | 3 | `body.nav-loading header nav` | 19 | 9 | 0 |
| `loading.css` | 86 | 4.7 | 2 | 3 | `#clp-overlay .clp-spinner svg` | 15 | 8 | 19 |
| `modern-styles.css` | 89 | 3.2 | 1 | 2 | `.bottom-nav *` | 5 | 4 | 0 |
| `nav-core-ext.css` | 140 | 6.2 | 17 | 2 | `.img-d1 img` | 7 | 3 | 4 |
| `nav-core.css` | 99 | 3.7 | 2 | 4 | `nav ul li button` | 5 | 2 | 2 |
| `new.css` | 105 | 4.4 | 0 | 2 | `h1 span` | 20 | 9 | 3 |
| `popup.css` | 698 | 21.5 | 12 | 2 | `.fp-popup *` | 8 | 9 | 15 |
| `report.css` | 134 | 3.5 | 4 | 1 | `.report-textarea` | 4 | 0 | 0 |
| `roadmap.css` | 193 | 6.3 | 0 | 3 | `#feature-list li.past-feature small` | 17 | 5 | 15 |
| `search-compact-overrides.css` | 823 | 28.8 | 24 | 4 | `#searchOverlayContainer .pill` | 116 | 18 | 11 |
| `search.css` | 70 | 3.0 | 5 | 1 | `*` | 2 | 4 | 5 |
| `setting.css` | 160 | 7.2 | 9 | 2 | `.setting-item label` | 16 | 7 | 14 |
| `tokens.css` | 239 | 7.9 | 2 | 1 | `:root` | 56 | 0 | 0 |
| `top-navigation-bar.css` | 45 | 1.5 | 1 | 2 | `.back-button:active svg` | 3 | 0 | 1 |
| `variables.css` | 8 | 0.4 | 0 | 1 | `:root` | 4 | 0 | 0 |
| **TOTALS** | **4,286** | **142.2** | **305** | — | — | **375** | **107** | **109** |

---

## 4. Ranked Architectural Problems with Code Evidence

### P1 — High: Specificity Locks, `!important` Overuse, and Override Layers

#### 1. `assets/css/footer.css:7-240` — Extreme Specificity Lock (193 `!important` flags)
- **Evidence:** `footer.css` attaches `!important` to almost every rule:
  ```css
  /* footer.css:12-16 */
  .footer-minimal { display: grid!important; background: var(--fv-surface-page)!important; }
  .footer-minimal * { box-sizing: border-box!important; font-family: var(--fv-font-sans)!important; }
  ```
- **Impact:** Locks component styling into an untouchable state. Prevents scoped page rules or theme overrides from taking effect without adding further `!important` declarations.

#### 2. `assets/css/search-compact-overrides.css:1-823` — Over-Specific Override Patch (28.8 KB, 24 `!important`, 116 Hardcoded Colors)
- **Evidence:** 823-line override file containing heavy magic numbers and deep nesting to forcibly re-style `search.css`:
  ```css
  /* search-compact-overrides.css:97, 410 */
  padding-top: 138px !important;
  margin-top: -12px !important;
  z-index: 100;
  ```
- **Impact:** Increases CSS bundle size by 28.8 KB for search pages alone. Any modification to `search.css` requires updating matching override blocks in `search-compact-overrides.css`.

#### 3. Widespread `!important` Pollution across Core Layout CSS
- **Evidence:** `home.css` (18), `nav-core-ext.css` (17), `popup.css` (12), `setting.css` (9), `loading-system.css` (7), `search.css` (5), `about.css` (4), `bg.css` (4), `report.css` (4).
- **Impact:** Systemic degradation of CSS cascade. Developers relied on `!important` as a brute-force mechanism to defeat conflicting specificity.

---

### P2 — Medium: Z-Index Escalation War & Layering Chaos

#### 1. Escalated Arbitrary Z-Index Values Across CSS and JS
- **Evidence:**
  - `assets/js/copyNotification.js:54`: `z-index: 1500000;`
  - `assets/css/home.css:523`: `z-index: 99999;`
  - `assets/css/loading-system.css:305`: `z-index: 17500;`
  - `assets/js/lang-modules/ui.js:225`: `z-index: 9999;`
  - `assets/css/popup.css:626`: `z-index: var(--fv-z-overlay, 17000);`
  - `assets/css/back-to-top.css:42`: `z-index: 1100;`
  - `assets/css/nav-core.css:90`: `z-index: 1000;`
- **Impact:** Out-of-control layer stack. Because base tokens in `tokens.css` start at `16000`, components arbitrary pick numbers in the hundreds of thousands or millions to force elements to render on top.

#### 2. Inflated and Fragmented Z-Index Token System in `tokens.css`
- **Evidence:** `tokens.css:137-141` defines:
  ```css
  --fv-z-sticky: 100;
  --fv-z-nav: 16000;
  --fv-z-overlay: 17000;
  --fv-z-modal: 18000;
  --fv-z-toast: 19000;
  ```
- **Impact:** Massive gap between sticky (`100`) and nav (`16000`). Lack of intermediate tiers (e.g. drop-down menus, backdrops) forces components to bypass tokens entirely.

---

### P3 — Medium: Token Bypassing & Theme Deficits

#### 1. 375 Hardcoded Color Declarations Bypassing `tokens.css`
- **Evidence:**
  - `home.css`: 46 hardcoded hex/rgba values (`#0a9273`, `#13b47f`, `#23272f`, `#222b45`)
  - `about.css`: 7 hardcoded values (`#FBFEFC`, `#21383c`, `#0a9273`)
  - `back-to-top.css`: 5 hardcoded values (`#00CEB0`, `#00dfbe`)
  - `new.css`: 20 hardcoded values (`#0e1618`, `#18c490`, `#405860`)
  - `loading-system.css`: 19 hardcoded values (`#1a1d23`, `#2a2d33`, `#e8f5ef`)
  - `roadmap.css`: 17 hardcoded values (`#0a9273`, `#7c4dcc`, `#c8d3d8`)
  - `setting.css`: 16 hardcoded values (`#00FFAA`, `#38AA84`, `#E2D4E2`, `#FF0081`)
- **Impact:** Bypasses central color tokens, creating color inconsistency and making true dark-mode or custom theme switching impossible.

#### 2. Missing Native Dark Theme Token Map in `tokens.css`
- **Evidence:** `tokens.css` defines light-mode colors under `:root`, but contains zero `@media (prefers-color-scheme: dark)` or `[data-theme="dark"]` rules.
- **Impact:** Pages that switch themes rely on ad-hoc rules scattered across individual files (`new.css:95`, `loading-system.css:78`) rather than a unified token map.

#### 3. Fragmented Spacing & Typography Units
- **Evidence:** Arbitrary mixing of `rem`, `px`, `em`, `%`, `vh` across layout files (e.g. `margin-top: 138px`, `font-size: 1.3em`, `gap: 15px`, `padding: 1.5rem`).
- **Impact:** Breaks visual rhythm and vertical alignment grids across page transitions.

---

### P4 — Low: Rendering Micro-Issues, FOUC, and Markup Pollution

#### 1. Flash of Invisible Content (FOUC / FOIT) via Inline Body `opacity:0`
- **Evidence:** 10 HTML pages hide the document body until JS executes:
  - `home/index.html:188`: `<body style="opacity:0">`
  - `setting/index.html:40`: `<body style="opacity:0">`
  - `community/index.html:22`: `<body style="opacity:0">`
  - `community/contact/index.html:26`: `<body style="opacity:0">`
  - `community/report/index.html:27`: `<body style="opacity:0">`
  - `platform/about/index.html:44`: `<body style="opacity:0">`
  - `platform/license/index.html:41`: `<body style="opacity:0">`
  - `platform/privacy/index.html:41`: `<body style="opacity:0">`
  - `platform/roadmap/index.html:41`: `<body style="opacity:0">`
  - `platform/whats_new/index.html:42`: `<body style="opacity:0">`
- **Impact:** If JavaScript fails to load or execution is delayed, the page remains completely blank for the user.

#### 2. 39 Inline Style Declarations Polluting HTML Markup
- **Evidence:** Inline styles scattered across 13 HTML files:
  - `setting/index.html`: 10 instances (e.g. `style="display:inline-flex;align-items:center;gap:15px;"` repeated on 7 lines)
  - `community/contact/index.html`: 6 instances (`style="margin-bottom:1.5rem;"`)
  - `community/index.html`: 3 instances (`style="font-size:1.3em;font-weight:700;margin-bottom:1.5rem;"`)
  - `platform/whats_new/index.html`: 3 instances (`style="text-align:center;padding:24px 16px 0;font-size:1.3em;font-weight:700;color:var(--fv-brand-teal);"`)
- **Impact:** Violates separation of concerns, increases HTML size, and overrides external CSS rules.

#### 3. Non-Performant `transition: all` Usage
- **Evidence:**
  - `popup.css:167`: `transition: all var(--fv-transition-fast);`
  - `setting.css:64`: `transition:all var(--fv-transition-fast);`
  - `setting.css:125`: `transition:all var(--fv-transition-fast);`
  - `setting.css:140`: `opacity:0; transform:translateX(20px); transition:all 0.3s ease;`
  - `top-navigation-bar.css:27, 32`: `transition:all 0.2s cubic-bezier(0.4,0,0.2,1);`
- **Impact:** Triggers unnecessary browser layout and paint calculations during transition cycles instead of animating only composite properties (`transform`, `opacity`).

#### 4. Missing or Overly Aggressive Reduced-Motion Guards
- **Evidence:**
  - `search.css:62`, `roadmap.css:193`, `new.css:105`: `@media (prefers-reduced-motion: reduce) { * { animation:none!important; transition:none!important; transform:none!important; } }`
  - `back-to-top.css`, `setting.css`, `top-navigation-bar.css`: completely lack `@media (prefers-reduced-motion)` guards.
- **Impact:** Blanket wildcard resets destroy functional visibility state transitions, while missing guards cause accessibility issues for motion-sensitive users.

#### 5. 100+ Dead / Orphaned Selectors Lingering in CSS
- **Evidence:**
  - `roadmap.css`: 14 dead classes (`.roadmap-card`, `.roadmap-card--new`, `.roadmap-status-pill`)
  - `home.css`: 16 dead classes (`.btn`, `.btn-arrow`, `.button-primary`, `.notice`, `.notice-icon`, `.hero-visual`)
  - `popup.css`: 15 dead classes (`.fp-pos-bottom`, `.fp-pos-top-left`, `.fp-size-lg`, `.fp-size-xs`)
  - `loading.css`: 17 dead classes (`.clp-arc`, `.clp-msg`, `.notification-error`, `#instant-loading-overlay`)
- **Impact:** Bloats CSS payload and confuses developer maintenance.

---

## 5. Target CSS Architecture & Refactoring Recommendations

To resolve specificity debt, eliminate `!important` flags, and provide clean maintainability, the site must adopt a structured **Zero-Override CSS Architecture**.

### 1. Five-Layer Zero-Override Cascade Structure
```
Layer 1: tokens.css          -> CSS variables only (colors, typography, spacing, motion, z-index)
Layer 2: base.css            -> Reset, box-sizing, typography base, body defaults
Layer 3: layout.css          -> Containers, grid, flex wrappers, shell layout
Layer 4: components/*.css    -> BEM component styles (buttons, cards, badges, nav, footer, toasts)
Layer 5: pages/*.css         -> Page-specific unique layouts (zero global overrides allowed)
```

### 2. Modern 8-Tier Z-Index Scale (0–700)
Replace the current inflated scale (`16000`–`19000` and `1500000`) with an explicit 8-tier z-index design token system in `tokens.css`:

```css
:root {
  --fv-z-base: 0;         /* Default content layer */
  --fv-z-sticky: 100;     /* Sticky table headers, filter bars */
  --fv-z-nav: 200;        /* Top navigation bar, fixed header */
  --fv-z-dropdown: 300;   /* Dropdown menus, tooltips, select popovers */
  --fv-z-overlay: 400;    /* Backdrop overlays, dimmers */
  --fv-z-modal: 500;      /* Dialog boxes, modal popups */
  --fv-z-toast: 600;      /* Toast notifications, copy alerts */
  --fv-z-max: 700;        /* Full-screen boot loader, critical alerts */
}
```

### 3. Native Dark Theme Token System
Extend `tokens.css` with a standard dark mode mapping:

```css
/* tokens.css */
:root {
  --fv-surface-page: #ffffff;
  --fv-surface-card: #f8fafc;
  --fv-text-primary: #152a2f;
  --fv-text-muted: #6d8590;
  --fv-border-subtle: #e2e8f0;
  --fv-brand-primary: #0d9488; /* Primary interactive teal with 4.5:1 AA contrast */
}

[data-theme="dark"],
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --fv-surface-page: #0f172a;
    --fv-surface-card: #1e293b;
    --fv-text-primary: #f8fafc;
    --fv-text-muted: #94a3b8;
    --fv-border-subtle: #334155;
    --fv-brand-primary: #14b8a6;
  }
}
```

### 4. FOUC Elimination via `.is-loaded` Class Pattern
- **Action:** Remove `<body style="opacity:0">` from all 10 HTML pages.
- **Pattern:** Apply opacity transition in CSS and toggle `.is-loaded` class on initial DOM ready:
  ```css
  /* base.css */
  body {
    opacity: 0;
    transition: opacity 200ms ease-in-out;
  }
  body.is-loaded,
  body:not([data-js-required]) {
    opacity: 1;
  }
  ```
- **Fallback:** Un-hide body automatically via a `<noscript>` tag or CSS fallback if JS is disabled.

### 5. `search-compact-overrides.css` Refactoring Strategy
- **Action:** Refactor and delete `search-compact-overrides.css` (28.8 KB).
- **Solution:** Move search mode layouts directly into `search.css` utilizing Container Queries (`@container`) and CSS component classes, eliminating duplicate style blocks and magic numbers.

### 6. `footer.css` Purge Strategy
- **Action:** Rewrite `footer.css` from scratch based on design tokens.
- **Goal:** Eliminate all **193 `!important` flags** while preserving identical layout, responsive flex/grid structure, and bilingual display.

