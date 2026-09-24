# FanHoard System Design & User Experience (UX) Architecture

- **System Described**: Design Tokens (`tokens.css`), Typography, Color System, Responsive Layout Architecture, Accessibility, and UI Components
- **Entry File**: `assets/css/tokens.css`
- **Dependencies**: `assets/css/variables.css`, `assets/css/top-navigation-bar.css`, `assets/css/popup.css`, `assets/css/search-system.css`
- **Verification**: `npm run test`

---

## 1. Design System Overview

FanHoard delivers an instant, clutter-free utility experience. Users visit FanHoard to discover, copy, and utilize emojis, symbols, and fancy text without registration, paywalls, or distracting popups. The UI design combines modern aesthetics (teal/cyan gradients, soft border radii, dark mode adaptability) with platform-grade performance.

---

## 2. Design Tokens Architecture (`assets/css/tokens.css`)

All design constants (colors, typography, spacing, border radii, shadows, z-indices) are defined as CSS custom properties with the `--fv-*` namespace in `assets/css/tokens.css`.

### 2.1 Brand Color Palette Tokens

```css
/* Primary Brand Palette */
--fv-brand-teal:           #13b47f;  /* Primary brand color */
--fv-brand-teal-light:     #00CEB0;  /* Light accent variant */
--fv-brand-teal-dark:      #0a9273;  /* Dark hover/active variant */
--fv-brand-cyan:           #0eb0d5;  /* Secondary accent */
--fv-brand-cyan-accent:    #11c3ec;  /* Bright cyan highlight */

/* Accent Gradients */
--fv-brand-purple:         #B58CFF;  /* Header accent start */
--fv-brand-purple-dark:    #9B6EFF;
--fv-brand-green-bright:   #18E4A1;  /* Gradient end */
```

### 2.2 Border Radius Standard Tokens

FanHoard uses distinct, soft non-standard corner radii to establish visual identity:

```css
--fv-radius-sm:   12px;   /* Small badges & chips */
--fv-radius-md:   17px;   /* Input fields & buttons */
--fv-radius-lg:   27px;   /* Content cards & modals */
--fv-radius-xl:   37px;   /* Navigation containers */
--fv-radius-max:  47px;   /* Floating action pill elements */
```

### 2.3 Typography & Web Fonts

Custom web fonts are hosted in `assets/fonts/` using optimized modern WOFF2 format:

| Font Family | File Asset Path | Usage Scope |
| :--- | :--- | :--- |
| **FoglihtenNo07** | `assets/fonts/FoglihtenNo07.woff2` | Decorative brand headings & title logo |
| **FoglihtenNo07calt** | `assets/fonts/FoglihtenNo07calt.woff2` | Alternative contextual heading glyphs |
| **MunroSmall** | `assets/fonts/MunroSmall.woff2` | Monospace pixel & code display accents |
| **System Sans-Serif** | System Font Stack (`system-ui, -apple-system, BlinkMacSystemFont`) | Primary UI body text & interactive buttons |

---

## 3. Google-Like Non-Sticky Search UX Layout

In v3.0.0, the search page layout was redesigned for optimal vertical viewing:

```
┌──────────────────────────────────────────────────────────┐
│ #search-sticky  (Sticky Bar)                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [ 🔍 Search emojis, symbols, fancy text...        ] │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ .search-filters-panel  (Natural Scroll Area)             │
│ [ All ]  [ Emojis ]  [ Symbols ]  [ Fancy ]             │
│ (Category filter row collapses automatically when empty)  │
└──────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────┐
│ #search-results  (Virtual Scrolled Grid Results)         │
│ ...                                                      │
└──────────────────────────────────────────────────────────┘
```

- **Sticky Element**: `#search-sticky` holds ONLY the search input bar.
- **Scroll Behavior**: `.search-filters-panel` scrolls naturally with content, ensuring maximum viewport height for search results on mobile screens.
- **Category Auto-Collapse**: CSS rule `.filter-pills-row--cat:empty { display: none; }` prevents empty layout gaps when no subcategories match.

---

## 4. Accessibility & Motion Standards (WCAG AA)

1. **Reduced Motion Compliance**: Respects `@media (prefers-reduced-motion: reduce)` by disabling non-essential CSS keyframe animations and transition delays.
2. **Keyboard Navigation**: Interactive elements (`<button>`, `<a href>`) must have visible `:focus-visible` focus rings (`outline: 2px solid var(--fv-brand-teal)`).
3. **Contrast Compliance**: Text contrast meets WCAG AA standards (minimum 4.5:1 ratio against background surfaces).

---

## 5. Prohibited UX Practices

| Prohibited UX Practice | System Impact |
| :--- | :--- |
| Hardcoding raw hex colors in component CSS | Bypasses theme token system and breaks dark mode. |
| Referencing obsolete font extensions (`.ttf`) | Causes 404 network fetch errors. |
| Making search filter panels sticky | Obscures mobile screen real estate and reduces visible results. |
| Removing `:focus-visible` outlines without fallback | Violates accessibility guidelines for keyboard users. |

---

## 6. Cross-References

- [`02-Search-System.md`](./02-Search-System.md) — Two-tier search engine & UI orchestrator
- [`06-Popup-System.md`](./06-Popup-System.md) — Modal & Toast Notification System
- [`docs/engineering/ai-docs-guide.md`](../docs/engineering/ai-docs-guide.md) — AI-first documentation standards
