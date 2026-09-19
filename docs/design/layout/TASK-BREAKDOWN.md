# FanHoard Layout System Execution Task Breakdown

**Document Code:** `docs/design/layout/TASK-BREAKDOWN.md`  
**Status:** APPROVED EXECUTION CHUNK LIST  
**Target Repository:** `github.com/fanhoard/fanhoard-page`  
**Authoritative Plan:** `docs/design/layout/MASTER-PLAN.md`  
**Architectural Direction:** `docs/design/layout/DIRECTION.md`  

---

## 1. Executive Summary & Sub-Agent Sizing Protocol

This document defines the complete, granular execution chunk list for implementing the FanHoard layout system refactoring. To guarantee that every execution step succeeds without agent timeout or workspace corruption, every chunk is bounded to a single page or a small, coherent cluster of files.

### Mandatory Sub-Agent Sizing & Execution Rules:
1. **Sandbox Boundary Rule**: All git clones, builds, file edits, and commits MUST occur in a fresh directory under `/tmp` (e.g., `/tmp/fh-exec-chunk-XX`). NEVER clone, reset, or write files under `/app` (reading `/app` for context is permitted).
2. **Package Lifecycle Rule**: Run `npm install` once per execution session after cloning into `/tmp`.
3. **Mandatory Quality Gate**: Before pushing any commit to main, the worker MUST execute and verify green output for:
   ```bash
   npm run build && npm run validate && npm test
   ```
4. **Git Sync Protocol**: Immediately prior to pushing, always pull the latest main branch via rebase:
   ```bash
   git pull origin main --rebase
   ```
   Then push using the authenticated repository URL:
   ```bash
   git push https://$GITHUB_ACCESS_TOKEN@github.com/fanhoard/fanhoard-page.git main
   ```
5. **SIZE GUARD Partial-Push Protocol**: If a chunk's scope or tool responses approach context/token limits, the sub-agent MUST immediately commit the work completed so far, push to main with `[partial]` in the commit message summary, record what was accomplished and what remains, and exit safely.
6. **Conventional Commit Standard**: All commits MUST follow conventional commit formatting with scope `layout` (e.g., `refactor(layout): shared scaffold and tokens foundation`).

---

## 2. Chunk Sequence & Phase Map

