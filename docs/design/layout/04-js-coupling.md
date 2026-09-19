# Deep JS-to-Layout Coupling Assessment

**Repository**: `fanhoard/fanhoard-page`  
**Assessment Target**: JS scripts (`assets/js/**`, `src/**`), inline scripts, template HTML, SSG build pipeline, and validation scripts  
**Date**: September 20, 2026  
**Status**: Completed Assessment  

---

## Executive Summary

The FanHoard website relies on a hybrid static/dynamic architecture: pre-built SSG HTML pages generated at build time, combined with client-side JavaScript modules for dynamic navigation, search, virtual scrolling, modal popups, release note parsing, and interactive content feeds. 

This assessment evaluates the degree of **JS-to-layout coupling** across four key dimensions:
1. **Dynamic DOM Restructuring & Template Generation**: Client-side JS and SSG tools injecting markup, card wrappers, navigation bars, and footers.
2. **Geometry Reading & Class Toggling**: Scripts reading scroll offsets, container dimensions, or element positions, and toggling CSS state classes or setting inline styles.
3. **SSG Build & Data Validation Pipeline**: Machine-generated markup rules, template constraints, and CI/CD validation boundaries that forbid hand-editing generated artifacts.
4. **i18n & Marker System Coupling**: The translation engine's structural dependency on `data-translate` attributes, inline SVG anchors, slot markers (`@slot`), and link preserve markers.

### Key Assessment Findings
* **Dynamic DOM Generators (5 Core Systems)**: The site relies on 5 major client-side DOM generators: `NavCore` / `DiscoverFeed` (feed pages), `SearchEngine` / `URE` (search virtual scrolling), `home.js` (home page carousels), `new.js` (release notes viewer), and `roadmap.js` (IndexedDB feature list). Restructuring target IDs (e.g. `#fv-app`, `#search-results`, `#sub-nav`, `.roadmap-container`) will break client rendering unless JS hooks are preserved.
* **Sticky & Geometry Failures**: The search page (`search/index.html`) contains an **inline sticky scroll script** tightly bound to `#search-sticky`. Global navigation relies on `modern-navigation.js` and `nav-core-modules/buttons.js` to dynamically measure header/nav bounds and inject `#sub-nav` into `<header>`.
* **SSG Machine-Generated Markup**: `src/build/ssg.ts` and `src/build/html-transformer.ts` manipulate HTML strings during build, injecting `<script>window.__fvStaticConfig=...</script>`, translating `[data-translate]`, appending `footer.footer-minimal` from `assets/template-html/footer-template.html`, and stripping `opacity:0`. The `dist/` directory and `assets/md/{lang}/releases/` are strictly machine-generated.
* **Marker-to-DOM Structural Contracts**: The i18n engine (`marker-parser.ts` & `lang-modules/translator.js`) processes string markers like `@svg:id@` and `@slot:name@`. Translating elements containing inline SVGs or custom slots requires that child elements maintain matching IDs or slot attributes.

---

## 1. Inventory: JS Creating or Restructuring Layout DOM

Client-side scripts frequently inject markup wrappers, build complex components, or append elements to body or specific container IDs.

### Primary Dynamic DOM Generators Table

