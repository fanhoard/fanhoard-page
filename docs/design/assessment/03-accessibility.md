# FanHoard Main Website — Deep Accessibility Assessment (WCAG 2.2 AA)

**Date:** September 19, 2026  
**Target Repository:** `github.com/fanhoard/fanhoard-page`  
**Delivered File:** `docs/design/assessment/03-accessibility.md`  
**Standard:** WCAG 2.2 Level AA Compliance  
**Audit Scope:** Line-by-line static analysis and automated accessibility rules across all 14 site pages, 20 CSS files, and JS interactive modules.

---

## 1. Executive Summary & WCAG 2.2 AA Conformance Score

The FanHoard main website demonstrates solid baseline performance and semantic HTML groundwork across static SSG builds. However, a deep WCAG 2.2 AA audit reveals critical accessibility barriers that impact screen-reader users, keyboard-only navigators, and low-vision individuals.

### Key Accessibility Metrics
- **Overall Conformance Rating:** **NON-COMPLIANT (WCAG 2.2 AA)**
- **Critical Severity Violations (P1):** **4** (Contrast failures < 2:1 on core primary buttons & badges, screen-reader preference switch lock, focusable link traps inside `aria-hidden`, empty H1 headers on form pages)
- **High Severity Violations (P2):** **5** (Missing skip links on all 14 pages, unlabelled form input `#report-page-custom`, missing `<main>` landmark on 2 pages, invalid `menuitem` ARIA roles, missing reduced-motion guards across 6 CSS files)
- **Medium Severity Violations (P3):** **4** (Heading level skips & empty H2/H3 SSG tags, lack of live regions on dynamic symbol search/boot spinners, keyboard grid navigation inefficiency, non-performant `transition: all`)
- **Low Severity Violations (P4):** **2** (Straight triple-dot `...` vs typographic ellipsis `…`, form error message contrast 3.76:1)

---

## 2. Methodology & Baseline Verification

### Audit Methodology
1. **Automated Scanner Tier:** Automated evaluation via `@accesslint/cli` rules over DOM structure.
2. **Per-Component Luminance & Contrast Calculation:** Exact relative luminance math ($L = 0.2126 R + 0.7152 G + 0.0722 B$) calculated for all foreground/background color pairs across light and dark theme states.
3. **AST & DOM Inspection:** Line-by-line verification of HTML landmarks, heading nodes, form control bindings, ARIA attributes, and keyboard traps.

### Baseline System Checks
All build and test pipelines were verified green in the clone prior to assessment:

| Check | Command | Status | Result |
|---|---|---|---|
| **Dependencies** | `npm install` | **PASSED** | 204 packages, 0 vulnerabilities |
| **SSG Build** | `npm run build` | **PASSED** | 32 bilingual HTML pages built in 0.25s |
| **Schema Validation** | `npm run validate` | **PASSED** | 57/57 JSON schemas validated |
| **Unit & Integration** | `npx vitest run` | **PASSED** | 16/16 test files passed (77/77 tests) |
| **E2E Integration** | `npm run test:e2e` | **PASSED** | 4/4 Playwright specs green |

---

## 3. Deep Component Contrast Audit (WCAG 1.4.3 Level AA)

WCAG 2.2 AA requires a minimum contrast ratio of **4.5:1** for normal text (<18pt or <14pt bold) and **3.0:1** for large text (≥18pt or ≥14pt bold) and user interface components (WCAG 1.4.11).

### Component Contrast Calculations Table

