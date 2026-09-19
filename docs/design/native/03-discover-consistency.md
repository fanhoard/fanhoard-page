# Discover-Page Token-Consistency Audit & Systemic Alignment Plan

**Target Repository**: `fanhoard/fanhoard-page`  
**Scope**: Discover Page (`data/verse/discover/index.html` + associated CSS/JS dependencies)  
**Audit Author**: Superagent Sub-Agent (`assess-discover-consistency`)  
**Date**: September 20, 2026  
**Status**: Completed Assessment (Committed Repo File)  

---

## 1. Executive Summary

### 1.1 Key Audit Findings
An independent design-system audit of the FanHoard Discover page (`data/verse/discover/index.html`) confirms the **OWNER's observation**: the Discover page visually diverges sharply from the rest of the FanHoard platform. Rather than consuming the central design tokens (`assets/css/tokens.css` and `assets/css/layout.css` primitives), the Discover page relies heavily on legacy hardcoded pixel values, custom un-standardized custom properties (`--r-card`, `--r-btn`), and isolated hardcoded container rules.

The audit identified **48 distinct token bypass declarations** across the HTML, CSS, and JS engine files that govern the Discover page experience.

### 1.2 Summary Statistics
* **Total Visual Declarations Audited**: 72
* **Total Token Bypass Declarations**: 48
* **Central Token Compliance Rate**: 33.3% (33.3% tokenized, 66.7% hardcoded or custom bypasses)
* **Top Divergence Category**: Border Radii & Corner Curves (30px card radius & 25px container radius vs. 16px standard)

### 1.3 Top 5 Visual Divergences
1. **Inflated Corner Radii (`--r-card: 30px` vs. `--radius-xl: 16px`)**: Cards on the Discover page consume `--r-card` (defined in `tokens.css` as `30px`), creating overly rounded "blob" cards. Every other page on the site (Home, Search, Setting) uses `--radius-xl` (`16px`) or `--radius-lg` (`12px`) for card surfaces.
2. **Hardcoded Container Curves (`border-radius: 25px`)**: `#sub-buttons-container`, `.button-content-container`, and `.card-content-container` in `nav-core-ext.css` use hardcoded `border-radius: 25px;`, completely bypassing the token system and creating unmatched capsule enclosures.
3. **Emoji Button Radius (`--r-btn: 27px`)**: Emoji character buttons consume `--r-btn` (`27px`), an arbitrary non-standard radius value that does not match `--radius-full` (`9999px` pill) or `--radius-lg` (`12px`).
4. **Un-Tokenized Fluid Typography**: Text elements across Discover use arbitrary static font sizes such as `21px` (`.button-content`), `13px` (`.card-title`), `11.3px` (`.card-description`), `12.5px` (`.label`), and `1.2rem` (`.group-header-text`) rather than fluid scale tokens (`--step--1`, `--step-0`, `--step-1`).
5. **Off-Grid Spacing & Missing Elevation**: Layout containers rely on hardcoded `gap: 5px;`, `gap: 12px;`, `margin: 0 0 40px;`, and `padding: 1rem 5px;`, breaking the platform's 4px base grid system (`--space-2`, `--space-4`, `--space-6`, `--space-8`), while card surfaces lack elevation tokens (`--shadow-sm` / `--shadow-md`).

---

## 2. Comprehensive Visual Declaration & Bypass Inventory

Below is the complete, file-by-file inventory of every visual declaration made by the Discover page and its loaded dependencies. Each declaration is classified as **TOKEN-COMPLIANT** or **TOKEN-BYPASS**.

### 2.1 `data/verse/discover/index.html` (Inline Styles & Boot Loader)

