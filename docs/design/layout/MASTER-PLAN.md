# FanHoard Layout System Execution Master Plan

**Document Code:** `docs/design/layout/MASTER-PLAN.md`  
**Status:** APPROVED EXECUTION MASTER PLAN  
**Target Repository:** `github.com/fanhoard/fanhoard-page`  
**Authoritative Specifications:** `docs/design/layout/DIRECTION.md`, `docs/design/DIRECTION.md`  
**Assessment Suite:** `docs/design/layout/01-html-structure.md` through `04-js-coupling.md`  

---

## 1. Executive Summary & Architecture Overview

This document specifies the exact, file-level execution master plan for unifying the front-end layout system, HTML structure, CSS utility primitives, and visual components across all pages of the FanHoard main website (`fanhoard/fanhoard-page`).

### Key Goals & Non-Negotiable Requirements:
1. **Material-Level Layout System**: Unify all 16 static source HTML files (generating 32 localized output pages in `dist/`) under a single canonical page shell (`.fv-page-shell`), standardized landmark contract (`<header>`, `<nav>`, `<main id="fv-main">`, `<footer>`), universal skip-link target (`#fv-main`), and reusable Material components (`.fv-card`, `.fv-section`, `.fv-setting-row`, `.fv-hero`).
2. **Visual Parity**: Ensure that user-visible layouts, visual density, element positions, colors, and responsive behavior remain 100% equivalent to production. Internal markup and CSS change; the rendered UI look stays identical.
3. **Nav-Offset Solution**: Solve top navigation content overlap on 100% of affected pages (7 initial-load overlap, 10 anchor-jump overlap) via a token-driven shell contract (`--fv-nav-height: 56px`, `--fv-scroll-offset`, global `scroll-padding-top` and `scroll-margin-top`), completely eliminating per-page CSS hacks.
4. **Zero Inset Shadows**: Purge all 10 inset/inner shadow occurrences in CSS and JS, replacing them with clean flat borders or background tints. Standardize outward box-shadows under 4 elevation tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-focus`).
5. **Standard Type Scale**: Eliminate decorative font overuse across regular headings and text site-wide. Update `--font-heading` to `var(--font-sans)`, purge hardcoded serif declarations, and remove external Sofia Google Font imports. Restrict `FoglihtenNo07calt` strictly to the site logo (`.logo` in `nav-core.css`, `.brand-name` in `index.html`).
6. **SSG & JS Preservation**: Retain all dynamic JS coupling hooks, SSG translation marker/slot contracts (`@slot:name`, `<svg data-i18n-svg>`), and DOM IDs required by dynamic scripts (`NavCore`, `SearchEngine`, `DiscoverFeed`, `Home Engine`, `Roadmap Viewer`).

---

## 2. Shared Layout System Architecture

### 2.1 Canonical Page Shell & Landmark Standard

```html
<!DOCTYPE html>
<html lang="en">
<head> <!-- Global Meta & Token CSS Imports --> </head>
<body class="fv-body">
  <!-- Universal Accessibility Skip Link -->
  <a href="#fv-main" class="skip-link" data-translate="home-skip-link">Skip to main content</a>

  <!-- Shell Wrapper -->
  <div class="fv-page-shell fv-page-shell--has-top-nav">
    <header class="fv-header" role="banner">
      <nav class="fv-nav" role="navigation" aria-label="Main Navigation">
        <!-- Top Nav Bar / Logo / Navigation Links -->
      </nav>
    </header>

    <main id="fv-main" class="fv-main" role="main" tabindex="-1">
      <!-- Standardized Page Content -->
    </main>

    <footer class="fv-footer" role="contentinfo">
      <!-- Footer Shell Container / SSG Injected Template -->
    </footer>
  </div>
</body>
</html>
```

### 2.2 Standard Nav-Offset & Scroll Alignment Contract (`assets/css/layout.css`)

```css
:root {
  --fv-nav-height: 56px;
  --fv-scroll-offset: calc(var(--fv-nav-height) + var(--space-3)); /* 56px + 12px = 68px */
}

@media (max-width: 640px) {
  :root {
    --fv-nav-height: 52px;
    --fv-scroll-offset: calc(var(--fv-nav-height) + var(--space-2)); /* 52px + 8px = 60px */
  }
}

html {
  scroll-behavior: smooth;
  scroll-padding-top: var(--fv-scroll-offset);
}

.fv-page-shell--has-top-nav {
  padding-top: var(--fv-nav-height);
}

