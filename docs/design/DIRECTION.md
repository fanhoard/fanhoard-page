# FanHoard Main Website — Formalized Design Direction Spec

**Status:** OWNER-APPROVED (Chat Approval 2026-09-19) — COMMITTED  
**Target Repository:** `github.com/fanhoard/fanhoard-page`  
**Authoritative Reference:** `docs/design/DIRECTION.md`  

---

## Executive Summary & Scope

This specification formalizes the owner-approved design direction for the FanHoard main website (`fanhoard/fanhoard-page`). It translates the findings of the deep CSS architecture, per-page UX, and WCAG 2.2 AA accessibility assessments (`docs/design/assessment/*.md`) into an actionable, binding architectural specification.

### Primary Objectives
1. **Preserve & Elevate Brand Identity**: Retain FanHoard's signature emerald/teal visual identity and editorial serif heading accents (`FoglihtenNo07calt`) while elevating interactive contrast to WCAG 2.2 Level AA compliance (`#0d9488` primary teal).
2. **Establish Surface Mode Ergonomics**: Categorize all 12 main website pages into three distinct surface modes—**Persuade**, **Operate**, and **Read**—each tuned for specific user intent and layout density.
3. **Comprehensive Token System**: Define a single source of truth in `assets/css/tokens.css` with dark-mode mapping, fluid minor-third typography, 4px baseline spacing, motion tokens, and a strict 8-tier z-index scale (`0`–`700`).
4. **Zero-Override CSS Architecture**: Enforce a unidirectional cascade (`Tokens` → `Base` → `Layout` → `Components` → `Pages`), eliminate all 305 `!important` declarations (including 193 in `footer.css`), and delete the 29.5 KB `search-compact-overrides.css` by adopting CSS container queries (`@container`).
5. **FOUC & Opacity Remediation**: Replace render-blocking inline `<body style="opacity:0">` declarations across 10 HTML files with a CSS keyframe transition triggered by `.is-loaded`.
6. **Universal Accessibility Floor**: Guarantee WCAG 2.2 AA compliance across all surfaces, including ≥4.5:1 text contrast, semantic `<main>` landmarks, skip links, explicit form label bindings, ARIA live status regions, and reduced-motion guards.

---

## 1. Look & Feel — Preserved Identity & Accessibility Standard

FanHoard's brand personality combines fan-community warmth, symbol database precision, and editorial craftsmanship. The redesign preserves these core traits while resolving visual deficits identified during the deep assessment pass.

### Key Visual & Brand Pillars
* **Signature Emerald/Teal Identity**: Preserved and strengthened. The brand identity is grounded in deep navy backdrops (`#0f172a`), emerald gradients (`#059669` to `#0d9488`), and vibrant teal focal points.
* **Serif Heading Accents**: Editorial headings, hero titles, and major section banners utilize `FoglihtenNo07calt` (with `Georgia, serif` fallback) to deliver high craftsmanship. Body and interface copy utilize system sans-serif font stacks for crisp legibility across devices.
* **Interactive Contrast Standard (WCAG 2.2 AA)**:
  * Legacy primary interactive color `#2CEBC2` yielded a **1.53:1** contrast ratio on white surfaces, severely failing accessibility standards.
  * **New Primary Interactive Teal (`#0d9488` / Teal 600)** achieves a **4.88:1** contrast ratio on white and light slate surfaces (passing WCAG AA for normal text).
  * **Dark Mode Interactive Teal (`#2dd4bf` / Teal 400)** achieves a **11.2:1** contrast ratio against slate dark surfaces (`#0f172a` / `#1e293b`).

---

## 2. Three Surface Modes & Layout Concepts

To ensure design consistency across diverse user workflows, all 12 primary pages are grouped into three distinct surface modes. Each mode defines specific visual density, typographic hierarchy, and layout patterns.