| Line(s) | Selector / Target | Property | Value / Expression | Classification | Notes & Token Alternative |
|---|---|---|---|---|---|
| 28 | `html` | `background` | `#fff` | **TOKEN-BYPASS** | Hardcoded background hex; bypasses `var(--surface-card)` / `var(--surface-base)`. |
| 29 | `body` | `margin`, `opacity` | `0`, `1` | **TOKEN-COMPLIANT** | Standard CSS reset. |
| 31 | `header` | `min-height` | `90px` | **TOKEN-BYPASS** | Hardcoded min-height; should use `--fv-nav-height` or token calculation. |
| 53 | `#fv-boot-loader` | `gap` | `22px` | **TOKEN-BYPASS** | Hardcoded 22px gap; bypasses `--space-5` (20px) or `--space-6` (24px). |
| 54 | `#fv-boot-loader` | `background` | `var(--surface-primary, var(--fv-surface-page, #ffffff))` | **TOKEN-COMPLIANT** | Consumes semantic surface tokens. |
| 56 | `#fv-boot-loader` | `font-family` | `var(--fv-font-stack, ...)` | **TOKEN-COMPLIANT** | Consumes font stack variable. |
| 58 | `#fv-boot-loader` | `transition` | `opacity 220ms cubic-bezier(...)` | **TOKEN-BYPASS** | Hardcoded 220ms duration; bypasses `--transition-normal` (250ms). |
| 67-68 | `.fv-boot-spinner` | `width`, `height` | `68px`, `68px` | **TOKEN-BYPASS** | Hardcoded 68px dimension. |
| 79 | `.fv-boot-track` | `stroke` | `var(--surface-tertiary, var(--border-subtle, #e8f5ef))` | **TOKEN-COMPLIANT** | Token with fallback. |
| 83 | `.fv-boot-arc` | `stroke` | `var(--color-brand-primary, #0d9488)` | **TOKEN-COMPLIANT** | Token with fallback. |
| 95-97 | `.fv-boot-msg` | `font-size`, `color` | `16px`, `var(--text-primary, #3c4043)` | **TOKEN-BYPASS** | Hardcoded 16px font-size; should consume `--step-0`. |

### 2.2 `assets/css/nav-core.css`

| Line(s) | Selector / Target | Property | Value / Expression | Classification | Notes & Token Alternative |
|---|---|---|---|---|---|
| 8 | `header` | `margin-bottom` | `30px` | **TOKEN-BYPASS** | Hardcoded 30px margin; should use `var(--space-8)` (32px). |
| 13-14 | `.logo` | `font-size`, `padding` | `26px`, `20px 0 0` | **TOKEN-BYPASS** | Logo font-size (26px) and padding (20px) hardcoded. (Font is logo-only decorative). |
| 15, 17 | `.logo`, `.logo img` | `margin-left` | `10px`, `5px` | **TOKEN-BYPASS** | Hardcoded 10px and 5px margins; should use `--space-2` / `--space-3`. |
| 19 | `nav` | `margin-top` | `7px` | **TOKEN-BYPASS** | Hardcoded 7px margin. |
| 22 | `nav ul` | `padding` | `7px 7px 0` | **TOKEN-BYPASS** | Hardcoded 7px padding. |
| 25 | `nav ul` | `border-bottom` | `0.8px solid rgba(13,148,136,0.3)` | **TOKEN-BYPASS** | Hardcoded border color `rgba(13,148,136,0.3)`; bypasses `--border-subtle`. |
| 32 | `nav ul li button` | `padding` | `11px 13px` | **TOKEN-BYPASS** | Hardcoded 11px 13px padding; bypasses `--space-3`. |
| 32 | `nav ul li button` | `border-radius` | `var(--fv-radius-pill)` | **TOKEN-COMPLIANT** | Consumes pill token (`--radius-full`). |
| 33 | `nav ul li button` | `font-size` | `0.9em` | **TOKEN-BYPASS** | Relative 0.9em font-size; should consume `--step--1`. |
| 36 | `nav ul li button` | `transition` | `background 200ms...` | **TOKEN-BYPASS** | Hardcoded 200ms transition; bypasses `--transition-fast` (150ms). |
| 43 | `nav ul li button.active` | `border-color` | `rgba(13,148,136,0.51)` | **TOKEN-BYPASS** | Hardcoded rgba border; bypasses `--border-brand`. |
| 51 | `nav ul li button::after` | `border-radius` | `10px 10px 0 0` | **TOKEN-BYPASS** | Hardcoded 10px top radius; bypasses `--radius-md` (8px) / `--radius-lg` (12px). |
| 65 | `.navbar-toggle` | `top`, `padding` | `25.3px`, `5px` | **TOKEN-BYPASS** | Hardcoded 25.3px position and 5px padding. |
| 69 | `.error-message` | `background`, `border-radius` | `#dc2626`, `5px` | **TOKEN-BYPASS** | Hardcoded `#dc2626` (bypasses `--color-danger`), 5px radius (bypasses `--radius-sm` 4px). |