[id], section, article, .fv-section, main {
  scroll-margin-top: var(--fv-scroll-offset);
}
```

### 2.3 Shared Primitives & Material Components Summary
- **Container Primitives**: `.container-narrow` (720px), `.container-md` (960px), `.container-lg` (1200px), `.container-full` (100%).
- **Grid Primitives**: `.grid-2`, `.grid-3`, `.grid-4`, `.grid-auto-fit`, `.grid-aside`.
- **Stack & Cluster**: `.stack` (`.stack-xs`, `.stack-sm`, `.stack-md`, `.stack-lg`, `.stack-xl`), `.cluster`.
- **Material Components**: `.fv-card`, `.fv-section`, `.fv-setting-row`, `.fv-hero`.
- **Elevation Tokens**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-focus`.

---

## 3. Shared System & Foundation Implementation Plan

### 3.1 CSS Tokens & Base System Standardizations
- **File**: `assets/css/tokens.css`
  - Define `--fv-nav-height: 56px` and `--fv-scroll-offset`.
  - Update `--font-heading: var(--font-sans);`.
  - Add fluid type scale tokens (`--step--1` through `--step-5`).
  - Add elevation tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-focus`).
- **File**: `assets/css/layout.css`
  - Implement `.fv-page-shell`, `.fv-page-shell--has-top-nav`, `.fv-header`, `.fv-main`, `.fv-footer`.
  - Implement `scroll-padding-top` on `html` and `scroll-margin-top` on `[id]`.
  - Implement container primitives (`.container-narrow/md/lg/full`).
  - Implement grid primitives (`.grid-2/3/4/auto-fit/aside`) and flex primitives (`.stack-*`, `.cluster`).
  - Implement Material components (`.fv-card`, `.fv-section`, `.fv-setting-row`, `.fv-hero`).
- **File**: `assets/css/base.css`
  - Apply standard type scale reset and system sans-serif font stack.
  - Standardize focus ring styles using `--shadow-focus`.

### 3.2 Inset Shadow Purge & Decorative Font Cleanup
- **CSS Inset Shadow Purge (9 rules)**:
  - `assets/css/back-to-top.css:17`: `#back-to-top:hover` -> remove inset shadow, retain `--shadow-md`.
  - `assets/css/modern-styles.css:19`: `.svg-wrapper::before` -> `border: 1px solid var(--border-subtle);`.
  - `assets/css/modern-styles.css:51`: `.nav-item.active-1 .svg-wrapper::before` -> `border: 1.5px solid var(--color-brand-primary); background: var(--surface-active);`.
  - `assets/css/nav-core-ext.css:24`: `#sub-nav.fx .hj` -> `border: 1px solid var(--border-subtle);`.
  - `assets/css/search.css:608`: `.hero-featured-card` -> `border: 2px solid var(--color-brand-primary); box-shadow: var(--shadow-md);`.
  - `assets/css/search.css:614-616`: `@keyframes heroPulse` -> replace inner shadow pulse with outward pulse ring `box-shadow: 0 0 0 6px rgba(13,148,136,0.2)`.
  - `assets/css/setting.css:289`: `.setting-card.active` -> `border: 2px solid var(--color-brand-primary); background: var(--surface-card-active);`.
- **JS Inset Shadow Purge (1 location)**:
  - `assets/js/nav-core-modules/performance.js:42`: Remove inset shadow string from inline style generator.
- **Decorative Font Overuse Purge (8 locations + Google Font links)**:
  - Replace decorative fonts in `setting.css:109`, `home.css:23, 33, 146, 346`, `modern-styles.css:102`, `footer.css:86`, `index.html:72` with `var(--font-sans)` and `--step-*` tokens.
  - Delete Google Font `<link>` imports for `Sofia` in `about/index.html` and `setting/index.html`.
  - Enforce logo exemption in `assets/css/nav-core.css:16` (`.logo`) and `index.html:66` (`.brand-name`).

---

## 4. Detailed File-Level Master Plan for ALL Pages & Groups

### Group 1: Root Landing Page
- **File**: `index.html`
- **Exact File Changes**:
  - Wrap entire document body inside `.fv-page-shell`.
  - Standardize accessibility skip link: `<a href="#fv-main" class="skip-link">`.
  - Structure landmark header/nav: `<header class="fv-header"><nav class="fv-nav">`.
  - Convert primary content to `<main id="fv-main" class="fv-main">`.
  - Replace inline styling on `<h2>` (`font-family: FoglihtenNo07...`) with class using `--font-sans`.
  - Retain `.brand-name` decorative font declaration for official logo wordmark exemption.
  - Wrap hero and feature sections in `.container-lg` and `.fv-section`.
- **Acceptance Criteria**:
  - Page builds cleanly via SSG.
  - `#fv-main` is keyboard targetable via skip link.
  - Zero inset shadows; logo font restricted to `.brand-name`.
- **Visible Parity Requirements**:
  - Landing hero presentation, button layout, and responsive column stacking must match production 100%.

