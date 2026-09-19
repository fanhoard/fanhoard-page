# FanHoard Native Design Restoration Task Breakdown

**Document Code:** `docs/design/native/TASK-BREAKDOWN.md`  
**Status:** BINDING EXECUTION CHUNK LIST / OWNER-APPROVED  
**Target Repository:** `github.com/fanhoard/fanhoard-page`  
**Authoritative References:** `docs/design/native/MASTER-PLAN.md`, `docs/design/native/DIRECTION.md`  

---

## Execution Sizing & Operating Rules

To ensure safe, robust, and verifiable execution, every sub-agent worker MUST strictly adhere to the following mandatory workspace and execution protocol rules:

### Mandatory Execution Protocol Rules
1. **Workspace Isolation**:
   * Executing sub-agents MUST clone the latest `main` branch into a **FRESH directory under `/tmp`** (e.g., `/tmp/fh-exec-chunk-XX`).
   * **NEVER** clone, reset, modify, or write files under `/app` (reading `/app` reference files is permitted).
2. **Environment Setup & Local Validation**:
   * Run `npm install` once upon workspace creation.
   * Prior to pushing any commit, the worker MUST run and verify that all three automated quality gates pass cleanly:
     1. `npm run build` (Vite compilation + TypeScript SSG build system)
     2. `npm run validate` (Data schema validator + release validator)
     3. `npm run test` (Vitest unit test suite — 16 files / 77 tests)
3. **Git Branch & Push Protocol**:
   * Pull the latest `main` branch with rebase (`git pull origin main --rebase`) before pushing.
   * Push using explicit GitHub token authentication:  
     `git push https://$GITHUB_ACCESS_TOKEN@github.com/fanhoard/fanhoard-page.git main`
   * Commit using conventional commit format (e.g., `refactor(native): ...` or `docs(design): ...`).
4. **SIZE GUARD Partial-Push Protocol**:
   * If a sub-agent window reaches capacity or encounters file size/payload limits, it MUST commit and push all completed, passing work to `main` immediately, note what remains in its result report, and exit cleanly.
5. **No Connector Tools**: Sub-agents MUST NOT invoke any external connector tools or services.

---

## Executive Summary & Chunk Sequence Overview

Total Exec Chunks: **13 Chunks** across 5 Mandatory Execution Phases.

```
Phase 1: Foundation (Tokens & Layout Primitives)
└── chunk-01-token-craft-foundation

Phase 2: Discover Tokenization
└── chunk-02-discover-tokenization

Phase 3: Per-Page Essence Restoration
├── chunk-03-essence-index-landing
├── chunk-04-essence-home
├── chunk-05-essence-search
├── chunk-06-essence-setting
├── chunk-07-essence-community
├── chunk-08-essence-platform
└── chunk-09-essence-scope-templates

Phase 4: JS Adaptation
├── chunk-10-js-adaptation-nav-search-footer
└── chunk-11-js-adaptation-home-ure-i18n

Phase 5: Verification & Audits
├── chunk-12-verify-gates
└── chunk-13-verify-audits
```

---

## Detailed Exec Chunk Specifications

### Phase 1: Foundation (Tokens & Layout Primitives)