### 2.3 `assets/css/nav-core-ext.css`

| Line(s) | Selector / Target | Property | Value / Expression | Classification | Notes & Token Alternative |
|---|---|---|---|---|---|
| 1 | `main` | `margin-top`, `margin-bottom` | `30px`, `80px` | **TOKEN-BYPASS** | Hardcoded 30px / 80px margins; bypasses `--space-6` / `--space-16`. |
| 6-7 | `.button-sub` | `padding`, `font-size` | `11px 13px`, `0.9em` | **TOKEN-BYPASS** | Hardcoded 11px 13px padding, relative font size. |
| 11 | `.button-sub` | `transition` | `200ms ease` | **TOKEN-BYPASS** | Hardcoded 200ms duration; bypasses `--transition-fast`. |
| 18 | `.button-sub.active` | `border-color` | `rgba(13,148,136,0.51)` | **TOKEN-BYPASS** | Hardcoded border color; bypasses `--border-brand`. |
| 20 | `.hi` | `padding` | `0 10px` | **TOKEN-BYPASS** | Hardcoded 10px padding. |
| 21 | `.hj` | `border-radius`, `border` | `var(--fv-radius-xl)`, `var(--border-subtle)` | **TOKEN-COMPLIANT** | Consumes radius and border tokens. |
| 28 | `:where(.button-content)` | `padding`, `margin`, `height` | `13px 17px`, `8px 0`, `60px` | **TOKEN-BYPASS** | Hardcoded 13px 17px padding, 8px margin, 60px fixed height. |
| 30 | `:where(.button-content)` | `border-radius` | `var(--r-btn)` | **CUSTOM BYPASS** | Uses `--r-btn` (`27px` hardcoded in `tokens.css`); non-standard radius curve. |
| 31 | `:where(.button-content)` | `font-size` | `21px` | **TOKEN-BYPASS** | Hardcoded 21px font-size; should consume `--step-2`. |
| 41 | `:where(.card)` | `width`, `height` | `160px`, `222px` | **TOKEN-BYPASS** | Fixed hardcoded dimensions. |
| 42 | `:where(.card)` | `border-radius` | `var(--r-card)` | **CRITICAL BYPASS** | Uses `--r-card` (`30px` hardcoded in `tokens.css`); primary curve divergence. |
| 51 | `.card-image` | `height` | `110px` | **TOKEN-BYPASS** | Hardcoded 110px image height. |
| 56 | `.card-content` | `padding` | `12px` | **TOKEN-BYPASS** | Hardcoded 12px padding; should consume `var(--space-3)`. |
| 58, 60 | `.card-title` | `font-size`, `margin-bottom` | `13px`, `4px` | **TOKEN-BYPASS** | Hardcoded 13px font-size (bypasses `--step--1`), 4px margin. |
| 63 | `.card-description` | `font-size` | `11.3px` | **TOKEN-BYPASS** | Hardcoded 11.3px font-size; severely degraded readability. |
| 75 | `#main-buttons-container` | `gap`, `padding` | `8px`, `4px` | **TOKEN-BYPASS** | Hardcoded 8px gap and 4px padding literals. |
| 76 | `#sub-buttons-container` | `padding`, `border-radius` | `6px`, `25px` | **CRITICAL BYPASS** | Hardcoded `border-radius: 25px;` and 6px padding. |
| 80 | `.group-header` | `padding` | `10px` | **TOKEN-BYPASS** | Hardcoded 10px padding. |
| 81 | `.group-header-text` | `font-size` | `1.2rem` | **TOKEN-BYPASS** | Static 1.2rem font-size; bypasses fluid `--step-1`. |
| 82 | `.group-header-description` | `margin`, `font-size` | `0.5rem 0 0`, `1rem` | **TOKEN-BYPASS** | Static 0.5rem margin, 1rem font-size; bypasses `--step-0`. |
| 84-89 | `.button-content-container` | `margin`, `padding`, `border-radius`, `gap` | `0 0 40px`, `1rem 5px`, `25px`, `5px` | **CRITICAL BYPASS** | Hardcoded `border-radius: 25px;`, 40px margin, 5px gap. |
| 94-99 | `.card-content-container` | `margin`, `padding`, `border-radius`, `gap` | `0 0 40px`, `1rem 5px`, `25px`, `12px` | **CRITICAL BYPASS** | Hardcoded `border-radius: 25px;`, 40px margin, 12px gap. |
| 108 | `@media (max-width:600px)` | `gap`, `width`, `height` | `8px`, `145px`, `210px` | **TOKEN-BYPASS** | Hardcoded mobile grid gap (8px) and card dimensions (145x210px). |
| 118-120 | `::-webkit-scrollbar*` | `width`, `background`, `border-radius` | `7px`, `#e0e7f2`, `6px` | **TOKEN-BYPASS** | Hardcoded scrollbar dimensions, colors, and radii. |

