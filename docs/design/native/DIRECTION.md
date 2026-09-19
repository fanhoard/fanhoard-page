# FanHoard Native Design Restoration Direction Specification

**Document Code:** `docs/design/native/DIRECTION.md`  
**Status:** BINDING ARCHITECTURAL SPECIFICATION / OWNER-APPROVED  
**Target Repository:** `github.com/fanhoard/fanhoard-page`  
**Authoritative References:** Complements `docs/design/DIRECTION.md` (Visual Direction) and `docs/design/layout/DIRECTION.md` (Layout System Direction). Synthesizes findings from Assessments `docs/design/native/01`–`04` and Impeccable Craft Standards (`/app/.agents/skills/impeccable/reference/craft-floor.md`).

---

## Executive Summary & Core Philosophy

This document formalizes the binding native-app design restoration direction for the FanHoard main website (`fanhoard/fanhoard-page`). 

### Purpose & Scope
The recent layout refactor (`goal fanhoard-layout`) successfully established a unified HTML landmark architecture (`.fv-page-shell`), central design token foundation (`assets/css/tokens.css`), and accessibility baseline. However, the application of generic layout wrapper utilities (`.fv-section`, `.fv-card`, `.fv-hero`, `.fv-setting-row`, `.stack-md`) accidentally stripped away FanHoard's original visual design essence, introducing double-padding bloat, ghost-card visual noise, unconstrained multi-column grid wrapping, inflated search sticky headers, and token isolation on the Discover page.

This specification restores FanHoard's **native-app visual essence and craft quality** ON TOP OF the canonical `.fv-page-shell` landmark architecture and round-1 visual token system:
* **Architecture Integrity**: The standardized `.fv-page-shell` landmark contract (`<header>`, `<nav>`, `<main id="fv-main">`, `<footer>`) and CSS variable token scale stay authoritative. This goal restores design essence; it does not undo structural layout unification.
* **Policy Floor**: The prohibition on inset/inner shadows (`box-shadow: inset ...`) and the logo-only restriction for decorative fonts (`FoglihtenNo07` / `FoglihtenNo07calt`) remain strictly active.

---

## 1. Essence-Restoration Map

To eliminate visual complexity and restore a clean, high-craft native-app feel that resembles the pre-layout baseline while improving upon it, five core systemic regressions are mapped to precise target specifications.

### 1.1 Systemic Regression Remediation Map

| Regression Theme | Pre-Layout Baseline Behavior | Post-Layout Defect on `main` | Restoration Target Specification |
| :--- | :--- | :--- | :--- |
| **1. Double Card / Double Padding Bloat** | Compact, single-layer padding (16px–24px) around section content. | `.fv-section` (32px padding) + `.fv-card` (24px padding) stacked on existing section wrappers, producing 64px–88px whitespace holes and double borders. | Remove outer `.fv-card` wrappers from content sections that already feature internal card styling. Set `.fv-section` padding to `var(--space-10)` (40px) or `var(--space-12)` (48px) at page level, with zero nested section padding. |
| **2. Search Header Vertical Inflation** | Sleek 56px sticky Google-like search bar pinned to top during scroll. | `.search-header` inside `#search-sticky` given `.fv-hero` (`padding: 40px 0`), inflating sticky bar height to 120px+ and pushing content offscreen. | Strip `.fv-hero` utility from `.search-header`. Enforce compact sticky bar geometry (`min-height: 56px`, `padding: var(--space-2) 0`). Pinned search bar height remains max 64px. |
| **3. Native Overlapping Layer Elevation** | Smooth page canvas (`--surface-page`) with clean borderless floating surfaces and crisp visual hierarchy. | Rigid 1px outlined box cards (`.fv-card`) applied around all text blocks, turning the canvas into a boxy grid of isolated cages with heavy dark shadows. | Restore background surface contrast (`--surface-page` canvas with `--surface-card` surfaces). Default cards use a subtle border (`1px solid var(--border-subtle)`) with `box-shadow: none`. Hover cards use `--shadow-md` with `border-color: transparent`. |
| **4. Form & Button Grid Misalignment** | Vertical form controls (stacked labels/inputs) and side-by-side action button rows. | Community Report fields received `.fv-setting-row` (forcing horizontal split between labels and textareas); Community Hub action buttons stacked vertically via `.stack-md`. | Restore vertical block stack for forms (`display: flex; flex-direction: column; gap: var(--space-2)`). Restore horizontal button row clusters (`display: flex; gap: var(--space-4); flex-wrap: wrap`) on desktop/tablet. |
| **5. Discover Page Token Isolation** | Rich catalog feed with custom curves. | Discover page (`data/verse/discover/`) bypassed central tokens, using hardcoded `--r-card: 30px`, hardcoded `border-radius: 25px`, and inline styling. | Require Discover page to consume `assets/css/tokens.css`. Standardize card radius to `var(--radius-xl)` (16px) and pill button radius to `var(--radius-full)` (9999px). |