#### Chunk 01: Central Design Tokens & Layout Primitives (`chunk-01-token-craft-foundation`)
* **Phase**: 1 - Foundation
* **Target Files**: `assets/css/tokens.css`, `assets/css/layout.css`
* **Dependencies**: None (First Chunk)
* **Sub-Agent Window Sizing**: Bounded to central CSS design token & layout primitive definitions.
* **Step-by-Step Instructions**:
  1. In `assets/css/tokens.css`:
     * Add missing spacing token `--space-7: 28px;` to eliminate token reference warnings.
     * Harmonize radius token scale (`--radius-xs: 4px`, `--radius-sm: 6px`, `--radius-md: 8px`, `--radius-lg: 12px`, `--radius-xl: 16px`, `--radius-2xl: 24px`, `--radius-full: 9999px`).
     * Standardize outward elevation tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-focus`).
  2. In `assets/css/layout.css`:
     * Update `.fv-section` padding to `var(--space-10)` (40px) desktop, `var(--space-6)` (24px) mobile.
     * Reset `.fv-card` default styling to single-layer card surface with subtle border (`1px solid var(--border-subtle)`) and zero default shadow.
     * Enforce `min-height: 44px; min-width: 44px;` target floor on interactive control utilities.
* **Done Criteria**:
  * `npm run build`, `npm run validate`, and `npm run test` pass cleanly.
  * Central CSS token scale is complete and exported cleanly.
  * Pushed to `main` via git rebase.

---

### Phase 2: Discover Tokenization

#### Chunk 02: Discover Page Token Integration & CSS Decoupling (`chunk-02-discover-tokenization`)
* **Phase**: 2 - Discover Tokenization
* **Target Files**: `data/verse/discover/index.html`, `assets/css/nav-core-ext.css`
* **Dependencies**: `chunk-01-token-craft-foundation`
* **Sub-Agent Window Sizing**: Bounded to Discover page markup and nav-core extension CSS.
* **Step-by-Step Instructions**:
  1. In `data/verse/discover/index.html` & `assets/css/nav-core-ext.css`:
     * Purge all token bypass declarations (`--r-card: 30px`, `--r-btn: 27px`, hardcoded `border-radius: 25px`, custom box shadows, un-tokenized color hex codes).
     * Replace all hardcoded values with central token references from `assets/css/tokens.css` (`var(--radius-xl)`, `var(--radius-full)`, `var(--shadow-md)`).
     * Update `.card-content-container` grid: `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); align-items: stretch;`. Remove `justify-items: center`.
     * Update `#sub-buttons-container` as a clean horizontal scrolling pill track (`display: flex; gap: var(--space-2); overflow-x: auto`).
* **Done Criteria**:
  * Discover page zero token bypass count verified.
  * `npm run build`, `npm run validate`, and `npm run test` pass cleanly.
  * Pushed to `main` via git rebase.

---

### Phase 3: Per-Page Essence Restoration

#### Chunk 03: Root Landing & 404 Shell Restoration (`chunk-03-essence-index-landing`)
* **Phase**: 3 - Page Restorations
* **Target Files**: `index.html`
* **Dependencies**: `chunk-01-token-craft-foundation`
* **Sub-Agent Window Sizing**: Bounded to Root Landing page shell.
* **Step-by-Step Instructions**:
  1. Strip redundant outer `.fv-card` wrapping from landing hero section and portal options.
  2. Set hero section padding to `var(--space-12)` (48px top/bottom).
  3. Format portal option cards as single-layer `var(--surface-card)` with `border: 1px solid var(--border-subtle)` and `border-radius: var(--radius-xl)`.
  4. Ensure all portal cards pass WCAG 2.5.5 touch target minimums (≥44px height).
* **Done Criteria**:
  * Landing hero renders clean 48px padding without double borders.
  * `npm run build`, `npm run validate`, and `npm run test` pass cleanly.
  * Pushed to `main` via git rebase.

#### Chunk 04: Main Fan Hub & Carousel Restoration (`chunk-04-essence-home`)
* **Phase**: 3 - Page Restorations
* **Target Files**: `home/index.html`, `assets/css/home.css`
* **Dependencies**: `chunk-01-token-craft-foundation`
* **Sub-Agent Window Sizing**: Bounded to Home Hub page and home CSS.
* **Step-by-Step Instructions**:
  1. Revert carousel card (`.item-card`) padding from `.fv-card`'s 24px back to `var(--space-4)` (16px) in `assets/css/home.css`.
  2. Align hero action buttons into a balanced flex row (`display: flex; gap: var(--space-4); justify-content: center; flex-wrap: wrap`).
  3. Enforce explicit 4-column desktop grid for `.features-grid` (`grid-template-columns: repeat(4, 1fr); gap: var(--space-4); align-items: stretch`).
  4. Set major section spacing to `margin-bottom: var(--space-10)` (40px).