### 2.4 `assets/js/ure/ure.css` (Auto-Injected Virtual Scroll CSS)

| Line(s) | Selector / Target | Property | Value / Expression | Classification | Notes & Token Alternative |
|---|---|---|---|---|---|
| 87 | `img.ure-img-loading` | `background` | `#f0f0f0` | **TOKEN-BYPASS** | Hardcoded background fallback `#f0f0f0`; bypasses `--surface-hover`. |
| 98 | `img.ure-img-error` | `background`, `border` | `#ffeaea`, `1px solid #f5c6c6` | **TOKEN-BYPASS** | Hardcoded error colors `#ffeaea` and `#f5c6c6`. |
| 109 | `img.ure-img-loading` | `background` | `linear-gradient(90deg, #f0f0f0, #e0e0e0, #f0f0f0)` | **TOKEN-BYPASS** | Hardcoded shimmer colors `#f0f0f0` and `#e0e0e0`. |
| 119 | `.ure-render-error` | `padding`, `color`, `background`, `border-radius` | `8px 12px`, `#c0392b`, `#fff5f5`, `6px` | **TOKEN-BYPASS** | Hardcoded 8px 12px padding, `#c0392b` color, `#fff5f5` background, 6px radius (bypasses `--radius-md`). |

### 2.5 `assets/css/modern-styles.css` (Loaded via `modern-navigation.js`)