---

### 1.2 Per-Page Restoration Specifications

#### 1. Root Landing & 404 Shell (`/index.html`)
* **Padding & Rhythm**: Strip nested `.fv-card` wrappers around the main landing hero and portal options. Set hero section padding to `var(--space-12)` (48px top/bottom).
* **Radii & Surfaces**: Standardize card corners to `var(--radius-xl)` (16px). Replace heavy box shadows (`0 20px 25px rgba(0,0,0,0.3)`) with `var(--shadow-md)`.
* **Action Buttons**: Keep primary action buttons in a horizontal flex cluster with `gap: var(--space-4)` (16px).

#### 2. Main Fan Hub (`/home/index.html` & `assets/css/home.css`)
* **Hero & Quick Actions**: Maintain compact hero layout. Feature carousel cards (`.item-card`) must revert to `padding: var(--space-4)` (16px) instead of being inflated by `.fv-card`'s 24px padding.
* **Grid Layout**: Features grid must use clean 4-column layout on desktop (`grid-template-columns: repeat(4, 1fr)`), 2-column on tablet (`768px`), and 1-column on mobile, with uniform `gap: var(--space-4)` (16px).
* **Section Spacing**: Separate major hub sections with `margin-bottom: var(--space-10)` (40px).

#### 3. Search & Results Feed (`/search/index.html` & `assets/css/search.css`)
* **Sticky Search Bar (`#search-sticky`)**: Remove `.fv-hero` utility. Sticky bar must maintain `height: 56px` on desktop with `padding: var(--space-2) var(--space-4)`. Clear button (`#search-clear-btn`) must be enlarged to `44px x 44px` hit target.
* **Filter Pills**: Render search filter tags as a single horizontal wrapping flex row (`display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3)`).
* **Results List**: Display search result cards as a uniform 1-column stack with `gap: var(--space-3)` (12px), eliminating redundant section card padding around the list container.

#### 4. Settings & Preferences (`/setting/index.html` & `assets/css/setting.css`)
* **Section Scaffolding**: Remove `.fv-card` wrapping around entire setting groups. Use clean setting group containers with `background: var(--surface-card)`, `border: 1px solid var(--border-subtle)`, and `border-radius: var(--radius-xl)`.
* **Setting Rows (`.fv-setting-row`)**: Keep setting rows as horizontal flex items (`align-items: center; justify-content: space-between; padding: var(--space-4)`). Enforce min-height `48px` for toggle controls and dropdown targets.
* **Spaciousness**: Eliminate nested vertical padding between setting items; enforce divider borders (`border-bottom: 1px solid var(--border-subtle)`).

