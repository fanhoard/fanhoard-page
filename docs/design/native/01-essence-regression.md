# FanHoard Design Essence Regression Assessment

**Baseline Commit:** `fc45afa` (State of `main` immediately prior to layout refactor `chunk-01-foundation` `7c613cf`)  
**Current Assessment Head:** `HEAD` (`75ad51e` / latest `main`)  
**Target Document Path:** `docs/design/native/01-essence-regression.md`

---

## Executive Summary: Lost Design Essence Themes

During the `fanhoard-layout` refactor (chunks `chunk-01` through `chunk-17`), the FanHoard main website underwent structural standardization under the `.fv-page-shell` architecture. While this established semantic HTML landmarks and a unified CSS variable scale, the refactor introduced significant visual design regressions. The pre-refactor site possessed a calm, native-app visual essence characterized by subtle overlapping surface layers, natural padding rhythm, compact touch targets, and balanced content density.

The owner reported that the site now reads as overly complex, boxy, and poorly spaced. Our git archaeology confirms five major systemic lost-essence themes across the codebase:

1. **"Double Card / Double Padding" Bloat (Over-application of `.fv-section` and `.fv-card`):**
   Refactor chunks systematically appended `.fv-section` (`padding-top: 32px; padding-bottom: 32px`) and `.fv-card` (`padding: 24px; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-sm)`) onto existing section elements. Stacking these utility classes on top of pre-existing page-level paddings resulted in 64px–88px gaping whitespace holes and nested double card borders.

2. **Destruction of Google-like Compact Hero/Header Geometry:**
   On the Search page (`/search/`), `.search-header` inside `#search-sticky` received `.fv-hero` (`padding: 40px 0`), inflating a sleek 56px sticky Google-like search bar into a 120px+ screen-hogging header block.

3. **Loss of Native Overlapping Surface Elevation:**
   The pre-refactor site used soft background canvases (`--surface-page`) with clean, borderless floating layers. The refactor surrounded almost all text blocks and settings groups with explicit 1px outlined box cards (`.fv-card`), transforming a smooth native-app canvas into a cluttered grid of disconnected boxes.

4. **Form & Button Grid Misalignments:**
   Form field containers in Community Report (`/community/report/`) received `.fv-setting-row` (`display: flex; align-items: center; justify-content: space-between`), forcing vertical form labels and multi-line textareas into side-by-side flex rows. Community Hub (`/community/`) lost its balanced button row cluster in favor of heavy stacked full-width blocks.

5. **Token Bypass & Styling Isolation on Discover Page:**
   The Discover page (`/data/verse/discover/`) was wrapped in `.fv-page-shell` but remains isolated from central tokens in `assets/css/tokens.css`, utilizing hardcoded radii (`18px`, `24px`), custom box shadows, and inline color declarations.

---

## Policy Exemptions (Explicitly Retained Policies)

Per design direction and project policy, the following changes made during the layout refactor are **classified as Intentional Policy (c)** and will **NOT** be reverted:

1. **Inset Shadow Purge:** Inset shadows (`box-shadow: inset ...`) were intentionally removed across CSS and JS to enforce clean modern surface rendering. Elevation will rely on subtle outer borders and low-alpha outer drop shadows (`--shadow-sm`, `--shadow-md`).
2. **Logo-Only Decorative Font Rule:** Decorative display fonts (`FoglihtenNo07` / `FoglihtenNo07calt`) are restricted exclusively to the brand logo mark (`.brand-name`, logo header). Headings (`h1`–`h6`) intentionally consume `var(--font-sans)`.
3. **Canonical Shell Architecture:** The `.fv-page-shell` wrapper, `<header class="fv-header">`, `<main class="fv-main">`, `<footer class="fv-footer">` structure, and skip links stay authoritative. Essence restoration will refine internal spacing and styling *within* this shell.

---

## Classification Criteria

Each visual change identified between baseline (`fc45afa`) and current (`HEAD`) is classified into one of three categories:
- **(a) Essence Lost — Restore:** Visual polish, overlapping layers, compact touch target density, calm spacing rhythm, or native-app feel was replaced with generic boxy/flattened/cramped layout. Needs concrete restoration to baseline target values.
- **(b) Neutral or Improved — Keep:** Structural improvements, clean semantic HTML5 landmarks, dark mode tokenization, accessible focus rings, or performance enhancements.
- **(c) Intentional Policy — Stays:** Inset shadow removals, logo-only display font restriction, and `.fv-page-shell` landmark contracts.