| Subsystem / Script | Target Container / Hook | Injected Markup & DOM Structure | Dependent CSS Classes & Inline Styles | Impact on HTML Restructuring |
| :--- | :--- | :--- | :--- | :--- |
| **`assets/js/footer-template.js`** & SSG `_injectFooter` | Mounts to `#fv-footer-mount` or appends to `document.body` | Injects `<footer class="footer-minimal">` with `.footer-inner`, `.footer-grid`, `.footer-brand`, `.footer-nav`, `.footer-legal`, `.footer-contact`, `.footer-bottom` | `.footer-minimal`, `.footer-inner`, `.footer-grid`, `.footer-brand`, `.footer-heading`, `.footer-link`, `.footer-social` | High. If `#fv-footer-mount` exists, replaced; otherwise appended to `body`. Container layout must support `footer.footer-minimal` at root or mount target. |
| **`assets/js/modern-navigation.js`** | Appends to `document.body` or parent shell | Injects `<div class="bottom-nav" role="navigation">` containing `.nav-item`, `.svg-wrapper`, `.label`. Sets `style.visibility = 'hidden'` then `'visible'`. | `.bottom-nav`, `.nav-item`, `.svg-wrapper`, `.label`, `.default-button` | High. Dynamically builds the fixed bottom navigation bar across pages. Expects body root insertion. |
| **`assets/js/nav-core-modules/buttons.js`** | Searches for `<header>`, inserts `#sub-nav` | Creates `#sub-nav.hi` containing `.hj` (`.sub-buttons-container`) after `<header>` or prepends to `body` if missing. Injects system "All" button `.all-feed-button`. | `#sub-nav`, `.hi`, `.hj`, `.sub-buttons-container`, `.all-feed-button`, `.active` | High. Modifies the header layout hierarchy dynamically on feed/nav-core pages (`data/verse/discover`). |
| **`src/components/DiscoverFeed.ts`** & `nav-core-modules/content.js` | Mounts inside `#content-loading` or `#fv-app` | Creates `.feed-page`, `.cm-group`, `.ure-btn-row`, `.card-content-container`, `.card-content-container--h`, `.button-content`, `.card`, `.card-image`, `.card-content`, `.card-title`, `.card-description`, `.group-header`, `.group-header-text`. | `.feed-page`, `.cm-group`, `.ure-btn-row`, `.card-content-container`, `.button-content`, `.card`, `.card-image`, `.card-title` | Critical. The entire discover feed layout is built via DOM recycling pools in TS/JS. CSS classes on cards and rows MUST be preserved. |
| **`assets/js/search-system/search-modules/input-bar.js`** | Restructures `.search-input-wrapper` | Injects or re-orders `.search-input-icon` (`🔍` / `←`), `#searchInput`, and `.search-clear-btn` (`✕`). | `.search-input-wrapper`, `.search-input-icon`, `#searchInput`, `.search-clear-btn` | Medium. Requires `.search-input-wrapper` to exist and contain these child classes/IDs. |
| **`assets/js/search-system/search-modules/rendering.js`** & `URE` | Mounts inside `#search-results` or `#content-loading` | Mounts URE virtual list or native result cards: `.search-card`, `.card-icon`, `.card-title`, `.card-copy-btn`, `.search-category-header`, `.search-no-results`. | `.search-card`, `.card-icon`, `.card-title`, `.card-copy-btn`, `.search-category-header` | Critical. Search page layout depends on `#search-results` container and URE virtual card rendering. |
| **`assets/js/popup-modules/overlay.js`** & `renderer.js` | Appends to `document.body` | Injects `#clp-overlay.fv-popup-overlay` containing `.fv-popup-dialog`, `.fv-popup-header`, `.fv-popup-body`, `.fv-popup-footer`, `.fv-popup-close`. Toggles `body.fv-popup-active`. | `#clp-overlay`, `.fv-popup-overlay`, `.fv-popup-dialog`, `.fv-popup-content`, `.fv-popup-close`, `body.fv-popup-active` | Medium. Popup overlay attaches to `body`. Requires CSS tokens and class names for modal rendering. |
| **`assets/js/home.js`** | Selects `#fv-app` or `.category-section` | Dynamically builds carousel tracks: `.carousel-wrapper`, `.carousel-track`, `.carousel-arrow-prev`, `.carousel-arrow-next`, `.card`, `.view-all-btn`. | `.category-section`, `.carousel-wrapper`, `.carousel-track`, `.carousel-arrow`, `.card`, `.view-all-btn` | High. Home page section content and carousels are built dynamically from JSON data via ConDataService. |
| **`assets/js/new.js`** | Mounts inside `#whats-new-container` / `.release-notes-root` | Fetches markdown files and builds `.release-card`, `.version-badge`, `.release-date`, `.changelog-body`, `.version-selector`. | `.release-card`, `.version-badge`, `.release-date`, `.changelog-body`, `.version-selector` | High. Release notes page (`platform/whats_new`) relies on `new.js` to render release entries. |
| **`assets/js/roadmap.js`** | Mounts inside `.roadmap-container` / `#roadmap-list` | Reads IndexedDB/JSON and constructs `.roadmap-card`, `.status-badge`, `.version-tag`, `.roadmap-title`, `.roadmap-desc`. | `.roadmap-container`, `.roadmap-card`, `.status-badge`, `.version-tag`, `.status-current`, `.status-upcoming` | High. Roadmap page (`platform/roadmap`) layout is generated entirely by `roadmap.js`. |
| **`assets/js/copyNotification.js`** | Appends to `document.body` | Injects `#cn-notification-v3` off-white toast capsule with inline styles (`position: fixed; bottom: 84px; left: 50%; transform: translateX(-50%); z-index: 99999`). | `#cn-notification-v3`, `#cn-styles-v3` (injected `<style>` block) | Low. Floating notification independent of body markup structure. |
| **`assets/js/back-to-top.js`** | Appends to `document.body` | Injects `<button id="back-to-top" class="btt-hidden">` with inline SVG arrow. | `#back-to-top`, `.btt-shown`, `.btt-hidden` | Low. Floating widget appended to `body`. |