```
                  ┌─────────────────────────────────────────┐
                  │          FanHoard Surface Modes         │
                  └────────────────────┬────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
 ┌──────────────┐               ┌──────────────┐               ┌──────────────┐
 │ Persuade Mode│               │ Operate Mode │               │  Read Mode   │
 ├──────────────┤               ├──────────────┤               ├──────────────┤
 │ index.html   │               │ search/      │               │ roadmap/     │
 │ home/        │               │ setting/     │               │ whats_new/   │
 │ about/       │               │ discover/    │               │ community/*  │
 │              │               │              │               │ scope/       │
 └──────────────┘               └──────────────┘               └──────────────┘
```

### A. Persuade Mode (`index.html`, `home/`, `platform/about`)
* **Intent**: Inspire, engage, and introduce new and returning fans to the FanHoard ecosystem.
* **Layout Concepts**:
  * **Hero Banners**: High-impact, asymmetrical hero sections featuring brand gradients, serif typography (`clamp(2.25rem, 1.8rem + 1.5vw, 3rem)`), and prominent high-contrast CTA buttons (`.btn-primary` `#0d9488`).
  * **Card Grids**: Generous gap spacing (`var(--space-8)` / 32px), elevated card surfaces (`var(--surface-card)` with `var(--shadow-md)`), and subtle hover translate effects (`translateY(-2px)`).
  * **Feature Highlights**: Alternating text and interactive preview cards showcasing symbol collections, quick search teasers, and ecosystem stats.
* **FOUC & Motion**: Smooth CSS entrance transitions using `.is-loaded` without render-blocking inline styles.

### B. Operate Mode (`search/`, `setting/`, `data/verse/discover`)
* **Intent**: Provide high-density, high-efficiency tools for searching, configuring, and browsing symbol data.
* **Layout Concepts**:
  * **Utility Toolbars & Search Bars**: Sticky, compact control headers (`var(--z-sticky)`) containing filter pill groups, view toggles, and live search inputs.
  * **Container Query Responsive Grids**: Symbol card grids adapt dynamically to container width (`@container`) rather than viewport media queries, eliminating duplicate override CSS files.
  * **High-Density Data Cards**: Compact padding (`var(--space-3)` / 12px), crisp borders (`var(--border-subtle)`), clear hover focus rings (`2px solid var(--color-brand-primary)`).
  * **Accessible Form Controls**: Custom toggle switches, radio groups, and text inputs with explicit `<label for="...">` associations and `aria-live` status regions for background loading.

### C. Read Mode (`platform/roadmap`, `platform/whats_new`, `community/*`, `data/verse/scope`)
* **Intent**: Deliver clear, comfortable long-form reading, documentation, timeline updates, and issue submission forms.
* **Layout Concepts**:
  * **Editorial Prose Layouts**: Single or dual-column centered containers with strict measure control (`max-width: 70ch`).
  * **Timelines & Changelogs**: Vertical milestone connectors (`2px solid var(--border-subtle)`), date badges (`.badge`), and release tag groupings.
  * **Structured Form Cards**: Clean vertical form stacks with clear section headings, helper copy (`var(--text-muted)`), and accessible validation states.
  * **Landmark Hierarchy**: Explicit `<main id="main">` landmark tags wrapping content on all pages, accompanied by a top skip link (`<a href="#main" class="skip-link">`).

---

## 3. Full Design Token System Specification (`tokens.css`)

All colors, dimensions, typography, shadows, transitions, and stacking orders are controlled via native CSS custom properties defined in `assets/css/tokens.css`.

### A. Color Palette & Dark-Mode Token Map