### Group 2: Home / Hub Page
- **Files**: `home/index.html`, `assets/template-html/home-templates.html`
- **Exact File Changes**:
  - Wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
  - Standardize skip link to target `#fv-main`.
  - Structure header: `<header class="fv-header"><nav class="fv-nav">`.
  - Structure primary landmark: `<main id="fv-main" class="fv-main">`.
  - Replace custom wrappers (`.w`, `.con`, `.hub-actions`) with `.container-lg`, `.grid-3`, `.stack-md`.
  - Refactor feature cards and carousel cards to `.fv-card`.
  - In `home-templates.html`, ensure dynamic card templates adopt `.fv-card` markup structure.
  - Remove decorative typography rules in `assets/css/home.css` (`.hero-title`, `.section-title`, `.card-title`, `.cta-title`).
- **Acceptance Criteria**:
  - Top nav content overlap fixed via `--fv-nav-height` padding.
  - Dynamic carousel JS (`assets/js/home.js`) initializes and renders cards correctly.
  - `npm run build` generates `dist/home/index.html` for EN and TH without errors.
- **Visible Parity Requirements**:
  - Grid arrangement, carousel navigation, card visual density, and banner layout match production.

### Group 3: Search Engine Page
- **File**: `search/index.html`
- **Exact File Changes**:
  - Wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
  - Standardize skip link to target `#fv-main`.
  - Normalize landmark `<main id="fv-main" class="fv-main">` (preserve `id="searchResults"` on search results container inside main or as alias).
  - Wrap search input hero in `.container-lg` and `.fv-hero`.
  - Replace inset shadow pulse keyframes in `assets/css/search.css:608-616` with outward pulse ring.
  - Update `#search-sticky` wrapper to use CSS token `--fv-nav-height` for sticky positioning offset.
- **Acceptance Criteria**:
  - Search input, sticky filter bar, and search result list function identically.
  - Search results virtual scrolling (`VirtualScrollEngine`) calculates offsets correctly.
  - Top nav initial load overlap eliminated.
- **Visible Parity Requirements**:
  - Search input box alignment, hero visual presentation, card grid, and sticky bar position remain identical.

### Group 4: Setting Page
- **File**: `setting/index.html`
- **Exact File Changes**:
  - Wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
  - Delete Sofia Google Font `<link>` import in `<head>`.
  - Standardize skip link to `#fv-main`.
  - Wrap content in `<main id="fv-main" class="fv-main"><div class="container-md">`.
  - Replace custom `.setting-card` and setting options with `.fv-card` and `.fv-setting-row` primitives.
  - Delete `body { padding-top: 2rem; }` in `assets/css/setting.css`.
  - Replace inset shadow in `setting.css:289` (`.setting-card.active`) with active border + background token.
  - Replace `.setting-section h2` decorative font declaration in `setting.css:109` with `var(--font-sans)`.
- **Acceptance Criteria**:
  - All setting toggles, language switches, and theme selectors function properly via `PreferenceStore`.
  - No inset shadows, zero external font imports.
- **Visible Parity Requirements**:
  - Setting form layout, toggle positions, and section groupings remain visually identical.

### Group 5: Community Index Page
- **File**: `community/index.html`
- **Exact File Changes**:
  - Wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
  - Standardize skip link to `#fv-main`.
  - Structure landmark `<main id="fv-main" class="fv-main"><div class="container-md">`.
  - Refactor community resource links and community hub sections into `.fv-section` and `.fv-card` components.
- **Acceptance Criteria**:
  - Top nav overlap resolved.
  - SSG localized builds pass cleanly.
- **Visible Parity Requirements**:
  - Community link cards, icons, and hero section retain exact production spacing and appearance.

### Group 6: Community Contact & Report Pages
- **Files**: `community/contact/index.html`, `community/report/index.html`
- **Exact File Changes**:
  - **`community/contact/index.html`**:
    - Wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
    - Standardize skip link to `#fv-main`.
    - Wrap form content in `<main id="fv-main" class="fv-main"><div class="container-md">`.
    - Apply `.fv-card` to form container and `.stack-md` to form field groups.
  - **`community/report/index.html`**:
    - Wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
    - Standardize skip link to `#fv-main`.
    - Wrap issue report form in `<main id="fv-main" class="fv-main"><div class="container-md">`.
    - Clean up custom CSS declarations in `assets/css/report.css`.
- **Acceptance Criteria**:
  - Contact and report forms submit correctly.
  - Form field focus states use `--shadow-focus`.
  - Top nav overlap fixed on both pages.
- **Visible Parity Requirements**:
  - Form input alignments, label placements, and submit button layouts remain identical to production.