---

## 2. Inventory: JS Class Toggling & Geometry / Scroll / Offset Reading

Scripts that read geometry (`scrollTop`, `offsetHeight`, `getBoundingClientRect`) or toggle state classes are fragile to HTML restructuring. If container hierarchies or positioning contexts (`position: relative/fixed`) change, these scripts may miscalculate positions or fail to show/hide controls.

### Geometry Reading & Class Toggling Inventory Table

| Script / Module | Read Property / Event | Target Selector | Applied Classes & Inline Styles | Structural Failure Mode / Breakage Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Inline Sticky Script** (`search/index.html:135-180`) | `window.scrollY`, `touchmove` delta | `#search-sticky` | Sets `style.transform = 'translateY(...) '` and `style.transition = '...'`. | **High Failure Risk**. Script calls `document.getElementById('search-sticky')`. If the sticky bar wrapper ID changes or is wrapped in a non-sticky layout container, sticky scrolling breaks completely. |
| **`assets/js/back-to-top.js`** | `window.scrollY` vs `THRESHOLD (120px)` | `#back-to-top` | Toggles `class = 'btt-shown'` / `'btt-hidden'`. Sets `style.touchAction = 'manipulation'`. | Low Risk. Independent of content layout; only checks global window scroll. |
| **`assets/js/modern-navigation.js`** | Header bounds, `window.location.pathname` | `.bottom-nav`, `.nav-item` | Toggles `.active` on current nav link. Sets `style.visibility = 'visible' / 'hidden'`. | Medium Risk. Active indicator matching depends on `data-base-url` attributes on `.nav-item` elements. |
| **`assets/js/nav-core-modules/buttons.js`** | `<header>` sibling / parent node position | `<header>`, `#sub-nav` | Toggles `.active` on sub-nav buttons. Inserts `#sub-nav` immediately after `<header>`. | High Risk. If `<header>` tag is renamed or moved inside a deeply nested wrapper, `#sub-nav` will be inserted in an incorrect DOM depth. |
| **`assets/js/popup-modules/overlay.js`** | Screen viewport size, ESC key, backdrop click | `document.body`, `#clp-overlay` | Toggles `body.fv-popup-active`, sets `style.overflow = 'hidden'` on body. Sets z-index `100000`. | Medium Risk. Requires `body` to respect `.fv-popup-active` overflow lock to prevent background scrolling. |
| **`assets/js/search-system/search-modules/virtual-scroll.js`** | Container `scrollTop`, `offsetHeight`, `clientHeight`, `ResizeObserver` | `#search-results` or window scroll | Sets `style.transform = 'translateY(${offset}px)'` on item pool nodes. Sets container total height `style.height = '${totalHeight}px'`. | **Critical Failure Risk**. Absolute coordinate math depends on container positioning context (`position: relative`). Changing container display or margin collapse will jank virtual list rendering. |
| **`assets/js/ure/ure-modules/virtual-list.js`** | Viewport height, scroll Y, item height metrics | Virtual list host container | Sets `style.height` and `transform: translateY(...)`. | **Critical Failure Risk**. Requires stable scroll container with explicit width/height constraints. |
| **`assets/js/loading-system/fvl.js`** | Document readystate, custom event `fvl:done` | `#fvl-overlay`, `body` | Toggles `.fvl-complete` class, sets `style.opacity = '0'` then removes overlay element from DOM. | Low Risk. Lookups `#fvl-overlay` by ID; remove style when transition completes. |

---

## 3. Inventory: SSG Build & Data Pipeline (Machine-Generated Markup)

The FanHoard static site generator (`src/build/ssg.ts`) and data pipeline (`scripts/validate-data.ts`, `scripts/validate-release.js`) enforce strict contracts on HTML files and JSON schemas. 

### SSG Build & Pipeline Matrix