---

## Detailed Per-Page Essence Regression Assessment

### 1. Root Landing / 404 Error Page (`/index.html`)

#### Visual Diff Summary
Baseline (`index.html`) used a direct `.wrap` container inside `.fv-app` with 28px padding, resulting in a perfectly centered 404 dialog. Current main wrapped the content in `.fv-page-shell` > `.fv-header` + `.fv-main` > `<section class="fv-section fv-hero">` > `<div class="container-lg">` > `.wrap`. Adding `.fv-section` (32px padding) and `.fv-hero` (40px padding) inside `.fv-app` (which already centers content with `min-height: 100svh`) added 72px of redundant vertical offset, pushing the error card off-center.

#### Change Classification Table
| Characteristic | Baseline Value (`fc45afa`) | Current Value (`HEAD`) | Classification | Restoration Target |
| :--- | :--- | :--- | :--- | :--- |
| **Spacing Rhythm** | `.fv-app` padding: `28px` | `.fv-app` + `.fv-hero` (`40px 0`) + `.fv-section` (`32px 0`) | **(a) Essence Lost** | Remove `.fv-section` and `.fv-hero` classes from `index.html` main body. Keep single centered 28px padding. |
| **Typography Scale** | `h1` & `h2` used `FoglihtenNo07calt` | `h1` & `h2` use `var(--font-sans)`; `.brand-name` uses `FoglihtenNo07calt` | **(c) Intentional Policy** | Keep `var(--font-sans)` for headings and `FoglihtenNo07calt` for brand badge. |
| **Layering / Layout** | Direct centered `.wrap` | Double wrapper (`container-lg` + `wrap`) inside empty header/footer shell | **(a) Essence Lost** | Remove `container-lg` wrapper inside 404 `.wrap`; let `.wrap` (max 640px) sit directly inside `.fv-main.fv-app`. |
| **Landmark Shell** | Simple `<main id="main">` | Canonical `.fv-page-shell` with `<header>`, `<main>`, `<footer>` | **(b) Neutral / Improved** | Keep `.fv-page-shell` architecture. |

---

### 2. Home Page (`/home/index.html` & `assets/css/home.css`)

#### Visual Diff Summary
Pre-refactor Home featured a native hero banner image (`.hio` / `.img-d1`) over which hero text floated seamlessly. Feature cards (`.feature-card`) and FAQ accordions (`.faq-card`) sat in a calm vertical flow. Refactor added `fv-section fv-hero` to `.hero` (adding 40px top/bottom padding), `container-lg stack-lg` to the content body (adding 24px gap), and `fv-section` to every sub-section (`features-grid` and `faq-grid`), causing cumulative 88px gaping whitespace holes between sections. Furthermore, wrapping `feature-card` and `faq-card` with `.fv-card` added double borders and redundant outer shadows.

#### Change Classification Table
| Characteristic | Baseline Value (`fc45afa`) | Current Value (`HEAD`) | Classification | Restoration Target |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Spacing** | Hero padding: `16px 0 24px` floating over `.hio` banner | Hero class: `hero nob fv-section fv-hero` (`40px` top/bottom padding) | **(a) Essence Lost** | Remove `fv-hero` and `fv-section` from `.hero`. Re-establish `padding: 16px 0 24px` floating over `.hio`. |
| **Section Rhythm** | Section margin: `24px`; inner padding: `0` | `container-lg stack-lg` (24px gap) + `.fv-section` (32px padding per section) | **(a) Essence Lost** | Remove `fv-section` from feature & FAQ sub-sections. Restore standard 24px–32px section rhythm. |
| **Card Layering** | Single card styling on `.feature-card` and `.faq-card` | Double card nesting: `.fv-card.feature-card` & `.fv-card.faq-card` | **(a) Essence Lost** | Strip `.fv-card` class from `.feature-card` and `.faq-card`. Retain clean single surface card styles. |
| **Grid Arrangement** | Features grid: flexible aspect ratio card grid | `.features-grid.grid-3` rigid equal-height layout | **(a) Essence Lost** | Adjust `.features-grid` to responsive flex/grid with max-width card targets (`minmax(260px, 1fr)`). |
| **Typography Scale** | Headings used `var(--font-heading)` (`FoglihtenNo07calt`) | Headings use `var(--font-sans)` | **(c) Intentional Policy** | Keep `var(--font-sans)` for section titles. |

