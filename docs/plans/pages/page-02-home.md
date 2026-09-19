# Page Plan 02: Main Hub & Dashboard (`/home/`)

**Target Path:** `home/index.html`  
**Route URL:** `/home/` (Localized: `/en/home/`, `/th/home/`)  

---

## 1. Current Problems from Technical Assessment

1. **Dead Script References**:
   - Line 7: `<script src="/assets/js/lang-sync.js"></script>` (Missing file; 404 error).
   - Line 319: `<script src="/fanhoard-console-bridge.js"></script>` (Missing file; 404 error).
2. **Non-Accessible Checkbox Hack Accordions**: Lines 280–310 use CSS-hidden `<input type="checkbox">` elements for FAQ accordions. They lack `aria-expanded`, `aria-controls`, and keyboard `Enter`/`Space` actuation hooks for screen readers.
3. **Unoptimized Font & Image Assets**:
   - Uncompressed TTF font `FoglihtenNo07.ttf` (~150KB) loaded in header.
   - Hero banner `/assets/images/j.png` and hub banners are uncompressed PNG/JPG files without WebP/AVIF alternates.
4. **Script Load Waterfall**: Loads 11 individual external JavaScript files sequentially in head and body, creating high RTT latency on mobile networks.

---

## 2. Target Design

### Architecture & Component Structure
The homepage will be composed of modular TypeScript components bundled by Vite:
- **`HeroSection.ts`**: Hero banner with localized tagline and quick search trigger.
- **`CategoryGrid.ts`**: Quick category pills rendering symbol collections from `assets/json/buttons.json`.
- **`FeatureHighlights.ts`**: Fast copy, unicode discovery, and community cards.
- **`FaqAccordion.ts`**: Native HTML5 `<details>` and `<summary>` elements with WCAG 2.1 AA accessibility.

### Component Interfaces
```typescript
interface CategoryCard {
  id: string;
  nameKey: string;
  icon: string;
  routeUrl: string;
}

interface FaqItem {
  id: string;
  questionKey: string;
  answerKey: string;
}
```

---

## 3. Exact Refactoring Steps

1. **Phase 1 Fixes**:
   - Delete line 7 (`lang-sync.js`) and line 319 (`fanhoard-console-bridge.js`) from `home/index.html`.
2. **Phase 4 Asset & Accessibility Refactoring**:
   - Replace TTF font references with `assets/fonts/FoglihtenNo07.woff2` (<30KB).
   - Convert `j.png` hero image to WebP (`assets/images/j.webp`) with `<picture>` fallback tags.
   - Refactor FAQ section in `home/index.html`: Replace `<input type="checkbox">` accordions with native `<details class="fv-faq-item"><summary class="fv-faq-question">...</summary><div class="fv-faq-answer">...</div></details>`.
3. **Phase 5 Component & Vite Modernization**:
   - Build `src/pages/home.ts` importing `CategoryGrid` and `FaqAccordion`.
   - Configure Vite to bundle `home.ts` and `assets/css/home.css` into minified single JS/CSS bundle.
4. **Verification**:
   - Verify zero 404 network errors in DevTools.
   - Test keyboard navigation on FAQ accordions (`Tab`, `Space`, `Enter` expands/collapses answer).
   - Audit with Lighthouse: Verify 100/100 Accessibility score and LCP < 1.0s.
