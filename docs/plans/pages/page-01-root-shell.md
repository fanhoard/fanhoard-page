# Page Plan 01: Root Fallback Shell & Custom 404 (`/`)

**Target Path:** `index.html` (Cloudflare Pages fallback target via `_redirects`)  
**Route URL:** `/` / 404 Fallback  

---

## 1. Current Problems from Technical Assessment

1. **Dead Script Reference (404 Error)**: Line 122 contains `<script src="/fanhoard-console-bridge.js"></script>`. This script file does not exist in the repository, causing an HTTP 404 error on every invalid route request.
2. **Hardcoded Unlocalized Content**: The custom 404 error title, description, and navigation fallback buttons are hardcoded in English, failing to respect the user's preferred language (`fv_lang` in `localStorage` or browser language preferences).
3. **Broken Action Button Links**: Action buttons point to `/home` (line 105), relying on Cloudflare Pages trailing-slash redirects instead of linking directly to localized entry points (`/en/home/` or `/th/home/`).
4. **Missing Security Headers**: Deployed page lacks Content Security Policy (CSP) and frame protection headers in `_headers`.

---

## 2. Target Design

### User Experience & DOM Structure
A lightweight, fully localized custom 404 error shell that detects the user's preferred locale (`en` or `th`) and displays a clear error state with action buttons to return home or search symbols.

### Component & TypeScript Interface
```typescript
interface RootShellProps {
  locale: 'en' | 'th';
  errorCode: 404;
  title: string;
  description: string;
  homeUrl: string;
  searchUrl: string;
}
```

### Accessibility (a11y) Pattern
- `main` element with `role="main"` and `aria-labelledby="404-heading"`.
- Primary and secondary action buttons with high-contrast `:focus-visible` outline rings.

---

## 3. Exact Refactoring Steps

1. **Phase 1 Fixes**:
   - Open `index.html` and delete line 122 (`<script src="/fanhoard-console-bridge.js"></script>`).
   - Update action button hrefs on lines 105–108: replace `/home` with `/en/home/` as baseline static href, dynamically updated by locale detector script.
2. **Phase 3 Modernization**:
   - Inject localized data-translate attributes (`data-translate="404.title"`, `data-translate="404.description"`).
   - Integrate `src/stores/LanguageStore.ts` to inspect `localStorage.getItem('fv_lang')` or `navigator.language` on mount and set appropriate link targets (`/en/home/` vs `/th/home/`).
3. **Phase 5 Vite SSG Integration**:
   - Ensure SSG build pipeline generates pre-rendered localized 404 fallback templates in `dist/en/404.html` and `dist/th/404.html`.
4. **Verification**:
   - Request invalid route (e.g. `http://localhost:5173/non-existent-page`).
   - Open DevTools Network tab: verify 0 HTTP 404 script loading errors.
   - Verify action buttons route directly to localized `/en/home/` or `/th/home/`.