#### 5. Community Pages (`/community/index.html`, `/community/contact/`, `/community/report/`)
* **Community Hub (`/community/index.html`)**: Replace `.stack-md` on primary action buttons with a horizontal row cluster (`display: flex; gap: var(--space-4); flex-wrap: wrap`).
* **Contact & Report Forms**: Strip `.fv-setting-row` from form field containers (`.form-group`). Form labels, inputs, and textareas must stack vertically (`display: flex; flex-direction: column; gap: var(--space-2)`). Textarea minimum height must be `120px` with full width.

#### 6. Platform Pages (`/platform/about/`, `/platform/roadmap/`, `/platform/whats_new/`, `/platform/license/`, `/platform/privacy/`)
* **Card & Section Scaffolding**: Remove nested `.fv-section` padding from internal article cards. Main page container applies `padding: var(--space-10) 0`.
* **Typography & Hierarchy**: Article H1 keeps `var(--step-4)` fluid size; H2 keeps `var(--step-2)` with `margin-top: var(--space-8)` (32px) and `margin-bottom: var(--space-3)` (12px). Paragraphs use `line-height: var(--line-height-relaxed)` (1.6).

#### 7. Symbol Discover Catalog (`/data/verse/discover/index.html` & CSS dependencies)
* **Token Standardization**: Purge all local overrides (`--r-card: 30px`, `--r-btn: 27px`, `border-radius: 25px`). Consume central token variables exclusively.
* **Feed Grid**: Feed card container (`.card-content-container`) must use explicit CSS grid: `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4)`. Remove `justify-items: center` to ensure uniform row alignment.
* **Sub-Nav Bar**: `#sub-buttons-container` must be styled as a clean horizontal scrolling pill track (`display: flex; gap: var(--space-2); overflow-x: auto; padding: var(--space-2)`).

#### 8. Scope Detail Viewer (`/data/verse/scope/index.html` & `assets/css/modern-styles.css`)
* **Metadata Grid**: Scope metadata container must arrange in a neat 3-column row on desktop (`grid-template-columns: repeat(3, 1fr)`), 2-column on tablet, 1-column on mobile, with `gap: var(--space-4)`. Eliminate irregular 2-item top / 1-item bottom wrapping splits.
* **Detail Card Surfaces**: Use single-layer `var(--surface-card)` with `border: 1px solid var(--border-subtle)` and `border-radius: var(--radius-xl)`.

---

## 2. Native-App Craft Standard

To achieve a true native-app level of quality, all pages and components must abide by five craft directives adapted from Impeccable Craft Standards (`/app/.agents/skills/impeccable/reference/craft-floor.md`).

### 2.1 Perceived-Simplicity Rules
* **Eliminate Ghost Cards**: A card surface must use EITHER a subtle border OR a soft elevation shadow—NEVER both simultaneously in static rest state.
  ```css
  /* Static Rest State: Subtle border, zero shadow */
  .fv-card, .item-card, .sc, .card {
    border: 1px solid var(--border-subtle);
    box-shadow: none;
    border-radius: var(--radius-xl, 16px);
  }
  
  /* Interactive Hover State: Elevate with shadow, hide border */
  .fv-card:hover, .item-card:hover, .sc:hover, .card:hover {
    border-color: transparent;
    box-shadow: var(--shadow-md);
  }
  ```
* **No Nested Card Containers**: Cards inside cards are strictly prohibited. Section containers provide spatial structure; child elements provide content without adding inner border enclosures.
* **Quiet Surfaces**: Use canvas background contrast (`--surface-page: #0f172a` dark / `#f8fafc` light) behind cards (`--surface-card: #1e293b` dark / `#ffffff` light) to create natural visual layering without explicit heavy borders.

### 2.2 Spacing System & Grid Rhythm
* **Strict 4/8px Grid Scale**: Every margin, padding, gap, width, and height value MUST consume tokens from `assets/css/tokens.css`:
  * `--space-1`: 4px | `--space-2`: 8px | `--space-3`: 12px | `--space-4`: 16px
  * `--space-5`: 20px | `--space-6`: 24px | `--space-8`: 32px | `--space-10`: 40px
  * `--space-12`: 48px | `--space-16`: 64px