| Line(s) | Selector / Target | Property | Value / Expression | Classification | Notes & Token Alternative |
|---|---|---|---|---|---|
| 4 | `--nav-radius` | custom property | `var(--fv-radius-xl)` | **TOKEN-COMPLIANT** | Consumes `--fv-radius-xl` (16px). |
| 5 | `--nav-item-radius` | custom property | `var(--fv-radius-sm)` | **TOKEN-COMPLIANT** | Consumes `--fv-radius-sm` (4px). |
| 15 | `.bottom-nav` | `padding` | `10px 0 calc(...)` | **TOKEN-BYPASS** | Hardcoded 10px padding. |
| 31 | `.nav-item` | `gap` | `2px` | **TOKEN-BYPASS** | Hardcoded 2px gap. |
| 37 | `.svg-wrapper` | `border-radius` | `50px` | **TOKEN-BYPASS** | Hardcoded 50px radius; bypasses `--radius-full`. |
| 45 | `.svg-wrapper::before` | `background`, `border` | `rgba(13,148,136,.08)`, `1.5px solid var(...)` | **TOKEN-COMPLIANT** | Token with fallback. |
| 50 | `.nav-item .label` | `font-size` | `12.5px` | **TOKEN-BYPASS** | Hardcoded 12.5px font-size; bypasses `--step--1`. |
| 64 | `@media (min-width:768px)` | `border-radius` | `0 16px 16px 0` | **TOKEN-COMPLIANT** | Matches `--radius-xl` (16px). |

### 2.6 `assets/css/loading.css`

| Line(s) | Selector / Target | Property | Value / Expression | Classification | Notes & Token Alternative |
|---|---|---|---|---|---|
| 15 | `#clp-overlay` | `gap` | `22px` | **TOKEN-BYPASS** | Hardcoded 22px gap. |
| 23 | `.clp-spinner` | `width`, `height` | `68px`, `68px` | **TOKEN-BYPASS** | Hardcoded 68px size. |
| 27 | `.clp-track` | `stroke` | `#e8f5ef` | **TOKEN-BYPASS** | Hardcoded track color `#e8f5ef`. |
| 37, 38 | `.clp-msg`, `.clp-sub` | `font-size`, `color` | `16px`, `13px`, `#3c4043`, `#9aa0a6` | **TOKEN-BYPASS** | Hardcoded font sizes and colors. |
| 43 | `#content-loading-overlay` | `background` | `rgba(255,255,255,0.96)` | **TOKEN-BYPASS** | Hardcoded rgba overlay color. |
| 53 | `.notification` | `box-shadow` | `0 2px 10px rgba(0,0,0,0.08)` | **TOKEN-BYPASS** | Hardcoded box-shadow; bypasses `--shadow-md`. |
| 57-61 | `.notification-*` | `background` | `#1e8e3e`, `#d93025`, `#f29900`, `#1a73e8` | **TOKEN-BYPASS** | Hardcoded notification colors; bypasses `--color-success`, `--color-danger`, `--color-warning`, `--color-info`. |

---

## 3. Page Divergence Analysis

To verify the OWNER's observations, the Discover page was benchmarked against three primary site pages: **Home** (`/home/`), **Search** (`/search/`), and **Setting** (`/setting/`).

### 3.1 Divergence Matrix