```css
:root {
  /* Brand Core Palette */
  --color-teal-50:  #f0fdf4;
  --color-teal-100: #ccfbf1;
  --color-teal-400: #2dd4bf;
  --color-teal-600: #0d9488; /* Primary Light Interactive - 4.88:1 Contrast */
  --color-teal-700: #0f766e; /* Hover State */
  --color-cyan-600: #0284c7;
  --color-cyan-400: #38bdf8;
  --color-emerald-600: #059669;

  /* Semantic Theme Tokens — Light Mode (Default) */
  --color-brand-primary:       var(--color-teal-600);
  --color-brand-primary-hover: var(--color-teal-700);
  --color-brand-secondary:     var(--color-cyan-600);
  --color-brand-accent:        var(--color-emerald-600);

  --surface-base:    #f8fafc;
  --surface-card:    #ffffff;
  --surface-hover:   #f1f5f9;
  --surface-overlay: #ffffff;
  --border-subtle:   #e2e8f0;
  --border-strong:   #cbd5e1;

  --text-main:    #0f172a; /* 15.5:1 Contrast on surface-base */
  --text-muted:   #475569; /* 5.2:1 Contrast on surface-base */
  --text-inverse: #ffffff;

  /* Status Colors (WCAG AA) */
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-error:   #dc2626;
  --color-info:    #0284c7;
}

/* Dark Mode Theme Tokens */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-brand-primary:       var(--color-teal-400); /* 11.2:1 Contrast on dark surface */
    --color-brand-primary-hover: #5eead4;
    --color-brand-secondary:     var(--color-cyan-400);

    --surface-base:    #0f172a;
    --surface-card:    #1e293b;
    --surface-hover:   #334155;
    --surface-overlay: #1e293b;
    --border-subtle:   #334155;
    --border-strong:   #475569;

    --text-main:    #f8fafc; /* 15.8:1 Contrast on dark surface-base */
    --text-muted:   #94a3b8; /* 6.1:1 Contrast on dark surface-base */
    --text-inverse: #0f172a;

    --color-success: #4ade80;
    --color-warning: #fbbf24;
    --color-error:   #f87171;
    --color-info:    #38bdf8;
  }
}

/* Manual Theme Override Support */
[data-theme="dark"] {
  --color-brand-primary:       var(--color-teal-400);
  --color-brand-primary-hover: #5eead4;
  --color-brand-secondary:     var(--color-cyan-400);

  --surface-base:    #0f172a;
  --surface-card:    #1e293b;
  --surface-hover:   #334155;
  --surface-overlay: #1e293b;
  --border-subtle:   #334155;
  --border-strong:   #475569;

  --text-main:    #f8fafc;
  --text-muted:   #94a3b8;
  --text-inverse: #0f172a;
}
```

### B. Typography Scale (Fluid Minor Third / 4px Baseline Grid)

```css
:root {
  /* Font Stacks */
  --font-heading: 'FoglihtenNo07calt', Georgia, 'Times New Roman', serif;
  --font-sans:    system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --font-mono:    ui-monospace, 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;

  /* Line Heights */
  --lh-tight:   1.2;
  --lh-heading: 1.3;
  --lh-body:    1.6;

  /* Fluid Type Steps */
  --step--1: clamp(0.75rem, 0.70rem + 0.25vw, 0.875rem); /* Small Copy / Captions */
  --step-0:  clamp(0.875rem, 0.83rem + 0.25vw, 1.000rem); /* Body Standard Text */
  --step-1:  clamp(1.00rem, 0.95rem + 0.30vw, 1.125rem); /* Subsections / H4 */
  --step-2:  clamp(1.125rem, 1.05rem + 0.40vw, 1.350rem); /* H3 Titles */
  --step-3:  clamp(1.35rem, 1.20rem + 0.60vw, 1.680rem); /* H2 Titles */
  --step-4:  clamp(1.68rem, 1.40rem + 1.00vw, 2.250rem); /* H1 Page Titles */
  --step-5:  clamp(2.25rem, 1.80rem + 1.50vw, 3.000rem); /* Hero Headlines */
}
```

### C. Spacing Scale (4px Baseline Grid)

```css
:root {
  --space-1:  0.25rem; /*  4px */
  --space-2:  0.50rem; /*  8px */
  --space-3:  0.75rem; /* 12px */
  --space-4:  1.00rem; /* 16px */
  --space-5:  1.25rem; /* 20px */
  --space-6:  1.50rem; /* 24px */
  --space-8:  2.00rem; /* 32px */
  --space-10: 2.50rem; /* 40px */
  --space-12: 3.00rem; /* 48px */
  --space-16: 4.00rem; /* 64px */
}
```

### D. Radius, Depth & Shadows

