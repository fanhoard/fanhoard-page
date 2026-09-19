# FanHoard Redesign Master Plan

**Status:** APPROVED & AUTHORITATIVE  
**Target Repository:** `github.com/fanhoard/fanhoard-page`  
**Authoritative Reference:** `docs/design/MASTER-PLAN.md`  
**Upstream Specs:** `docs/design/DIRECTION.md`, `docs/design/assessment/*.md`  

---

## 1. Executive Summary & Architecture Overview

This Master Plan establishes the authoritative design and technical specification for the comprehensive redesign of the FanHoard main website (`fanhoard/fanhoard-page`). It translates the owner-approved design direction (`docs/design/DIRECTION.md`) and assessment findings (`docs/design/assessment/*.md`) into exact, file-level architectural specifications for every system and page surface.

### Core Objectives
1. **Preserve Identity & Upgrade Accessibility**: Preserve FanHoard's signature emerald/teal visual identity and editorial serif typography (`FoglihtenNo07calt`), while upgrading all interactive controls, text, and status indicators to WCAG 2.2 Level AA compliance (primary interactive teal upgraded from `#2CEBC2` [1.53:1 contrast] to `#0d9488` [4.88:1 contrast on white]).
2. **Three Ergonomic Surface Modes**: Categorize all 12 primary pages into **Persuade**, **Operate**, and **Read** surface modes, establishing purpose-built visual hierarchy, density, and layout structures for every user touchpoint.
3. **Zero-Override CSS Cascade**: Enforce a strict unidirectional cascade (`Tokens` → `Base` → `Layout` → `Components` → `Pages`). Eliminate all 305 `!important` declarations across the CSS codebase, purge hardcoded hex color bypasses, and delete the 29.5 KB `search-compact-overrides.css` file by leveraging CSS Container Queries (`@container`).
4. **FOUC & FOIT Remediation**: Standardize page loading using a CSS `.is-loaded` keyframe transition pattern, completely eliminating inline `<body style="opacity:0">` attributes across 10 HTML files.
5. **Standardized Z-Index Architecture**: Replace erratic z-index escalations (reaching up to `1,500,000` and `99999`) with an explicit 8-tier z-index token scale bounded between `0` and `700`.

---

## 2. Core System Specifications

### System 1: Design Token Architecture (`assets/css/tokens.css`)
- **File Scope**: `assets/css/tokens.css`, `assets/css/variables.css`
- **Architectural Scope**: Complete rewrite of custom property definitions to serve as the single source of truth for color, typography, spacing, border radii, shadows, motion, and stacking order.
- **Specific Changes**:
  - **Color System**:
    - Primary Light Interactive: `--color-brand-primary: #0d9488` (Teal 600; 4.88:1 contrast ratio on white/light slate).
    - Primary Dark Interactive: `--color-brand-primary: #2dd4bf` (Teal 400; 11.2:1 contrast ratio on dark slate `#0f172a`).
    - Secondary/Accent: `--color-brand-secondary: #0284c7` (Cyan 600) / `#38bdf8` (Cyan 400), `--color-brand-accent: #059669` (Emerald 600).
    - Surfaces: `--surface-base` (`#f8fafc` / `#0f172a`), `--surface-card` (`#ffffff` / `#1e293b`), `--surface-hover` (`#f1f5f9` / `#334155`), `--surface-overlay` (`#ffffff` / `#1e293b`).
    - Typography Colors: `--text-main` (`#0f172a` [15.5:1] / `#f8fafc` [15.8:1]), `--text-muted` (`#475569` [5.2:1] / `#94a3b8` [6.1:1]), `--text-inverse` (`#ffffff` / `#0f172a`).
    - Status Tokens: `--color-success` (`#16a34a` / `#4ade80`), `--color-warning` (`#d97706` / `#fbbf24`), `--color-error` (`#dc2626` / `#f87171`), `--color-info` (`#0284c7` / `#38bdf8`).
  - **Dark-Mode Mapping**:
    - Automatic dark mode via `@media (prefers-color-scheme: dark)` mapping semantic tokens to dark variants.
    - Explicit theme toggle support via `[data-theme="dark"]` attribute selector.
  - **Typography Scale**:
    - Fluid minor third scale: `--step--1` (`clamp(0.8rem, 0.78rem + 0.1vw, 0.89rem)`), `--step-0` (`clamp(1rem, 0.95rem + 0.25vw, 1.125rem)`), `--step-1` (`clamp(1.2rem, 1.1rem + 0.4vw, 1.4rem)`), `--step-2` (`clamp(1.44rem, 1.28rem + 0.7vw, 1.78rem)`), `--step-3` (`clamp(1.73rem, 1.48rem + 1.1vw, 2.22rem)`), `--step-4` (`clamp(2.07rem, 1.71rem + 1.7vw, 2.78rem)`), `--step-5` (`clamp(2.49rem, 1.97rem + 2.5vw, 3.47rem)`).
    - Font Families: `--font-heading: 'FoglihtenNo07calt', Georgia, serif`, `--font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`, `--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`.
  - **Spacing Scale**: 4px baseline grid (`--space-1: 0.25rem`, `--space-2: 0.5rem`, `--space-3: 0.75rem`, `--space-4: 1rem`, `--space-6: 1.5rem`, `--space-8: 2rem`, `--space-10: 2.5rem`, `--space-12: 3rem`, `--space-16: 4rem`).
  - **Motion Tokens**: `--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)`, `--transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1)`, `--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1)`.
  - **8-Tier Z-Index Scale**: `--z-base: 0`, `--z-sticky: 100`, `--z-dropdown: 200`, `--z-popover: 300`, `--z-tooltip: 400`, `--z-overlay: 500`, `--z-modal: 600`, `--z-toast: 700`.