* **Prohibited Off-Grid Values**: Explicitly purge all hardcoded non-8px/4px values (`2px`, `5px`, `7px`, `11.3px`, `12.5px`, `13px`, `14px`, `22px`, `25px`, `27px`, `28px`, `30px`).
* **Section Hierarchy Rhythm**:
  * Major page section separation: `var(--space-10)` (40px) or `var(--space-12)` (48px).
  * Sub-section or group separation: `var(--space-6)` (24px) or `var(--space-8)` (32px).
  * Internal card padding: `var(--space-4)` (16px) for compact cards, `var(--space-6)` (24px) for spacious cards.
  * Heading bottom margin: `var(--space-2)` (8px) to keep heading bound to its section content.

### 2.3 Visual-Noise Budget & Chrome Rules
* **Banned Decorative Chrome**:
  * **No Side-Stripe Accent Borders**: Remove `border-left: 3px solid var(--color-primary)` on alert boxes or cards. Use subtle background fill tints (`var(--surface-hover)`) and uniform borders (`1px solid var(--border-subtle)`).
  * **No Gradient Text Fill**: Remove `-webkit-text-fill-color: transparent` and gradient text backgrounds from headings and page titles (`.page-title`). All body and heading text must render clean solid contrast colors (`var(--text-main)`).
  * **No Raw Unicode Icon Glyphs**: Replace text glyphs like `'▼'` or `'►'` in accordions or dropdowns with structured SVG icons or standard CSS caret indicators.
* **Visual Layer Ceiling**: At any point on screen, a user should perceive no more than 3 distinct elevation levels (Canvas Background -> Surface Layer -> Overlay/Flyout).

### 2.4 Elevation & Typography Policy
* **Elevation Policy**:
  * **Inset Shadows BAN**: `box-shadow: inset ...` remains 100% BANNED across the entire codebase.
  * **Elevation Scale**: Restrict box shadows to central tokens: `--shadow-sm`, `--shadow-md`, `--shadow-lg`.
* **Typography Policy**:
  * **Decorative Fonts**: `FoglihtenNo07` and `FoglihtenNo07calt` remain strictly LOGO-ONLY. Headings across all 14 pages must use `var(--font-sans)` with appropriate font weights (`var(--font-bold)` for H1/H2, `var(--font-semibold)` for H3/H4).
  * **Fluid Typography Scale**: Headings and body text must consume fluid step tokens (`var(--step--1)` through `var(--step-4)`). Hardcoded `px` or arbitrary `rem` text sizing on components is prohibited.

### 2.5 Ergonomic Touch-Target Floor
* **Minimum 44px/48px Hit Areas**: All interactive controls (buttons, links, search clear buttons, accordion toggles, navigation tabs, carousel arrows) MUST have a touch target of at least `44px x 44px` (utility controls) or `48px` height (primary action buttons and navigation items).
  ```css
  /* Touch Target Ergonomics Compliance */
  #search-clear-btn { min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .ca-icon-wrap, .view-all-icon { width: 44px; height: 44px; }
  .bottom-nav .nav-item { min-height: 48px; padding: var(--space-2) var(--space-4); }
  .button-content { min-height: 48px; padding: 0 var(--space-5); }
  ```

---

## 3. Token Policy: Universal Central Token Consumption

Zero component files or inline styles may hardcode radii, shadows, colors, typography sizes, or spacing. Every page—without exception—must consume central design tokens from `assets/css/tokens.css` and primitives from `assets/css/layout.css`.

### 3.1 Discover Page Complete Tokenization Specification

The Discover page (`/data/verse/discover/index.html` and its loaded CSS/JS modules) is currently the primary token bypass offender. The following mapping is mandatory:

