# Native-App Craft Audit: FanHoard Main Website

> **Audit Date:** September 2026  
> **Target Repository:** `fanhoard/fanhoard-page` (Main Web Engine)  
> **Craft Lens:** `/app/.agents/skills/impeccable/SKILL.md`, `reference/craft-floor.md`, `reference/polish.md`, `reference/quieter.md`  
> **Output Deliverable:** `docs/design/native/02-native-craft.md`

---

## Executive Summary: Top 5 Native-App Craft Violations

A native-app experience demands **calm, clean visual hierarchy**, **comfortable spacing rhythm**, **predictable depth elevation**, and **flawless touch ergonomics**. The current FanHoard main website reads overly complex and visually noisy due to systematic craft breakdowns across several core layout layers.

Below are the **Top 5 Critical Craft Problems** identified during the site-wide audit:

1. **Ghost Cards & Heavy Dark Shadows (Elevation Chaos)**
   * **Violation:** Widespread dual-declaration of elevation where cards carry both a `1px` border AND a heavy dark shadow (`box-shadow: var(--shadow-sm)` mapped to `rgba(0, 0, 0, 0.25)` or `0.30` opacity in light mode).
   * **Craft Floor Ban:** `skill-ban-codex-ghost-card` ("Declare elevation once, border or shadow. A 1px border under a wide soft shadow is the ghost card.") and `skill-color-no-glow-halo`. Heavy `25-40%` black opacity on light backgrounds creates muddy visual noise.

2. **Sub-44px Touch Target Deficits (Ergonomic Failures)**
   * **Violation:** Multiple primary and utility controls fall below the WCAG 2.5.5 / iOS / Android 44–48px touch-target floor. Search clear button (`#search-clear-btn`) is sized at `20px × 20px`, carousel navigation arrows (`.ca-icon-wrap`) at `32px × 32px`, category view-all buttons at `42px × 42px`, and mobile nav buttons at `39px × 39px`.
   * **Craft Impact:** Frustrating user experience on mobile devices, missed tap states, and WCAG AA accessibility non-compliance.

3. **Banned Decorative Chrome & Gradient Text**
   * **Violation:** Explicit craft floor rules are violated in header and feedback elements:
     * Gradient text on top navigation titles (`page-title` using `-webkit-text-fill-color: transparent` with `--fv-gradient-teal`), violating `skill-ban-gradient-text`.
     * Unicode glyph text (`▼`) used for accordion state triggers in FAQ sections, violating `skill-ban-glyph-icons`.
     * Colored side-stripe borders (`border-left: 3px solid var(--color-warning)`), violating `skill-ban-side-stripe-borders`.

4. **Grid Breakdown & Arbitrary/Fractional Spacing**
   * **Violation:** Widespread usage of non-4/8px grid values and fallback variables (e.g., `2px`, `5px`, `7px`, `11.3px`, `12.5px`, `13px`, `14px`, `22px`, `25px`, `27px`, `30px`). Furthermore, `index.html` references non-existent tokens like `--space-7`, falling back to `28px` padding and non-grid margins (`18px`, `26px`).
   * **Token Bypass:** Over-rounded arbitrary corner radii in `tokens.css` (`--r-btn: 27px; --r-card: 30px;` and hardcoded `border-radius: 25px`), breaking `--radius-lg` (12px) and `--radius-xl` (16px) standard scales (`skill-ban-codex-over-round`).

5. **Over-Density & Nested Card Containers**
   * **Violation:** Excessive container nesting creates visual clutter. In the Home page, `.feature-card` elements are nested inside a heavy `.section` card container with its own borders and shadows.
   * **Craft Floor Ban:** `skill-ban-identical-card-grids` and `skill-layout-cards-lazy` ("Cards are the lazy container; nested cards are always wrong."). Vertical section breathing room is cramped at `24–32px` instead of a comfortable `48–64px` native section rhythm.

---

## Craft Lens Framework

This audit applies the **Impeccable Design Skill** quality criteria (`SKILL.md` and `reference/craft-floor.md`), evaluating the UI across **Operate** (task execution) and **Persuade** (landing/marketing) surface modes.

