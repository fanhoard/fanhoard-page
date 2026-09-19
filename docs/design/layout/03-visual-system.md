# Visual System Assessment: Shadows, Typography, and Type Scale

## Executive Summary
- **Inset / Inner Shadows**: **10** total occurrences identified across 5 CSS files and 1 JS module. All slated for complete **REMOVAL** / replacement with flat treatments (borders, subtle background fills) or outward elevation.
- **Outward Box Shadows**: **56** total occurrences across CSS and JS modules. Listed for consistency and migration to canonical elevation tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-focus`).
- **Font Assets & Families**: 3 font files in `assets/fonts/` (`FoglihtenNo07calt.woff2`, `FoglihtenNo07.woff2`, `MunroSmall.woff2`) + 1 external Google Font ('Sofia').
- **Decorative Font Overuse**: **8 specific CSS/HTML rule locations** setting decorative serif/cursive fonts on English headings/titles/tagline, PLUS the global token `--font-heading` affecting every heading on every page across the site.
- **Logo Font Exemption**: 2 locations (`.logo` in `nav-core.css`, `.brand-name` in `index.html`) represent the site logo branding and are **EXEMPT** from removal.
- **Type Scale Compliance**: **78** compliant usages of `--step-*` tokens vs **90** non-compliant hardcoded `font-size` declarations (`px`, `rem`, `em`, `pt`, `%`).

---

## 1. Inset / Inner Shadow Inventory (Slated for Removal)
*Every inset box-shadow, inner-glow, or overlay shadow technique across all CSS and HTML/JS files.*

| # | File Path & Line | CSS Selector / JS Context | Visual Element Styled | Exact Declaration / Technique | Proposed Flat Replacement Plan |
|---|---|---|---|---|---|
| 1 | `assets/css/back-to-top.css:17` | `#back-to-top:hover` | Back to top button hover state | `box-shadow: inset 0 0 6px 0 rgba(255, 255, 255, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15);` | Remove white inset glow; retain outward elevation `var(--shadow-md)` + subtle background brightness shift on hover. |
| 2 | `assets/css/modern-styles.css:19` | `.svg-wrapper::before` | Mobile/modern nav icon container background | `box-shadow: inset 0 0 4px 1.1px rgba(166, 187, 211, 0.14);` | Replace inset box-shadow with flat `border: 1px solid var(--border-subtle)` or `background: var(--surface-active)`. |
| 3 | `assets/css/modern-styles.css:51` | `.nav-item.active-1 .svg-wrapper::before` | Active state nav icon container | `box-shadow: inset 0 0 5px 0 rgba(13,148,136, 0.3);` | Replace inset teal glow with solid `border: 1.5px solid var(--color-brand-primary)` and subtle background fill. |
| 4 | `assets/css/nav-core-ext.css:24` | `#sub-nav.fx .hj` | Sticky sub-navigation bar item inner highlight | `box-shadow: inset 0 0 1px 1px rgba(166, 187, 211, 0.14);` | Replace inset inner highlight with flat `border: 1px solid var(--border-subtle)` or remove. |
| 5 | `assets/css/search.css:608` | `.hero-visual-card.hero-featured-card` | Featured hero card on Search page | `box-shadow: inset 0 0 0 2px var(--color-brand-primary, #0d9488), inset 0 0 18px rgba(13, 148, 136, 0.20);` | Replace double inset (2px border + 18px glow) with clean `border: 2px solid var(--color-brand-primary)` + outward elevation `var(--shadow-md)`. |
| 6 | `assets/css/search.css:614` | `@keyframes heroPulse` (0%) | Hero card pulse animation (start) | `box-shadow: inset 0 0 0 2px var(--color-brand-primary, #0d9488), inset 0 0 18px rgba(13, 148, 136, 0.20), 0 0 0 0 rgba(13, 148, 136, 0.40);` | Replace inset pulse with outward border-color / ring opacity transition or outward pulse glow (`0 0 0 0 rgba(...)`). |
| 7 | `assets/css/search.css:615` | `@keyframes heroPulse` (60%) | Hero card pulse animation (mid) | `box-shadow: inset 0 0 0 2px var(--color-brand-primary, #0d9488), inset 0 0 18px rgba(13, 148, 136, 0.20), 0 0 0 12px rgba(13, 148, 136, 0);` | Standardize animation to pulse outward ring / opacity without inset inner glows. |
| 8 | `assets/css/search.css:616` | `@keyframes heroPulse` (100%) | Hero card pulse animation (end) | `box-shadow: inset 0 0 0 2px var(--color-brand-primary, #0d9488), inset 0 0 18px rgba(13, 148, 136, 0.20), 0 0 0 16px rgba(13, 148, 136, 0);` | Standardize animation to pulse outward ring / opacity without inset inner glows. |
| 9 | `assets/css/setting.css:289` | `.slider` | Toggle switch track trough | `box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);` | Replace track inset shadow with flat `background-color: var(--surface-active)` and subtle 1px border. |
| 10 | `assets/js/nav-core-modules/performance.js:42` | `#sub-nav.fx .hj` | Injected dynamic sub-nav style override | `box-shadow: inset 0 0 1px 1px rgba(166, 187, 211, 0);` | Remove inset shadow string from injected CSS block in JS. |