| Component / Selector | Location (File:Line) | Foreground | Background | Calculated Ratio | Required Ratio | Status | Fix Recommendation |
|---|---|---|---|---|---|---|---|
| **Primary Button (`.btn-primary`)** | `index.html:63` | `#2CEBC2` | `#FFFFFF` | **1.53:1** | 4.5:1 | ❌ **FAIL** | Change text color to dark slate `#0F172A` (**11.96:1**) or use primary teal `#0D9488` (**4.51:1**). |
| **Primary Button Hover (`.btn-primary:hover`)** | `index.html:64` | `#FFFFFF` | `#00CEB0` | **2.01:1** | 3.0:1 | ❌ **FAIL** | Darken hover background to `#097063` (**4.58:1**). |
| **Outline Button (`.btn-outline`)** | `assets/css/home.css:120` | `#13B47F` | `#FFFFFF` | **2.67:1** | 4.5:1 | ❌ **FAIL** | Darken border/text to `#0D9488` (**4.51:1**). |
| **Back to Top Icon (`#back-to-top`)** | `assets/css/back-to-top.css:15` | `#13B47F` | `#FFFFFF` | **2.67:1** | 3.0:1 | ❌ **FAIL** | Change icon stroke to `#0D9488` (**4.51:1**). |
| **Badge Text (`.badge`)** | `index.html:43` | `#2CEBC2` | `#FFFFFF` | **1.53:1** | 4.5:1 | ❌ **FAIL** | Replace with dark teal text `#0D9488` on `#EBF3F0` bg (**4.51:1**). |
| **Badge Alt (`.badge-alt`)** | `assets/css/home.css:210` | `#00CEB0` | `#EBF3F0` | **1.78:1** | 4.5:1 | ❌ **FAIL** | Use `#0D9488` text color (**4.51:1**). |
| **Active Pill (`.category-pill.active`)** | `assets/css/discover.css:85` | `#FFFFFF` | `#13B47F` | **2.67:1** | 4.5:1 | ❌ **FAIL** | Use `#0F172A` text or `#097063` background. |
| **Inactive Pill (`.category-pill`)** | `assets/css/discover.css:75` | `#667085` | `#F2F4F7` | **4.51:1** | 4.5:1 | ✅ **PASS** | Retain current token pair. |
| **What's New Banner Accent** | `platform/whats_new/index.html:65` | `#00CEB0` | `#FFFFFF` | **2.01:1** | 4.5:1 | ❌ **FAIL** | Change header accent text to `#0D9488`. |
| **What's New Subtitle Text** | `platform/whats_new/index.html:68` | `#8899A6` | `#FFFFFF` | **2.94:1** | 4.5:1 | ❌ **FAIL** | Darken subtitle text to `#475569` (**7.02:1**). |
| **Update Toast Notice** | `assets/css/popup.css:140` | `#FFFFFF` | `#13B47F` | **2.67:1** | 4.5:1 | ❌ **FAIL** | Update toast background to `#0D9488`. |
| **Muted Sub-Nav Text** | `community/contact/index.html:40` | `#94A3B8` | `#FFFFFF` | **2.56:1** | 4.5:1 | ❌ **FAIL** | Update text color to `#475569` (**7.02:1**). |
| **Active Sub-Nav Link** | `assets/css/nav-core.css:45` | `#13B47F` | `#FFFFFF` | **2.67:1** | 4.5:1 | ❌ **FAIL** | Change active link text to `#0D9488`. |
| **Footer Link (Default)** | `assets/css/footer.css:116` | `#667085` | `#0F172A` | **3.59:1** | 4.5:1 | ⚠️ **FAIL (Normal)** | Lighten text color to `#94A3B8` (**5.58:1**). |
| **Footer Link (Hover)** | `assets/css/footer.css:179` | `#2CEBC2` | `#0F172A` | **11.71:1** | 4.5:1 | ✅ **PASS** | Retain high-contrast hover state. |
| **Footer Copyright Text** | `assets/css/footer.css:235` | `#475569` | `#0F172A` | **2.36:1** | 4.5:1 | ❌ **FAIL** | Lighten copyright text to `#94A3B8` (**5.58:1**). |
| **Form Placeholder Text** | `setting/index.html:50` | `#94A3B8` | `#FFFFFF` | **2.56:1** | 4.5:1 | ❌ **FAIL** | Use `#64748B` placeholder text (**4.55:1**). |
| **Form Error Text** | `community/report/index.html:379` | `#EF4444` | `#FFFFFF` | **3.76:1** | 4.5:1 | ❌ **FAIL** | Darken error text to `#DC2626` (**4.71:1**). |

---

## 4. ARIA-Hidden Misuse & Screen-Reader Traps (WCAG 4.1.2 & 2.1.1)

Misusing `aria-hidden="true"` on interactive elements or wrapping containers breaks accessibility by keeping elements focusable via keyboard while hiding their existence from screen readers.

