# FanHoard Native Design Restoration Master Plan

**Document Code:** `docs/design/native/MASTER-PLAN.md`  
**Status:** BINDING EXECUTION ARCHITECTURE / OWNER-APPROVED  
**Target Repository:** `github.com/fanhoard/fanhoard-page`  
**Authoritative References:** 
- `docs/design/native/DIRECTION.md` (Native Restoration Direction)  
- `docs/design/native/01-essence-regression.md` (Essence Assessment)  
- `docs/design/native/02-native-craft.md` (Craft Assessment)  
- `docs/design/native/03-discover-consistency.md` (Discover Assessment)  
- `docs/design/native/04-grid-arrangement.md` (Grid Assessment)  
- `docs/design/layout/DIRECTION.md` (Layout System Direction)  

---

## Executive Summary & Architectural Strategy

The recent layout refactor (`goal fanhoard-layout`) successfully unified the HTML landmark architecture (`.fv-page-shell`) and built a central CSS token foundation. However, over-application of generic utility wrappers (`.fv-section`, `.fv-card`, `.fv-hero`, `.stack-md`) accidentally stripped away FanHoard's original visual essence—introducing double-padding bloat, ghost-card visual noise, unconstrained grid wrapping, inflated search headers, and token isolation on Discover.

This Master Plan specifies the exact file-level refactoring required to restore FanHoard's lost visual essence and elevate craft to native-app level **ON TOP OF** the standardized `.fv-page-shell` landmark architecture and round-1 visual token direction.

### Core Restoration Principles
1. **Architecture Preservation**: Maintain the canonical `.fv-page-shell` contract (`<header>`, `<nav>`, `<main id="fv-main">`, `<footer>`) and SSG pipeline (`src/build/ssg.ts`).
2. **Policy Floor**: Absolute ban on inset shadows (`box-shadow: inset ...`); brand decorative font (`FoglihtenNo07`) remains 100% logo-only.
3. **De-bloating & Ghost Card Elimination**: Remove redundant outer card containers from sections with existing internal card styling. Never pair a 1px border with a heavy outward box shadow on standard rest surfaces.
4. **Token Universality**: Standardize all radii, elevation, spacing, and colors across every page—including Discover (`data/verse/discover/`)—via `assets/css/tokens.css`.
5. **Row-Based Grid Discipline**: Enforce predictable column patterns (4/3 desktop, 2 tablet, 1 mobile) with equal-height stretch alignment across repeated content components.

---

## 1. Shared Design System Level Specification

### 1.1 Central Design Tokens (`assets/css/tokens.css`)
* **Spacing Scale Standardization**:
  * Retain 4/8px base grid scale (`--space-1`: 4px through `--space-16`: 64px).
  * Add `--space-7` (28px) explicitly to resolve missing token reference warnings.
  * Define explicit section spacing utility tokens: `--space-section-desktop`: 48px (`var(--space-12)`), `--space-section-mobile`: 32px (`var(--space-8)`).
* **Corner Radius Harmonization**:
  * `--radius-xs`: 4px (pills, badges, small tags)
  * `--radius-sm`: 6px (inputs, small buttons)
  * `--radius-md`: 8px (standard buttons, dropdown items)
  * `--radius-lg`: 12px (form containers, medium cards)
  * `--radius-xl`: 16px (standard content cards, modal windows, setting groups)
  * `--radius-2xl`: 24px (hero highlight containers)
  * `--radius-full`: 9999px (circular avatar/icons, pill filters)
