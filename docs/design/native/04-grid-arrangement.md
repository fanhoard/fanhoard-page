# FanHoard Native Design Assessment: Grid & Arrangement Audit

## Executive Summary

This audit evaluates the grid and layout arrangement regressions across the FanHoard main website (`fanhoard-page`), comparing the current state on `main` against the pre-layout baseline commit (`fc45afa` / `7c613cf~1`, immediately prior to `chunk-01-foundation`).

The site owner reported that content grids that previously arranged in neat, predictable rows (where content item counts mapped cleanly to uniform rows) now display messily or randomly, with broken card sizing, awkward vertical stacking, bloated header heights, and asymmetric row wraps.

### Key Finding & Root Cause
The loss of neat row-based arrangements stems from **indiscriminate application of generic global layout utility classes (`.fv-hero`, `.fv-section`, `.fv-card`, `.fv-setting-row`, `.stack-md`) over specialized page components**, creating three major structural defects:

1. **Header & Sticky Utility Pollution**: Adding `.fv-hero` (`padding: 40px 0; text-align: center`) to the sticky `.search-header` expanded a compact search bar into an 80px+ vertical block, pushing filter pills and search results offscreen.
2. **Double-Padding & Card Wrapper Inflation**: Applying `.fv-section` (`padding: 32px 0`) alongside `.fv-card` (`padding: 24px`) or `.section` on cards inflated component padding (e.g., home carousel `.item-card` inflated from 16px to 24px padding on 140px-wide cards; setting sections and platform cards received double vertical padding).
3. **Broken Row Density & Flex Wrapping**: Side-by-side action buttons (Community index, setting rows) were replaced with `.stack-md` (`flex-direction: column`), forcing 1-column vertical stacking. Metadata grids and feed containers used unconstrained `auto-fit`/`auto-fill` rules with `justify-items: center`, causing 3-item rows to wrap asynchronously (2 items on Row 1, 1 stretched item on Row 2).

---

## Baseline vs. Current Grid Comparison Table