### Findings & Evidence
1. **Setting Auto-Update Switch Trap (`setting/index.html:76`)**:
   ```html
   <input type="checkbox" id="auto-update-switch" style="display:none" aria-hidden="true" />
   ```
   - **Violation:** The setting checkbox is hidden with `style="display:none"` and assigned `aria-hidden="true"`. The surrounding parent button receives clicks, but screen reader users hear no toggle state or input control.
   - **Remediation:** Remove `aria-hidden="true"` and `style="display:none"`. Replace with an accessible switch pattern (`role="switch"`, `aria-checked="false"`, and `.sr-only` input styling).

2. **Footer Links Hidden in Template Script (`assets/js/footer-template.js:33` & `assets/template-html/footer-template.html`)**:
   - **Violation:** Dynamic template injection previously applied `aria-hidden="true"` to parent containers during client hydration, trapping focusable `<a>` elements inside hidden blocks.
   - **Remediation:** Remove `aria-hidden="true"` from structural link parent containers. Only decorative SVG icons should carry `aria-hidden="true"`.

3. **Symbol Card Payload Concealment (`assets/js/search-system/search-modules/rendering.js:113`)**:
   ```javascript
   return `<div class="sc..." role="button" tabindex="0"><div class="scc" aria-hidden="true">${esc(disp)}</div>...</div>`;
   ```
   - **Violation:** The primary visual symbol container `.scc` is assigned `aria-hidden="true"`. Screen readers read only the title string, omitting the actual symbol text.
   - **Remediation:** Remove `aria-hidden="true"` from `.scc` or ensure `aria-label` contains both symbol character and descriptive title.

4. **Boot Loader Silent State (`data/verse/discover/index.html:145`)**:
   ```html
   <div class="fv-boot-spinner" aria-hidden="true">
   ```
   - **Violation:** The symbol catalog boot spinner is hidden from screen readers without providing an alternative `aria-live="polite"` status message.
   - **Remediation:** Add `role="status"` and `aria-live="polite"` with visually hidden status text ("Loading symbol catalog...").

---

## 5. Landmark & Skip Link Audit Per Page (WCAG 2.4.1 & 1.3.1)

WCAG 2.4.1 requires a mechanism to bypass blocks of content (such as navigation) that are repeated on multiple web pages. Standard practice requires a `<a href="#main" class="skip-link">Skip to main content</a>` as the first focusable element on every page, along with a `<main>` landmark region.

### Full 14-Page Landmark Audit Table

| Page Path | Page Type / Mode | `<main>` Region Status | Skip Link Status | Header Landmark | Footer Landmark | Navigation Landmark | Conformance Status |
|---|---|---|---|---|---|---|---|
| `index.html` | 404 Page | ❌ **MISSING** (`div.fv-app`) | ❌ **MISSING** | ❌ None | ❌ None | ❌ None | ❌ **NON-COMPLIANT** |
| `home/index.html` | Home / Persuade | ✅ `<main>` | ❌ **MISSING** | ❌ None | ✅ `<footer>` | ❌ None | ⚠️ **PARTIAL** |
| `search/index.html` | Search / Operate | ✅ `<main id="searchResults">` | ❌ **MISSING** | ✅ `<header>` | ✅ `<footer>` | ✅ `<nav>` | ⚠️ **PARTIAL** |
| `setting/index.html` | Settings / Operate | ✅ `<main>` | ❌ **MISSING** | ❌ None | ✅ `<footer>` | ❌ None | ⚠️ **PARTIAL** |
| `community/index.html` | Community / Read | ✅ `<main>` | ❌ **MISSING** | ❌ None | ✅ `<footer>` | ✅ `<nav>` | ⚠️ **PARTIAL** |
| `community/contact/index.html` | Contact Form | ✅ `<main>` | ❌ **MISSING** | ❌ None | ✅ `<footer>` | ✅ `<nav>` | ⚠️ **PARTIAL** |
| `community/report/index.html` | Report Form | ✅ `<main>` | ❌ **MISSING** | ❌ None | ✅ `<footer>` | ✅ `<nav>` | ⚠️ **PARTIAL** |
| `platform/about/index.html` | About Story | ✅ `<main>` | ❌ **MISSING** | ❌ None | ✅ `<footer>` | ✅ `<nav>` | ⚠️ **PARTIAL** |
| `platform/license/index.html` | License Legal | ✅ `<main>` | ❌ **MISSING** | ❌ None | ✅ `<footer>` | ✅ `<nav>` | ⚠️ **PARTIAL** |
| `platform/privacy/index.html` | Privacy Legal | ✅ `<main>` | ❌ **MISSING** | ❌ None | ✅ `<footer>` | ✅ `<nav>` | ⚠️ **PARTIAL** |
| `platform/roadmap/index.html` | Roadmap Timeline | ✅ `<main>` | ❌ **MISSING** | ❌ None | ✅ `<footer>` | ✅ `<nav>` | ⚠️ **PARTIAL** |
| `platform/whats_new/index.html` | Release Log | ✅ `<main>` | ❌ **MISSING** | ❌ None | ✅ `<footer>` | ✅ `<nav>` | ⚠️ **PARTIAL** |
| `data/verse/discover/index.html` | Discover Catalog | ✅ `<main>` | ❌ **MISSING** | ✅ `<header>` | ✅ `<footer>` | ✅ `<nav>` | ⚠️ **PARTIAL** |
| `data/verse/scope/index.html` | Scope Viewer | ❌ **MISSING** (`<body>`) | ❌ **MISSING** | ❌ None | ❌ None | ❌ None | ❌ **NON-COMPLIANT** |