* **Elevation & Shadow System**:
  * Purge all raw dark shadows (`rgba(0,0,0,0.25)`, `rgba(0,0,0,0.3)`).
  * Rest surfaces (`.fv-card`): `box-shadow: none; border: 1px solid var(--border-subtle);`.
  * Interactive hover surfaces: `box-shadow: var(--shadow-md); border-color: transparent; transition: transform 0.2s ease, box-shadow 0.2s ease;`.
  * Define strict 4-tier elevation tokens:
    * `--shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
    * `--shadow-md`: `0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)`
    * `--shadow-lg`: `0 12px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.04)`
    * `--shadow-focus`: `0 0 0 3px var(--focus-ring-color)`

### 1.2 Core Layout Primitives (`assets/css/layout.css`)
* **`.fv-section` Utility**:
  * Change padding from static `32px` to `var(--space-10)` (40px) on desktop, `var(--space-6)` (24px) on mobile.
  * Ensure zero internal margin collapsing when combined with `.fv-page-shell`.
* **`.fv-card` Primitive**:
  * Reset default styling to: `background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: var(--space-6); box-shadow: none;`.
  * Ban nested `.fv-card` inside another `.fv-card` or `.fv-section` with card styling.
* **`.fv-hero` Utility**:
  * Restrict `.fv-hero` usage strictly to full-page top landing heroes.
  * Ban `.fv-hero` on sticky header bars, inner section headers, and modal titles.
* **Touch Target & Focus Floor**:
  * Enforce `min-height: 44px; min-width: 44px;` for interactive control targets (`.btn`, `.nav-item`, `.search-clear-btn`, `.carousel-arrow`).
  * Universal focus ring styling: `outline: 2px solid var(--color-primary); outline-offset: 2px;`.

---

## 2. Page Group & File-Level Specifications

### 2.1 Root Landing & 404 Shell (`index.html`)
* **Target File**: `index.html`
* **File-Level Changes**:
  * Strip outer `.fv-card` wrapping from landing hero container and portal directory options.
  * Set hero section wrapper padding to `var(--space-12)` (48px top/bottom).
  * Standardize portal option cards to single-layer `var(--surface-card)` with `border: 1px solid var(--border-subtle)` and `border-radius: var(--radius-xl)`.
  * Replace custom landing box-shadow (`0 20px 25px rgba(0,0,0,0.3)`) with `var(--shadow-md)`.
* **Visible-Parity & Preserved Contracts**:
  * Retain logo text rendering in `FoglihtenNo07` font.
  * Retain `data-i18n` attributes on landing cards and portal option titles.
* **Acceptance Criteria**:
  * Zero ghost-card border/shadow double-declarations.
  * Portal links pass WCAG 2.5.5 touch target minimums (≥44px height).

---

### 2.2 Main Fan Hub (`home/index.html` & `assets/css/home.css`)
* **Target Files**: `home/index.html`, `assets/css/home.css`, `assets/js/home.js`
* **File-Level Changes**:
  * **Carousel Cards (`.item-card`)**: Revert padding from `.fv-card`'s 24px back to `var(--space-4)` (16px) to stop card text clipping and vertical expansion.
  * **Quick Actions Row**: Align hero action buttons into a balanced flex row (`display: flex; gap: var(--space-4); justify-content: center; flex-wrap: wrap`).
  * **Features Grid (`.features-grid`)**: Set explicit desktop grid: `display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); align-items: stretch;`. Mobile collapses to 1 column.
  * **Section Separation**: Set spacing between major home sections to `margin-bottom: var(--space-10)` (40px).
* **Visible-Parity & Preserved Contracts**:
  * Preserve dynamic carousel rendering logic in `assets/js/home.js`.
  * Preserve all `data-i18n` translation keys in hero and feature headers.
* **Acceptance Criteria**:
  * Carousel cards display crisp 16px padding without vertical text overflow.
  * Features grid renders a perfectly tidy 4-column row on desktop views (≥1024px).

---

### 2.3 Search & Results Feed (`search/index.html` & `assets/css/search.css`)
* **Target Files**: `search/index.html`, `assets/css/search.css`, `assets/js/search-system/*`
* **File-Level Changes**:
  * **Sticky Search Bar (`#search-sticky`)**: Remove `.fv-hero` utility class from `.search-header`. Enforce compact sticky bar geometry: `min-height: 56px; max-height: 64px; padding: var(--space-2) var(--space-4);`.
  * **Clear Target (`#search-clear-btn`)**: Expand touch target from 20x20px to `44x44px` with `display: inline-flex; align-items: center; justify-content: center;`.
  * **Filter Pills**: Render search categories in a uniform flex row (`display: flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3)`).
  * **Results Feed Stack**: Display search result items in a neat 1-column stack with `gap: var(--space-3)` (12px). Remove redundant outer card wrapper padding.
* **Visible-Parity & Preserved Contracts**:
  * Retain `#search-input`, `#search-clear-btn`, and `#search-sticky` DOM IDs required by `assets/js/search-system/search.js`.
  * Preserve sticky bar position calculations and scroll state events.
* **Acceptance Criteria**:
  * Sticky search bar stays strictly under 64px total height when scrolled.
  * Search result cards fill the viewport cleanly without double-nested card borders.

---

### 2.4 Settings & Preferences (`setting/index.html` & `assets/css/setting.css`)
* **Target Files**: `setting/index.html`, `assets/css/setting.css`
* **File-Level Changes**:
  * **Section Scaffolding**: Remove redundant `.fv-card` wrapper from around `.fv-section` blocks. Use single-layer setting group cards (`background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl)`).
  * **Setting Rows (`.fv-setting-row`)**: Keep setting items formatted as horizontal flex rows (`display: flex; align-items: center; justify-content: space-between; padding: var(--space-4)`).
  * **Row Divider Lines**: Separate items inside a group using `border-bottom: 1px solid var(--border-subtle)` (last row `border-bottom: none`).
  * **Control Touch Targets**: Set toggle switches and option buttons to minimum target height `48px`.
* **Visible-Parity & Preserved Contracts**:
  * Retain setting field IDs (`#theme-select`, `#lang-select`, `#reduce-motion-toggle`).
  * Retain client-side state persistence event bindings.
* **Acceptance Criteria**:
  * Eliminate gaping 64px+ double padding between setting blocks.
  * Setting item rows align labels flush left and controls flush right.

---

### 2.5 Community Hub & Forms (`community/*`)
* **Target Files**: `community/index.html`, `community/contact/index.html`, `community/report/index.html`, `assets/css/community.css` (or relevant page CSS)
* **File-Level Changes**:
  * **Community Hub (`/community/index.html`)**: Replace vertical `.stack-md` column stack on primary action buttons with a horizontal row cluster (`display: flex; gap: var(--space-4); flex-wrap: wrap`).
  * **Contact & Report Forms (`/community/contact/`, `/community/report/`)**: Strip `.fv-setting-row` from form field containers (`.form-group`). Labels, inputs, and textareas stack vertically (`display: flex; flex-direction: column; gap: var(--space-2); align-items: stretch`).
  * **Textarea Geometry**: Set textarea minimum height to `120px` with `width: 100%`.
* **Visible-Parity & Preserved Contracts**:
  * Retain form input IDs and submit action hooks (`#report-form`, `#contact-form`).
  * Retain translation attributes (`data-i18n`, `data-i18n-ph`).
* **Acceptance Criteria**:
  * Form inputs render in clean vertical stacks rather than being split horizontally across the row.
  * Action buttons in Community Hub align side-by-side on desktop.

---

### 2.6 Platform Pages Group (`platform/*`)
* **Target Files**: 
  * `platform/about/index.html`
  * `platform/roadmap/index.html`
  * `platform/whats_new/index.html`
  * `platform/license/index.html`
  * `platform/privacy/index.html`
* **File-Level Changes**:
  * **Container Cleanup**: Remove redundant outer `.fv-card` or `.fv-section` nesting from content blocks. Apply clean section padding `var(--space-10) 0`.
  * **Typography Scale**: Article H1 uses `var(--step-4)` fluid size; H2 uses `var(--step-2)` with `margin-top: var(--space-8)` (32px) and `margin-bottom: var(--space-3)` (12px). Paragraphs set to `line-height: var(--line-height-relaxed)` (1.6).
  * **Roadmap & Release Lists**: Preserve dynamic container element `#roadmap-container` intact for client-side rendering while applying clean card surfaces (`.fv-card`) to individual release timeline cards.
* **Visible-Parity & Preserved Contracts**:
  * Retain `#roadmap-container` and `#whats-new-container` DOM hooks used by dynamic renderers.
  * Maintain SSG translation marker/slot contracts.
* **Acceptance Criteria**:
  * Platform article pages render comfortable, readable typography without card nesting bloat.
  * Dynamic roadmap and what's new lists render cleanly.

---

### 2.7 Symbol Discover Catalog (`data/verse/discover/index.html` & `assets/css/nav-core-ext.css`)
* **Target Files**: `data/verse/discover/index.html`, `assets/css/nav-core-ext.css`, discover CSS/JS assets
* **File-Level Changes**:
  * **Central Token Integration**: Purge all hardcoded visual values (`--r-card: 30px`, `--r-btn: 27px`, `border-radius: 25px`, custom box-shadows, inline hex colors). Consume `assets/css/tokens.css` tokens exclusively.
  * **Card & Button Radii**: Standardize card radius to `var(--radius-xl)` (16px), emoji pill buttons to `var(--radius-full)` (9999px), and sub-nav buttons to `var(--radius-md)` (8px).
  * **Feed Grid Arrangement**: Container `.card-content-container` uses explicit CSS grid: `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); align-items: stretch;`. Remove `justify-items: center` to fix row alignment.
  * **Sub-Nav Bar (`#sub-buttons-container`)**: Format sub-nav as a horizontal scrolling pill track (`display: flex; gap: var(--space-2); overflow-x: auto; padding: var(--space-2)`).
* **Visible-Parity & Preserved Contracts**:
  * Retain DOM IDs `#sub-buttons-container`, `.card-content-container`, and URE virtual list hooks (`.ure-virtual-list`).
  * Preserve client-side catalog state management and search filtering hooks.
* **Acceptance Criteria**:
  * Zero token bypass declarations in `data/verse/discover/index.html` or `assets/css/nav-core-ext.css`.
  * Symbol cards render in a uniform, tidy grid with matching radii and shadows.

---

### 2.8 Scope Detail Viewer (`data/verse/scope/index.html` & `assets/css/modern-styles.css`)
* **Target Files**: `data/verse/scope/index.html`, `assets/css/modern-styles.css`
* **File-Level Changes**:
  * **Metadata Grid**: Scope metadata container arranges in a neat 3-column row on desktop (`display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4)`), 2 columns on tablet, 1 column on mobile. Replaces irregular auto-fit wrapping.
  * **Card Surface**: Scope detail cards use single-layer `var(--surface-card)` with `border: 1px solid var(--border-subtle)` and `border-radius: var(--radius-xl)`.
* **Visible-Parity & Preserved Contracts**:
  * Retain `.scope-meta-item`, `.scope-title`, `#scope-detail-container` DOM selectors required by SSG generator (`bin/generate-scope.js`).
* **Acceptance Criteria**:
  * Metadata items form a clean 3-column horizontal row on desktop viewports.

---

### 2.9 Shared Templates & Footer (`assets/template-html/*`)
* **Target Files**: `assets/template-html/footer-template.html`, `assets/template-html/intro-template.html`, `assets/js/footer-template.js`
* **File-Level Changes**:
  * **Footer Wrapper**: Remove outer `.container-full` wrapper from inside `footer-template.html` to eliminate double horizontal padding.
  * **Footer Inner**: Apply clean inner container styling: `.footer-inner { max-width: var(--max-width-site); margin: 0 auto; padding: var(--space-8) var(--space-4); }`.
  * **Footer Grid**: Footer link columns align in a balanced flex/grid row (`display: flex; justify-content: space-between; gap: var(--space-6); flex-wrap: wrap`).
* **Visible-Parity & Preserved Contracts**:
  * Retain `<footer class="fv-footer">` landmark structure and `#fv-footer-mount` injection point.
* **Acceptance Criteria**:
  * Footer content aligns cleanly with the main content max-width container without horizontal double-padding offset.

---

## 3. JS & Data-Pipeline Coupling Contracts

Per `docs/design/layout/04-js-coupling.md`, native design changes MUST NOT break dynamic scripts, i18n translation attributes, or SSG build generators.

### 3.1 Contract Requirements
1. **SSG Compatibility**: `bin/generate-html.js` and `bin/generate-scope.js` parse HTML files to insert language variants. HTML tag contracts, landmark IDs, and translation slots (`@slot:name`, `<svg data-i18n-svg>`) MUST remain untouched.
2. **Translation Markers**: All modified markup elements MUST preserve `data-i18n` (text translation) and `data-i18n-ph` (placeholder translation) attributes.
3. **DOM Selector Preservation**:
   * Search Engine: `#search-input`, `#search-clear-btn`, `#search-sticky`, `.search-result-item`.
   * Discover Feed: `#sub-buttons-container`, `.card-content-container`, `.button-content`, `.ure-virtual-list`.
   * Home Engine: `#hero-carousel`, `.item-card`, `#features-grid`.
   * Roadmap Viewer: `#roadmap-container`.
4. **JS Inset Shadow Cleanup**: In `assets/js/nav-core-modules/performance.js:42`, purge the inline `inset` box-shadow string declaration.

---

## 4. Verification & Testing Strategy

Restoration quality will be validated through a two-phase verification sequence:

### 4.1 Automated Validation Gates
* **Build Check**: `npm run build` must compile Vite assets and run `src/build/ssg.ts` to generate all 32 localized pages with zero errors.
* **Schema & Release Validation**: `npm run validate` (`validate:data` + `validate-release.js`) must pass 57/57 data schema checks.
* **Vitest Suite**: `npm run test` (`vitest run`) must pass all 16 test files / 77 unit tests.

### 4.2 Quality & Compliance Audits
* **Design Parity & Essence Audit**: Compare built pages against pre-refactor baseline screenshots and `01-essence-regression.md` target specifications. Verify double padding, ghost cards, and broken grids are 100% resolved.
* **WCAG 2.2 AA Audit**:
  * Verify all interactive controls have minimum 44x44px touch targets.
  * Verify focus rings are clearly visible on all focusable elements (`outline: 2px solid var(--color-primary)`).
  * Verify text color contrast ratios satisfy 4.5:1 minimums against card surfaces.
* **Token Bypass Audit**: Grep CSS and HTML files for hardcoded radii, raw box-shadows, or un-tokenized color hex codes.
* **Committed Deliverable**: Synthesize all verification findings into `docs/design/native/VERIFICATION-REPORT.md`.

---
*End of Master Plan — `docs/design/native/MASTER-PLAN.md`*