---

## 2. Regular Outward Box-Shadow Inventory (Allowed to Stay)
*Complete inventory of the 56 outward box-shadow declarations, categorized by file.*

### `assets/css/about.css` (2 declarations)
- Line 51: `.about-card` -> `box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));`
- Line 82: `.about-badge` -> `box-shadow: var(--fv-shadow-teal, 0 4px 14px 0 rgba(13, 148, 136, 0.25));`

### `assets/css/footer.css` (10 declarations)
- Line 34: `.footer-container` top divider line shadow -> `box-shadow: 0 -1px 0 0 var(--border-subtle, #e2e8f0);`
- Line 50: `.footer-card` -> `box-shadow: 0 0 0 1px var(--border-subtle, #e2e8f0), 0 10px 30px -10px rgba(0, 0, 0, 0.05);`
- Line 62: `.footer-divider` -> `box-shadow: 0 1px 0 0 var(--border-subtle, #e2e8f0);`
- Line 143: `.footer-input` -> `box-shadow: 0 0 0 1px var(--border-subtle, #e2e8f0), 0 2px 6px rgba(0, 0, 0, 0.02);`
- Line 155: `.footer-input:focus` -> `box-shadow: 0 0 0 1px var(--color-brand-primary, #0d9488), 0 4px 12px rgba(13, 148, 136, 0.1);`
- Line 189: `.footer-btn` -> `box-shadow: 0 0 0 1.5px var(--border-subtle, #e2e8f0);`
- Line 215: `.footer-btn:hover` -> `box-shadow: 0 0 0 1.5px var(--color-brand-primary, #0d9488), 0 6px 15px rgba(13, 148, 136, 0.12);`
- Line 281: `.footer-bottom` top divider -> `box-shadow: 0 -1px 0 0 var(--border-subtle, #e2e8f0);`
- Line 293: `.footer-link` hover bottom line -> `box-shadow: 0 1px 0 0 var(--border-subtle, #e2e8f0);`
- Line 311: `.footer-legal` top line -> `box-shadow: 0 1px 0 0 var(--border-subtle, #e2e8f0);`

### `assets/css/home.css` (8 declarations)
- Line 81: `.hero-card` -> `box-shadow: var(--shadow-md);`
- Line 178: `.feature-card` -> `box-shadow: var(--shadow-sm);`
- Line 195: `.feature-card:hover` -> `box-shadow: var(--shadow-md);`
- Line 254: `.stat-card` -> `box-shadow: var(--shadow-sm);`
- Line 372: `.cta-card` -> `box-shadow: var(--shadow-sm);`
- Line 391: `.cta-card:hover` -> `box-shadow: var(--shadow-md);`
- Line 500: `.feed-item` -> `box-shadow: var(--shadow-sm);`
- Line 601: `.modal-content` -> `box-shadow: var(--shadow-lg);`

### `assets/css/layout.css` & `top-navigation-bar.css` (2 declarations)
- `assets/css/layout.css:90`: `.sticky-header` -> `box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1));`
- `assets/css/top-navigation-bar.css:13`: `.top-nav` -> `box-shadow: 0 0 8px rgba(0,0,0,0.08);`