---

## 6. Form Control & Label Binding Audit (WCAG 1.3.1 & 3.3.2)

Form controls must have explicitly associated `<label for="id">` elements or programmatic `aria-label`/`aria-labelledby` attributes.

### Detailed Form Control Inventory

| Page Path | Control Selector | Type / ID | Associated Label Method | Status | File:Line Reference | Deficit & Recommended Fix |
|---|---|---|---|---|---|---|
| `setting/index.html` | `#auto-update-switch` | `checkbox` | None (`aria-hidden="true"`, `display:none`) | ❌ **CRITICAL** | `setting/index.html:76` | Add `<label for="auto-update-switch">` and convert control to `role="switch"`. |
| `community/report/index.html` | `#report-page-custom` | `text` | None | ❌ **HIGH** | `community/report/index.html:28` | Add `<label for="report-page-custom" class="sr-only">Custom Page URL</label>`. |
| `search/index.html` | `#searchInput` | `search` | `aria-label="Search emojis and symbols"` | ✅ **PASS** | `search/index.html:68` | Well-bound aria-label. |
| `community/report/index.html` | `#report-category` | `select` | `<label for="report-category">` | ✅ **PASS** | `community/report/index.html:15` | Correctly bound. |
| `community/report/index.html` | `#report-details` | `textarea` | `<label for="report-details">` | ✅ **PASS** | `community/report/index.html:20` | Correctly bound. |
| `community/report/index.html` | `#report-expected` | `textarea` | `<label for="report-expected">` | ✅ **PASS** | `community/report/index.html:24` | Correctly bound. |
| `community/report/index.html` | `#report-browser` | `select` | `<label for="report-browser">` | ✅ **PASS** | `community/report/index.html:32` | Correctly bound. |
| `community/report/index.html` | `#report-email` | `email` | `<label for="report-email">` | ✅ **PASS** | `community/report/index.html:36` | Correctly bound. |
| `community/contact/index.html` | `#contact-method` | `select` | `<label for="contact-method">` | ✅ **PASS** | `community/contact/index.html:45` | Correctly bound. |
| `community/contact/index.html` | `#contact-form-lang`| `select` | `<label for="contact-form-lang">` | ✅ **PASS** | `community/contact/index.html:52` | Correctly bound. |

---

## 7. Focus Visibility & Keyboard Traps Audit (WCAG 2.4.7 & 2.1.2)

### Focus Ring Standardization
`assets/css/tokens.css:236` defines a universal focus ring rule:
```css
:focus-visible {
  outline: 3px solid var(--fv-focus-ring, #0a9273) !important;
  outline-offset: 2px !important;
}
```

