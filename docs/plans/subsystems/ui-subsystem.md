# UI Subsystem Plan

**Subsystem Name:** UI Components, Tokens & Accessibility  
**Scope:** `fanhoard/fanhoard-page`  

---

## 1. Target UI & Styling Architecture

The UI Subsystem governs the visual design tokens, layout templates, responsive component library, font/image assets, and accessibility features across FanHoard.

### CSS Design Token System (`assets/css/tokens.css`)
```css
:root {
  /* Color Tokens */
  --fv-color-bg: #0f172a;
  --fv-color-surface: #1e293b;
  --fv-color-text: #f8fafc;
  --fv-color-text-muted: #94a3b8;
  --fv-color-primary: #6366f1;
  --fv-color-primary-hover: #4f46e5;
  --fv-color-border: #334155;

  /* Focus Ring Accessibility Token */
  --fv-focus-ring: #818cf8;

  /* Typography Tokens */
  --fv-font-sans: system-ui, -apple-system, sans-serif;
  --fv-font-heading: 'FoglihtenNo07', serif;

  /* Spacing Tokens */
  --fv-space-xs: 0.25rem;
  --fv-space-sm: 0.5rem;
  --fv-space-md: 1rem;
  --fv-space-lg: 1.5rem;
  --fv-space-xl: 2rem;
}
```

---

## 2. Asset Optimization Strategy

1. **Font Conversion (WOFF2)**:
   - Convert `FoglihtenNo07.ttf` and `MunroSmall.ttf` to WOFF2 format (<30KB each).
   - Configure `@font-face` with `font-display: swap`.
2. **Responsive WebP/AVIF Images**:
   - Convert all static PNG/JPG assets (`j.png`, hub banners, OG images) to WebP and AVIF.
   - Replace standard `<img>` tags with responsive `<picture>` fallbacks:
     ```html
     <picture>
       <source srcset="/assets/images/j.avif" type="image/avif">
       <source srcset="/assets/images/j.webp" type="image/webp">
       <img src="/assets/images/j.png" alt="FanHoard Logo" loading="lazy">
     </picture>
     ```

---

## 3. Component Architecture & Accessibility Standard (WCAG 2.1 AA)

1. **High-Contrast Focus Rings**:
   - Remove all `outline: none` suppression rules.
   - Enforce visible `:focus-visible` focus ring: `outline: 3px solid var(--fv-focus-ring); outline-offset: 2px;`.
2. **Native HTML5 Accordions**:
   - Replace CSS checkbox hacks with native `<details>` and `<summary>` elements.
3. **Screen Reader Announcers (`aria-live`)**:
   - Inject `aria-live="polite"` regions for dynamic search hit counts and copy toast notifications.
4. **Accessible Modal Engine (`src/components/PopupEngine.ts`)**:
   - Full keyboard focus trapping (`focus-trap`) and `Escape` key close listener.
   - DOM node construction replacing raw `innerHTML` string assignments.

---

## 4. Migration Steps

1. **Phase 1: Focus Ring Restoration**: Purge `outline: none` rules across all CSS files.
2. **Phase 4: Token & Asset Modernization**: Refactor `tokens.css`, convert fonts to WOFF2, convert images to WebP/AVIF, and refactor accordions to `<details>`.
3. **Verification**: Run `@axe-core/cli` automated accessibility audit across all 16 page routes.
