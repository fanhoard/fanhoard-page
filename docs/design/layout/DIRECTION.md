# Layout System Direction: Unified Material Architecture & Surface Standards

**Document Code:** `docs/design/layout/DIRECTION.md`  
**Status:** OWNER-APPROVED / BINDING ARCHITECTURAL SPECIFICATION  
**Target Repository:** `github.com/fanhoard/fanhoard-page`  
**Authoritative Reference:** Complements `docs/design/DIRECTION.md` (Visual Direction) & Assessment Suite (`docs/design/layout/01`–`04`)  

---

## Executive Summary & Purpose

This document formalizes the binding layout-system direction for the FanHoard main website (`fanhoard/fanhoard-page`). Synthesizing findings from the four deep assessments (`01-html-structure.md`, `02-nav-overlap.md`, `03-visual-system.md`, `04-js-coupling.md`) and guided by `docs/design/DIRECTION.md` (Visual Direction) and the craft floor standards (`/app/.agents/skills/impeccable/reference/craft-floor.md`), this specification establishes a single, cohesive, Material-level layout system.

### Core Architecture Directives:
1. **Unified Page Scaffold**: Establish a single canonical page shell (`.fv-page-shell`), landmark contract (`<header>`, `<nav>`, `<main id="fv-main">`, `<footer>`), and skip-link target across all 14 site pages.
2. **Visual-Parity Rule**: All user-visible layouts, visual density, element positions, and responsive behavior remain 100% equivalent to existing production UI. Internal HTML and CSS structures change; the look stays identical.
3. **Standard Nav-Offset Solution**: Fix top-nav content overlap across 100% of affected pages (7 initial load overlap, 10 anchor jump overlap) via a single token-driven shell contract (`--fv-nav-height`) and global `scroll-padding-top` / `scroll-margin-top`, completely eliminating per-page CSS hacks.
4. **Shadow Policy (Zero Inset Shadows)**: Purge all 10 inset/inner shadow techniques across CSS/JS and replace them with clean flat borders or background tints. Restrict outward box-shadows to a strict 4-tier elevation token set (`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-focus`).
5. **Typography Policy (Heading Cleanliness)**: Eliminate decorative font overuse across all headings site-wide, replacing `--font-heading` and hardcoded serif declarations with the standard readable type scale (`--font-sans` + `--step-*` tokens). Remove Sofia Google Font imports. Restrict `FoglihtenNo07calt` strictly to the site logo (`.logo` in `nav-core.css`, `.brand-name` in `index.html`).
6. **JS Adaptation Principles**: Mandate strict compliance with machine-generated SSG markup, i18n marker/slot contracts, preserved DOM IDs/hooks, and layout geometry calculations.

---

## 1. Unified Material-Level Layout System

### 1.1 Canonical Page Scaffold & Landmark Contract