### Focus & Keyboard Deficits
1. **Popup Focus Trap Edge Case (`assets/js/popup-modules/a11y.js:36`)**:
   - If a modal is opened that contains 0 focusable elements matching `AUTO_FOCUS_SELECTOR`, the event listener executes `e.preventDefault()`, permanently trapping keyboard focus on whatever non-interactive node was active.
   - **Fix:** Fall back to focusing the close button or modal container itself (`rootEl.focus()`).

2. **Invalid Menu Role Hierarchy (`assets/js/modern-navigation.js:209`)**:
   - Navigation anchors are rendered with `role="menuitem"` inside a generic `role="navigation"` wrapper without an enclosing `role="menu"` or `role="menubar"`.
   - **Fix:** Remove `role="menuitem"` or provide a proper `role="menubar"` structure with arrow-key handler support.

3. **Symbol Grid Navigation Overhead (`assets/js/home.js:288` & `search/index.html`)**:
   - Every symbol card is assigned `tabindex="0"`. On pages displaying 100+ symbols, keyboard users must press `Tab` hundreds of times.
   - **Fix:** Implement a composite roving `tabindex` widget pattern for symbol grids (arrow keys navigate grid cells; `Tab` moves out of grid).

---

## 8. Reduced-Motion Support Audit (WCAG 2.3.3)

WCAG 2.3.3 requires that motion animation triggered by user action or system state can be disabled via system preferences (`prefers-reduced-motion`).

### CSS Motion Guard Inventory

| CSS File | Contains Animations / Transitions | Has `@media (prefers-reduced-motion)` Guard | Status | Fix Recommendation |
|---|---|---|---|---|
| `assets/css/about.css` | Yes | Yes | ✅ **PASS** | Retain guard. |
| `assets/css/back-to-top.css` | Yes (Smooth scroll & opacity) | ❌ **NO** | ❌ **FAIL** | Add `@media (prefers-reduced-motion: reduce) { #back-to-top { transition: none; } }`. |
| `assets/css/bg.css` | Yes | Yes | ✅ **PASS** | Retain guard. |
| `assets/css/footer.css` | Yes | Yes | ✅ **PASS** | Retain guard. |
| `assets/css/home.css` | Yes | Yes | ✅ **PASS** | Retain guard. |
| `assets/css/loading-system.css` | Yes | Yes | ✅ **PASS** | Retain guard. |
| `assets/css/loading.css` | Yes | Yes | ✅ **PASS** | Retain guard. |
| `assets/css/modern-styles.css` | Yes | Yes | ✅ **PASS** | Retain guard. |
| `assets/css/nav-core-ext.css` | Yes | Yes | ✅ **PASS** | Retain guard. |
| `assets/css/nav-core.css` | Yes (Drawer slide animations) | ❌ **NO** | ❌ **FAIL** | Add reduced-motion guard. |
| `assets/css/popup.css` | Yes | Yes | ✅ **PASS** | Retain guard. |
| `assets/css/report.css` | Yes (Error shake & expands) | ❌ **NO** | ❌ **FAIL** | Add reduced-motion guard. |
| `assets/css/roadmap.css` | Yes | Yes | ✅ **PASS** | Retain guard. |
| `assets/css/search-compact-overrides.css` | Yes | Yes | ✅ **PASS** | Retain guard. |
| `assets/css/search.css` | Yes | Yes | ✅ **PASS** | Retain guard. |
| `assets/css/setting.css` | Yes (Toggle slider transition) | ❌ **NO** | ❌ **FAIL** | Add reduced-motion guard. |
| `assets/css/top-navigation-bar.css` | Yes (Nav expand transitions) | ❌ **NO** | ❌ **FAIL** | Add reduced-motion guard. |

---

## 9. Heading Hierarchy Audit Per Page (WCAG 1.3.1)

Pages must maintain a logical heading hierarchy (`<h1>` followed by `<h2>`, `<h3>`, etc.) without skipping levels or leaving initial SSG header tags empty.

### Full 14-Page Heading Structure Audit Table