### `assets/css/loading-system.css` & `loading.css` (2 declarations)
- `assets/css/loading-system.css:320`: `.loading-bar` glow -> `box-shadow: 0 0 8px rgba(19, 180, 127, 0.4);`
- `assets/css/loading.css:57`: `.toast-container` -> `box-shadow: 0 2px 10px rgba(0,0,0,0.08);`

### `assets/css/modern-styles.css` & `new.css` (2 declarations)
- `assets/css/modern-styles.css:97`: `.modern-card` -> `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);`
- `assets/css/new.css:60`: `.whats-new-card` -> `box-shadow: var(--shadow-sm);`

### `assets/css/popup.css` (6 declarations)
- Line 27: `.fp-overlay` -> `box-shadow: var(--fp-shadow, var(--fv-shadow-lg));`
- Line 36: `.fp-content` -> `box-shadow: var(--fp-shadow, var(--fv-shadow-lg)), var(--fv-shadow-focus);`
- Line 187: `.fp-button--primary` -> `box-shadow: 0 4px 12px rgba(19, 180, 127, 0.2);`
- Line 479: `.fp-toast` -> `box-shadow: var(--fv-shadow-lg), 0 0 0 1px var(--fv-border-default);`
- Line 501: `.fp-chip` -> `box-shadow: var(--fv-shadow-md);`
- Line 519: `.fp-tooltip` -> `box-shadow: var(--fv-shadow-lg), 0 0 0 1px var(--fv-border-default);`

### `assets/css/report.css` (4 declarations)
- Line 35: `.form-control:focus` -> `box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.2);`
- Line 61: `.btn-submit:focus` -> `box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.2);`
- Line 99: `.btn-submit` -> `box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);`
- Line 119: `.form-control.is-invalid:focus` -> `box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);`

### `assets/css/roadmap.css` (3 declarations)
- Line 31: `.roadmap-card` -> `box-shadow: var(--shadow-sm);`
- Line 240: `.roadmap-item` -> `box-shadow: var(--shadow-sm);`
- Line 276: `.roadmap-badge` -> `box-shadow: var(--shadow-sm);`

### `assets/css/search.css` (10 declarations)
- Line 49: `.search-bar-container` -> `box-shadow: 0 1px 0 rgba(14, 95, 153, 0.05), 0 4px 16px rgba(6, 20, 24, 0.05);`
- Line 77: `.search-input` -> `box-shadow: 0 1px 4px rgba(6, 20, 24, 0.04);`
- Line 84: `.search-input:focus` -> `box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.18), 0 1px 4px rgba(6, 20, 24, 0.04);`
- Line 236: `.result-card` -> `box-shadow: 0 0 0 1px rgba(13, 148, 136, 0.51);`
- Line 294: `.filter-chip` -> `box-shadow: 0 1px 3px rgba(6, 20, 24, 0.04), 0 4px 16px rgba(6, 20, 24, 0.025);`
- Line 633: `.hero-card-badge` -> `box-shadow: 0 4px 16px rgba(13, 148, 136, 0.35);`
- Line 661: `.hero-cta-btn` -> `box-shadow: 0 4px 20px rgba(13, 148, 136, 0.25);`
- Line 685: `.search-header` -> `box-shadow: 0 -2px 12px rgba(13, 186, 146, 0.04);`
- Line 718: `.search-modal` -> `box-shadow: 0 4px 24px rgba(6, 20, 24, 0.09), 0 1px 4px rgba(6, 20, 24, 0.04);`

### `assets/css/setting.css` (4 declarations)
- Line 34: `.setting-card` -> `box-shadow: var(--shadow-md);`
- Line 162: `.setting-btn` -> `box-shadow: var(--shadow-sm);`
- Line 302: `.slider::before` (toggle knob) -> `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);`
- Line 364: `.setting-modal` -> `box-shadow: var(--shadow-lg);`

### JS Modules (`copyNotification.js`, `home.js`, `version-core.js`) (3 declarations)
- `assets/js/home.js:168, 176`: Dynamic hero banner card elevation -> `box-shadow: 0 2px 8px ...`, `box-shadow: 0 3px 12px ...`
- `assets/js/version-core.js:142`: Update modal CTA button shadow -> `box-shadow: 0 2px 12px rgba(19,180,127,.35)`

---

## 3. Typography & Font Family Inventory