- **Acceptance Criteria**:
  - All token custom properties defined under `:root` and verified in `assets/css/tokens.css`.
  - Primary light interactive color `#0d9488` achieves ≥4.5:1 contrast against `#ffffff` and `#f8fafc`.
  - Dark mode variables function seamlessly under both `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass without errors.

---

### System 2: Z-Index Scale Standardization
- **File Scope**: `assets/css/tokens.css`, `assets/css/popup.css`, `assets/css/loading-system.css`, `assets/css/home.css`, `assets/js/copyNotification.js`
- **Architectural Scope**: Eliminate arbitrary z-index values (`1,500,000`, `99999`, `17500`, `9999`, `16000–19000`) and map all stacking contexts strictly to the 8-tier token scale (`0` to `700`).
- **Specific Changes**:
  - `assets/css/tokens.css`: Replace legacy `--z-index-*` variables (`16000` to `19000`) with standardized 8-tier scale (`--z-base: 0` to `--z-toast: 700`).
  - `assets/css/popup.css`: Replace `.popup-overlay` `z-index: 16000` and `.popup-content` `z-index: 16001` with `var(--z-overlay)` (500) and `var(--z-modal)` (600).
  - `assets/css/loading-system.css`: Replace `.loading-screen` `z-index: 17500` with `var(--z-overlay)` (500).
  - `assets/css/home.css`: Replace `z-index: 99999` with `var(--z-dropdown)` (200) or `var(--z-popover)` (300).
  - `assets/js/copyNotification.js`: Replace inline style `z-index: 1500000` with `var(--z-toast)` (700) or class `.copy-notification` referencing `var(--z-toast)`.
- **Acceptance Criteria**:
  - Maximum z-index in the entire codebase is `700` (`var(--z-toast)`).
  - Zero hardcoded numeric z-index values exceeding 700 in any CSS or JS file.
  - Modals, overlays, popups, loading screens, and toast notifications render in correct stacking order without visual overlap bugs.

---

### System 3: FOUC & Loading Pattern Remediation
- **File Scope**:
  - HTML Files (6 primary pages + 4 secondary): `home/index.html`, `setting/index.html`, `community/index.html`, `community/contact/index.html`, `community/report/index.html`, `platform/about/index.html`, `platform/license/index.html`, `platform/privacy/index.html`, `platform/roadmap/index.html`, `platform/whats_new/index.html`.
  - CSS & JS Files: `assets/css/base.css` (or `modern-styles.css`), `assets/js/modern-navigation.js` / `nav-core-early.js`.
- **Architectural Scope**: Eliminate render-blocking inline `<body style="opacity:0">` attributes and replace with CSS keyframe transition triggered by `.is-loaded` class.
- **Specific Changes**:
  - HTML: Remove `style="opacity:0"` from `<body>` tags in all 10 HTML files.
  - CSS (`base.css`):
    ```css
    body {
      opacity: 0;
      transition: opacity var(--transition-fast);
    }
    body.is-loaded {
      opacity: 1;
    }
    noscript body,
    body.no-js {
      opacity: 1 !important;
    }
    ```
  - JS (`assets/js/modern-navigation.js` or `nav-core-early.js`): Add `document.body.classList.add('is-loaded')` on `DOMContentLoaded` with a 150ms safety timeout fallback.
- **Acceptance Criteria**:
  - Zero occurrences of `style="opacity:0"` in any HTML document in the repository.
  - Pages render without unstyled content flashes (FOUC) or hidden body hangs (FOIT).
  - Content remains fully visible and accessible when JavaScript is disabled (`<noscript>`).

---

### System 4: Footer Purge & Modernization
- **File Scope**: `assets/css/footer.css`, `assets/js/footer-template.js`, `assets/template-html/footer-template.html`
- **Architectural Scope**: Purge all 193 `!important` declarations from footer CSS, refactor footer styling to use semantic design tokens, and fix screen reader accessibility traps in footer link rendering.
- **Specific Changes**:
  - `assets/css/footer.css`: Complete token-based rewrite. Remove all 193 `!important` flags. Utilize `--surface-base`, `--text-muted`, `--border-subtle`, and `--color-brand-primary` tokens.
  - `assets/js/footer-template.js`: Fix template injection logic that previously wrapped focusable navigation links (`<a>`) inside `aria-hidden="true"` parent containers.
  - Contrast Correction: Upgrade dark navy footer copyright text (`#475569`) and sub-links to `--text-muted` (`#94a3b8` on dark background) yielding ≥4.5:1 contrast.