| Page / Component | Baseline Pattern (`fc45afa`) | Current Pattern (`HEAD`) | Nature of Regression | Exact Restoration Target |
| :--- | :--- | :--- | :--- | :--- |
| **Home Hero Buttons** | `display: flex; justify-content: center; gap: var(--space-4); flex-wrap: wrap;` | Same CSS, wrapped in `.hero-btns` inside `.fv-hero` | Intact layout, but vertical spacing inflated by hero section padding | Maintain `.hero-btns` horizontal flex cluster with `gap: 16px`; keep 3 buttons in neat row on desktop. |
| **Home Features Grid** | `.features-grid`: `grid-template-columns: repeat(3, 1fr); gap: 24px;` (@media <=768px: `1fr; gap: 16px`) | `<div class="features-grid grid-3">` | Functional, but `.grid-3` class overrides mobile gap and section rhythm | Keep `grid-template-columns: repeat(3, 1fr)` at desktop, 1 col at <=768px. Explicit 24px gap on desktop, 16px on mobile. |
| **Home Carousels & Cards** | `.carousel-track`: `display: flex; gap: 16px; overflow-x: auto;`. `.item-card`: `width: 140px; padding: 16px 12px; flex-shrink: 0;` | `card.className = 'item-card fv-card'` in `assets/js/home.js` | `.fv-card` added `padding: 24px`, inflating 140px card dimensions and overflowing text | Strip `.fv-card` class from `.item-card` in JS renderer. Enforce fixed `width: 140px; padding: 16px 12px; flex-shrink: 0; gap: 8px;`. |
| **Search Sticky Header** | `.search-header`: compact sticky bar (`padding: 12px 16px; background: surface`) | `.search-header.fv-hero` (`padding: 40px 0; text-align: center`) | Sticky header inflated by 80px+ vertical hero padding, pushing results down | Remove `.fv-hero` class from `.search-header`. Reinstate compact `padding: 12px 16px` sticky search container. |
| **Search Results Grid** | `#searchResults`: single column `.sc` cards with `margin-bottom: 10px; padding: 18px 20px;` | `#searchResults` inside `.search-main-layout` inside `.fv-main` | Functional, but structural shell alignment broken by hero height above | Keep single-column stacked card list for search results with `gap: 12px` and `padding: 16px 20px`. |
| **Settings Section Cards** | `<section.con>`: `padding: 20px; border-radius: 16px; background: card` | `<section class="fv-section fv-card">` | Double padding (32px section + 24px card) creates oversized empty cards | Remove `.fv-section` from `<section>`. Retain single card container with `padding: 20px` and `margin-bottom: 24px`. |
| **Settings Item Rows** | `.m5`: `margin-bottom: 16px;` containing label left and control right | `<div class="m5 fv-setting-row"><div class="w" style="width: 100%">` | `.fv-setting-row` plus inline full-width style broke clean label/control flex alignment | Restore clean flex row: `display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid border-subtle;`. |
| **Community Action Buttons** | `.hub-actions`: `display: flex; gap: 16px; flex-wrap: wrap;` (side-by-side row) | `<section class="fv-section stack-md">` | Neat 2-button horizontal row destroyed; forced into 1-column vertical stack with 32px section padding | Reinstate 2-column grid row: `display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;` on desktop; 1 col on mobile <=480px. |
| **Platform Content Sections** | `.section`: `padding: 24px; border-radius: 20px; margin-bottom: 24px;` | `<section class="fv-section section">` inside `.stack-md` | Redundant 32px vertical padding trapped inside 24px card containers | Remove `.fv-section` from `.section`. Use single card padding (`24px`) and `margin-bottom: 24px` or `gap: 20px` between cards. |
| **Discover Feed Grid** | `.card-content-container`: `grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); justify-items: center;` | Same CSS, wrapped in `.container-lg` in `index.html` | `auto-fill` + `justify-items: center` leaves wide empty track gaps and centers incomplete rows | Change to responsive column grid: `repeat(auto-fit, minmax(160px, 1fr))` with `justify-items: stretch;` so cards fill rows neatly. |
| **Scope Metadata Grid** | `.scope-metadata-grid`: `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));` | Same CSS, but card wrapped in `fv-section fv-card` | 3 items wrap unevenly on tablet/medium screens (2 on Row 1, 1 stretched on Row 2) | Enforce explicit fixed columns: `grid-template-columns: repeat(3, 1fr)` for >=768px; `1fr` for <768px. Remove `.fv-section` from card. |
| **Footer Grid** | `<footer class="footer-minimal">` with `.footer-inner` (`max-width: 1200px; padding: 48px 24px 32px;`) | `<footer class="fv-footer footer-minimal"><div class="container-full"><div class="footer-inner">` | `.container-full` adds redundant outer horizontal padding (16px) around `.footer-inner` | Remove `.container-full` wrapper from `footer-template.html`. `.footer-inner` directly manages `max-width: 1200px` and padding. |

---

## Detailed Component & Page Analysis

### 1. Home Page (`/home/index.html` & `assets/css/home.css`)
- **Carousel & Card Layout**:
  - *Baseline*: `buildItemCard` in `assets/js/home.js` assigned `card.className = 'item-card'`. `.item-card` in `assets/css/home.css` specified `width: 140px; padding: var(--space-4) var(--space-3); flex-shrink: 0;`.
  - *Current Failure*: Commit `44fc141` modified JS to assign `card.className = 'item-card fv-card'`. In `assets/css/layout.css`, `.fv-card` defines `padding: var(--space-6, 24px)`. Applying 24px padding to a 140px wide card reduced internal content width to 92px, forcing text labels to truncate aggressively and causing vertical card bloating inside `.carousel-track`.
  - *Restoration Target*: Remove `fv-card` from JS emission in `assets/js/home.js`. Preserve explicit card dimensions in CSS:
    ```css
    .item-card {
      width: 140px;
      padding: var(--space-4) var(--space-3);
      flex-shrink: 0;
      border-radius: var(--radius-lg);
      background-color: var(--surface-card);
      border: 1px solid var(--border-subtle);
    }
    ```