| Chunk ID | Chunk Name | Phase / Scope | Exact Target Files | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **`chunk-01-foundation`** | Layout Foundation & Primitives | Phase 1: Foundation | `assets/css/tokens.css`, `assets/css/layout.css`, `assets/css/base.css`, `assets/css/top-navigation-bar.css`, `assets/css/nav-core.css` | None |
| **`chunk-02-shadow-typography-css`** | CSS Inset Shadow & Typography Purge | Phase 2: Visual Cleanliness | `assets/css/back-to-top.css`, `assets/css/modern-styles.css`, `assets/css/nav-core-ext.css`, `assets/css/search.css`, `assets/css/setting.css`, `assets/css/home.css`, `assets/css/footer.css`, `assets/css/about.css`, `assets/css/roadmap.css`, `assets/css/report.css` | `chunk-01` |
| **`chunk-03-shadow-typography-js`** | JS Inset Shadow & Logo Exemption Enforcer | Phase 2: Visual Cleanliness | `assets/js/nav-core-modules/performance.js`, `assets/css/nav-core.css`, `index.html` | `chunk-02` |
| **`chunk-04-page-root-index`** | Root Landing Page Restructuring | Phase 3: Page Restructuring | `index.html` | `chunk-01`, `chunk-03` |
| **`chunk-05-page-home`** | Home / Hub Page Restructuring | Phase 3: Page Restructuring | `home/index.html`, `assets/template-html/home-templates.html` | `chunk-01` |
| **`chunk-06-page-search`** | Search Engine Page Restructuring | Phase 3: Page Restructuring | `search/index.html` | `chunk-01`, `chunk-02` |
| **`chunk-07-page-setting`** | Setting Page Restructuring | Phase 3: Page Restructuring | `setting/index.html` | `chunk-01`, `chunk-02` |
| **`chunk-08-page-community-index`** | Community Index Page Restructuring | Phase 3: Page Restructuring | `community/index.html` | `chunk-01` |
| **`chunk-09-page-community-contact-report`** | Community Contact & Report Restructuring | Phase 3: Page Restructuring | `community/contact/index.html`, `community/report/index.html` | `chunk-01` |
| **`chunk-10-page-platform-about-roadmap`** | Platform About & Roadmap Restructuring | Phase 3: Page Restructuring | `platform/about/index.html`, `platform/roadmap/index.html` | `chunk-01`, `chunk-02` |
| **`chunk-11-page-platform-whatsnew-license-privacy`** | What's New, License & Privacy Restructuring | Phase 3: Page Restructuring | `platform/whats_new/index.html`, `platform/license/index.html`, `platform/privacy/index.html` | `chunk-01` |
| **`chunk-12-page-data-verse-discover-scope`** | Data Verse Discover & Scope Restructuring | Phase 3: Page Restructuring | `data/verse/discover/index.html`, `data/verse/scope/index.html` | `chunk-01` |
| **`chunk-13-templates-footer-intro`** | Template Assets & Footer Shell Restructuring | Phase 3: Page Restructuring | `assets/template-html/footer-template.html`, `assets/js/footer-template.js`, `assets/template-html/intro-template.html` | `chunk-01`, `chunk-02` |
| **`chunk-14-js-adaptation-nav-search`** | JS Adaptation: NavCore & Search Geometry | Phase 4: JS Adaptation | `assets/js/nav-core.js`, `assets/js/nav-core-modules/router.js`, `assets/js/search-system/search.js`, `assets/js/search-system/search-modules/input-bar.js`, `assets/js/search-system/search-modules/utils.js` | `chunk-06` |
| **`chunk-15-js-adaptation-home-ure-i18n`** | JS Adaptation: Home, URE & i18n Slots | Phase 4: JS Adaptation | `assets/js/home.js`, `assets/js/ure/ure.js`, `assets/js/ure/ure-modules/virtual-list.js`, `assets/js/lang-modules/translator.js`, `assets/js/lang-modules/markers.js` | `chunk-05`, `chunk-14` |
| **`chunk-16-verify-gates`** | Verification Gate 1: SSG, Data & Vitest Suite | Phase 5: Verification | Entire Repository Build Output (`/dist`) | `chunk-01` through `chunk-15` |
| **`chunk-17-verify-audits`** | Verification Gate 2: WCAG 2.2 AA & Design Audit | Phase 5: Verification | `docs/design/layout/VERIFICATION-REPORT.md` | `chunk-16` |

---

## 3. Detailed Chunk Specifications