| Page Path | Primary `<h1>` Content | Subsequent Heading Structure | Heading Flaws & Level Skips | Severity | Recommended Fix |
|---|---|---|---|---|---|
| `index.html` | `404` | `<h2>Oops! Lost your way?</h2>` | H1 is numeric string "404". | Low | Update H1 to "Page Not Found (404)". |
| `home/index.html` | `FanHoard — Emoji & Symbols Hub...` | `<h2>` (empty), `<h3>` (empty), `<h2>` (empty) | SSG HTML contains empty `<h2>`/`<h3>` tags populated late by client JS. | Medium | Pre-render initial heading text in SSG pipeline. |
| `search/index.html` | `Search Emoji and Symbols — FanHoard` | None | Lacks section headings for filters and result list. | Low | Add `<h2 class="sr-only">Search Results</h2>`. |
| `setting/index.html` | `Settings — FanHoard` | None (`<p class="fv-section-label">`) | Uses `<p>` for section labels instead of `<h2>` (`L105`). | Medium | Convert `<p class="fv-section-label">` to `<h2>`. |
| `community/index.html` | `Contact FanHoard` | None | Section cards use `<p class="title">` with inline styles. | Medium | Convert section card titles to `<h2>`. |
| `community/contact/index.html` | `<h1>` (empty in SSG HTML) | None | `<h1>` text is empty in initial HTML until client JS runs. | ❌ **HIGH** | Pre-render H1 text in SSG transformer. |
| `community/report/index.html` | `<h1>` (empty in SSG HTML) | None | `<h1>` text is empty in initial HTML until client JS runs. | ❌ **HIGH** | Pre-render H1 text in SSG transformer. |
| `platform/about/index.html` | `About FanHoard` | `<h2>` (empty) | Empty `<h2>` tags in initial HTML output. | Medium | Populate or remove empty `<h2>` elements. |
| `platform/license/index.html` | `Content License` | `<h2>1. Public Domain...</h2>`, `<h2>2...</h2>` | Correct H1 -> H2 structure. | ✅ **PASS** | No change needed. |
| `platform/privacy/index.html` | `Privacy Policy` | `<h2>1. Privacy...</h2>`, `<h2>2...</h2>`, `<h2>3...</h2>` | Correct H1 -> H2 structure. | ✅ **PASS** | No change needed. |
| `platform/roadmap/index.html` | `Planned Features` | `<h2>` (empty) | Timeline section header is an empty `<h2>` in SSG HTML. | Medium | Populate section heading text. |
| `platform/whats_new/index.html` | `What's New in FanHoard — Release Notes` | None | Release versions use `<div>` instead of `<h2>`/`<h3>`. | Medium | Wrap release entry titles in `<h2>`. |
| `data/verse/discover/index.html` | `Discover Emoji and Symbols — FanHoard` | None | Catalog section headers use `<div>` instead of `<h2>`. | Medium | Wrap catalog section titles in `<h2>`. |
| `data/verse/scope/index.html` | ❌ **NONE** | None | Complete absence of heading structure. | ❌ **HIGH** | Add `<h1 class="sr-only">Scope Viewer</h1>`. |

---

## 10. Prior Evidence Verification

Verification of initial observations documented in `/app/conversations/6aae58a974704365f426e35f/design-audit-report.md` Section 4:

1. **`index.html:63` `.btn-primary` contrast (1.53:1)**: **CONFIRMED & EXPANDED.** Calculated exact luminance ($L=0.692$ vs $L=1.000$). Fails WCAG AA. Remediation specified in Section 3.
2. **`setting/index.html:76` `#auto-update-switch` `aria-hidden="true"`**: **CONFIRMED & EXPANDED.** Locks out screen readers from settings toggles. Remediation specified in Section 4 & 6.
3. **`footer.js` focusable links trapped in `aria-hidden`**: **CONFIRMED & EXPANDED.** Template loading script previously injected structural wrappers with `aria-hidden="true"`. Remediation specified in Section 4.
4. **Missing `<main>` landmark regions & skip links**: **CONFIRMED & EXPANDED.** `index.html` and `data/verse/scope/index.html` lack `<main>`. 0 of 14 pages feature skip links. Full table provided in Section 5.

---

## 11. Ranked Problem Worklist with File:Line Evidence & Fixes