- **Acceptance Criteria**:
  - `assets/css/footer.css` contains exactly 0 `!important` declarations.
  - Screen readers can navigate and announce all footer links.
  - Footer renders with WCAG AA compliant contrast ratios across all supported screen widths and theme modes.

---

### System 5: Shell Components & Universal Navigation Architecture
- **File Scope**: `assets/css/base.css`, `assets/css/layout.css`, `assets/css/nav-core.css`, `assets/css/top-navigation-bar.css`, `assets/js/modern-navigation.js`, all 12 primary HTML files.
- **Architectural Scope**: Standardize global header, navigation bar, skip links, and landmark structures across all pages.
- **Specific Changes**:
  - `assets/css/nav-core.css` & `top-navigation-bar.css`: Replace hardcoded hex colors and specificity overrides with tokens. Ensure 0 `!important` declarations in shell CSS.
  - Shell Controls Contrast:
    - Primary buttons (`.btn-primary`): Background `--color-brand-primary` (`#0d9488` light / `#2dd4bf` dark) with white/dark text yielding ≥4.5:1 contrast.
    - Badges (`.badge`): Text color upgraded from `#2CEBC2` (1.53:1) to `--text-main` or `--color-brand-primary` (≥4.5:1).
  - Navigation ARIA Roles: Fix `assets/js/modern-navigation.js` where navigation `<a>` tags carried `role="menuitem"` without an enclosing `role="menu"` or `role="menubar"`.
  - Universal Landmarks & Skip Links: Inject top skip link (`<a href="#main" class="skip-link">Skip to main content</a>`) and ensure every HTML page wraps its primary content in a `<main id="main">` landmark.
- **Acceptance Criteria**:
  - Zero `!important` declarations in shell CSS files (`nav-core.css`, `top-navigation-bar.css`, `base.css`, `layout.css`).
  - All 12 primary pages contain a skip link and a semantic `<main id="main">` region.
  - Primary buttons and badges achieve ≥4.5:1 contrast ratio in light and dark modes.

---

### System 6: Search-Override Removal & Container Query Refactoring
- **File Scope**:
  - Deletion: `assets/css/search-compact-overrides.css`
  - Edits: `assets/css/search.css`, `search/index.html`
- **Architectural Scope**: Delete the 29.5 KB `search-compact-overrides.css` file (24 `!important` flags, 116 hardcoded color hexes) and integrate responsive compact/expanded views directly into `assets/css/search.css` using CSS Container Queries (`@container`).
- **Specific Changes**:
  - `assets/css/search.css`: Define container context (`container-type: inline-size` on search results container). Replace viewport media queries with `@container (max-width: 640px)` rules for compact card rendering.
  - `search/index.html`: Remove `<link rel="stylesheet" href="/assets/css/search-compact-overrides.css">` reference.
  - Delete File: Remove `assets/css/search-compact-overrides.css` from the repository.