| Pipeline Component / Script | Source Inputs | Generated Output / Target | Machine-Generated Markup & Constraints | Hand-Edit Restrictions & Refactoring Boundaries |
| :--- | :--- | :--- | :--- | :--- |
| **`src/build/ssg.ts`** | Root `.html` files, `assets/lang/*.json`, `db.json`, `footer-template.html` | Output HTML in `dist/{lang}/**` | • Injects `<script>window.__fvStaticConfig=...</script>` into `<head>`<br>• Removes body `opacity:0` style<br>• Injects SEO hreflang and `<link rel="canonical">`<br>• Appends translated `footer.footer-minimal`<br>• Replaces module scripts with Vite hashed bundles from `dist/manifest.json` | **STRICT READ-ONLY TARGET**. Files under `dist/` must NEVER be hand-edited. Source `.html` files in root are transformed during build. |
| **`src/build/html-transformer.ts`** | Source HTML string + translation dictionary | Transformed Cheerio HTML AST | • Evaluates `[data-translate]` attributes and replaces inner HTML<br>• Strips `data-translate`, `data-original-text`, `data-original-style`<br>• Modifies `<html>` to include `lang="${lang}"` and `data-fv-built="${lang}"`<br>• Prefixes relative `a[href]` with `/${lang}/` | **Source HTML Contract**: Source HTML must keep `[data-translate]` keys aligned with `assets/lang/en.json` and `th.json`. Removing `[data-translate]` stops SSG translation. |
| **`assets/template-html/footer-template.html`** | Footer template HTML file | Appended to `dist/{lang}/**` pages and fetched dynamically in dev | • Contains `<footer class="footer-minimal">`<br>• Contains `[data-translate]` hooks: `general.description`, `about.1title`, `footer-about`, `page-What's-New`, `page-planned-features`, `footer-contact`, `page-report`, `footer-privacy`, `footer-license`, `about.6title`, `footer-follow-us`, `footer-copyright` | **Machine Template**. Must maintain semantic `<footer>` root, `.footer-inner`, `.footer-grid` structure. Refactoring footer CSS requires updating this single source template. |
| **`scripts/validate-release.js`** | `assets/md/{lang}/current.md` | Validates release pipeline artifacts | • Validates version bump in `current.md`<br>• Checks generated artifacts: `assets/md/{lang}/releases/index.json`, `assets/md/{lang}/releases/v*.md`, `assets/json/version.json`<br>• Enforces 4-layer CI/CD version validation | **Strict Release Guard**. Developers may ONLY edit `assets/md/en/current.md` and `assets/md/th/current.md`. Editing generated release manifests/files directly triggers CI validation failures. |
| **`scripts/validate-data.ts`** & `src/schemas/data.ts` | `assets/db/con-data/**`, `assets/json/**` | Validates JSON against Zod schemas | • Validates `MasterIndexSchema`, `SymbolGroupIndexSchema`, `SymbolCategoryFileSchema`<br>• Validates `ButtonConfigSchema`, `StageConfigSchema`, `VersionConfigSchema`, `ReleaseManifestSchema` | **Data Schema Constraint**. Changes to JSON content structures must strictly comply with `src/schemas/data.ts` Zod definitions. |
| **`scripts/update-version.js`** | `assets/md/{lang}/current.md` | Updates `version.json`, generates `v{version}.md` and `releases/index.json` | • Bumps version metadata<br>• Replaces `FV_BUILD_ID` in `nav-core.js`<br>• Generates release notes HTML/markdown | **Automated Artifacts**. Release markdown history and manifests are automatically compiled. Hand-editing generated history files causes hash mismatches in `validate-release.js`. |

---

## 4. Inventory: i18n & Marker System Coupling to Markup

The internationalization engine operates at both build time (`src/build/html-transformer.ts` / `marker-parser.ts`) and runtime (`assets/js/lang-modules/*`). It relies on specific DOM attributes and marker tokens inside translation strings.

### 1. `data-translate` Attribute Mechanism
* **Source Attribute**: HTML elements tagged with `data-translate="key.name"` are queried by Cheerio at build time ($(`[data-translate]`)) and by `lang-modules/translator.js` at runtime.
* **Replacement Behavior**: The text content or inner HTML of the element is overwritten by the translated value from `assets/lang/{lang}.json`.
* **Attribute Cleanup**: In SSG pre-built pages (`dist/`), `data-translate` is stripped from transformed elements, while `html[data-fv-built]` is added.

### 2. Translation Marker Syntax & Structural Requirements