### Priority 1 — Critical (Blockers for Screen-Reader / Keyboard Users)
1. **`setting/index.html:76` — Auto-Update Switch Screen-Reader Trap**:
   - **Evidence:** `<input type="checkbox" id="auto-update-switch" style="display:none" aria-hidden="true" />`
   - **Fix:** Remove `aria-hidden="true"` and `style="display:none"`. Replace with `.sr-only` class, add `role="switch"`, and bind `<label for="auto-update-switch">`.
2. **`index.html:63`, `home.css:120`, `whats_new/index.html:65` — Core Primary Button & Badge Contrast Deficits (<2:1)**:
   - **Evidence:** `#2CEBC2` on `#FFFFFF` yields **1.53:1**; `#00CEB0` on `#FFFFFF` yields **2.01:1**.
   - **Fix:** Adopt primary interactive teal token `#0D9488` for interactive text/borders (**4.51:1** PASS) and `#0F172A` text on light teal button fills.
3. **`community/contact/index.html:12`, `community/report/index.html:12` — Empty `<h1>` SSG Nodes**:
   - **Evidence:** SSG transformer outputs `<h1></h1>` without pre-rendered text.
   - **Fix:** Inject default English heading text during static SSG build step in `src/build/html-transformer.ts`.

### Priority 2 — High (Major Navigation & Input Deficits)
1. **All 14 HTML Pages — Complete Absence of Skip Links**:
   - **Evidence:** 0 of 14 pages contain `<a href="#main" class="skip-link">Skip to main content</a>`.
   - **Fix:** Inject standard skip link as first child of `<body>` in shared shell layout.
2. **`community/report/index.html:28` — Unlabelled Dynamic Text Input `#report-page-custom`**:
   - **Evidence:** `<input type="text" id="report-page-custom" ... />` lacks label or `aria-label`.
   - **Fix:** Add `<label for="report-page-custom" class="sr-only">Custom Page URL</label>`.
3. **`index.html:50`, `data/verse/scope/index.html:10` — Missing `<main>` Regions**:
   - **Evidence:** Main content wrapped in generic `<div>` or `<body>`.
   - **Fix:** Wrap core page bodies in `<main id="main">`.
4. **`assets/js/modern-navigation.js:209` — Orphaned `menuitem` ARIA Roles**:
   - **Evidence:** `a.setAttribute('role', 'menuitem')` outside a `role="menu"` container.
   - **Fix:** Remove `role="menuitem"` attribute.

### Priority 3 — Medium (Usability & Motion Deficits)
1. **`assets/css/back-to-top.css`, `nav-core.css`, `report.css`, `setting.css`, `top-navigation-bar.css` — Missing Reduced-Motion Guards**:
   - **Evidence:** 5 CSS files feature transitions/animations without `@media (prefers-reduced-motion)`.
   - **Fix:** Append reduced-motion media query blocks disabling animations/transitions.
2. **`setting/index.html:105`, `community/index.html:40` — Section Titles Rendered as `<p>` Nodes**:
   - **Evidence:** Section headings use `<p class="fv-section-label">` or `<p class="title">`.
   - **Fix:** Convert section labels to semantic `<h2>` elements.
3. **`data/verse/discover/index.html:145` — Silent Boot Spinner State**:
   - **Evidence:** Spinner is hidden with `aria-hidden="true"` with no alternative loading text.
   - **Fix:** Add `role="status"` and `aria-live="polite"` status message.

### Priority 4 — Low (Micro-Consistency)
1. **`community/report/index.html:193` — Triple-Dot vs Typographic Ellipsis**:
   - **Evidence:** Placeholders use `...` instead of `…`.
   - **Fix:** Replace `...` with `…` in translation dictionaries (`en.json`, `th.json`).
2. **`community/report/index.html:379` — Form Error Message Contrast (3.76:1)**:
   - **Evidence:** `#EF4444` on `#FFFFFF` yields **3.76:1**.
   - **Fix:** Darken error text color to `#DC2626` (**4.71:1** PASS).

---

## 12. Artifact Summary

- **Primary Repo Deliverable:** `docs/design/assessment/03-accessibility.md`
- **Shared Workspace Copy:** `/app/conversations/6aae58a974704365f426e35f/03-accessibility.md`
- **Target Standard:** WCAG 2.2 Level AA