- **Acceptance Criteria**:
  - `assets/css/search-compact-overrides.css` is completely deleted from the codebase.
  - Search view seamlessly transitions between compact and expanded layouts based on container width.
  - Search functionality and Vitest tests pass with 0 regressions.

---

## 3. Detailed Page Specifications

### Page 1: `index.html` (Landing / 404 Portal)
- **Surface Mode**: Persuade
- **Layout & Structure**: Centered hero portal, brand title accent (`FoglihtenNo07calt`), high-impact search/navigation CTA, system status badges.
- **File Scope**: `index.html`, `assets/css/home.css`
- **Accessibility & Contrast**:
  - Inject `<a href="#main" class="skip-link">Skip to main content</a>`.
  - Wrap portal content in `<main id="main">`.
  - Upgrade `.btn-primary` background to `--color-brand-primary` (`#0d9488`; 4.88:1 contrast).
  - Upgrade `.badge` text contrast from 1.92:1 to ≥4.5:1 using `--text-main`.
- **Acceptance Criteria**:
  - Page renders identically across English and secondary locale routes.
  - WCAG AA contrast compliance verified for CTA buttons and status badges.
  - Skip link correctly shifts keyboard focus to `<main id="main">`.

---

### Page 2: `home/index.html` (Fan Hub Dashboard)
- **Surface Mode**: Persuade
- **Layout & Structure**: Asymmetrical hero header, ecosystem metrics grid, card grid (`--space-6` gap, `--surface-card`, `--shadow-md`), community highlights.
- **File Scope**: `home/index.html`, `assets/css/home.css`, `assets/js/home.js`
- **Accessibility & Contrast**:
  - Remove inline `<body style="opacity:0">` attribute; apply `.is-loaded` CSS transition pattern.
  - Replace 46 hardcoded color hexes in `home.css` with semantic design tokens.
  - Inject skip link and ensure `<main id="main">` landmark.
- **Acceptance Criteria**:
  - FOUC/FOIT eliminated; page transitions smoothly on load.
  - Metric cards and feature tiles use tokenized background and text colors.
  - Bilingual versions (`/home/index.html`) build and validate without errors.

---

### Page 3: `search/index.html` (Search Interface)
- **Surface Mode**: Operate
- **Layout & Structure**: Sticky utility toolbar (`--surface-card`, `--border-subtle`, `--z-sticky`), search filter pills, responsive container query result grid.
- **File Scope**: `search/index.html`, `assets/css/search.css`, `assets/js/search-system/*.js`
- **Accessibility & Contrast**:
  - Remove reference to `search-compact-overrides.css`.
  - Apply `@container` rules inside `search.css`.
  - Ensure search input fields have visible focus rings (`2px solid var(--color-brand-primary)`) and `aria-label="Search symbols"`.
  - Add `aria-live="polite"` to search result counter element.
- **Acceptance Criteria**:
  - `search-compact-overrides.css` removed and deleted.
  - Compact and expanded search states render faithfully without visual bugs.
  - Search unit tests (`search-system.test.js`) and Playwright specs pass.

---

### Page 4: `setting/index.html` (Settings Panel)
- **Surface Mode**: Operate
- **Layout & Structure**: Preferences group cards (`--surface-card`, `--radius-md`, `--space-6`), custom toggle switch control, language and theme selectors.
- **File Scope**: `setting/index.html`, `assets/css/setting.css`, `assets/js/language.js`
- **Accessibility & Contrast**:
  - Remediate `#auto-update-switch`: Remove `aria-hidden="true"` and `style="display:none"`; replace with custom toggle switch with `role="switch"`, `aria-checked="false|true"`, and explicit `<label for="auto-update-switch">`.
  - Remove all 10 inline `style="..."` attributes from HTML markup.
  - Replace non-performant `transition: all` declarations (`setting.css:64,125,140`) with specific properties (`transition: transform, background-color`).
- **Acceptance Criteria**:
  - `#auto-update-switch` is fully operable via keyboard and announced by screen readers.
  - Zero inline styles remain in `setting/index.html`.
  - Preference changes persist across browser reloads without errors.

---