* **Done Criteria**:
  * Carousel cards display tidy 16px padding without text overflow.
  * Features grid renders perfectly structured 4-column desktop rows.
  * `npm run build`, `npm run validate`, and `npm run test` pass cleanly.
  * Pushed to `main` via git rebase.

#### Chunk 05: Search Sticky Header & Results Feed Restoration (`chunk-05-essence-search`)
* **Phase**: 3 - Page Restorations
* **Target Files**: `search/index.html`, `assets/css/search.css`
* **Dependencies**: `chunk-01-token-craft-foundation`
* **Sub-Agent Window Sizing**: Bounded to Search page and search CSS.
* **Step-by-Step Instructions**:
  1. Strip `.fv-hero` utility class from `.search-header` inside `#search-sticky` in `search/index.html`.
  2. Enforce compact sticky bar geometry in `assets/css/search.css`: `min-height: 56px; max-height: 64px; padding: var(--space-2) var(--space-4);`.
  3. Enlarge `#search-clear-btn` touch target to `44x44px`.
  4. Format search result cards as a tidy 1-column stack with `gap: var(--space-3)` (12px), stripping outer container card padding.
* **Done Criteria**:
  * Sticky search bar height stays under 64px when scrolled.
  * Search clear button meets WCAG 44x44px touch target floor.
  * `npm run build`, `npm run validate`, and `npm run test` pass cleanly.
  * Pushed to `main` via git rebase.

#### Chunk 06: Settings Sections & Row Controls Restoration (`chunk-06-essence-setting`)
* **Phase**: 3 - Page Restorations
* **Target Files**: `setting/index.html`, `assets/css/setting.css`
* **Dependencies**: `chunk-01-token-craft-foundation`
* **Sub-Agent Window Sizing**: Bounded to Settings page and setting CSS.
* **Step-by-Step Instructions**:
  1. Strip outer `.fv-card` wrapping from around `.fv-section` blocks in `setting/index.html`.
  2. Structure setting group containers with single-layer `var(--surface-card)`, `border: 1px solid var(--border-subtle)`, and `border-radius: var(--radius-xl)`.
  3. Format setting items (`.fv-setting-row`) as horizontal flex rows (`display: flex; align-items: center; justify-content: space-between; padding: var(--space-4)`).
  4. Add divider lines between setting rows (`border-bottom: 1px solid var(--border-subtle)`).
  5. Enforce min-height 48px for setting toggle controls and select dropdowns.
* **Done Criteria**:
  * Double-padding bloat eliminated from Settings page.
  * Setting rows render flush left labels and flush right controls with 48px touch targets.
  * `npm run build`, `npm run validate`, and `npm run test` pass cleanly.
  * Pushed to `main` via git rebase.

#### Chunk 07: Community Hub & Form Layout Restoration (`chunk-07-essence-community`)
* **Phase**: 3 - Page Restorations
* **Target Files**: `community/index.html`, `community/contact/index.html`, `community/report/index.html`, `assets/css/community.css` (or relevant page CSS)
* **Dependencies**: `chunk-01-token-craft-foundation`
* **Sub-Agent Window Sizing**: Bounded to Community Hub and form pages.
* **Step-by-Step Instructions**:
  1. In `community/index.html`: Replace vertical `.stack-md` column stack on primary action buttons with a horizontal row cluster (`display: flex; gap: var(--space-4); flex-wrap: wrap`).
  2. In `community/contact/index.html` & `community/report/index.html`: Strip `.fv-setting-row` from form field containers (`.form-group`).
  3. Format form labels, inputs, and textareas into clean vertical block stacks (`display: flex; flex-direction: column; gap: var(--space-2); align-items: stretch`).
  4. Set textarea minimum height to `120px` with full container width.
* **Done Criteria**:
  * Community Report form inputs align vertically with 100% width textareas.
  * Community Hub action buttons render side-by-side on desktop.
  * `npm run build`, `npm run validate`, and `npm run test` pass cleanly.
  * Pushed to `main` via git rebase.