### Key Quality Floors Applied:
* **Spacing Rhythm:** Base 4px/8px grid alignment across margins, padding, gaps, and line-heights.
* **Density & Proportion:** Comfortable breathing room (65–75ch measure for reading, distinct hierarchy scale steps, section margins of 48–64px).
* **Visual Noise:** Strict elimination of competing borders, double containers, hard shadows, and unnecessary background overlays.
* **Elevation Coherence:** Single elevation method (border OR shadow, never both); light-mode shadows restricted to soft 5–10% opacity blurs.
* **Typography Feel:** Clear weight steps (400, 500, 600, 700), prohibition of gradient text, tracking floor `-0.04em`.
* **Touch-Target Ergonomics:** Minimum 44px × 44px (preferably 48px × 48px) interactive hit targets.
* **Alignment & Grids:** Neat row-based card and button arrangements, clean grid templates without random wrap breaks.

---

## Detailed Audit by Page Group

### 1. Root Landing & 404 Shell (`index.html`)

* **Surface Mode:** Persuade / Utility
* **Spacing Rhythm:**
  * **Violation:** Style block contains multiple non-grid fallback values due to missing/mismatched custom property definitions.
  * **Exact Findings:** `padding: var(--space-7, 28px)` (note: `--space-7` does not exist in `tokens.css`), `margin-bottom: var(--space-4, 18px)` (fallback 18px breaks 16px grid step), `margin: 0 0 var(--space-2, 10px)` (fallback 10px vs 8px), `margin: 0 0 var(--space-3, 14px)` (fallback 14px vs 12px), `margin-top: var(--space-5, 22px)` (fallback 22px vs 20px).
* **Density & Proportion:**
  * **Findings:** Centered hero wrap has good max-width (`640px`), but badge padding (`4px 12px`) and action gaps (`14px`) are slightly tight.
* **Visual Noise:**
  * **Findings:** Badge border (`1px solid rgba(13, 148, 136, 0.25)`) combined with background color (`--surface-hover`) creates unnecessary subtle noise.
* **Elevation Coherence:**
  * **Findings:** Clean flat elevation. No ghost card borders or heavy shadows present.
* **Typography Feel:**
  * **Findings:** Large display `h1` (`clamp(3.5rem, 2.5rem + 5vw, 4.25rem)`) has strong contrast, but fallback font stacks rely on system generic serif for brand name (`'FoglihtenNo07calt', Georgia, serif`).
* **Touch-Target Sizing:**
  * **Findings:** Action buttons (`.btn-primary`, `.btn-secondary`) have `padding: 12px 24px` (~44px total height), meeting minimum target size.
* **Alignment:**
  * **Findings:** Center alignment is consistent across the hero block.

---

### 2. Main Hub & Dashboard (`home/index.html`, `assets/css/home.css`)

* **Surface Mode:** Persuade / Hub
* **Spacing Rhythm:**
  * **Violation:** Section rhythm is compressed (`margin-bottom: var(--space-6)` = 24px). Hero section padding (`32px 0 16px`) is disproportionately tight compared to desktop viewport scale.
  * **Exact Findings:** Section gaps rely on `var(--space-4)` (16px), making dense card blocks feel crowded.
* **Density & Proportion:**
  * **Violation:** Nested card structure. The `.features-grid` features 3 `.feature-card` elements placed inside a parent `<section>` card that already specifies `padding: 24px`, `border: 1px solid var(--border-subtle)`, and `box-shadow: var(--shadow-md)`.
  * **Craft Floor Ban:** `skill-ban-identical-card-grids` & `skill-layout-cards-lazy`.
* **Visual Noise:**
  * **Violation:** Notice callout (`.notice`) uses a hard 3px left border (`border-left: 3px solid var(--color-warning)`), violating `skill-ban-side-stripe-borders`.
  * **Violation:** FAQ section (`.faq-question::after`) uses character `▼` instead of an SVG icon token, violating `skill-ban-glyph-icons`.
* **Elevation Coherence:**
  * **Violation:** Ghost cards. `.item-card` and `.section` combine `1px solid var(--border-subtle)` with `--shadow-md` and `--shadow-sm`. In `tokens.css`, `--shadow-sm` uses `rgba(0, 0, 0, 0.25)` and `--shadow-md` uses `rgba(0, 0, 0, 0.30)`, creating overly heavy, muddy halos in light mode.