### Page 5: `community/index.html` (Community Hub)
- **Surface Mode**: Read
- **Layout & Structure**: Community resource tiles, editorial section headings (`FoglihtenNo07calt`), guidelines overview card.
- **File Scope**: `community/index.html`, `assets/css/new.css`
- **Accessibility & Contrast**:
  - Remove inline `<body style="opacity:0">` attribute.
  - Remove 3 inline `style="..."` attributes from HTML.
  - Wrap hub contents in `<main id="main">` landmark and add skip link.
- **Acceptance Criteria**:
  - Page loads gracefully without FOUC.
  - Hub cards maintain consistent spacing (`--space-6`) and tokenized surface colors.
  - Screen reader navigation passes without hidden node traps.

---

### Page 6: `community/contact/index.html` (Contact Form)
- **Surface Mode**: Read / Operate
- **Layout & Structure**: Centered contact card, input field stack (`--surface-base`, `--border-subtle`, `--radius-sm`), sub-navigation bar.
- **File Scope**: `community/contact/index.html`, `assets/css/new.css`
- **Accessibility & Contrast**:
  - Add explicit `<label for="...">` associations for all input and textarea controls.
  - Fix sub-nav muted text contrast (upgraded from 2.67:1 to `--text-muted` `#475569` light / `#94a3b8` dark; ≥4.5:1 contrast).
  - Remove 6 inline `style="..."` attributes.
  - Replace empty `<h1>` SSG shell node with static fallback heading text.
- **Acceptance Criteria**:
  - Form controls completely accessible via screen reader.
  - Form submission retains existing POST handling with zero regressions.
  - Sub-navigation text passes WCAG AA contrast standard.

---

### Page 7: `community/report/index.html` (Issue Report Form)
- **Surface Mode**: Read / Operate
- **Layout & Structure**: Structured issue report card, category radio selector grid, custom input details box.
- **File Scope**: `community/report/index.html`, `assets/css/report.css`
- **Accessibility & Contrast**:
  - Bind custom text input `#report-page-custom` with explicit `<label for="report-page-custom">`.
  - Add top skip link and wrap card in `<main id="main">` landmark.
  - Replace empty `<h1>` SSG node with static heading.
  - Add `@media (prefers-reduced-motion)` guard to `report.css`.
- **Acceptance Criteria**:
  - `#report-page-custom` input correctly labeled.
  - Playwright E2E form interaction tests pass (`report.spec.js`).
  - Form elements achieve WCAG AA contrast.

---

### Page 8: `platform/about/index.html` (About Story Page)
- **Surface Mode**: Persuade
- **Layout & Structure**: Editorial narrative blocks, ecosystem statistics cards, brand mission statement.
- **File Scope**: `platform/about/index.html`, `assets/css/about.css`
- **Accessibility & Contrast**:
  - Remove hardcoded dark background CSS rules in `about.css` that broke light theme rendering.
  - Remove inline `<body style="opacity:0">`.
  - Inject `<main id="main">` landmark and skip link.
- **Acceptance Criteria**:
  - Page renders seamlessly in both light and dark themes.
  - FOUC eliminated via `.is-loaded` pattern.
  - Typography adheres strictly to fluid type scale tokens.

---

### Page 9: `platform/roadmap/index.html` (Milestone Roadmap)
- **Surface Mode**: Read
- **Layout & Structure**: Vertical milestone timeline, status badges (Completed, In Progress, Planned), feature release cards.
- **File Scope**: `platform/roadmap/index.html`, `assets/css/roadmap.css`, `assets/js/roadmap.js`
- **Accessibility & Contrast**:
  - Inject missing `<main id="main">` landmark and top skip link.
  - Tokenize timeline vertical spine (`2px solid var(--border-subtle)`).
  - Replace 17 hardcoded hex colors in `roadmap.css` with semantic tokens.
- **Acceptance Criteria**:
  - Timeline renders cleanly across light and dark theme modes.
  - Landmark navigation works seamlessly in screen readers.
  - Milestone badges achieve ≥4.5:1 contrast.

---

### Page 10: `platform/whats_new/index.html` (Changelog / Release Log)
- **Surface Mode**: Read
- **Layout & Structure**: Release log header banner, version milestone cards, feature highlight lists.
- **File Scope**: `platform/whats_new/index.html`, `assets/css/new.css`
- **Accessibility & Contrast**:
  - Upgrade header banner subtitle text contrast from 2.32:1 to `--text-muted` (≥4.5:1).
  - Remove 3 inline `style="..."` attributes from HTML markup.
  - Fix dark mode background leaks where dark container backgrounds persisted in light theme.