### Chunk 01: Layout Foundation & System Tokens (`chunk-01-foundation`)
- **Phase**: 1 - Layout Foundation
- **Scope Justification**: Shared tokens, shell definitions, and core layout primitives. Small file cluster affecting global layout CSS.
- **Target Files**: `assets/css/tokens.css`, `assets/css/layout.css`, `assets/css/base.css`, `assets/css/top-navigation-bar.css`, `assets/css/nav-core.css`
- **Dependencies**: None
- **Tasks**:
  1. In `assets/css/tokens.css`, define shell tokens: `--fv-nav-height: 56px`, `--fv-scroll-offset: calc(var(--fv-nav-height) + var(--space-3))`.
  2. In `assets/css/tokens.css`, update typography token `--font-heading: var(--font-sans);`, add fluid `--step-*` type scale tokens, and add elevation tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-focus`).
  3. In `assets/css/layout.css`, add canonical shell classes (`.fv-page-shell`, `.fv-page-shell--has-top-nav`, `.fv-header`, `.fv-main`, `.fv-footer`).
  4. In `assets/css/layout.css`, add global scroll alignment rules: `html { scroll-padding-top: var(--fv-scroll-offset); }` and `[id], section, article, .fv-section, main { scroll-margin-top: var(--fv-scroll-offset); }`.
  5. In `assets/css/layout.css`, add container primitives (`.container-narrow`, `.container-md`, `.container-lg`, `.container-full`), grid primitives (`.grid-2`, `.grid-3`, `.grid-4`, `.grid-auto-fit`, `.grid-aside`), stack/cluster primitives, and Material component primitives (`.fv-card`, `.fv-section`, `.fv-setting-row`, `.fv-hero`).
- **Acceptance Criteria**:
  - `npm run build`, `npm run validate`, and `npm test` execute GREEN.
  - CSS tokens and utility classes are cleanly defined without syntax errors.

---

### Chunk 02: CSS Inset Shadow Purge & Typography Simplification (`chunk-02-shadow-typography-css`)
- **Phase**: 2 - Visual Cleanliness
- **Scope Justification**: Focused CSS-only cleanup purging all 9 CSS inset shadows and 7 hardcoded decorative font overuse declarations.
- **Target Files**: `assets/css/back-to-top.css`, `assets/css/modern-styles.css`, `assets/css/nav-core-ext.css`, `assets/css/search.css`, `assets/css/setting.css`, `assets/css/home.css`, `assets/css/footer.css`, `assets/css/about.css`, `assets/css/roadmap.css`, `assets/css/report.css`
- **Dependencies**: `chunk-01-foundation`
- **Tasks**:
  1. Remove inset shadows from `back-to-top.css:17`, `modern-styles.css:19, 51`, `nav-core-ext.css:24`, `search.css:608, 614-616`, `setting.css:289`. Replace with flat borders or outward pulse ring per DIRECTION.md.
  2. Replace decorative serif fonts in `setting.css:109`, `home.css:23, 33, 146, 346`, `modern-styles.css:102`, `footer.css:86` with `var(--font-sans)` and `--step-*` tokens.
  3. Delete per-page top padding/margin hacks (`body { padding-top: 2rem; }` in `setting.css`, `body { margin-top: 90px; }` in `about.css`, `.scope-shell { margin: 24px auto; }`).
- **Acceptance Criteria**:
  - 0 inset shadow declarations remain across target CSS files.
  - Heading fonts use standard `--font-sans`.
  - `npm run build` passes GREEN.

---

### Chunk 03: JS Inset Shadow Purge & Logo Exemption Enforcer (`chunk-03-shadow-typography-js`)
- **Phase**: 2 - Visual Cleanliness
- **Scope Justification**: Small JS edit + verification of brand logo font exemptions.
- **Target Files**: `assets/js/nav-core-modules/performance.js`, `assets/css/nav-core.css`, `index.html`
- **Dependencies**: `chunk-02-shadow-typography-css`
- **Tasks**:
  1. In `assets/js/nav-core-modules/performance.js:42`, remove the `inset` box-shadow string from inline style injection.
  2. In `assets/css/nav-core.css` (`.logo`) and `index.html` (`.brand-name`), confirm and enforce `FoglihtenNo07calt` font declaration for official brand logo exemption.
  3. Verify via grep that zero other CSS or JS files declare decorative serif fonts outside the 2 logo locations.
- **Acceptance Criteria**:
  - Total codebase inset shadow count = 0.
  - Logo font present strictly in `.logo` and `.brand-name`.
  - `npm test` passes GREEN.

---

### Chunk 04: Root Landing Page Restructuring (`chunk-04-page-root-index`)
- **Phase**: 3 - Per-Page HTML Restructuring
- **Scope Justification**: Single file (`index.html`) restructuring into canonical page shell.
- **Target Files**: `index.html`
- **Dependencies**: `chunk-01-foundation`, `chunk-03-shadow-typography-js`
- **Tasks**:
  1. Wrap body in `.fv-page-shell`.
  2. Update skip link target to `<a href="#fv-main" class="skip-link" data-translate="home-skip-link">`.
  3. Structure header/nav landmark: `<header class="fv-header"><nav class="fv-nav">`.
  4. Convert main content block to `<main id="fv-main" class="fv-main" role="main" tabindex="-1">`.
  5. Replace inline serif styling on `<h2>` with class using `--font-sans`.
  6. Wrap hero and feature cards in `.container-lg` and `.fv-section`.
- **Acceptance Criteria**:
  - `index.html` adopts canonical shell markup.
  - Skip link keyboard navigation lands on `#fv-main`.
  - `npm run build` compiles `dist/index.html` green.

---