When translation strings contain complex inline markup (icons, line breaks, slots, styled links), the marker parser decomposes strings into structured AST tokens (`TranslationPart[]`):

| Marker Syntax | Parsed AST Token | Target HTML Requirement / Injected Output | Structural Constraint |
| :--- | :--- | :--- | :--- |
| `@br` | `{ type: 'br' }` | Injects `<br>` element | Simple line break; no DOM requirements. |
| `@strong text@` | `{ type: 'strong', text }` | Injects `<strong>text</strong>` | Bold inline text. |
| `@svg:id@` or `@lsvg:id@` | `{ type: 'svg'/'lsvg', id }` | Clones matching `<svg id="id">` or `[data-svg-id="id"]` from original element | **CRITICAL**. The target element in source HTML MUST contain pre-existing `<svg>` elements with matching `id` or `data-svg-id`. Restructuring must NOT strip these inline `<svg>` templates! |
| `@slot:name@` | `{ type: 'slot', name }` | Preserves existing element matching `[data-translate-slot="name"]` or `[data-slot="name"]` | **CRITICAL**. Target DOM element must contain child slot elements with matching attribute. |
| `@a:translate:text@` | `{ type: 'a', translate, text }` | Preserves existing `<a>` tag or creates new `<a>` tag | Anchors inside translated blocks must retain their `href` and class attributes during string replacement. |

### 3. Dynamic Language Switching Hooks (`assets/js/lang-modules/*`)
* **State Selector**: Queries `html[lang]` and `localStorage.getItem('selectedLang')`.
* **Link Rewriting (`lang-links.js`)**: Scans all `a[href]` links at runtime and dynamically updates URL prefixes (e.g. `/home/` → `/th/home/`). Internal navigation links must remain standard relative paths (`/path`) so `lang-links.js` can parse and prefix them reliably.

---

## 5. Per-Page Classification Map

Every page across the FanHoard repository is classified into one of three restructuring levels:
1. **Safe to Restructure**: Minimal JS coupling; standard static layout or simple declarative scripts. Structural changes will not break client JS.
2. **Must Adapt JS**: Page contains active JS scripts, dynamic list/card generators, sticky scroll logic, or specific DOM container dependencies that MUST be updated if HTML element IDs/classes change.
3. **Generated Markup**: Page structure or sections are generated by SSG build scripts or dynamic JS templates. Source templates or JS generators must be updated rather than hand-editing output.

### Per-Page Classification Matrix