---

### 3. Search Page (`/search/index.html` & `assets/css/search.css`)

#### Visual Diff Summary
Pre-refactor Search featured a Google-like compact sticky search bar (`.search-header` with `padding: 14px 0 12px; height: ~56px`), keeping focus entirely on the search input and results list. Refactor added class `.fv-hero` to `.search-header` inside `#search-sticky`, applying `padding: 40px 0` (40px top + 40px bottom padding). This inflated the sticky search header to over 120px in height, wasting massive vertical screen space and obscuring search results.

#### Change Classification Table
| Characteristic | Baseline Value (`fc45afa`) | Current Value (`HEAD`) | Classification | Restoration Target |
| :--- | :--- | :--- | :--- | :--- |
| **Sticky Header Height** | Compact header padding: `14px 0 12px` (~56px total height) | Injected `.fv-hero` class (`padding: 40px 0`, ~120px total height) | **(a) Essence Lost** | Remove `fv-hero` class from `.search-header`. Reinstate compact `padding: 12px 0` for sticky search bar. |
| **Filter Pills Spacing** | `.filter-pills-row` gap: `8px`; horizontal overflow scroll | Filter pills wrapped in `<nav>` container with extra padding | **(b) Neutral / Improved** | Keep semantic `<nav>` wrapper; verify horizontal scroll performance on mobile. |
| **Demo Pulse Shadow** | `box-shadow: inset 0 0 0 2px ...` | Converted to outer border + `box-shadow: var(--shadow-md)` | **(c) Intentional Policy** | Keep outer border + outer shadow for active demo card. |

---

### 4. Settings Page (`/setting/index.html` & `assets/css/setting.css`)

#### Visual Diff Summary
Pre-refactor Settings had an iOS-style calm grouped settings list. Section labels (`.fv-section-label`) sat cleanly above grouped item cards (`.m5`). Refactor wrapped every `<section>` in `.fv-section.fv-card` (adding 32px section padding + 24px card padding = 56px inner padding per section block) and injected `.fv-setting-row` (`padding: 16px 0; border-bottom: 1px solid var(--border-subtle)`) onto every `.m5` item. This created boxed cards with double-border glitches and excessive inner padding.

#### Change Classification Table
| Characteristic | Baseline Value (`fc45afa`) | Current Value (`HEAD`) | Classification | Restoration Target |
| :--- | :--- | :--- | :--- | :--- |
| **Group Container Box** | Clean borderless setting section groups | Sections wrapped in `.fv-section.fv-card` (56px inner padding per card) | **(a) Essence Lost** | Remove `.fv-section.fv-card` from setting section containers. Use clean grouped card surface with 16px padding. |
| **Row Divider & Spacing** | Single item card (`.m5`) with `padding: var(--space-5)` (16px) | `.m5.fv-setting-row` forcing double borders and misaligned height | **(a) Essence Lost** | Remove `.fv-setting-row` class from inside `.m5`. Restore clean grouped list items with subtle dividers. |
| **Section Label Rhythm** | Section label margin: `16px 0 8px` above group | Section label inside `.fv-card` container with 32px top offset | **(a) Essence Lost** | Position section label cleanly above setting card group (`margin-bottom: 8px`). |
| **Toggle Switch Shadow** | `box-shadow: inset 0 1px 2px ...` | Converted to `border: 1px solid var(--border-subtle)` | **(c) Intentional Policy** | Keep outer border styling on auto-update toggle switch. |

---

### 5. Community Pages (`/community/` x3)

#### 5.1 Community Hub (`/community/index.html`)

| Characteristic | Baseline Value (`fc45afa`) | Current Value (`HEAD`) | Classification | Restoration Target |
| :--- | :--- | :--- | :--- | :--- |
| **Action Buttons Layout** | `.hub-actions` flex cluster / button row | `.fv-section.stack-md` forcing full-width vertical block buttons | **(a) Essence Lost** | Restore `.hub-actions` row cluster layout for action buttons. |
| **Header Section** | Clean intro paragraph (`.con`) | `<section class="fv-section fv-card con">` adding heavy box border & 56px padding | **(a) Essence Lost** | Remove `fv-card` border box from header intro; restore clean text layout. |