### 3.1 Font Assets & External Sources
- **`assets/fonts/FoglihtenNo07calt.woff2`** (Display Serif, ~28KB): Primary logo font asset.
- **`assets/fonts/FoglihtenNo07.woff2`** (Display Serif, ~28KB): Alternate display font asset.
- **`assets/fonts/MunroSmall.woff2`** (Pixel Display Font, ~18KB): Defined in `@font-face` in `tokens.css`, but **0 usages** in CSS/HTML rules across the entire codebase.
- **Google Fonts - Sofia** (`https://fonts.googleapis.com/css2?family=Sofia`): External font import in `footer.css`, `platform/about/index.html`, and `setting/index.html`.

### 3.2 Logo Font Exemption (Allowed to Stay)
1. **`assets/css/nav-core.css:16`**: `.logo` -> `font-family: 'FoglihtenNo07calt', monospace;`
2. **`index.html:66`**: `.brand-name` -> `font-family: var(--font-heading, 'FoglihtenNo07calt', Georgia, serif);`

*Note*: Per project direction, the site LOGO retains its decorative serif identity (`FoglihtenNo07calt`) for brand recognition.

### 3.3 Decorative Font Overuse on Headings & Body (Slated for Removal)
*Decorative display fonts (`FoglihtenNo07calt`, `Sofia`) are currently overused on regular headings, sections, titles, and tagline body text, causing readability and visual inconsistency issues.*

| # | File & Line | CSS Selector / Target | Current Decorative Declaration | Overuse Analysis & Problem | Replacement Plan |
|---|---|---|---|---|---|
| 1 | `assets/css/tokens.css:102` | Global variable `--font-heading` | `--font-heading: 'FoglihtenNo07calt', Georgia, serif;` | Sets decorative serif font for ALL headings site-wide. | Change `--font-heading` to use standard clean sans-serif/system font scale (`var(--font-sans)`). |
| 2 | `assets/css/base.css:47` | `h1, h2, h3, h4, h5, h6` | `font-family: var(--font-heading, 'FoglihtenNo07calt', Georgia, serif);` | Applies decorative serif font to every HTML heading element. | Update `h1-h6` default selector to inherit clean system sans-serif scale. |
| 3 | `assets/css/home.css:23` | `.hero-title` | `font-family: var(--font-heading);` | Decorative display font on main home hero title. | Replace with standard readable sans-serif type token `--step-4` / `--step-5`. |
| 4 | `assets/css/home.css:33` | `.section-title` | `font-family: var(--font-heading);` | Decorative display font on home section titles. | Replace with clean sans-serif type token `--step-2` / `--step-3`. |
| 5 | `assets/css/home.css:146` | `.card-title` | `font-family: var(--font-heading);` | Decorative display font on home feature cards. | Replace with clean sans-serif type token `--step-1` / `--step-2`. |
| 6 | `assets/css/home.css:346` | `.cta-title` | `font-family: var(--font-heading);` | Decorative display font on call-to-action title. | Replace with clean sans-serif type token `--step-2`. |
| 7 | `assets/css/setting.css:109` | `.setting-section h2` | `font-family: var(--font-heading, 'FoglihtenNo07calt', Georgia, serif);` | Decorative serif font on technical settings headers. | Standardize to clean system sans-serif `--step-2`. |
| 8 | `assets/css/modern-styles.css:102` | `.modern-heading` | `font-family: var(--font-heading);` | Decorative display font on modern heading elements. | Standardize to clean system sans-serif scale. |
| 9 | `assets/css/footer.css:86` | `.footer-tagline` | `font-family: 'Sofia', cursive, var(--font-sans);` | Cursive decorative font on footer tagline text. | Remove 'Sofia' import; set tagline to clean `--font-sans` with `--step--1` or `--step-0`. |
| 10 | `index.html:72` | `h2` inline style | `font-family: var(--font-heading, 'FoglihtenNo07calt', Georgia, serif);` | Decorative serif font on landing page h2. | Standardize to clean sans-serif `--font-sans`. |
| 11 | `platform/about/index.html:31` | `<link>` import | `<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Sofia" />` | External Google Font HTTP request for Sofia. | Remove external Google Font `<link>` stylesheet import. |
| 12 | `setting/index.html:29` | `<link>` import | `<link href="https://fonts.googleapis.com/css?family=Sofia" rel="stylesheet" />` | External Google Font HTTP request for Sofia. | Remove external Google Font `<link>` stylesheet import. |