* **Typography Feel:**
  * **Findings:** Heading scale steps (`--step-5`, `--step-2`, `--step-1`) are generally well-proportioned, but `.hero h1` sets `user-select: none`, hindering copyability.
* **Touch-Target Sizing:**
  * **Violation:** Carousel navigation arrows (`.ca-icon-wrap`) measure `32px × 32px`. Category view-all icons (`.view-all-icon`) measure `42px × 42px`. Both are below the 44px touch-target floor.
* **Alignment:**
  * **Findings:** Horizontal carousels scroll smoothly with `scroll-snap-type: x mandatory`, but lack left/right padding alignment with the 1200px main container edge.

---

### 3. Search & Results Feed (`search/index.html`, `assets/css/search.css`)

* **Surface Mode:** Operate
* **Spacing Rhythm:**
  * **Violation:** Pervasive hardcoded odd pixel values breaking the 4/8px grid.
  * **Exact Findings:** Sticky header padding `14px 0 12px`, filter row panel margin `2px`, search card padding `18px 20px`, mobile search card padding `13px 14px` and `12px 13px`, tag padding `3px 10px`, gap `5px`, result card margin `10px`.
* **Density & Proportion:**
  * **Findings:** Search input wrapper (`height: 44px`) is well-proportioned, but filter pills row padding is tight (`padding-block: 4px 12px`), causing tight vertical touch spacing when category pills expand.
* **Visual Noise:**
  * **Violation:** Active filter pills (`.filter-pill.active`) combine `box-shadow: 0 0 0 1px rgba(13, 148, 136, 0.51)`, background color `rgba(13, 148, 136, 0.08)`, bold text, and teal text color, creating visual clutter across filter strips.
* **Elevation Coherence:**
  * **Violation:** Ghost cards. Search result cards (`.sc`) carry `background: rgba(255, 255, 255, 0.97)`, `border: 1px solid rgba(14, 95, 153, 0.07)`, and double shadow `box-shadow: 0 1px 3px rgba(6, 20, 24, 0.04), 0 4px 16px rgba(6, 20, 24, 0.025)`.
* **Typography Feel:**
  * **Findings:** Good legible font sizing (`1.02rem` for card title, `0.89rem` for description), but search card symbol container (`.sc .scc`) has fixed font-size (`24px` desktop / `20px` mobile) regardless of character length.
* **Touch-Target Sizing:**
  * **Violation:** Search clear button (`#search-clear-btn`) has dimensions of `20px × 20px`. This is an extreme touch-target defect (<44px).
* **Alignment:**
  * **Findings:** Category filter pills and type filter pills align horizontally, but lack end-of-scroll right padding, causing the last pill to clip against the viewport edge.

---

### 4. Settings & Preferences (`setting/index.html`, `assets/css/setting.css`)

* **Surface Mode:** Operate
* **Spacing Rhythm:**
  * **Violation:** Inline styles in `setting/index.html` override layout CSS with non-grid values: `section { padding: 2px; padding-top: 5px; }`. Main container uses `padding: 0rem 1rem 2.5rem` (40px bottom padding).
* **Density & Proportion:**
  * **Findings:** Settings card (`max-width: 32rem` = 512px) provides a good focused reading width. Setting rows (`.fv-setting-row`) have comfortable vertical padding (`16px`).
* **Visual Noise:**
  * **Violation:** Inline SVG background images in select controls and buttons (`#language-button`, `.buttons.tap`) contain hardcoded URL-encoded color values (`stroke='%230d9488'`). This prevents CSS custom property overrides and breaks dark mode theme consistency.
* **Elevation Coherence:**
  * **Findings:** Outer settings container uses `box-shadow: var(--shadow-md)` and `border: 1px solid var(--border-subtle)`. Internal rows use flat divider lines (`border-bottom: 1px solid var(--border-subtle)`).
* **Typography Feel:**
  * **Findings:** Clean hierarchy with `h1` (`--step-2`), section labels (`--step-0` bold), and help text (`--step--1`).
* **Touch-Target Sizing:**
  * **Violation:** The auto-update toggle switch track (`.slider`) measures `44px × 24px` with a `20px × 20px` handle. While the track is 44px wide, its vertical height (24px) lacks an expanded invisible touch target padding wrapper, making vertical touch activation tight.
* **Alignment:**
  * **Findings:** Setting row items use flexbox `justify-content: space-between` with clean label and control alignment.