- **Features Grid**:
  - *Baseline*: `.features-grid` used `display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-6);`.
  - *Current State*: HTML added class `grid-3`. `.grid-3` in `layout.css` sets `gap: 16px` on mobile and `24px` on desktop.
  - *Restoration Target*: Keep 3-column equal grid on desktop (`repeat(3, 1fr)`) breaking to 1 column at <=768px.

---

### 2. Search Page (`/search/index.html` & `assets/css/search.css`)
- **Sticky Search Header**:
  - *Baseline*: `#search-sticky` held `.search-header` with compact sticky padding (`12px 16px`).
  - *Current Failure*: The layout refactor added class `fv-hero` to `.search-header` (`<div class="search-header fv-hero">`). `.fv-hero` in `layout.css` applies `padding-top: 40px; padding-bottom: 40px; text-align: center;`. This transformed a sticky top navigation search bar into a 100px+ hero banner that sticks to the top of the viewport, obscuring page content and forcing search filter pills offscreen.
  - *Restoration Target*: Strip `fv-hero` from `.search-header` in `/search/index.html`. Restore clean, compact sticky bar dimensions:
    ```css
    .search-header {
      padding: 12px 16px;
      background: var(--surface-page);
      border-bottom: 1px solid var(--border-subtle);
    }
    ```

- **Search Results Cards (`.sc`)**:
  - *Baseline & Current*: Search cards `.sc` display as full-width flex cards stacked vertically in `#searchResults`. The single-column row stack is structurally sound, but requires standard 12px vertical spacing.

---

### 3. Settings Page (`/setting/index.html` & `assets/css/setting.css`)
- **Section Cards & Setting Rows**:
  - *Baseline*: Settings sections were clean cards containing `.m5` row containers. Each row held a label on the left and a control button or link on the right.
  - *Current Failure*: Each `<section>` was converted to `<section class="fv-section fv-card">`. `.fv-section` applies 32px top/bottom padding; `.fv-card` applies 24px padding. Rows were given `class="m5 fv-setting-row"` with an inner `<div class="w" style="width: 100%">`. This created double vertical padding and forced full-width flex child expansion that misaligns toggle switches and language triggers.
  - *Restoration Target*: Strip `.fv-section` from settings `<section>` elements. Maintain a single card wrapper with 20px padding. Standardize setting rows without inline width hacks:
    ```css
    .setting-section {
      background: var(--surface-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
      margin-bottom: var(--space-6);
    }
    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--border-subtle);
    }
    .setting-row:last-child {
      border-bottom: none;
    }
    ```

---

### 4. Community Hub & Forms (`/community/index.html`, `/community/contact/`, `/community/report/`)
- **Hub Action Buttons**:
  - *Baseline*: `community/index.html` arranged "Contact Us" and "Report Issue" action buttons side-by-side in a tidy row via `.hub-actions` (`display: flex; gap: 16px; flex-wrap: wrap;`).
  - *Current Failure*: `.hub-actions` was removed and replaced with `<section class="fv-section stack-md">`. `.stack-md` enforces `flex-direction: column; gap: 16px;`, destroying the neat 2-button horizontal row and forcing full-width vertical stacking with 32px section padding.
  - *Restoration Target*: Re-establish the 2-column action button grid for desktop/tablet:
    ```css
    .community-actions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
      margin-top: var(--space-4);
    }
    @media (max-width: 480px) {
      .community-actions-grid {
        grid-template-columns: 1fr;
      }
    }
    ```

---

### 5. Platform Content Pages (`/platform/about/`, `/platform/roadmap/`, `/platform/whats_new/`, `/platform/license/`, `/platform/privacy/`)
- **Section Card Spacing**:
  - *Baseline*: Content sections (`.section`) were formatted as cards with 24px padding (`var(--space-6)`), 20px border radius, and 24px bottom margin.
  - *Current Failure*: HTML templates wrapped sections as `<section class="fv-section section">` inside `<div class="container-narrow stack-md">`. `.fv-section` injected 32px top/bottom padding into `.section` cards that already had 24px padding, doubling vertical spacing and creating sparse, empty card interiors.
  - *Restoration Target*: Remove `fv-section` class from platform `.section` cards. Retain single 24px card padding and 24px gap between stacked sections.