### Chunk 05: Home / Hub Page Restructuring (`chunk-05-page-home`)
- **Phase**: 3 - Per-Page HTML Restructuring
- **Scope Justification**: Home page HTML + home templates HTML file cluster.
- **Target Files**: `home/index.html`, `assets/template-html/home-templates.html`
- **Dependencies**: `chunk-01-foundation`
- **Tasks**:
  1. In `home/index.html`, wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
  2. Standardize skip link to target `#fv-main`.
  3. Structure landmark `<main id="fv-main" class="fv-main">`.
  4. Replace custom layout classes (`.w`, `.con`, `.hub-actions`) with `.container-lg`, `.grid-3`, `.stack-md`.
  5. Refactor feature cards and carousel containers to `.fv-card`.
  6. In `home-templates.html`, update dynamic card templates to consume `.fv-card` markup.
- **Acceptance Criteria**:
  - Top nav content overlap eliminated on home page.
  - Home carousel and feature cards initialize properly.
  - `npm run build` passes GREEN.

---

### Chunk 06: Search Engine Page Restructuring (`chunk-06-page-search`)
- **Phase**: 3 - Per-Page HTML Restructuring
- **Scope Justification**: Search hub single file restructuring.
- **Target Files**: `search/index.html`
- **Dependencies**: `chunk-01-foundation`, `chunk-02-shadow-typography-css`
- **Tasks**:
  1. Wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
  2. Standardize skip link to `#fv-main`.
  3. Structure landmark `<main id="fv-main" class="fv-main">` (preserve `#searchResults` ID or alias on results container).
  4. Wrap search hero in `.container-lg` and `.fv-hero`.
  5. Update `#search-sticky` element to align with `--fv-nav-height`.
- **Acceptance Criteria**:
  - Initial load overlap fixed.
  - Virtual scroll engine (`VirtualScrollEngine`) renders result items accurately.
  - `npm run build` passes GREEN.

---

### Chunk 07: Setting Page Restructuring (`chunk-07-page-setting`)
- **Phase**: 3 - Per-Page HTML Restructuring
- **Scope Justification**: Setting single page restructuring + font cleanup.
- **Target Files**: `setting/index.html`
- **Dependencies**: `chunk-01-foundation`, `chunk-02-shadow-typography-css`
- **Tasks**:
  1. Delete external Sofia Google Font `<link>` import in `<head>`.
  2. Wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
  3. Standardize skip link to `#fv-main`.
  4. Wrap form content in `<main id="fv-main" class="fv-main"><div class="container-md">`.
  5. Convert setting groups to `.fv-card` and setting options to `.fv-setting-row`.
- **Acceptance Criteria**:
  - Setting page top padding hack removed; nav offset handled by shell.
  - Zero external font network requests.
  - `PreferenceStore` options toggle seamlessly.
  - `npm run build` passes GREEN.

---

### Chunk 08: Community Index Page Restructuring (`chunk-08-page-community-index`)
- **Phase**: 3 - Per-Page HTML Restructuring
- **Scope Justification**: Community index single file restructuring.
- **Target Files**: `community/index.html`
- **Dependencies**: `chunk-01-foundation`
- **Tasks**:
  1. Wrap body in `.fv-page-shell.fv-page-shell--has-top-nav`.
  2. Standardize skip link to `#fv-main`.
  3. Structure landmark `<main id="fv-main" class="fv-main"><div class="container-md">`.
  4. Apply `.fv-section` and `.fv-card` components to community resource cards.
- **Acceptance Criteria**:
  - Top nav overlap fixed.
  - Community hub cards render with exact visual parity.
  - `npm run build` passes GREEN.

---

### Chunk 09: Community Contact & Report Restructuring (`chunk-09-page-community-contact-report`)
- **Phase**: 3 - Per-Page HTML Restructuring
- **Scope Justification**: Small 2-file cluster for community interaction forms.
- **Target Files**: `community/contact/index.html`, `community/report/index.html`
- **Dependencies**: `chunk-01-foundation`
- **Tasks**:
  1. Restructure `community/contact/index.html` into `.fv-page-shell--has-top-nav` and `<main id="fv-main" class="fv-main"><div class="container-md">`.
  2. Apply `.fv-card` to form container and `.stack-md` to form groups.
  3. Restructure `community/report/index.html` into `.fv-page-shell--has-top-nav` and `<main id="fv-main" class="fv-main"><div class="container-md">`.
  4. Clean up inline styles and custom card wrappers.
- **Acceptance Criteria**:
  - Form submission targets and fields remain 100% functional.
  - Focus rings utilize `--shadow-focus`.
  - `npm run build` passes GREEN.