| Page Path | Group / Category | JS Coupling Level | Primary JS Dependencies | Classification | Required Adaptation Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `index.html` | Root Shell / Custom 404 | Low | `lang-core.js`, `language.js`, `footer-template.js`, `lang-links.js` | **Safe to Restructure** | Preserve `.fv-app` wrapper and script tags. Layout restructuring safe. |
| `home/index.html` | Home Page | High | `home.js`, `con-data-service.js`, `popup.js`, `version-core.js`, `copyNotification.js`, `modern-navigation.js`, `footer-template.js` | **Must Adapt JS** & **Generated Markup** | Preserve `#fv-app`, `.category-section`, `.carousel-wrapper`, and `.carousel-track`. Carousels are populated dynamically by `home.js`. |
| `search/index.html` | Search System | Critical | `search-system/search.js`, `ure.js`, `con-data-service.js`, `#search-sticky` inline script, `copyNotification.js`, `modern-navigation.js` | **Must Adapt JS** | **Must retain `#search-sticky` ID and sticky structure** for inline scroll script. Retain `#search-results` and `.search-input-wrapper` for search engine mounting. |
| `setting/index.html` | Settings | Low | `lang-core.js`, `language.js`, `version-core.js`, `modern-navigation.js`, `footer-template.js` | **Safe to Restructure** | Standard static card/list layout. Safe to refactor to Material containers. |
| `community/index.html` | Community Hub | Low | `lang-core.js`, `language.js`, `modern-navigation.js`, `footer-template.js` | **Safe to Restructure** | Static grid of community cards. Safe to unify scaffold. |
| `community/contact/index.html` | Contact | Low | `lang-core.js`, `language.js`, `modern-navigation.js`, `footer-template.js` | **Safe to Restructure** | Static contact options list. Safe to refactor containers. |
| `community/report/index.html` | Report Issue | Low | `lang-core.js`, `language.js`, `modern-navigation.js`, `footer-template.js` | **Safe to Restructure** | Static form / report link cards. Safe to refactor layout. |
| `platform/about/index.html` | About Platform | Low | `lang-core.js`, `language.js`, `modern-navigation.js`, `footer-template.js` | **Safe to Restructure** | Static info sections. Safe to apply Material layout system. |
| `platform/license/index.html` | Content License | Low | `lang-core.js`, `language.js`, `modern-navigation.js`, `footer-template.js` | **Safe to Restructure** | Static legal document layout. Safe to standardize scaffold. |
| `platform/privacy/index.html` | Privacy Policy | Low | `lang-core.js`, `language.js`, `modern-navigation.js`, `footer-template.js` | **Safe to Restructure** | Static legal text layout. Safe to refactor containers. |
| `platform/roadmap/index.html` | Roadmap | High | `roadmap.js`, `lang-core.js`, `language.js`, `modern-navigation.js`, `footer-template.js` | **Must Adapt JS** | Preserve `.roadmap-container` / `#roadmap-list`. Item cards are constructed dynamically by `roadmap.js` from IndexedDB/JSON. |
| `platform/whats_new/index.html` | What's New / Releases | High | `new.js`, `lang-core.js`, `language.js`, `modern-navigation.js`, `footer-template.js` | **Must Adapt JS** & **Generated Markup** | Preserve `#whats-new-container` / `.release-notes-root`. `new.js` parses markdown and builds release cards dynamically. Do NOT hand-edit release notes HTML. |
| `data/verse/discover/index.html` | Discover Feed | Critical | `nav-core.js`, `nav-core-modules/*`, `DiscoverFeed.ts`, `modern-navigation.js`, `copyNotification.js`, `popup.js` | **Must Adapt JS** & **Generated Markup** | **Crucial Hook Retention**: Preserve `#content-loading`, `<header>` location (for `#sub-nav` injection), and DOM classes (`.cm-group`, `.ure-btn-row`, `.card`). Feed items are pool-recycled by TS/JS. |
| `data/verse/scope/index.html` | Symbol Scope | Low | `lang-core.js`, `language.js`, `modern-navigation.js`, `footer-template.js` | **Safe to Restructure** | Static overview cards. Safe to standardize container grid. |

---

## 6. Adaptation Recommendations for Layout Restructuring

When executing the layout unification plan (standardizing page scaffolds, container grids, section cards, and top-nav offsets), adhere strictly to the following engineering rules:

### 1. Preserve Required DOM Hook IDs & Classes
Never remove or rename the following key DOM identifiers required by client JS:
* `#search-sticky`, `#searchInput`, `.search-input-wrapper`, `#search-results` (`search/index.html`)
* `#content-loading`, `#sub-nav`, `.sub-buttons-container` (`data/verse/discover/index.html`)
* `#fv-app`, `.category-section`, `.carousel-wrapper`, `.carousel-track` (`home/index.html`)
* `#whats-new-container`, `.release-notes-root` (`platform/whats_new/index.html`)
* `.roadmap-container`, `#roadmap-list` (`platform/roadmap/index.html`)
* `#fv-footer-mount` (Footer injection hook)
* `#clp-overlay` (Popup modal engine hook)

### 2. Extract Sticky Header Logic into a Centralized Utility
The inline sticky scroll script in `search/index.html` should be refactored into a reusable module or coordinated with `modern-navigation.js` so that header offsets and sticky transitions remain consistent when top navigation padding is standardized.

### 3. Maintain i18n SVG Anchors & Slot Structure
When refactoring HTML elements that carry `data-translate="key"`, ensure any nested `<svg>` icons or `[data-translate-slot]` elements are preserved inside the HTML source. Stripping inner SVG tags from `data-translate` elements will cause `_partsToHtml()` in `html-transformer.ts` to omit icons.

### 4. Do Not Hand-Edit SSG Output or Release Manifests
Restructuring work must ONLY target source files in root directories (`home/index.html`, `search/index.html`, `assets/template-html/*`, `assets/js/**`, `src/**`). Never modify generated files in `dist/` or `assets/md/{lang}/releases/index.json`.

### 5. Coordinate Virtual Scroll Container Metrics
When standardizing CSS container utility classes (`.container`, `.layout-main`, `.surface-card`) around virtual list containers (`search/index.html` and `data/verse/discover/index.html`), keep `position: relative` or standard block display on parent wrappers to ensure `transform: translateY()` calculations remain pixel-accurate without layout jitter.