---

### 5. Community Hub, Contact & Report (`community/*`, `assets/css/report.css`)

* **Surface Mode:** Operate / Forms
* **Spacing Rhythm:**
  * **Violation:** Report form textarea and text input elements specify `min-height: 90px`, submit button has `margin-top: var(--space-6)` (24px).
  * **Non-grid px in CSS:** `assets/css/report.css` contains `1px`, `2px`, `3px`, `90px`.
* **Density & Proportion:**
  * **Findings:** Form layout inside `.container-md` (max-width 960px) feels overly stretched on wide desktop monitors for simple 2-field report forms. Should use `.container-narrow` (720px).
* **Visual Noise:**
  * **Violation:** Form inputs feature dual focus indicators (`border-color: var(--color-brand-primary)` AND `box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.2)`).
* **Elevation Coherence:**
  * **Findings:** Submit button uses hover transform (`translateY(-1px)`) with shadow (`0 4px 12px rgba(13, 148, 136, 0.25)`). Form container uses flat card style.
* **Typography Feel:**
  * **Findings:** Good label readability (`font-size: var(--step-0)`), optional badge (`.report-optional`) uses relative size `0.85em`.
* **Touch-Target Sizing:**
  * **Findings:** Form inputs (`padding: 12px 16px`, height > 44px) and submit button (`padding: 12px 24px`, height ~48px) meet ergonomic standards.
* **Alignment:**
  * **Findings:** Clean stack orientation (`.stack-md` with 16px gap).

---

### 6. Platform Pages (`platform/*`, `about.css`, `roadmap.css`, `new.css`)

* **Surface Mode:** Read / Persuade
* **Spacing Rhythm:**
  * **Violation:** Inconsistent section spacing across platform sub-pages:
    * `about.css`: `main` bottom margin `var(--space-12)` (48px), section padding `var(--space-8)` (32px), section margin-bottom `var(--space-6)` (24px).
    * `roadmap.css`: `container` padding `var(--space-2) var(--space-5) var(--space-16)` (8px top, 20px sides, 64px bottom). Note: 20px side padding breaks 16/24px container grid.
    * `new.css`: `whats-new-container` padding uses 20px sides (`var(--space-5)`).
* **Density & Proportion:**
  * **Findings:** `about.css` container max-width is set to `900px`, which is comfortable for reading. `roadmap.css` and `new.css` use `max-width: 720px` (`--fv-container-sm`).
* **Visual Noise:**
  * **Violation:** In `new.css`, legacy heading styling applies left margins and display flex: `h1 { margin: 0 0 5px 20px; }` and `h1 span { margin: 0 0 3px 18px; }` (arbitrary 5px, 20px, 3px, 18px spacing).
* **Elevation Coherence:**
  * **Violation:** Ghost cards in `.section` (`about.css`) and `.roadmap-header` / `.wn-release` (`roadmap.css`, `new.css`): cards combine `border: 1px solid var(--border-subtle)` and `box-shadow: var(--shadow-sm)` / `var(--shadow-md)`.
* **Typography Feel:**
  * **Findings:** High body text line-height (`1.72`), providing good reading comfort for documentation.
* **Touch-Target Sizing:**
  * **Findings:** In-text links have adequate inline padding, but lack offset underline (`text-underline-offset: 3px` in roadmap vs default in about).
* **Alignment:**
  * **Findings:** Single-column stacked card alignment is consistent.

---

### 7. Discover Feed & Sub-Nav (`data/verse/discover/index.html`, `nav-core-ext.css`)

* **Surface Mode:** Operate / Catalog
* **Spacing Rhythm:**
  * **Violation:** Pervasive bypass of central spacing tokens. Hardcoded non-grid values throughout `nav-core.css` and `nav-core-ext.css`:
    * `header`: `margin-bottom: 30px` (30px vs 32px token).
    * `nav`: `margin-top: 7px` (7px vs 8px token).
    * `.logo`: `padding: 20px 0 0`, `margin-left: 10px`.
    * `.navbar-toggle`: `top: 25.3px` (fractional pixel value!).
    * `main`: `margin-top: 30px`, `margin-bottom: 80px`.
    * `button-content`: `margin: 8px 0`, `padding: 13px 17px`, `height: 60px`.