---

### Chunk 10: Platform About & Roadmap Restructuring (`chunk-10-page-platform-about-roadmap`)
- **Phase**: 3 - Per-Page HTML Restructuring
- **Scope Justification**: 2-file cluster for platform informative pages.
- **Target Files**: `platform/about/index.html`, `platform/roadmap/index.html`
- **Dependencies**: `chunk-01-foundation`, `chunk-02-shadow-typography-css`
- **Tasks**:
  1. In `platform/about/index.html`, remove Sofia Google Font `<link>` import. Wrap body in `.fv-page-shell--has-top-nav` and `<main id="fv-main" class="fv-main"><div class="container-narrow">`.
  2. In `platform/roadmap/index.html`, wrap body in `.fv-page-shell--has-top-nav` and `<main id="fv-main" class="fv-main"><div class="container-lg">`.
  3. Ensure `#roadmap-container` ID is preserved for `roadmap.js` IDB renderer.
- **Acceptance Criteria**:
  - External Google font calls eliminated.
  - Roadmap items render dynamically without DOM lookup errors.
  - `npm run build` passes GREEN.

---

### Chunk 11: What's New, License & Privacy Restructuring (`chunk-11-page-platform-whatsnew-license-privacy`)
- **Phase**: 3 - Per-Page HTML Restructuring
- **Scope Justification**: 3 small document page files sharing container-narrow read mode.
- **Target Files**: `platform/whats_new/index.html`, `platform/license/index.html`, `platform/privacy/index.html`
- **Dependencies**: `chunk-01-foundation`
- **Tasks**:
  1. Restructure all 3 pages into `.fv-page-shell--has-top-nav`.
  2. Set `<main id="fv-main" class="fv-main"><div class="container-narrow">`.
  3. Refactor release log items in `whats_new/index.html` to `.fv-card`.
  4. Refactor legal text blocks in `license` and `privacy` into `.fv-section`.
- **Acceptance Criteria**:
  - Reading container width (720px) consistent across all document pages.
  - Top nav overlap fixed across all 3 pages.
  - `npm run build` passes GREEN.

---

### Chunk 12: Data Verse Discover & Scope Restructuring (`chunk-12-page-data-verse-discover-scope`)
- **Phase**: 3 - Per-Page HTML Restructuring
- **Scope Justification**: 2-file cluster for data verse exploration pages.
- **Target Files**: `data/verse/discover/index.html`, `data/verse/scope/index.html`
- **Dependencies**: `chunk-01-foundation`
- **Tasks**:
  1. Restructure `data/verse/discover/index.html` into `.fv-page-shell--has-top-nav` and `<main id="fv-main" class="fv-main"><div class="container-lg">`. Preserve tab strip DOM hooks for `DiscoverFeed.ts`.
  2. Restructure `data/verse/scope/index.html` into `.fv-page-shell--has-top-nav` and `<main id="fv-main" class="fv-main"><div class="container-md">`.
  3. Delete `.scope-shell` 24px margin override in CSS.
- **Acceptance Criteria**:
  - Feed infinite scroll and scope tables render accurately.
  - Top nav overlap resolved.
  - `npm run build` passes GREEN.

---

### Chunk 13: Template Assets & Footer Shell Restructuring (`chunk-13-templates-footer-intro`)
- **Phase**: 3 - Per-Page HTML Restructuring
- **Scope Justification**: Shared HTML templates injected during SSG build and client runtime.
- **Target Files**: `assets/template-html/footer-template.html`, `assets/js/footer-template.js`, `assets/template-html/intro-template.html`
- **Dependencies**: `chunk-01-foundation`, `chunk-02-shadow-typography-css`
- **Tasks**:
  1. In `assets/template-html/footer-template.html`, restructure to `<footer class="fv-footer" role="contentinfo"><div class="container-full">`.
  2. In `assets/js/footer-template.js`, update dynamic client footer injection to emit the canonical `<footer class="fv-footer">` landmark.
  3. In `assets/template-html/intro-template.html`, align markup with shell primitives.
- **Acceptance Criteria**:
  - SSG build (`src/build/ssg.ts`) compiles footer template into all 32 output pages cleanly.
  - `npm run validate` passes GREEN.

---