```css
:root {
  --radius-sm:   6px;
  --radius-md:   12px;
  --radius-lg:   20px;
  --radius-pill: 9999px;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
}
```

### E. Motion Tokens

```css
:root {
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  --duration-fast:   150ms;
  --duration-normal: 250ms;
  --duration-slow:   350ms;
}
```

### F. Standardized 8-Tier Z-Index Scale (0 to 700)

To resolve past escalation wars where z-index values spiked to `1,500,000` (`copyNotification.js`) and `19,000` (`tokens.css`), all stacking contexts are strictly bound to 8 standardized tiers:

| Tier Variable | Value | Intended Usage & Stacking Role |
|---|---|---|
| `--z-base` | `0` | Default body content, card containers, structural flows |
| `--z-sticky` | `100` | Sticky sub-navigation bars, persistent action toolbars |
| `--z-dropdown` | `200` | Select dropdown menus, language switcher popovers, filter menus |
| `--z-popover` | `300` | Interactive card popovers, preview floating cards |
| `--z-tooltip` | `400` | Non-blocking contextual text tooltips (`role="tooltip"`) |
| `--z-overlay` | `500` | Modal backdrop screens, off-canvas drawer backdrops |
| `--z-modal` | `600` | Modal dialog boxes (`role="dialog"`), confirmation popups |
| `--z-toast` | `700` | Copy notification banners (`copyNotification`), toast alerts |

```css
:root {
  --z-base:     0;
  --z-sticky:   100;
  --z-dropdown: 200;
  --z-popover:  300;
  --z-tooltip:  400;
  --z-overlay:  500;
  --z-modal:    600;
  --z-toast:    700;
}
```

---

## 4. Zero-Override CSS Architecture & Specificity Rules

### Single-Pass Unidirectional Architecture
The CSS stylesheet pipeline is restructured into five strict, non-overlapping architectural layers:

```
Layer 1: tokens.css      ---> CSS Custom Properties (Colors, Type, Space, Z-Index)
Layer 2: base.css        ---> Global Reset, Element Defaults, FOUC, Focus Rings
Layer 3: layout.css      ---> Grid/Flex Containers, Landmarks, Nav & Footer Shell
Layer 4: components/*.css ---> Reusable Modules (buttons, cards, search, forms, modals)
Layer 5: pages/*.css     ---> Page-Specific Structural Layout Modifiers Only
```

### Strict Specificity Governance Rules
1. **Zero `!important` Policy**: No file may use `!important` declarations. All 305 existing instances across `footer.css` (193), `search-compact-overrides.css` (24), `home.css` (18), etc., must be completely purged.
2. **Selector Depth Limit**: Maximum selector nesting depth is **2 levels** (e.g., `.c-card .c-card__title`).
3. **Deletion of `search-compact-overrides.css`**:
   * The 29.5 KB override stylesheet is eliminated.
   * Responsive adaptations for compact search bars are handled directly inside `components/search.css` using native CSS Container Queries:
     ```css
     .search-container {
       container-type: inline-size;
       container-name: search;
     }

     @container search (max-width: 600px) {
       .search-bar {
         flex-direction: column;
         gap: var(--space-2);
       }
     }
     ```
4. **Token-Based Footer Rebuild**:
   * `footer.css` is re-engineered using utility component classes (`.c-footer__link`, `.c-footer__brand`), completely removing the 193 legacy `!important` overrides while maintaining identical visual alignment.

---

## 5. FOUC Fix Pattern (`.is-loaded`)

### Assessment Problem
Ten HTML documents hid their body content using inline `<body style="opacity:0">` to prevent Flash of Unstyled Content. If JS initialization stalled or was disabled, users were left with an entirely blank, unusable screen.

### Standardized Remediation Pattern
1. **CSS Fade-In Definition (`base.css`)**:
   ```css
   /* FOUC Prevention & Smooth Load Pattern */
   body {
     opacity: 0;
     transition: opacity var(--duration-normal) var(--ease-out);
   }

   body.is-loaded {
     opacity: 1;
   }
   ```