| Component / Property | Current Legacy / Hardcoded Value | Central Token Target | File Location |
| :--- | :--- | :--- | :--- |
| **Card Radius Custom Prop** | `--r-card: 30px` | `var(--radius-xl, 16px)` | `assets/css/tokens.css` & `nav-core-ext.css` |
| **Button Radius Custom Prop** | `--r-btn: 27px` | `var(--radius-full, 9999px)` | `assets/css/tokens.css` & `nav-core-ext.css` |
| **Sub-Buttons Container** | `border-radius: 25px` | `border-radius: var(--radius-xl, 16px)` | `assets/css/nav-core-ext.css` |
| **Button Content Container** | `border-radius: 25px` | `border-radius: var(--radius-full, 9999px)` | `assets/css/nav-core-ext.css` |
| **Card Content Container** | `border-radius: 25px` | `border-radius: var(--radius-xl, 16px)` | `assets/css/nav-core-ext.css` |
| **Discover Feed Card** | `border-radius: 24px` | `border-radius: var(--radius-xl, 16px)` | `data/verse/discover/index.html` |
| **Emoji Button Font Size** | `font-size: 21px` | `font-size: var(--step-1, 1.25rem)` | `assets/css/nav-core-ext.css` |
| **Card Title Typography** | `font-size: 13px; font-weight: bold` | `font-size: var(--step-0, 1rem); font-weight: var(--font-semibold)` | `assets/css/nav-core-ext.css` |
| **Card Description Typography** | `font-size: 11.3px` | `font-size: var(--step--1, 0.875rem)` | `assets/css/nav-core-ext.css` |
| **Feed Grid Gaps** | `gap: 5px`, `gap: 12px` | `gap: var(--space-3, 12px)` / `gap: var(--space-4, 16px)` | `assets/css/nav-core-ext.css` |
| **Container Bottom Margin** | `margin: 0 0 40px` | `margin-bottom: var(--space-10, 40px)` | `assets/css/nav-core-ext.css` |
| **Card Elevation Shadows** | Hardcoded RGBA shadows / None | Rest: `box-shadow: none; border: 1px solid var(--border-subtle);` Hover: `box-shadow: var(--shadow-md);` | `assets/css/nav-core-ext.css` |

---

## 4. Grid Policy: Neat Row-Based Arrangements

Content components containing repeated items (cards, buttons, settings rows, metadata blocks) MUST adhere to predictable, row-based grid arrangements.

### 4.1 Grid Rules & Constraints
1. **Explicit Column Count Contracts**: Avoid unconstrained `auto-fit` or `auto-fill` minmax rules paired with `justify-items: center` that cause single orphaned cards to center-align on a row by themselves.
2. **Predictable Wrap Behavior**: Grids must maintain a fixed number of columns per breakpoint:
   * **Desktop (≥1024px)**: 4 columns or 3 columns depending on component type.
   * **Tablet (768px – 1023px)**: 2 columns.
   * **Mobile (<768px)**: 1 column (full width stacked items).
3. **Equal Height Rows**: Grid tracks must align items stretch-height (`align-items: stretch`) so all card surfaces within a row maintain equal vertical height.

### 4.2 Component Grid Specification Table