#### Chunk 08: Platform Article Pages Group Restoration (`chunk-08-essence-platform`)
* **Phase**: 3 - Page Restorations
* **Target Files**: 
  * `platform/about/index.html`
  * `platform/roadmap/index.html`
  * `platform/whats_new/index.html`
  * `platform/license/index.html`
  * `platform/privacy/index.html`
* **Dependencies**: `chunk-01-token-craft-foundation`
* **Sub-Agent Window Sizing**: Bounded to the 5 Platform documentation pages.
* **Step-by-Step Instructions**:
  1. Remove nested `.fv-card` or `.fv-section` wrappers from internal content blocks across all 5 platform pages.
  2. Apply clean page section padding `var(--space-10) 0` (40px top/bottom).
  3. Apply fluid typography scale: H1 uses `var(--step-4)`, H2 uses `var(--step-2)` with `margin-top: var(--space-8)` and `margin-bottom: var(--space-3)`. Paragraphs use `line-height: var(--line-height-relaxed)` (1.6).
  4. Preserve dynamic container elements `#roadmap-container` and `#whats-new-container` intact.
* **Done Criteria**:
  * Platform pages render calm, readable typography without double card containers.
  * `npm run build`, `npm run validate`, and `npm run test` pass cleanly.
  * Pushed to `main` via git rebase.

#### Chunk 09: Scope Detail Viewer & Shared Templates Restoration (`chunk-09-essence-scope-templates`)
* **Phase**: 3 - Page Restorations
* **Target Files**: `data/verse/scope/index.html`, `assets/css/modern-styles.css`, `assets/template-html/footer-template.html`, `assets/template-html/intro-template.html`
* **Dependencies**: `chunk-01-token-craft-foundation`
* **Sub-Agent Window Sizing**: Bounded to Scope viewer page and shared HTML templates.
* **Step-by-Step Instructions**:
  1. In `data/verse/scope/index.html` & `assets/css/modern-styles.css`: Set scope metadata container grid to 3 columns on desktop (`grid-template-columns: repeat(3, 1fr); gap: var(--space-4)`), 2 on tablet, 1 on mobile.
  2. In `assets/template-html/footer-template.html`: Remove outer `.container-full` wrapper to fix double horizontal padding. Apply `.footer-inner { max-width: var(--max-width-site); margin: 0 auto; padding: var(--space-8) var(--space-4); }`.
  3. Align footer link columns in a balanced flex row (`display: flex; justify-content: space-between; gap: var(--space-6); flex-wrap: wrap`).
* **Done Criteria**:
  * Scope metadata forms a neat 3-column row on desktop.
  * Footer aligns flush with the main site max-width container.
  * `npm run build`, `npm run validate`, and `npm run test` pass cleanly.
  * Pushed to `main` via git rebase.

---

### Phase 4: JS Adaptation

#### Chunk 10: JS Adaptation: NavCore, Search Sticky & Footer Injection (`chunk-10-js-adaptation-nav-search-footer`)
* **Phase**: 4 - JS Adaptation
* **Target Files**: `assets/js/nav-core.js`, `assets/js/nav-core-modules/performance.js`, `assets/js/search-system/*`, `assets/js/footer-template.js`
* **Dependencies**: `chunk-05-essence-search`, `chunk-09-essence-scope-templates`
* **Sub-Agent Window Sizing**: Bounded to navigation, search geometry, and footer injection JS modules.
* **Step-by-Step Instructions**:
  1. In `assets/js/nav-core-modules/performance.js:42`: Purge the inline `inset` box-shadow string declaration.
  2. In `assets/js/search-system/search-modules/input-bar.js` & `utils.js`: Synchronize search sticky bar scroll height calculation constants to match compact 56px sticky geometry (`--nav-height: 56px`).
  3. In `assets/js/footer-template.js`: Verify client-side dynamic footer mounting emits updated `<footer class="fv-footer">` landmark structure without errors.