---

### 6. Discover Page (`/data/verse/discover/index.html` & `assets/css/nav-core-ext.css`)
- **Feed Card Grid**:
  - *Baseline & Current*: `.card-content-container` in `nav-core-ext.css` defines `grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); justify-items: center;`.
  - *Current Failure*: On wider screen resolutions (e.g. 1200px container), `auto-fill` maintains empty 160px column slots even when content count is low (e.g. 2 or 3 cards). Combined with `justify-items: center`, cards float in isolated centered tracks with large gaps between them, failing to form neat, left-aligned rows.
  - *Restoration Target*: Replace `auto-fill` with `auto-fit` and `justify-items: stretch` or responsive fixed column steps:
    ```css
    .card-content-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      justify-items: stretch;
      gap: var(--space-4);
    }
    ```

---

### 7. Scope Detail Viewer (`/data/verse/scope/index.html` & `assets/css/modern-styles.css`)
- **Scope Metadata Grid**:
  - *Baseline*: `.scope-metadata-grid` held 3 metadata items ("Scope ID", "Category", "Encoding").
  - *Current Failure*: `.scope-metadata-grid` uses `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));`. On viewport widths between 600px and 780px, the grid fits exactly 2 items on Row 1 (2 x 220px = 440px), forcing the 3rd item onto Row 2 where `1fr` causes it to expand to 100% full width. This produces an asymmetric, messy 2+1 card row layout.
  - *Restoration Target*: Replace fluid `auto-fit` with explicit breakpoint columns to guarantee uniform row counts:
    ```css
    .scope-metadata-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-4);
    }
    @media (max-width: 768px) {
      .scope-metadata-grid {
        grid-template-columns: 1fr;
      }
    }
    ```

---

### 8. Footer Component (`/assets/template-html/footer-template.html` & `assets/css/footer.css`)
- **Footer Container**:
  - *Baseline*: `<footer class="footer-minimal">` contained `<div class="footer-inner">` (`max-width: 1200px; margin: 0 auto; padding: 48px 24px 32px;`).
  - *Current Failure*: The template was modified to wrap `.footer-inner` with `<div class="container-full">`. In `layout.css`, `.container-full` applies `padding-left: 16px; padding-right: 16px;`. This created redundant outer padding around `.footer-inner`'s existing 24px padding, misaligning footer content relative to main page containers.
  - *Restoration Target*: Remove `<div class="container-full">` from `footer-template.html`. Allow `.footer-inner` to serve as the sole container (`max-width: 1200px; margin: 0 auto; padding: 48px 24px 32px;`).

---

## Grid Restoration Specification Summary

To restore FanHoard's neat, row-based native layout language across all pages, the master plan must enforce the following explicit restoration targets:

1. **Global Utility Isolation**:
   - Never apply `.fv-hero` to sticky search header containers or top bars.
   - Never combine `.fv-section` (`padding: 32px 0`) with `.fv-card` or `.section` card containers.
2. **Component Card Purity**:
   - Keep home carousel `.item-card` free from `.fv-card` class emissions; enforce explicit `width: 140px; padding: 16px 12px; flex-shrink: 0;`.
3. **Structured Grid Rules (Content Count = Row Density)**:
   - **Action Buttons**: 2-column grid (`repeat(2, 1fr)`) on desktop, 1-column on mobile.
   - **Feature Cards**: 3-column grid (`repeat(3, 1fr)`) on desktop, 1-column on mobile <=768px.
   - **Metadata Items**: Explicit 3-column grid (`repeat(3, 1fr)`) on desktop, 1-column on mobile <=768px (eliminating 2+1 asymmetric wrapping).
   - **Discover Cards**: `repeat(auto-fit, minmax(160px, 1fr))` with `justify-items: stretch` (eliminating wide empty column track gaps).
4. **Clean Setting & Form Rows**:
   - Retain 1-column stacked setting section cards with single internal 20px padding; restore clean horizontal flex rows (`justify-content: space-between; align-items: center`) without inline full-width wrappers.