#### 5.2 Community Contact (`/community/contact/index.html`)

| Characteristic | Baseline Value (`fc45afa`) | Current Value (`HEAD`) | Classification | Restoration Target |
| :--- | :--- | :--- | :--- | :--- |
| **Form Container** | Single form card (`.pad`) with 20px padding | Injected `container-md stack-md` + `.fv-section.fv-card.con` + `.fv-card.pad.stack-md` | **(a) Essence Lost** | Remove `fv-section` and extra `fv-card` wrappers. Re-establish single clean form card with 20px padding. |
| **Field Rows** | Clean label + select/button row layout | `.setting-item.fv-setting-row` applied indiscriminately | **(a) Essence Lost** | Remove `.fv-setting-row` from contact form containers. |

#### 5.3 Community Report (`/community/report/index.html` & `assets/css/report.css`)

| Characteristic | Baseline Value (`fc45afa`) | Current Value (`HEAD`) | Classification | Restoration Target |
| :--- | :--- | :--- | :--- | :--- |
| **Form Layout & Alignment** | Vertical form layout: labels stacked above textareas/inputs | Injected `.fv-setting-row` (`display: flex; justify-content: space-between`) on form fields | **(a) Essence Lost** | Remove `.fv-setting-row` from vertical form field wrappers (`#report-form`). Restore `stack-sm` vertical label-over-input layout. |
| **Section & Card Bloat** | Single form container card | Header in `fv-section fv-card con`, form in `fv-section fv-card pad` | **(a) Essence Lost** | Remove `fv-section fv-card` nesting; consolidate into a single clean form surface. |
| **Textarea Focus Ring** | `box-shadow: 0 0 0 3px rgba(13,148,136,0.2)` | Tokenized `box-shadow: var(--shadow-focus)` | **(b) Neutral / Improved** | Keep tokenized `var(--shadow-focus)` focus ring. |

---

### 6. Platform Pages (`/platform/` x5: About, Roadmap, What's New, License, Privacy)

#### Visual Diff Summary
In the baseline, platform document sections (`.section` in `about.css`, `roadmap.css`, `whats_new.css`) were styled cards with `padding: 32px` and `margin-bottom: 24px`. Refactor appended `.fv-section` (`padding-top: 32px; padding-bottom: 32px`) onto every `<section class="section">`. This doubled the vertical padding inside each card to 64px, and when combined with `container-narrow stack-md` (16px gap), produced 80px+ gaping gaps between article sections. On Roadmap (`/platform/roadmap/`) and What's New (`/platform/whats_new/`), timeline release cards were broken up into isolated distant boxes.

#### Change Classification Table
| Characteristic | Baseline Value (`fc45afa`) | Current Value (`HEAD`) | Classification | Restoration Target |
| :--- | :--- | :--- | :--- | :--- |
| **Section Inner Padding** | `.section` padding: `32px` | `<section class="fv-section section">` (`32px` + `32px` = `64px` inner padding) | **(a) Essence Lost** | Remove `fv-section` class from article `.section` elements. Restore single `24px–32px` padding. |
| **Inter-Section Gap** | Section margin: `24px` | `stack-md` (16px) + `.fv-section` margins = `80px+` vertical gap | **(a) Essence Lost** | Remove `.fv-section` multiplier; maintain clean `20px–24px` section gap. |
| **Timeline Continuity** | Continuous timeline stream for release cards | Timeline items split into isolated `fv-section` boxed cards | **(a) Essence Lost** | Remove `fv-section` from release log timeline items on Roadmap & What's New. |
| **Skip Links & Landmarks** | Basic page navigation | Standardized skip links and `<main id="fv-main">` landmark | **(b) Neutral / Improved** | Keep accessibility landmarks and skip links. |

---

### 7. Discover Page (`/data/verse/discover/index.html` & `assets/css/discover.css`)

#### Visual Diff Summary
The Discover page was wrapped in `.fv-page-shell` during chunk-12, but its CSS (`assets/css/discover.css`) bypasses central system tokens in `assets/css/tokens.css`. It relies on hardcoded radii (`18px`, `24px`), custom elevation shadows, and hardcoded colors (`#0f172a`, `#e2e8f0`, `#0d9488`).