- **Acceptance Criteria**:
  - Header banner text fully legible in light and dark modes.
  - Zero dark mode color leaks.
  - Release log card layout responsive and accessible.

---

### Page 11: `data/verse/discover/index.html` (Symbol Discover Catalog)
- **Surface Mode**: Operate
- **Layout & Structure**: High-density symbol catalog grid, filter drawer, virtualized DOM symbol list, boot spinner.
- **File Scope**: `data/verse/discover/index.html`, `assets/css/search.css`, `assets/js/search-modules/rendering.js`
- **Accessibility & Contrast**:
  - Add `aria-live="polite"` and `aria-busy="true"` status attributes to boot loading spinner.
  - Remove `aria-hidden="true"` from symbol card character container (`.scc`) in `rendering.js:113` so screen readers can announce raw symbol characters.
- **Acceptance Criteria**:
  - Boot loading status announced to assistive technologies.
  - Symbol characters accessible to screen reader users.
  - Virtualized catalog performance remains fast with zero frame drops.

---

### Page 12: `data/verse/scope/index.html` (Detail Scope Viewer)
- **Surface Mode**: Read
- **Layout & Structure**: Scope detail container card, metadata key-value grid, monospace code/schema viewer block (`--font-mono`).
- **File Scope**: `data/verse/scope/index.html`, `assets/css/modern-styles.css`
- **Accessibility & Contrast**:
  - Inject missing `<main id="main">` landmark tag around scope viewer card.
  - Add top skip link.
  - Fix missing heading hierarchy by adding `<h2>` headings for detail sections.
- **Acceptance Criteria**:
  - Scope detail view properly structured with landmark and heading regions.
  - Code/metadata viewer legible with tokenized font and background colors.
  - WCAG AA contrast verified.

---

## 4. Summary Matrix of Page Scope & Changes

| Page Surface | Mode | Key Changes | Files Touched | Contrast & Accessibility Fixes |
| :--- | :--- | :--- | :--- | :--- |
| `index.html` | Persuade | Hero CTA, badge contrast, landmark inject | `index.html`, `home.css` | `.btn-primary` `#0d9488` (4.88:1), skip link |
| `home/` | Persuade | Card grid, FOUC removal, token purge | `home/index.html`, `home.css`, `home.js` | `.is-loaded` pattern, remove opacity:0 |
| `search/` | Operate | Delete overrides, container query grid | `search/index.html`, `search.css`, delete `search-compact-overrides.css` | Visible focus rings, aria-live counter |
| `setting/` | Operate | Fix switch ARIA bug, strip 10 inline styles | `setting/index.html`, `setting.css`, `language.js` | Fix `#auto-update-switch` aria-hidden |
| `community/` | Read | Hub cards, strip inline styles | `community/index.html`, `new.css` | `<main id="main">` landmark, skip link |
| `community/contact/` | Read/Operate | Form labels, sub-nav contrast fix | `community/contact/index.html`, `new.css` | Explicit `<label for>`, sub-nav 4.5:1 |
| `community/report/` | Read/Operate | Input binding, motion guard | `community/report/index.html`, `report.css` | Label `#report-page-custom`, empty H1 fix |
| `platform/about/` | Persuade | Story layout, theme fix | `platform/about/index.html`, `about.css` | Dark theme rules fix, FOUC removal |
| `platform/roadmap/` | Read | Milestone timeline, landmark inject | `platform/roadmap/index.html`, `roadmap.css`, `roadmap.js` | Tokenize timeline spine, skip link |
| `platform/whats_new/` | Read | Banner contrast fix, strip inline styles | `platform/whats_new/index.html`, `new.css` | Banner text contrast 2.32:1 → 4.5:1 |
| `data/verse/discover/` | Operate | Boot spinner ARIA, symbol text unhide | `discover/index.html`, `search.css`, `rendering.js` | `aria-live` spinner, unhide `.scc` text |
| `data/verse/scope/` | Read | Detail viewer layout, heading hierarchy | `scope/index.html`, `modern-styles.css` | `<main id="main">` landmark, H2 headings |