---

## 4. Type-Scale Compliance & Heading Hierarchy

### 4.1 Token Scale Definition
Defined in `assets/css/tokens.css:111-117`:
- `--step--1`: `clamp(0.8rem, 0.78rem + 0.1vw, 0.875rem)` (Caption / Small text)
- `--step-0`: `clamp(1rem, 0.95rem + 0.25vw, 1.125rem)` (Body text / Base)
- `--step-1`: `clamp(1.2rem, 1.12rem + 0.4vw, 1.35rem)` (Subheading / Card Title)
- `--step-2`: `clamp(1.44rem, 1.32rem + 0.6vw, 1.62rem)` (Section Header h3/h2)
- `--step-3`: `clamp(1.728rem, 1.55rem + 0.9vw, 2.025rem)` (Page Header h2)
- `--step-4`: `clamp(2.074rem, 1.82rem + 1.2vw, 2.53rem)` (Major Page Title h1)
- `--step-5`: `clamp(2.488rem, 2.12rem + 1.8vw, 3.16rem)` (Hero Title h1)

### 4.2 Compliance Breakdown
- **78 Compliant Declarations**: Used in `about.css`, `base.css`, `home.css`, `layout.css`, `modern-styles.css`, `new.css`, `report.css`, `roadmap.css`, `setting.css`, `index.html`.
- **90 Non-Compliant Declarations**: Arbitrary hardcoded pixel, rem, em, pt, or percentage values.
  - *Key offenders*: `search.css` (32 hardcoded font-sizes), `footer.css` (12 hardcoded font-sizes), `roadmap.css` (10 hardcoded clamp/rem values), `loading.css` / `loading-system.css` (8 hardcoded px values), `nav-core.css` / `nav-core-ext.css` (8 hardcoded px/em values).

### 4.3 Heading Hierarchy Mapping Standard
To enforce semantic document outline and accessible type hierarchy across all page groups:
- **`h1` / Page Hero Title**: `font-size: var(--step-4)` (mobile) to `var(--step-5)` (desktop); `font-weight: var(--font-bold, 700)`.
- **`h2` / Major Section Title**: `font-size: var(--step-3)`; `font-weight: var(--font-bold, 700)`.
- **`h3` / Sub-section / Card Group Header**: `font-size: var(--step-2)`; `font-weight: var(--font-semibold, 600)`.
- **`h4` / Card Title / Component Header**: `font-size: var(--step-1)`; `font-weight: var(--font-semibold, 600)`.
- **`h5`, `h6` / Minor Labels**: `font-size: var(--step-0)`; `font-weight: var(--font-semibold, 600)`.

---

## 5. Per-Page Impact Notes

### 1. Root / Landing Page (`index.html`)
- **Shadows**: Clean flat layout.
- **Typography Impact**: Currently uses `FoglihtenNo07calt` in `<style>` block for `h2` and `.brand-name`. `.brand-name` retains decorative font as logo; `h2` switches to `--font-sans` `--step-2`.
- **Type Scale**: Remove hardcoded `clamp(3.5rem, 2.5rem + 5vw, 4.25rem)` and replace with token `--step-5`.

### 2. Home Hub (`home/index.html` + `home.css`)
- **Shadows**: 8 outward box-shadows on cards (`.hero-card`, `.feature-card`, `.stat-card`, `.cta-card`, `.modal-content`). Outward shadows stay, migrated to elevation tokens `--shadow-sm`, `--shadow-md`, `--shadow-lg`.
- **Typography Impact**: `.hero-title`, `.section-title`, `.card-title`, `.cta-title` lose decorative serif font and gain clean readable sans-serif type scale.

### 3. Search Page (`search/index.html` + `search.css`)
- **Shadows**: Contains 5 inset shadow rules (1 in `.hero-visual-card.hero-featured-card` + 3 in `@keyframes heroPulse` + 1 in dynamic sub-nav). All 5 inset shadows will be removed and replaced with flat border + outward ring focus. 10 outward shadows on search bar, cards, filters stay allowed.
- **Typography Impact**: 32 hardcoded font-size declarations in `search.css` will be migrated to `--step-*` tokens.

