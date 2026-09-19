# Page Plan 12: Symbol Scope Detail View (`/data/verse/scope/`)

**Target Path:** `data/verse/scope/index.html`  
**Route URL:** `/data/verse/scope/`  

---

## 1. Technical Assessment Findings

1. **Missing 404 Fallback**: If requested symbol slug in URL query parameters (`?symbol=...`) is missing from `con-data`, page displays blank empty state without error card.
2. **Missing Dynamic Open Graph Meta**: Social sharing links lack dynamic card generation for specific symbol scopes.

---

## 2. Target Design & Refactoring Steps

1. **Phase 3 & 4 Scope Reader Refactoring**:
   - Build `src/components/SymbolScopeReader.ts`:
     - Looks up symbol in `con-data` database.
     - Renders breadcrumbs (`Home > Verse > Category > Symbol`).
     - Renders 404 error card ("Symbol not found") if slug is invalid.
     - Updates `document.title` and `og:title` dynamically.
2. **Phase 5 Vite Bundling**:
   - Bundle `src/pages/scope.ts` via Vite.
3. **Verification**:
   - Open valid symbol URL: verify symbol details, variations, and copy buttons display.
   - Open invalid symbol URL (`?symbol=nonexistent`): verify "Symbol Not Found" card displays.