| Component Name | File Path | Baseline Row Pattern | Desktop Grid Pattern | Mobile Grid Pattern |
| :--- | :--- | :--- | :--- | :--- |
| **Home Hero Actions** | `home/index.html` | 3 side-by-side buttons | `display: flex; gap: var(--space-4); justify-content: center;` | `display: flex; flex-direction: column; width: 100%;` |
| **Home Features Carousel** | `home/index.html` | 4-column item grid | `display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4);` | `display: grid; grid-template-columns: 1fr; gap: var(--space-3);` |
| **Search Filter Pills** | `search/index.html` | Horizontal pill row | `display: flex; gap: var(--space-2); flex-wrap: wrap;` | `display: flex; gap: var(--space-2); overflow-x: auto;` |
| **Search Results Stack** | `search/index.html` | Vertical item stack | `display: flex; flex-direction: column; gap: var(--space-3);` | Same (1 column stack) |
| **Settings Item Rows** | `setting/index.html` | Label + Control row | `display: flex; justify-content: space-between; align-items: center;` | Same (flex space-between) |
| **Community Hub Actions** | `community/index.html` | Side-by-side action buttons | `display: flex; gap: var(--space-4); flex-wrap: wrap;` | `display: flex; flex-direction: column; width: 100%;` |
| **Community Report Form** | `community/report/` | Vertical label/input stack | `display: flex; flex-direction: column; gap: var(--space-2);` | Same (vertical stack) |
| **Platform Content Cards** | `platform/*` | Clean section blocks | `display: flex; flex-direction: column; gap: var(--space-6);` | Same (vertical stack) |
| **Discover Catalog Feed** | `data/verse/discover/` | Multi-card grid | `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4);` | `display: grid; grid-template-columns: 1fr; gap: var(--space-3);` |
| **Scope Metadata Block** | `data/verse/scope/` | 3-item metadata row | `display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4);` | `display: grid; grid-template-columns: 1fr; gap: var(--space-2);` |
| **Footer Component** | `assets/template-html/footer-template.html` | Clean column cluster | Remove outer `.container-full`; use `.footer-inner` with `padding: var(--space-8) 0`. | Stack columns vertically. |

---

## 5. JS & Data-Pipeline Constraints

Restoration of native visual styling MUST NOT break existing client-side JavaScript execution, dynamic DOM injections, or the SSG build pipeline (`docs/design/layout/04-js-coupling.md`).

### 5.1 Binding JS Architectural Rules
1. **SSG Build Pipeline Compatibility**: Do not alter template structures in `assets/template-html/` or node generation in `bin/generate-html.js` and `bin/generate-scope.js` in ways that invalidate expected selector hooks.
2. **i18n Attribute Contracts**: All text-bearing elements restored or modified MUST retain their `data-i18n` and `data-i18n-ph` translation attributes.
3. **DOM Hook & Selector Preservation**: ID selectors and classes used by JS modules MUST be preserved intact:
   * Search: `#search-input`, `#search-clear-btn`, `#search-sticky`, `.search-result-item`.
   * Discover: `#sub-buttons-container`, `.card-content-container`, `.button-content`, URE virtual scroll container hooks (`.ure-virtual-list`).
   * Scope: `.scope-meta-item`, `.scope-title`, `#scope-detail-container`.
4. **Dynamic Geometry & Sticky Math**: CSS adjustments to sticky elements (`#search-sticky`, `.top-nav`) must maintain precise heights matching JS calculation constants (`--nav-height: 56px` or `64px`).

---

## 6. Implementation Authority & Verification Gates

### 6.1 Execution Sequence
All subsequent refactoring tasks executed under goal `fanhoard-native` MUST strictly follow this direction:
1. **Foundation Chunk**: Central token updates in `assets/css/tokens.css` and layout primitives in `assets/css/layout.css` (radii standardization, shadow policy, touch target floors).
2. **Discover Tokenization Chunk**: Full token mapping of `data/verse/discover/` and `assets/css/nav-core-ext.css`.
3. **Per-Page Restorations**: Incremental per-page chunks (Index, Home, Search, Setting, Community, Platform, Scope) removing double padding, ghost cards, and broken grids.
4. **JS & i18n Verification**: Build and test passes ensuring all vitest suites pass and SSG HTML generation completes cleanly.

### 6.2 Acceptance Gates
Before any chunk is pushed to `main`:
* `npm run build` must succeed with zero errors.
* `npm run validate` and `npm run vitest` must pass completely.
* Visual parity and craft standards must be verified against this specification.

---
*End of Binding Specification — `docs/design/native/DIRECTION.md`*