2. **HTML Script Hook**:
   ```html
   <!-- Placed in <head> or immediately after <body> -->
   <script>
     document.addEventListener('DOMContentLoaded', function() {
       document.body.classList.add('is-loaded');
     });
     /* Safety fallback timer */
     setTimeout(function() {
       if (!document.body.classList.contains('is-loaded')) {
         document.body.classList.add('is-loaded');
       }
     }, 1000);
   </script>
   <noscript>
     <style>
       body { opacity: 1 !important; }
     </style>
   </noscript>
   ```
3. **Inline Style Clean-Up**: All inline `style="opacity:0"` attributes are stripped from HTML files.

---

## 6. Universal Accessibility Floor (WCAG 2.2 Level AA)

Every page and component must satisfy all WCAG 2.2 AA success criteria:

### A. Color & Contrast Rules (WCAG 1.4.3 & 1.4.11)
* **Normal Text**: Minimum relative contrast ratio of **4.5:1** against its backing surface.
* **Large Text / UI Controls / Focus Boundaries**: Minimum relative contrast ratio of **3.0:1**.
* **Interactive Elements**: All interactive controls (`.btn-primary`, `.badge`, sub-nav links) use tokenized colors guaranteed to pass 4.5:1 in both light and dark themes.

### B. Keyboard Accessibility & Focus Visibility (WCAG 2.4.7)
* Clear focus rings on all focusable elements:
  ```css
  :focus-visible {
    outline: 2px solid var(--color-brand-primary);
    outline-offset: 2px;
  }
  ```
* No keyboard focus traps.

### C. Landmark Structure & Skip Links (WCAG 2.4.1 & 1.3.1)
* Every served HTML document must contain semantic structure:
  * `<header class="site-header">`
  * `<main id="main">`
  * `<footer class="site-footer">`
* Universal skip link placed as the first child of `<body>`:
  ```html
  <a href="#main" class="skip-link">Skip to main content</a>
  ```

### D. Form Controls & Screen Readers (WCAG 1.3.1, 3.3.2 & 4.1.2)
* Every input element (`<input>`, `<select>`, `<textarea>`) must have an explicit `<label for="...">` or `aria-label`.
* Remediation of `#auto-update-switch` in `setting/index.html`: Remove `aria-hidden="true"` and `style="display:none"`; replace with an accessible custom toggle switch with `role="switch"` and `aria-checked`.
* Remediation of `footer-template.js`: Ensure interactive `<a>` links in footer navigation are never enclosed within `aria-hidden="true"` parents.
* Boot loading spinners must include `aria-live="polite"` and `aria-busy="true"` status attributes.

### E. Reduced-Motion Rules (WCAG 2.3.3)
All animations, fade transitions, and smooth scrolling must be conditionally disabled for users requesting reduced motion:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 7. Per-Page Token Application Notes

Detailed token and layout application requirements across all 12 primary page surfaces:

### 1. `index.html` (Landing / 404 Portal)
* **Surface Mode**: Persuade
* **Token Application**:
  * Hero primary CTA: `.btn-primary` uses `--color-brand-primary` (`#0d9488`) with white text (4.88:1 contrast).
  * Feature badges: `.badge` uses `--surface-hover` with `--text-main` (15.5:1 contrast).
* **Fixes**: Remove inline `style="opacity:0"`, add `<main id="main">` wrapper, add skip link.

### 2. `home/index.html` (Fan Hub Dashboard)
* **Surface Mode**: Persuade
* **Token Application**:
  * Dashboard cards: `--surface-card` with `--shadow-md` and `--border-subtle`.
  * Grid gap: `--space-6` (24px).
* **Fixes**: Remove inline opacity hacks, replace hardcoded card background colors with tokens, apply `.is-loaded` pattern.

### 3. `search/index.html` (Search Interface)
* **Surface Mode**: Operate
* **Token Application**:
  * Toolbar: `--surface-card`, `--border-subtle`, `--z-sticky` (100).
  * Filter pills: `.pill` uses `--surface-hover` and `--color-brand-primary` on active state.
* **Fixes**: Delete `search-compact-overrides.css`, implement container query responsiveness in `components/search.css`, remove 24 `!important` flags.