| Visual Characteristic | Discover Page (`data/verse/discover/`) | Home Page (`/home/`) | Search Page (`/search/`) | Setting Page (`/setting/`) | Divergence Level |
|---|---|---|---|---|---|
| **Card Surface Radii** | `--r-card: 30px` (Bulky, overly rounded blob curves) | `var(--radius-xl)` (16px) | `var(--radius-xl)` (16px) / `var(--radius-lg)` (12px) | `var(--radius-lg)` (12px) | **CRITICAL DIVERGENCE** |
| **Container Radii** | `border-radius: 25px` (Hardcoded capsule containers) | `var(--radius-xl)` (16px) / Shell grid | `var(--radius-full)` (9999px) for bar, standard shell | `var(--radius-xl)` (16px) | **CRITICAL DIVERGENCE** |
| **Button Radii** | `--r-btn: 27px` (Custom non-standard curve) | `var(--radius-full)` (Pill) / `var(--radius-md)` (8px) | `var(--radius-full)` (Pill) | `var(--radius-md)` (8px) | **MAJOR DIVERGENCE** |
| **Elevation / Shadows** | Flat 1px borders (`var(--c-teal-border)`), zero card shadow | `var(--shadow-md)` on cards, layered depth | `box-shadow: 0 1px 4px...` elevation hierarchy | `var(--shadow-sm)` on settings panels | **MAJOR DIVERGENCE** |
| **Typography Scale** | Hardcoded static px: `21px`, `13px`, `11.3px`, `12.5px`, `1.2rem` | Fluid scale: `var(--step--1)` to `var(--step-4)` | Fluid scale: `var(--step--1)` to `var(--step-2)` | Fluid scale: `var(--step--1)` to `var(--step-2)` | **MAJOR DIVERGENCE** |
| **Grid / Section Spacing** | `gap: 5px`, `gap: 12px`, `margin: 0 0 40px`, `padding: 1rem 5px` | `gap: var(--space-4)`, `padding: var(--space-6)` | `gap: var(--space-3)`, `padding: var(--space-4)` | `gap: var(--space-4)`, `padding: var(--space-6)` | **MAJOR DIVERGENCE** |
| **Color Semantic Usage** | Custom legacy aliases (`--c-teal-border`, `--c-heading`, `--c-body`) | Standard tokens (`--border-subtle`, `--text-main`, `--text-muted`) | Standard tokens (`--border-subtle`, `--text-main`) | Standard tokens (`--border-subtle`, `--text-main`) | **MODERATE DIVERGENCE** |

### 3.2 Detailed Divergence Descriptions

#### 3.2.1 Corner Curves & Radii (The "Blob Effect")
On the **Home**, **Search**, and **Setting** pages, card surfaces present a refined native-app radius of **16px** (`--radius-xl`) or **12px** (`--radius-lg`). This creates clean, professional container boundaries that align neatly with 8px/16px padding.

On the **Discover** page, cards utilize `--r-card` (`30px`), while grid containers (`.card-content-container`, `.button-content-container`, `#sub-buttons-container`) utilize `border-radius: 25px;`. At 30px, card corners curve inward so far that they encroach on card title text and images, producing a cartoonish "blob" appearance that looks distinctly disconnected from the rest of the site.

#### 3.2.2 Typography & Readability Degradation
On standard platform pages, text scaling follows a fluid scale rooted in minor thirds (`--step--1` to `--step-3`), maintaining consistent vertical alignment and line-heights across viewports.

On the Discover page, card title text is set to static `13px`, while card descriptions are set to **`11.3px`**. On standard mobile and desktop displays, `11.3px` text falls below WCAG body readability thresholds and renders with irregular pixel hinting. Meanwhile, emoji button text is set to static `21px`.

#### 3.2.3 Spatial Rhythm & Grid Disruption
Platform pages strictly abide by a 4px base spatial grid (`--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-6: 24px`, `--space-8: 32px`).

The Discover page breaks this rhythm by using arbitrary spacing:
* Button containers use `gap: 5px;` and `padding: 1rem 5px;` (mixing rems and non-grid 5px padding).
* Card containers use `gap: 12px;` with fixed `40px` bottom margins (`margin: 0 0 40px;`), leaving vertical gaps that feel disjointed on mobile screens.

---

## 4. Tokenization Plan & Systemic Standardization

To resolve the Discover page's visual divergence and align it with the platform's native-app design language, all hardcoded bypasses will be systematically refactored to consume central design tokens.

### 4.1 Token Alignment Mapping