* **Done Criteria**:
  * Zero inset box-shadow strings remaining in JS modules.
  * Search sticky scroll calculations execute seamlessly without layout jitter.
  * `npm run build`, `npm run validate`, and `npm run test` pass cleanly.
  * Pushed to `main` via git rebase.

#### Chunk 11: JS Adaptation: Home Renderer, URE Virtual List & i18n Contracts (`chunk-11-js-adaptation-home-ure-i18n`)
* **Phase**: 4 - JS Adaptation
* **Target Files**: `assets/js/home.js`, `assets/js/ure/ure.js`, `assets/js/ure/ure-modules/virtual-list.js`, `assets/js/lang-modules/translator.js`
* **Dependencies**: `chunk-02-discover-tokenization`, `chunk-04-essence-home`
* **Sub-Agent Window Sizing**: Bounded to Home carousel renderer, URE virtual list, and translation contracts.
* **Step-by-Step Instructions**:
  1. In `assets/js/home.js`: Verify dynamic carousel rendering applies updated 16px padding `.item-card` elements.
  2. In `assets/js/ure/ure-modules/virtual-list.js`: Verify symbol catalog virtual list calculation functions correctly with updated `var(--radius-xl)` card heights.
  3. In `assets/js/lang-modules/translator.js`: Verify translation key mapping handles all preserved `data-i18n` and `data-i18n-ph` attributes across updated HTML files.
* **Done Criteria**:
  * Home carousel and URE virtual list render smoothly without height miscalculations.
  * SSG localized page generator (`src/build/ssg.ts`) builds all 32 pages with zero missing translation key errors.
  * `npm run build`, `npm run validate`, and `npm run test` pass cleanly.
  * Pushed to `main` via git rebase.

---

### Phase 5: Verification & Audits

#### Chunk 12: Automated Quality & Build Gates Verification (`chunk-12-verify-gates`)
* **Phase**: 5 - Final Verification
* **Target Files**: Build system & test output verification across entire workspace.
* **Dependencies**: All preceding chunks (`chunk-01` through `chunk-11`).
* **Sub-Agent Window Sizing**: Bounded to execution and verification of automated test suites.
* **Step-by-Step Instructions**:
  1. Execute `npm run build` and verify Vite compilation and SSG build output (`dist/` directory, 32 localized HTML pages, sitemap.xml).
  2. Execute `npm run validate` and verify all 57/57 static data schema and release checks pass with 0 errors.
  3. Execute `npm run test` (`vitest run`) and verify all 16 test files / 77 unit tests pass 100%.
  4. Document build gate execution results for inclusion in the final verification report.
* **Done Criteria**:
  * Build, validation, and Vitest gates pass 100% cleanly.
  * Pushed to `main` via git rebase.

#### Chunk 13: Native Design Audits, Parity Verification & Report Commitment (`chunk-13-verify-audits`)
* **Phase**: 5 - Final Verification
* **Target Files**: `docs/design/native/VERIFICATION-REPORT.md`
* **Dependencies**: `chunk-12-verify-gates`
* **Sub-Agent Window Sizing**: Bounded to audit execution and commitment of final verification report.
* **Step-by-Step Instructions**:
  1. Perform Native Design Parity Audit across all page groups: verify double padding, ghost cards, inflated sticky search, and broken grids are 100% resolved.
  2. Perform WCAG 2.2 AA Audit: verify minimum 44x44px touch targets on all interactive controls, clear focus rings (`outline: 2px solid var(--color-primary)`), and 4.5:1 text contrast ratios.
  3. Perform Token Bypass Audit: grep all CSS and HTML files to confirm 0 hardcoded radii or box-shadow bypasses remain on Discover or other pages.
  4. Write and commit `docs/design/native/VERIFICATION-REPORT.md` containing full audit findings, pass matrices, and final release clearance.
* **Done Criteria**:
  * `docs/design/native/VERIFICATION-REPORT.md` committed and pushed to `main`.
  * All audits pass with zero critical unresolved defects.

---
*End of Task Breakdown — `docs/design/native/TASK-BREAKDOWN.md`*