### 4. Settings Page (`setting/index.html` + `setting.css`)
- **Shadows**: 1 inset shadow in `.slider` toggle switch track (line 289). Replaced with flat track background + subtle border. 4 outward shadows on cards and modals stay.
- **Typography Impact**: `.setting-section h2` loses decorative serif font. External 'Sofia' Google Font `<link>` removed.

### 5. Platform Pages (`about`, `roadmap`, `whats_new`, `license`, `privacy`)
- **Shadows**: All outward shadows stay (`about.css`, `roadmap.css`, `new.css`).
- **Typography Impact**: 'Sofia' Google Font import in `about/index.html` removed. Heading fonts standardized to `--font-sans`. Non-compliant font-size declarations in `roadmap.css` (10 items) and `new.css` (13 items) migrated to `--step-*`.

### 6. Community Pages (`index`, `contact`, `report`)
- **Shadows**: Outward form control focus rings (`report.css`) stay as accessible focus rings (`box-shadow: 0 0 0 3px rgba(...)`).
- **Typography Impact**: Standardized to `--font-sans`.

### 7. Discover Verse (`data/verse/discover/index.html` + `nav-core.css` + `back-to-top.css`)
- **Shadows**: `#back-to-top:hover` inset glow (line 17) removed. Active nav icon wrapper inset glow (`modern-styles.css`) removed.
- **Typography Impact**: Logo retains `FoglihtenNo07calt`. Navigation links and buttons use clean sans-serif.

---

## 6. Actionable Removal & Replacement Plan

### Step 1: Token & Base CSS Updates (`tokens.css`, `base.css`)
1. Update `assets/css/tokens.css`:
   - Change `--font-heading` definition to:
     `--font-heading: var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);`
   - Define canonical logo font token:
     `--font-logo: 'FoglihtenNo07calt', Georgia, serif;`
2. Update `assets/css/base.css`:
   - Ensure `h1` through `h6` use `--font-heading` (which now resolves to clean sans-serif).
   - Define standard heading scale defaults (`h1` -> `--step-4`, `h2` -> `--step-3`, `h3` -> `--step-2`, `h4` -> `--step-1`, `h5`/`h6` -> `--step-0`).

### Step 2: Purge Inset Shadows (10 total instances)
1. `assets/css/back-to-top.css:17`: Remove `inset 0 0 6px 0 rgba(255, 255, 255, 0.4),`.
2. `assets/css/modern-styles.css:19`: Replace `box-shadow: inset ...` on `.svg-wrapper::before` with `border: 1px solid var(--border-subtle)`.
3. `assets/css/modern-styles.css:51`: Replace `box-shadow: inset ...` on `.nav-item.active-1 .svg-wrapper::before` with `border: 1.5px solid var(--color-brand-primary)`.
4. `assets/css/nav-core-ext.css:24`: Replace `box-shadow: inset ...` on `#sub-nav.fx .hj` with `border: 1px solid var(--border-subtle)`.
5. `assets/css/search.css:608, 614-616`: Remove inset shadows from `.hero-visual-card.hero-featured-card` and `@keyframes heroPulse`.
6. `assets/css/setting.css:289`: Remove `box-shadow: inset ...` from `.slider`.
7. `assets/js/nav-core-modules/performance.js:42`: Remove `box-shadow: inset ...` string from injected CSS block.

### Step 3: Purge Decorative Heading Fonts & Standardize Typography
1. Update `assets/css/nav-core.css:16` and `.brand-name` to explicitly use `--font-logo` (`FoglihtenNo07calt`).
2. Remove 'Sofia' cursive font imports from `assets/css/footer.css`, `platform/about/index.html`, and `setting/index.html`.
3. Update `.footer-tagline` in `footer.css` to use `var(--font-sans)`.
4. Ensure all heading classes (`.hero-title`, `.section-title`, `.card-title`, `.setting-section h2`, `.modern-heading`) inherit clean `--font-heading` (`--font-sans`).

### Step 4: Type Scale Tokenization
1. Replace 90 hardcoded `font-size` declarations across `search.css`, `footer.css`, `roadmap.css`, `new.css`, `setting.css`, `nav-core.css`, `loading.css`, and `index.html` with corresponding `--step-*` tokens.