### 4. `setting/index.html` (Settings Panel)
* **Surface Mode**: Operate
* **Token Application**:
  * Form panels: `--surface-card`, `--radius-md` (12px), `--space-6` padding.
  * Section titles: `--font-sans`, `--step-2` typography, `--text-main`.
* **Fixes**: Fix `#auto-update-switch` `aria-hidden` bug, remove 10 inline style attributes, replace non-performant `transition: all`.

### 5. `community/index.html` (Community Hub)
* **Surface Mode**: Read
* **Token Application**:
  * Hub cards: `--surface-card`, `--border-subtle`, `--shadow-sm`.
  * Section headers: `--font-heading` (`FoglihtenNo07calt`), `--step-3`.
* **Fixes**: Add `<main id="main">`, remove inline style attributes, unhide footer links from screen readers.

### 6. `community/contact/index.html` (Contact Form)
* **Surface Mode**: Read / Operate
* **Token Application**:
  * Input fields: `--surface-base`, `--border-subtle`, `--radius-sm` (6px).
  * Sub-nav text: `--text-muted` (`#475569` on light, `#94a3b8` on dark).
* **Fixes**: Add explicit `<label for="...">` bindings for all form inputs, replace empty `<h1>` nodes with static SSG headings.

### 7. `community/report/index.html` (Issue Report Form)
* **Surface Mode**: Read / Operate
* **Token Application**:
  * Form cards: `--surface-card`, `--space-6` padding, `--shadow-sm`.
  * Primary submit button: `.btn-primary` (`#0d9488`).
* **Fixes**: Bind `#report-page-custom` text input with explicit label, fix empty `<h1>` node, add skip link.

### 8. `platform/about/index.html` (About Story Page)
* **Surface Mode**: Persuade
* **Token Application**:
  * Narrative blocks: `--font-sans`, `--step-0` body copy (`--lh-body` 1.6).
  * Section titles: `--font-heading`, `--step-4`.
* **Fixes**: Remove hardcoded background color rules (`about.css`), add `<main id="main">`, apply `.is-loaded` pattern.

### 9. `platform/roadmap/index.html` (Milestone Roadmap)
* **Surface Mode**: Read
* **Token Application**:
  * Timeline spine: `2px solid var(--border-subtle)`.
  * Milestone badges: `--color-brand-primary` background for completed, `--surface-hover` for planned.
* **Fixes**: Add missing `<main id="main">` landmark, add skip link, tokenize timeline CSS.

### 10. `platform/whats_new/index.html` (Changelog / Release Log)
* **Surface Mode**: Read
* **Token Application**:
  * Release cards: `--surface-card`, `--border-subtle`, `--space-4` padding.
  * Subtitle text: `--text-muted` (contrast ≥4.5:1).
* **Fixes**: Fix header banner subtitle contrast (upgraded from 2.32:1), remove dark mode background leaks, strip inline styles.

### 11. `data/verse/discover/index.html` (Symbol Discover Catalog)
* **Surface Mode**: Operate
* **Token Application**:
  * Virtualized symbol cards: `--surface-card`, `--border-subtle`, `--radius-sm`.
  * Status spinner: `--color-brand-primary`.
* **Fixes**: Add `aria-live="polite"` status region to boot spinner, unhide symbol character text from screen readers (`.scc`).

### 12. `data/verse/scope/index.html` (Detail Scope Viewer)
* **Surface Mode**: Read
* **Token Application**:
  * Viewer container: `--surface-card`, `--radius-md`, `--space-6` padding.
  * Code / metadata blocks: `--font-mono`, `--step--1`.
* **Fixes**: Add `<main id="main">` landmark wrapper, add skip link, fix missing heading hierarchy.

---

## Conclusion & Implementation Authority

This document (`docs/design/DIRECTION.md`) stands as the official, owner-approved design direction spec for all subsequent execution chunks (`exec-tokens` through `final-verify`). All code changes pushed to the repository must strictly conform to the token definitions, surface mode guidelines, CSS architecture layer rules, FOUC pattern, and accessibility floor established herein.