#### Change Classification Table
| Characteristic | Baseline Value (`fc45afa`) | Current Value (`HEAD`) | Classification | Restoration Target |
| :--- | :--- | :--- | :--- | :--- |
| **Token Utilization** | Hardcoded CSS declarations | Injected `layout.css`, but CSS rules still bypass `tokens.css` | **(a) Essence Lost** | Tokenize `discover.css`: replace hardcoded radii/shadows/colors with `var(--radius-*)`, `var(--shadow-*)`, `var(--color-brand-*)`. |
| **Page Container** | Direct container width | Injected `container-lg` around `#content-loading` | **(b) Neutral / Improved** | Retain `container-lg` for grid alignment once tokenized. |

---

### 8. Scope Page (`/data/verse/scope/index.html` & `assets/css/modern-styles.css`)

#### Visual Diff Summary
Pre-refactor Scope page (`/data/verse/scope/`) used `.scope-shell` with `margin: 24px auto` and clean `.scope-card` containers (`padding: 24px; border-radius: 16px`). Refactor added `.fv-card` onto `.scope-card` inside `.container-md.scope-shell.stack-md`, resulting in double borders and 48px inner padding.

#### Change Classification Table
| Characteristic | Baseline Value (`fc45afa`) | Current Value (`HEAD`) | Classification | Restoration Target |
| :--- | :--- | :--- | :--- | :--- |
| **Card Nesting & Padding** | `.scope-card` padding: `24px` | `.scope-card.fv-card` (adding `24px` + `24px` = `48px` padding + double border) | **(a) Essence Lost** | Remove `.fv-card` class from `.scope-card`. Restore single 24px padding and clean border. |
| **Outer Margin** | `.scope-shell` margin: `24px auto` | `.scope-shell` margin: `0 auto` + `stack-md` | **(a) Essence Lost** | Restore `24px auto` margin for `.scope-shell`. |

---

## Executive Summary Matrix & Restoration Roadmap

| Page Group | Primary Regressions Identified | Recommended Action | Sizing / Risk |
| :--- | :--- | :--- | :--- |
| **Root Landing (`/index.html`)** | Off-center 404 dialog due to `fv-hero` + `fv-section` double padding | Remove `fv-hero` & `fv-section`; restore direct `.wrap` centering | Small / Low Risk |
| **Home (`/home/`)** | Hero height inflated; double card borders on features/FAQ; 88px section gaps | Remove `fv-hero` & `fv-section`; strip `fv-card` from inner cards | Medium / Low Risk |
| **Search (`/search/`)** | Sticky search bar inflated from 56px to 120px+ by `fv-hero` class | Remove `fv-hero` from `.search-header`; restore tight `12px` padding | Small / Low Risk |
| **Settings (`/setting/`)** | Group sections broken into isolated cards; double borders on `fv-setting-row` | Strip `fv-section fv-card` from section wrappers; fix `.m5` item rows | Medium / Low Risk |
| **Community (`/community/*`)** | Report form fields misaligned by flex row; button hub turned to stacked blocks | Remove `fv-setting-row` from vertical form fields; restore `.hub-actions` grid | Medium / Low Risk |
| **Platform (`/platform/*`)** | Article sections doubled padding (64px); timeline continuous stream broken | Strip `fv-section` from `.section` elements & release timeline cards | Medium / Low Risk |
| **Discover (`/discover/`)** | Custom hardcoded radii/shadows bypass central `tokens.css` | Tokenize `discover.css` to consume `var(--radius-*)` & `var(--shadow-*)` | Medium / Low Risk |
| **Scope (`/scope/`)** | Double card border and 48px inner padding on `.scope-card` | Strip `fv-card` from `.scope-card`; restore 24px card padding | Small / Low Risk |

---

## Verification & Build Validation

Before writing findings and committing, the build system was validated in `/tmp/fh-assess-essence`:
```bash
$ npm install
$ npm run build
✓ SSG Build successful (32 pages × 2 languages in 0.26s)
```

**Assessment File Path:** `docs/design/native/01-essence-regression.md`  
**Git Commit Message:** `docs(design): native assessment - essence regression`