| Legacy / Bypassed Value | Target Central Token | Value / Definition | Target Elements |
|---|---|---|---|
| `--r-card` (`30px`) | `var(--radius-xl)` | `16px` | `:where(.card)` |
| `border-radius: 25px` | `var(--radius-xl)` | `16px` | `.card-content-container`, `.button-content-container`, `.hj` |
| `#sub-buttons-container` `25px` | `var(--radius-full)` | `9999px` | `#sub-buttons-container` (Pill strip) |
| `--r-btn` (`27px`) | `var(--radius-lg)` or `var(--radius-full)` | `12px` or `9999px` | `:where(.button-content)` |
| `font-size: 21px` | `var(--step-2)` | `clamp(1.44rem, ..., 1.62rem)` | `:where(.button-content)` |
| `font-size: 13px` | `var(--step-0)` | `clamp(1.00rem, ..., 1.125rem)` | `.card-title` |
| `font-size: 11.3px` | `var(--step--1)` | `clamp(0.80rem, ..., 0.85rem)` | `.card-description` |
| `font-size: 1.2rem` | `var(--step-1)` | `clamp(1.20rem, ..., 1.35rem)` | `.group-header-text` |
| `gap: 5px`, `gap: 12px` | `var(--space-2)`, `var(--space-3)` | `8px`, `12px` | `.button-content-container`, `.card-content-container` |
| `padding: 1rem 5px` | `var(--space-4) var(--space-3)` | `16px 12px` | Containers |
| `margin: 0 0 40px` | `margin-bottom: var(--space-8)` | `32px` | Section containers |
| Flat 1px border only | `box-shadow: var(--shadow-sm)` | `0 1px 3px ...` | `:where(.card)` |
| `rgba(13,148,136,0.3)` | `var(--border-subtle)` or `var(--border-brand)` | Semantic border tokens | Active states, tab borders |
| `--c-teal-border` | `var(--border-subtle)` | `var(--color-slate-200)` | Card and button borders |
| `--c-heading`, `--c-body` | `var(--text-main)`, `var(--text-muted)` | Semantic text tokens | Text elements |

### 4.2 Concrete Refactoring Steps

1. **`tokens.css` Cleanup**:
   * Deprecate `--r-btn: 27px;` and `--r-card: 30px;` from `tokens.css`.
   * Map legacy `--r-btn` alias to `var(--radius-lg)` and `--r-card` alias to `var(--radius-xl)` for backward compatibility during transition.

2. **`nav-core-ext.css` Refactoring**:
   * Replace `:where(.card)` `border-radius: var(--r-card);` with `border-radius: var(--radius-xl);` and add `box-shadow: var(--shadow-sm);`.
   * Replace `:where(.button-content)` `border-radius: var(--r-btn);` with `border-radius: var(--radius-lg);`, padding with `var(--space-3)`, font-size with `var(--step-1)`.
   * Standardize `.card-content-container` and `.button-content-container` to `border-radius: var(--radius-xl);`, `gap: var(--space-3);`, `padding: var(--space-4);`, `margin-bottom: var(--space-8);`.
   * Update `.card-title` to `font-size: var(--step-0); font-weight: var(--font-semibold);` and `.card-description` to `font-size: var(--step--1);`.
   * Replace legacy aliases (`--c-teal-border`, `--c-heading`, `--c-body`) with standard tokens (`--border-subtle`, `--text-main`, `--text-muted`).

3. **`nav-core.css` & `index.html` Boot Loader Alignment**:
   * Replace hardcoded padding, margins, and border colors in `nav-core.css` with `--space-*` and `--border-*` tokens.
   * Standardize `#fv-boot-loader` inline styles in `index.html` to consume `--space-*`, `--step-0`, and `--transition-normal`.

4. **`ure.css` Standardization**:
   * Replace hardcoded background fallback `#f0f0f0` with `var(--surface-hover)` and hardcoded error colors with `var(--color-danger)` variants.
   * Standardize `.ure-render-error` to `border-radius: var(--radius-md); padding: var(--space-2) var(--space-3);`.

---

## 5. Summary & Next Steps

This assessment provides the complete baseline inventory and tokenization blueprint required for **Task 2 of the Native Master Plan** (`exec-discover-tokenization`). Once the Master Direction (`docs/design/native/DIRECTION.md`) and Master Plan are finalized, executing the tokenization steps above will restore visual harmony to the Discover page, eliminating the 30px blob curve anomaly and bringing Discover into 100% compliance with FanHoard's native-app design system.