### Chunk 14: JS Adaptation: NavCore & Search Geometry (`chunk-14-js-adaptation-nav-search`)
- **Phase**: 4 - JS Adaptation
- **Scope Justification**: Adapting JS modules that query nav geometry or search DOM elements.
- **Target Files**: `assets/js/nav-core.js`, `assets/js/nav-core-modules/router.js`, `assets/js/search-system/search.js`, `assets/js/search-system/search-modules/input-bar.js`, `assets/js/search-system/search-modules/utils.js`
- **Dependencies**: `chunk-06-page-search`
- **Tasks**:
  1. Update nav geometry reading logic to query `--fv-nav-height` CSS token.
  2. Synchronize main landmark query selectors (`#fv-main`, keeping fallback to `#searchResults` if present).
  3. Update `#search-sticky` positioning offset math in `search.js` to read CSS variables.
- **Acceptance Criteria**:
  - Sticky search bar behaves smoothly on scroll without layout jump.
  - `NavCore` route transitions execute without missing selector errors.
  - `npm test` passes GREEN.

---

### Chunk 15: JS Adaptation: Home, URE & i18n Slots (`chunk-15-js-adaptation-home-ure-i18n`)
- **Phase**: 4 - JS Adaptation
- **Scope Justification**: Adapting dynamic DOM generators, URE virtual scrolling, and i18n slot insertion routines.
- **Target Files**: `assets/js/home.js`, `assets/js/ure/ure.js`, `assets/js/ure/ure-modules/virtual-list.js`, `assets/js/lang-modules/translator.js`, `assets/js/lang-modules/markers.js`
- **Dependencies**: `chunk-05-page-home`, `chunk-14-js-adaptation-nav-search`
- **Tasks**:
  1. Verify home carousel card generator in `home.js` emits `.fv-card` markup.
  2. Confirm URE virtual list coordinate math aligns with normalized container padding.
  3. Verify `translator.js` and `markers.js` slot insertion routines (`@slot:name`, `<svg data-i18n-svg>`) function against restructured HTML.
- **Acceptance Criteria**:
  - Language switching (EN <-> TH) works across all pages without breaking DOM structure.
  - Vitest test suite (`npm test`) passes 100% GREEN.

---

### Chunk 16: Verification Gate 1: SSG, Data & Vitest Suite (`chunk-16-verify-gates`)
- **Phase**: 5 - Final Verification
- **Scope Justification**: Full suite automated verification gate across all build and test pipelines.
- **Target Files**: Build Output (`/dist`), test scripts
- **Dependencies**: `chunk-01` through `chunk-15`
- **Tasks**:
  1. Run `npm run build` and verify that all 16 source HTML files build into 32 localized output pages in `/dist/` in < 1s.
  2. Run `npm run validate` and verify 57/57 static data schema and release validator checks pass.
  3. Run `npm test` and verify 16 test files / 77 tests pass cleanly without failures or warnings.
- **Acceptance Criteria**:
  - `npm run build` -> SUCCESS (32 pages).
  - `npm run validate` -> 57/57 passed.
  - `vitest run` -> 16 test files passed.

---

### Chunk 17: Verification Gate 2: WCAG 2.2 AA & Design Audit (`chunk-17-verify-audits`)
- **Phase**: 5 - Final Verification
- **Scope Justification**: Dedicated WCAG 2.2 AA accessibility audit, design rule validation, and report creation.
- **Target Files**: `docs/design/layout/VERIFICATION-REPORT.md`
- **Dependencies**: `chunk-16-verify-gates`
- **Tasks**:
  1. Audit landmark structure across all 32 output pages in `/dist/`: verify skip links, `<header role="banner">`, `<nav>`, `<main id="fv-main">`, `<footer>`.
  2. Audit nav offset across all viewports: verify 0 content overlap on initial load and anchor jump.
  3. Audit shadow policy: verify 0 inset shadows and canonical outward elevation tokens.
  4. Audit typography policy: verify logo exemption compliance and standard `--step-*` type scale on headings.
  5. Write and commit comprehensive verification findings in `docs/design/layout/VERIFICATION-REPORT.md`.
- **Acceptance Criteria**:
  - `VERIFICATION-REPORT.md` created, committed, and pushed to main.
  - All goal success criteria met.