* **Density & Proportion:**
  * **Violation:** Discover feed items (`.button-content`) use fixed `height: 60px` with font size `21px`. Discover cards (`.card`) use fixed dimensions `160px × 222px` with rigid media query scaling (`145px × 210px` on mobile), causing text truncation (`.card-title` at `13px`, `.card-description` at fractional `11.3px`).
* **Visual Noise:**
  * **Violation:** Sub-navigation container (`#sub-buttons-container`) applies hardcoded `border-radius: 25px` and `border: 1px solid rgba(166, 187, 211, 0.2)`. Nav bar uses a `0.8px` hardcoded border line (`border-bottom: 0.8px solid rgba(13,148,136,0.3)`).
* **Elevation Coherence:**
  * **Violation:** Complete bypass of central radius tokens (`--radius-lg`, `--radius-xl`). Replaces tokens with arbitrary over-rounded values `--r-btn: 27px` and `--r-card: 30px` (`skill-ban-codex-over-round`).
* **Typography Feel:**
  * **Violation:** Fractional font size `.card-description { font-size: 11.3px; }` and hardcoded logo font size `26px`.
* **Touch-Target Sizing:**
  * **Violation:** Mobile category navigation buttons (`nav ul li button`) have tight vertical padding (`padding: 11px 13px`, font-size `0.9em`), leading to ~36px height touch targets on viewports <320px.
* **Alignment:**
  * **Violation:** Grid containers (`.button-content-container` and `.card-content-container`) use `repeat(auto-fill, minmax(100px, 1fr))` with `gap: 5px` and `padding: 1rem 5px`, producing misaligned, uneven row edges compared to the standard 1200px page grid.

---

### 8. Scope Detail Viewer (`data/verse/scope/index.html`, `modern-styles.css`)

* **Surface Mode:** Read / Detail
* **Spacing Rhythm:**
  * **Findings:** Uses standard container `.container-md.scope-shell` with `padding: 0 var(--space-4)` and `.stack-md` (16px gap).
* **Density & Proportion:**
  * **Findings:** Scope metadata grid (`.scope-metadata-grid`) uses `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))` with `gap: var(--space-4)`, providing clean proportioning.
* **Visual Noise:**
  * **Violation:** In `modern-styles.css`, bottom navigation items use fractional border widths: `.svg-wrapper::before { border: 1.5px solid var(--color-brand-primary); }`.
* **Elevation Coherence:**
  * **Findings:** Cards use soft shadow `0 1px 3px rgba(0, 0, 0, 0.05)` with `1px solid var(--border-subtle)`.
* **Typography Feel:**
  * **Findings:** Code block (`.scope-code-block`) uses monospace font stack (`--font-mono`), which is legitimate here for JSON metadata (`skill-reflex-mono-as-technical` allowed for code/data).
* **Touch-Target Sizing:**
  * **Violation:** Bottom nav labels (`.nav-item .label`) use fractional font size `12.5px`. Nav item wrapper has height `42px` (`--nav-item-h: 42px`), falling below 44px floor.
* **Alignment:**
  * **Findings:** Neat key-value vertical stack alignment.

---

## Prioritized Master Craft Violations

| Priority | Category | Violation Description | Location / Files Affected | Craft Rule Reference |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | **Touch Ergonomics** | Sub-44px touch targets on primary controls (`20px` clear button, `32px` carousel arrows, `42px` view-all icons, `42px` nav wrappers). | `assets/css/search.css`, `assets/css/home.css`, `assets/css/modern-styles.css` | WCAG 2.5.5 / Impeccable Floor |
| **P0** | **Elevation** | Ghost cards (dual declaration of `1px` border AND heavy `25–40%` black dark shadow). | `assets/css/home.css`, `assets/css/search.css`, `assets/css/about.css`, `assets/css/tokens.css` | `skill-ban-codex-ghost-card` |
| **P1** | **Banned Features** | Gradient text on page titles (`-webkit-text-fill-color: transparent`), character glyph icons (`▼`), colored side-stripe borders (`border-left`). | `assets/css/top-navigation-bar.css`, `assets/css/home.css` | `skill-ban-gradient-text`, `skill-ban-glyph-icons`, `skill-ban-side-stripe-borders` |
| **P1** | **Spacing & Tokens** | Non-4/8px grid values (5px, 7px, 13px, 14px, 22px, 25px, 28px, 30px), missing token fallbacks (`--space-7`). | `index.html`, `assets/css/search.css`, `assets/css/report.css`, `assets/css/nav-core-ext.css` | `skill-layout-spacing-rhythm` |
| **P2** | **Container Nesting** | Nested card containers (`.feature-card` inside heavy `<section>` card) and cramped section rhythm (24px margins). | `assets/css/home.css`, `home/index.html` | `skill-ban-identical-card-grids`, `skill-layout-cards-lazy` |
| **P2** | **Discover Token Bypass**| Hardcoded radii (`25px`, `--r-btn: 27px`, `--r-card: 30px`), fractional fonts (`11.3px`, `12.5px`), hardcoded hex colors in SVGs. | `assets/css/tokens.css`, `assets/css/nav-core.css`, `assets/css/nav-core-ext.css`, `assets/css/setting.css` | `skill-ban-codex-over-round` |