### Group 7: Platform About & Roadmap Pages
- **Files**: `platform/about/index.html`, `platform/roadmap/index.html`
- **Exact File Changes**:
  - **`platform/about/index.html`**:
    - Delete Sofia Google Font `<link>` import.
    - Wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
    - Structure landmark `<main id="fv-main" class="fv-main"><div class="container-narrow">`.
    - Delete `body { margin-top: 90px; }` in `assets/css/about.css`.
    - Refactor article sections into `.fv-section`.
  - **`platform/roadmap/index.html`**:
    - Wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
    - Structure landmark `<main id="fv-main" class="fv-main"><div class="container-lg">`.
    - Ensure `#roadmap-container` DOM element is preserved intact for `assets/js/roadmap.js` IDB renderer.
    - Clean up hardcoded margins in `assets/css/roadmap.css`.
- **Acceptance Criteria**:
  - About page text legibility enhanced with `--font-sans` and `--step-*` tokens.
  - Roadmap timeline items render dynamically via `roadmap.js` without errors.
- **Visible Parity Requirements**:
  - Article paragraph spacing and roadmap timeline node alignments match production.

### Group 8: Platform What's New, License, Privacy Pages
- **Files**: `platform/whats_new/index.html`, `platform/license/index.html`, `platform/privacy/index.html`
- **Exact File Changes**:
  - Wrap bodies in `.fv-page-shell.fv-page-shell--has-top-nav`.
  - Standardize skip link to `#fv-main`.
  - Structure landmark `<main id="fv-main" class="fv-main"><div class="container-narrow">`.
  - Refactor release log cards in `platform/whats_new/index.html` to `.fv-card`.
  - Refactor legal text blocks in `license/index.html` and `privacy/index.html` into `.fv-section`.
- **Acceptance Criteria**:
  - Top nav overlap fixed on all 3 pages.
  - Legal text and release notes build cleanly via SSG.
- **Visible Parity Requirements**:
  - Reading surface column width (720px) and typography spacing match production.

### Group 9: Data Verse Discover & Scope Pages
- **Files**: `data/verse/discover/index.html`, `data/verse/scope/index.html`
- **Exact File Changes**:
  - **`data/verse/discover/index.html`**:
    - Wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
    - Structure landmark `<main id="fv-main" class="fv-main"><div class="container-lg">`.
    - Preserve tabbed banner navigation and DOM hooks required by `DiscoverFeed.ts`.
  - **`data/verse/scope/index.html`**:
    - Wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
    - Structure landmark `<main id="fv-main" class="fv-main"><div class="container-md">`.
    - Delete `.scope-shell { margin: 24px auto; }` override hack in CSS.
- **Acceptance Criteria**:
  - Discover feed infinite loading and card rendering function correctly.
  - Scope viewer data tables and controls render without layout shifts.
- **Visible Parity Requirements**:
  - Banner layout, tab strip positioning, and feed card grid match production.

### Group 10: Shared Template Assets & Dynamic JS Modules
- **Files**: `assets/template-html/footer-template.html`, `assets/js/footer-template.js`, `assets/template-html/intro-template.html`
- **Exact File Changes**:
  - Refactor `footer-template.html` to canonical `<footer class="fv-footer" role="contentinfo"><div class="container-full">`.
  - Ensure `footer-template.js` injects the updated `<footer class="fv-footer">` landmark.
  - Update `footer.css:86` header typography declaration from serif to `var(--font-sans)`.
- **Acceptance Criteria**:
  - `ssg.ts` compiles footer template into all 32 localized output pages without HTML errors.
  - Dynamic client-side footer injection works for pages using JS footer loading.
- **Visible Parity Requirements**:
  - Footer navigation links, copyright notice, and language/theme triggers maintain exact production layout.

---

## 5. Verification & Quality Assurance Matrix

### 5.1 Automated Pipeline Gates
Every chunk push MUST pass the following automated gate suite:
```bash
npm run build     # Validates Vite bundling + TypeScript SSG page compilation (32 output pages)
npm run validate  # Runs data schema validation + release manifest check (57/57 rules)
npm test          # Runs Vitest unit & integration test suite (16 test files, 77 tests)
```

### 5.2 Accessibility & Design Policy Compliance Checklist
- **Skip Links**: 100% of pages have `<a href="#fv-main" class="skip-link">`.
- **Landmarks**: 100% of pages contain `<header role="banner">`, `<nav role="navigation">`, `<main id="fv-main" role="main">`, and `<footer role="contentinfo">`.
- **Nav Offset**: Zero content element obscured by fixed top nav on initial load across all pages. Zero anchor target obscured after anchor jump.
- **Shadows**: 0 inset/inner shadows across entire codebase. All outward shadows use `--shadow-sm`, `--shadow-md`, `--shadow-lg`, or `--shadow-focus`.
- **Typography**: 0 decorative font declarations on headings/body copy. `FoglihtenNo07calt` present strictly in `.logo` (`nav-core.css`) and `.brand-name` (`index.html`).
- **Google Fonts**: Zero external Google Font network dependencies.