Every static HTML page in `fanhoard-page` MUST adopt the canonical page shell contract. The shell guarantees accessible landmark hierarchy, predictable skip-link navigation, uniform viewport boundaries, and standard responsive behavior.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Global Meta, CSS Tokens & Layout Imports -->
</head>
<body class="fv-body">
  <!-- 1. Universal Accessibility Skip Link -->
  <a href="#fv-main" class="skip-link" data-translate="home-skip-link">Skip to main content</a>

  <!-- 2. Outer Page Shell Wrapper -->
  <div class="fv-page-shell fv-page-shell--has-top-nav">
    
    <!-- 3. Shell Header & Navigation Landmark -->
    <header class="fv-header" role="banner">
      <nav class="fv-nav" role="navigation" aria-label="Main Navigation">
        <!-- Brand Logo & Navigation Links -->
      </nav>
    </header>

    <!-- 4. Primary Content Landmark (Unified ID: #fv-main) -->
    <main id="fv-main" class="fv-main" role="main" tabindex="-1">
      <!-- Page Content / Material Sections & Cards -->
    </main>

    <!-- 5. Shell Footer Landmark -->
    <footer class="fv-footer" role="contentinfo">
      <!-- Static or Dynamic Footer Template Container -->
    </footer>

  </div>
</body>
</html>
```

#### Landmark Contract Rules:
- **Skip Link Target**: Must explicitly target `#fv-main` on every page, replacing fragmented legacy targets (`#main`, `#searchResults`).
- **Main Landmark ID**: Must be `<main id="fv-main" class="fv-main" role="main">` on all pages. Legacy IDs `#main` and `#searchResults` are normalized to `#fv-main` (with aliases preserved in JS query selectors where backward compatibility is required).
- **Page Shell Class**: `.fv-page-shell` wraps the top header, main content, and footer. Modifier class `.fv-page-shell--has-top-nav` signals fixed/sticky top navigation to the shell layout engine.

---

### 1.2 Layout Primitives (Containers, Grids, and Stacks)

All custom layout wrappers (`.m5`, `.w`, `.pad`, `.con`, `.hio`, `.hub-actions`) are deprecated in favor of standardized utility primitives defined in `assets/css/layout.css`:

#### Container Primitives
| Class Name | Max Width | Target Use Case |
| :--- | :--- | :--- |
| `.container-narrow` | `720px` / `45rem` | Read surface mode, single-column articles, legal/about text. |
| `.container-md` | `960px` / `60rem` | Operate surface mode, setting forms, scope view, contact forms. |
| `.container-lg` | `1200px` / `75rem` | Persuade surface mode, search hub, discover feed, home hero. |
| `.container-full` | `100%` | Full-width banners, footer shell, fluid hero headers. |

*Note: All containers enforce standard responsive horizontal padding (`var(--space-4)` on mobile, `var(--space-6)` on tablet/desktop).*

#### Grid Primitives
- **`.grid-2`**: 2-column equal grid (`grid-template-columns: repeat(2, 1fr)`). Responsive fallback: 1 column on `< 768px`.
- **`.grid-3`**: 3-column equal grid (`grid-template-columns: repeat(3, 1fr)`). Responsive fallback: 1 column on `< 640px`, 2 columns on `< 1024px`.
- **`.grid-4`**: 4-column equal grid (`grid-template-columns: repeat(4, 1fr)`). Responsive fallback: 1 column on `< 640px`, 2 columns on `< 900px`, 4 on desktop.
- **`.grid-auto-fit`**: Fluid grid using CSS container queries (`grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr))`).
- **`.grid-aside`**: Main + Sidebar grid (`grid-template-columns: 1fr 300px` or `280px 1fr`).
- **Default Grid Gap**: `gap: var(--space-4)` (16px) on mobile, `gap: var(--space-6)` (24px) on desktop.

#### Stack & Cluster Primitives
- **`.stack`**: Vertical flex column (`flex-direction: column`).
  - `.stack-xs`: `gap: var(--space-1)` (4px)
  - `.stack-sm`: `gap: var(--space-2)` (8px)
  - `.stack-md`: `gap: var(--space-4)` (16px)
  - `.stack-lg`: `gap: var(--space-6)` (24px)
  - `.stack-xl`: `gap: var(--space-8)` (32px)
- **`.cluster`**: Horizontal flex row with flex wrapping (`display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3)`).

---

### 1.3 Material Components Inventory

To eliminate copy-pasted HTML structures and inconsistent CSS, four core Material components are established for reuse across all pages:

#### 1. Material Card (`.fv-card`)
- **Structure**:
  ```html
  <article class="fv-card">
    <header class="fv-card__header">
      <h3 class="fv-card__title">Card Title</h3>
      <span class="fv-card__badge">Badge</span>
    </header>
    <div class="fv-card__body">
      <p>Card content body copy.</p>
    </div>
    <footer class="fv-card__footer">
      <button class="fv-btn fv-btn--secondary">Action</button>
    </footer>
  </article>
  ```
- **Styling Rules**:
  - Background: `var(--surface-card)` (`#1e293b` in dark mode).
  - Border: `1px solid var(--border-subtle)` (`rgba(255, 255, 255, 0.08)`).
  - Elevation: `var(--shadow-sm)` resting, `var(--shadow-md)` on hover. NO inset shadow.
  - Radius: `12px` (`var(--radius-lg)`).

#### 2. Section Scaffold (`.fv-section`)
- **Structure**:
  ```html
  <section class="fv-section" aria-labelledby="sec-title-1">
    <div class="fv-section__header">
      <h2 id="sec-title-1" class="fv-section__title">Section Title</h2>
      <p class="fv-section__desc">Supporting descriptive narrative.</p>
    </div>
    <div class="fv-section__content">
      <!-- Grid / Cards / Form Rows -->
    </div>
  </section>
  ```

#### 3. Setting / Form Row (`.fv-setting-row`)
- **Structure**:
  ```html
  <div class="fv-setting-row">
    <div class="fv-setting-row__info">
      <label for="setting-opt-1" class="fv-setting-row__label">Setting Option</label>
      <span class="fv-setting-row__help">Detailed description of setting effect.</span>
    </div>
    <div class="fv-setting-row__control">
      <input type="checkbox" id="setting-opt-1" class="fv-toggle" />
    </div>
  </div>
  ```

#### 4. Hero Header Scaffold (`.fv-hero`)
- Shared hero banner component for `home/`, `search/`, `discover/`, `about/`, `roadmap/`, `whats_new/` providing unified responsive typography, background glow, search inputs, and call-to-action clusters.

---

## 2. Visual-Parity Rule

### 2.1 Principle & Scope
- **User-Visible Layout Equivalent**: The refactored front-end layout MUST retain exact visual parity with existing production design.
- **Structural Optimization Only**: HTML refactoring standardizes semantic landmarks, element nesting, wrapper classes, utility classes, and ARIA attributes without altering the rendered visual layout, color palette, element sizing, visual density, font sizes, margins, or responsive layout behavior.
- **Strict Prohibition**: No visual redesigns, arbitrary color changes, spacing alterations, or layout shifts are permitted under this task.

### 2.2 Parity Assurance & Verification Protocol
1. **Side-by-Side Visual Inspection**: Every page refactor must be compared against current main branch rendering using static dev server builds.
2. **Viewport Parity**: Parity must hold across all supported viewports: Mobile (375px), Mobile Landscape (667px), Tablet (768px), Laptop (1024px), Desktop (1440px).
3. **Automated Verification**: Build (`npm run build`), validation (`npm run validate`), and Vitest unit/integration testing must pass green before committing any refactoring chunk.

---

## 3. Standard Nav-Offset Solution

### 3.1 Defect Analysis & Root Cause (Assessment 02)
Assessment 02 identified that 7 of 14 static site pages suffer from top-nav content overlap at initial page load (obscuring up to 40px of content), and 10 of 10 top-nav pages lack `scroll-margin-top` on anchor targets. The root cause is an architectural gap: pages previously attempted ad-hoc, fragmented CSS compensation (`body { padding-top: 2rem }`, `margin-top: 90px`, `setting.css` 32px top padding vs 56px fixed header) which broke on mobile viewports.

### 3.2 Standard Shell-Level Offset Mechanism

The fix MUST be implemented as a single, centralized shell-level mechanism in `assets/css/tokens.css` and `assets/css/layout.css`, completely removing all per-page CSS hacks.

#### 1. Centralized CSS Custom Properties (`assets/css/tokens.css`)
```css
:root {
  /* Standard Top Navigation Bar Height */
  --fv-nav-height: 56px;
  
  /* Total Nav Offset Space (Height + Breathable Gap) */
  --fv-nav-offset: var(--fv-nav-height);
  --fv-scroll-offset: calc(var(--fv-nav-height) + var(--space-4)); /* 56px + 16px = 72px */
}

@media (max-width: 640px) {
  :root {
    --fv-nav-height: 52px;
    --fv-scroll-offset: calc(var(--fv-nav-height) + var(--space-3)); /* 52px + 12px = 64px */
  }
}
```

#### 2. Shell Layout Contract (`assets/css/layout.css`)
```css
/* Universal Smooth Scroll & Scroll Padding Contract */
html {
  scroll-behavior: smooth;
  scroll-padding-top: var(--fv-scroll-offset);
}

/* Page Shell Layout Compensation */
.fv-page-shell--has-top-nav {
  padding-top: var(--fv-nav-height);
}

/* Universal Anchor Target Scroll Margin Rule */
[id],
section,
article,
.fv-section,
main {
  scroll-margin-top: var(--fv-scroll-offset);
}
```

#### 3. Deprecation & Cleanup of Per-Page Hacks
All existing page-level top padding/margin hacks MUST be removed during page restructuring:
- Delete `body { padding-top: 2rem; }` in `setting.css`.
- Delete `body { margin-top: 90px; }` in `about.css`.
- Delete `.scope-shell { margin: 24px auto; }` in `scope.css`.
- Delete responsive top margin shrinking rules in `modern-styles.css` and subpage stylesheets.

---

## 4. Shadow Policy

### 4.1 NO Inset / Inner Shadows Policy
Per Assessment 03 and owner directive, **NO inset or inner shadows are permitted anywhere in the codebase**. All 10 existing inset/inner shadow occurrences MUST be purged and replaced with clean flat design treatments.

#### Complete Inset Shadow Purge Inventory & Replacement Plan:
| # | File & Line | Selector / Context | Legacy Inset Declaration | Mandatory Replacement |
|---|---|---|---|---|
| 1 | `back-to-top.css:17` | `#back-to-top:hover` | `box-shadow: inset 0 0 6px ...` | Remove inset shadow; retain `--shadow-md` outward elevation + background color shift. |
| 2 | `modern-styles.css:19` | `.svg-wrapper::before` | `box-shadow: inset 0 0 4px 1.1px ...` | `border: 1px solid var(--border-subtle);` |
| 3 | `modern-styles.css:51` | `.nav-item.active-1 .svg-wrapper::before` | `box-shadow: inset 0 0 5px 0 ...` | `border: 1.5px solid var(--color-brand-primary); background: var(--surface-active);` |
| 4 | `nav-core-ext.css:24` | `#sub-nav.fx .hj` | `box-shadow: inset 0 0 1px 1px ...` | `border: 1px solid var(--border-subtle);` |
| 5 | `search.css:608` | `.hero-featured-card` | `box-shadow: inset 0 0 0 2px ..., inset 0 0 18px ...` | `border: 2px solid var(--color-brand-primary); box-shadow: var(--shadow-md);` |
| 6 | `search.css:614` | `@keyframes heroPulse` (0%) | `box-shadow: inset 0 0 0 2px ..., inset 0 0 18px ...` | Outward border color & `box-shadow: 0 0 0 0 rgba(13,148,136,0.4)` transition. |
| 7 | `search.css:615` | `@keyframes heroPulse` (60%) | `box-shadow: inset 0 0 0 2px ..., inset 0 0 24px ...` | Outward pulse ring: `box-shadow: 0 0 0 6px rgba(13,148,136,0.2)`. |
| 8 | `search.css:616` | `@keyframes heroPulse` (100%) | `box-shadow: inset 0 0 0 2px ..., inset 0 0 18px ...` | Reset outward ring to 0. |
| 9 | `setting.css:289` | `.setting-card.active` | `box-shadow: inset 0 0 12px rgba(...)` | `border: 2px solid var(--color-brand-primary); background: var(--surface-card-active);` |
| 10 | `performance.js:42` | Inline style injection | `box-shadow: inset 0 0 6px ...` | Remove inset box-shadow string from JS module. |

*Craft Floor Prohibition Check*: No hard offset block shadows (`box-shadow: 4px 4px 0`), no zero-blur glow halos, no inset shadows.

### 4.2 Outward Elevation Token Set

Outward box-shadows are permitted for depth separation, dropdown overlays, cards, and focus rings. All 56 outward box-shadow declarations across the repository MUST migrate to the 4 canonical elevation tokens in `tokens.css`:

```css
:root {
  /* Level 1: Subtle Resting Surface Separation */
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.25), 0 1px 2px -1px rgba(0, 0, 0, 0.20);

  /* Level 2: Raised Cards, Hover States, Floating Controls */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.30), 0 2px 4px -2px rgba(0, 0, 0, 0.25);

  /* Level 3: Overlay Windows, Popovers, Modals, Fixed Headers */
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.40), 0 4px 6px -4px rgba(0, 0, 0, 0.30);

  /* Level 4: Accessible Focus Ring Token (WCAG 2.2 AA) */
  --shadow-focus: 0 0 0 3px rgba(13, 148, 136, 0.45);
}
```

---

## 5. Typography Policy

### 5.1 Heading Cleanliness & Type Scale Standard

To deliver high legibility and visual cleanliness across all devices, decorative display fonts are REMOVED from all regular headings, section titles, subheadings, and body text.

#### 1. Elimination of Decorative Heading Token
- In `assets/css/tokens.css`, update `--font-heading`:
  ```css
  /* BEFORE (DEPRECATED) */
  /* --font-heading: 'FoglihtenNo07calt', Georgia, serif; */

  /* AFTER (MANDATORY STANDARD) */
  --font-heading: var(--font-sans);
  ```

#### 2. Purge of 8 Hardcoded Decorative Font Overuse Locations
The 8 specific CSS and HTML locations setting decorative display fonts on headings MUST be replaced with standard readable type scale tokens:
1. `setting.css:109`: `.setting-section h2` → `font-family: var(--font-sans); font-size: var(--step-2);`
2. `home.css:23`: `.hero-title` → `font-family: var(--font-sans); font-size: var(--step-4); font-weight: 700;`
3. `home.css:33`: `.section-title` → `font-family: var(--font-sans); font-size: var(--step-3); font-weight: 600;`
4. `home.css:146`: `.card-title` → `font-family: var(--font-sans); font-size: var(--step-1); font-weight: 600;`
5. `home.css:346`: `.cta-title` → `font-family: var(--font-sans); font-size: var(--step-2); font-weight: 600;`
6. `modern-styles.css:102`: `.modern-heading` → `font-family: var(--font-sans);`
7. `footer.css:86`: Footer headers → `font-family: var(--font-sans);`
8. `index.html:72`: `h2` inline style → Remove decorative serif declaration; use `--font-sans`.

#### 3. Removal of Sofia Google Font Imports
External Google Font `<link>` imports for `Sofia` in `about/index.html` and `setting/index.html` MUST be deleted completely, removing external network dependencies and performance overhead.

#### 4. Token Type Scale Contract (`assets/css/tokens.css`)
All headings across all 14 site pages MUST strictly consume fluid minor-third `--step-*` typography tokens:

```css
:root {
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  --font-mono: ui-monospace, 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;

  /* Fluid Minor-Third Type Scale (1.200 Ratio) */
  --step--1: clamp(0.80rem, 0.78rem + 0.10vw, 0.85rem);  /* Caption / Help Text */
  --step-0:  clamp(1.00rem, 0.95rem + 0.25vw, 1.125rem); /* Body Copy / Standard */
  --step-1:  clamp(1.20rem, 1.12rem + 0.40vw, 1.35rem);  /* Subheadings / Cards */
  --step-2:  clamp(1.44rem, 1.32rem + 0.60vw, 1.62rem);  /* Section Titles (H3/H2) */
  --step-3:  clamp(1.728rem, 1.55rem + 0.90vw, 2.00rem); /* Page Titles (H2) */
  --step-4:  clamp(2.074rem, 1.82rem + 1.25vw, 2.50rem); /* Hero Titles (H1) */
  --step-5:  clamp(2.488rem, 2.14rem + 1.75vw, 3.125rem);/* Display Titles */
}
```

---

### 5.2 Site Logo Font Exemption

`FoglihtenNo07calt` is the official brand identity face for FanHoard and is **EXEMPT** from removal, but its scope is strictly restricted to TWO explicit locations:

| Exempt Location # | File Path & Line | CSS Selector / Element | Exemption Scope & Purpose |
| :---: | :--- | :--- | :--- |
| **1** | `assets/css/nav-core.css:16` | `.logo` | Brand logo mark in top navigation bar across subpages. |
| **2** | `index.html:66` | `.brand-name` | Primary brand wordmark on root landing page. |

*Strict Enforcement*: Any declaration of `FoglihtenNo07calt`, `FoglihtenNo07`, or `Georgia, serif` outside these 2 logo locations is a policy violation.

---

## 6. JS Adaptation Principles

Per Assessment 04 (`04-js-coupling.md`), layout restructuring MUST adhere to four binding JS adaptation principles to prevent runtime failures, i18n breakage, or SSG build pipeline errors.

### Principle 1: Respect SSG Build Pipeline & Machine-Generated Markup
- The Static Site Generator (`ssg.ts`, `html-transformer.ts`) compiles 16 source HTML templates into 32 localized output pages in `/dist/`.
- Dynamic template scripts like `assets/js/footer-template.js` inject markup at build/runtime.
- Structural changes to shell footers or dynamic layouts MUST be made at the source template level (`footer-template.html` / source HTML in `src/` or root page directories), NEVER by hand-editing generated files in `dist/`.

### Principle 2: Maintain i18n Marker Contracts & Node Hierarchy
- The internationalization system (`assets/js/lang-modules/*`) relies on `data-translate="key"` attributes and translation markers (`@br`, `@strong`, `@svg:id`, `@lsvg:id`, `@slot:name`, `@a`).
- **SVG Anchor Contract**: Structural changes MUST preserve `<svg data-i18n-svg="...">` child node targets and anchor structures.
- **Slot Contract**: HTML refactoring must retain named slot wrappers (`<span data-slot="...">`) expected by dynamic translation insertion routines.

### Principle 3: Preserve Required DOM Hook IDs & CSS Selector Hooks
- Dynamic JS modules rely on explicit DOM IDs and CSS class selectors to manipulate elements and bind event listeners:
  - `NavCore` / `DiscoverFeed`: `#fv-main`, `#fv-nav-layer`, `#sub-nav`, `.hj`
  - `SearchEngine` / `URE`: `#searchResults`, `#search-sticky`, `.hero-visual-card`, `.modern-search-input`
  - `Home Engine`: `.hero-carousel`, `.feature-card`, `#back-to-top`
  - `Roadmap / Release Viewer`: `#roadmap-container`, `#release-viewer`, `.roadmap-item`
- During HTML restructuring, if an ID is normalized (e.g., unifying `#searchResults` to `#fv-main`), the corresponding JS query selectors MUST be updated in the module source simultaneously.

### Principle 4: Synchronize Geometry, Scroll & Sticky Offset Math
- Scripts that dynamically read layout geometry, calculate scroll positions, or toggle sticky header classes (`#search-sticky` in `search/index.html`, `NavCore` scroll listener, modal scroll-lockers) MUST read the CSS custom property `var(--fv-nav-height)` or use `getBoundingClientRect()` rather than hardcoding legacy pixel values.

---

## 7. Summary Table of Architectural Standards

| Architectural Axis | Legacy Baseline (Debt) | Target Standardized Direction | Key Files / Tokens |
| :--- | :--- | :--- | :--- |
| **Page Shell** | 4 main IDs, incomplete shell wrapping, bad skip links | One canonical shell (`.fv-page-shell`), landmark contract, `<main id="fv-main">` | `layout.css`, all HTML files |
| **Layout Primitives** | Ad-hoc `.m5`, `.w`, `.pad`, `.con` utility classes | Standardized `.container-*`, `.grid-*`, `.stack-*`, `.cluster` primitives | `layout.css` |
| **Top Nav Overlap** | 7 pages initial load overlap, 10 pages anchor overlap | Token-driven shell compensation (`--fv-nav-height`) & `scroll-padding-top` | `tokens.css`, `layout.css` |
| **Shadow Policy** | 10 inset shadows, unstandardized outward shadows | 0 inset shadows (flat borders/fills); outward shadows mapped to `--shadow-*` tokens | `tokens.css`, all stylesheets |
| **Typography** | Decorative fonts overused on headings & body text | Clean sans-serif headings (`--font-sans` + `--step-*`); logo exempt ONLY | `tokens.css`, `nav-core.css`, `index.html` |
| **JS Adaptation** | Fragile geometry math, dynamic DOM injection | Preserved DOM hooks, i18n slot integrity, SSG generator compliance | `assets/js/**`, `ssg.ts` |