---

## Concrete Native-App Improvement Targets

To elevate FanHoard to true native-app craft level, the following exact CSS and token target values must be implemented across the codebase:

### 1. Central Tokens Refinement (`assets/css/tokens.css`)

| Custom Property | Current Value | Target Native-App Value | Rationale |
| :--- | :--- | :--- | :--- |
| `--r-btn` | `27px` | `var(--radius-full, 9999px)` | Replace arbitrary 27px with standard pill token |
| `--r-card` | `30px` | `var(--radius-xl, 16px)` | Eliminate over-rounded cards; standardize on 16px |
| `--shadow-sm` | `0 1px 3px 0 rgba(0,0,0,0.25)...` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | Light mode soft ambient depth (5% opacity) |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.30)...` | `0 4px 12px -2px rgba(0, 0, 0, 0.08)` | Clean soft elevation (8% opacity) |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.40)...` | `0 12px 24px -4px rgba(0, 0, 0, 0.12)` | High elevation modal/overlay (12% opacity) |
| `--space-7` | *Undefined* | `1.75rem` (28px) | Add missing token to eliminate broken fallbacks |

### 2. Component & Layout Target Specifications

```css
/* ── Target Elevation Policy: Single Method ── */
/* Rule: Flat cards use subtle border; Elevated cards use soft shadow ONLY (no border) */
.fv-card, .section, .sc, .item-card {
  border: 1px solid var(--border-subtle);
  box-shadow: none; /* Flat card default */
  border-radius: var(--radius-xl, 16px);
}

.fv-card--elevated, .sc:hover, .item-card:hover {
  border-color: transparent;
  box-shadow: var(--shadow-md); /* Elevated hover state */
}

/* ── Target Touch-Target Ergonomics (Min 44px/48px) ── */
#search-clear-btn {
  width: 44px;
  height: 44px;
  min-width: 44px;
}

.ca-icon-wrap {
  width: 44px;
  height: 44px;
}

.view-all-icon {
  width: 48px;
  height: 48px;
}

.bottom-nav .nav-item {
  min-height: 48px;
  padding: var(--space-2) 0;
}

/* ── Target Section Rhythm & Breathing Room ── */
.fv-section, section {
  padding-top: var(--space-12, 48px);
  padding-bottom: var(--space-12, 48px);
  margin-bottom: var(--space-10, 40px);
}

/* ── Elimination of Banned Decorative Chrome ── */
.page-title {
  /* Remove gradient text fill */
  background: none;
  -webkit-text-fill-color: initial;
  color: var(--text-main);
  font-weight: var(--font-bold);
}

.notice {
  /* Replace side-stripe border with soft container fill + border */
  border-left: 1px solid var(--border-subtle);
  border: 1px solid var(--color-warning);
  background: var(--surface-hover);
}

/* ── Discover Feed Standardization ── */
:where(.button-content) {
  border-radius: var(--radius-full, 9999px);
  height: 48px;
  min-height: 48px;
  padding: 0 var(--space-5, 20px);
  font-size: var(--step-0, 1rem);
}

:where(.card) {
  border-radius: var(--radius-xl, 16px);
}
```

---

## Conclusion

By executing these target adjustments, FanHoard will eliminate all ghost card artifacts, resolve touch target accessibility issues, reinstate a strict 4/8px spacing grid, and restore a calm, professional native-app visual hierarchy.
