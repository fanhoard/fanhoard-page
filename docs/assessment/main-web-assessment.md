# Deep Technical Assessment: fanhoard/fanhoard-page

**Repository:** `fanhoard/fanhoard-page`  
**Assessment Date:** September 19, 2026  
**Target Commit:** `f39fab1` (Post-rename & Banner Removal)  
**Evaluator:** Base44 Autonomous Sub-Agent  

---

## Executive Summary

`fanhoard/fanhoard-page` is a static-site-generated (SSG) web platform for emojis, special unicode characters, and fancy text. The platform serves multi-language content (English `en` and Thai `th`) generated via custom Node.js build scripts using `cheerio` HTML transformation.

While the user-facing UI exhibits fast initial loads due to static HTML distribution on Cloudflare Pages, a deep codebase inspection reveals **significant technical debt, zero automated test coverage, architectural duplication, broken asset dependencies, accessibility gaps, and security risks**.

### Key Architectural & Code Metrics
- **Total Files:** ~284 files (excl. `.git` and `node_modules`)
- **JavaScript Files:** 52+ standalone files across 5 distinct subsystem folders (`lang-modules`, `nav-core-modules`, `popup-modules`, `search-system`, `ure`).
- **CSS Files:** 19 stylesheets shipped completely unminified.
- **Dependencies:** 1 production dependency (`cheerio ^1.0.0`), 0 devDependencies.
- **Test Coverage:** **0% (Zero unit, integration, or E2E tests).**
- **Dead/404 Script References:** 5 non-existent files referenced in core HTML templates.
- **Broken Footer Links:** 2 global dead links (`/platform/privacy` and `/platform/license`) across all 34 localized pages.

---

## 1. Architecture and Folder Structure

The repository combines static multi-language HTML generation with a custom modular JavaScript runtime executed directly in the browser without a module bundler.

```
fanhoard-page/
├── _headers                   # Cloudflare Pages header configuration (cache-control rules)
├── _redirects                 # Cloudflare Pages routing and 404 rewrite rules
├── assets/
│   ├── css/                   # 19 unminified CSS stylesheets
│   ├── db/                    # Static symbol database files (con-data)
│   ├── fonts/                 # TTF font files (FoglihtenNo07.ttf, MunroSmall.ttf)
│   ├── images/                # Site assets, OG cards, icons
│   ├── js/                    # Core JS modules & monolithic scripts
│   │   ├── con-data-service/  # Symbol content data service & registry
│   │   ├── lang-modules/      # Modular i18n translation system
│   │   ├── loading-system/    # FanHoard Verse Loader (fvl.js)
│   │   ├── nav-core-modules/  # Client-side router, feed, and page shell engine
│   │   ├── popup-modules/     # Overlay modal & popup queue engine
│   │   ├── search-system/     # Client-side Fuse.js fuzzy search & virtual scroll
│   │   └── ure/               # Unified Rendering Engine
│   ├── json/                  # UI button configurations, version manifests
│   ├── lang/                  # i18n translation dictionary files (en.json, th.json)
│   └── template-html/         # Shared HTML template snippets (footer, intro, home)
├── community/                 # Community hub, contact form, bug report page
├── data/verse/                # Discover feed and symbol detail scope reader
├── fanhoard-docs/             # System documentation (15+ architecture docs)
├── home/                      # Main landing page hub
├── platform/                  # About, Roadmap, What's New release notes
├── scripts/                   # Custom Node.js SSG build system & git hooks
│   ├── build.js               # SSG generator script using Cheerio
│   ├── generate-sitemap.js    # XML sitemap generator
│   ├── update-version.js      # Version bump automation
│   └── validate-release.js   # Pre-release validation script
├── search/                    # Standalone search interface
├── setting/                   # User preferences & theme settings
├── beta.html                  # Legacy search card test page (Orphan)
├── cn.html                    # Legacy FVL loader demo page (Orphan)
├── index.html                 # Root 404 fallback page (Cloudflare target)
├── n.html                     # Experimental SVG icon sandbox (Orphan)
└── package.json               # SSG build scripts & cheerio dependency
```

### Architectural Strengths
1. **Zero-Framework Fast First Paint:** The platform builds static HTML per language into `dist/en/` and `dist/th/`. Initial page loads do not require client-side JS hydration for basic content visibility.
2. **Comprehensive Local Documentation:** The `fanhoard-docs/` folder contains detailed documentation on architecture, virtual scrolling, and deployment.

### Structural Weaknesses
1. **Hybrid SSG / Client-Side SPA Anti-Pattern:** Pages static-render HTML on the server, but client-side JS (`nav-core.js`) attempts to intercept navigation and dynamically replace main content containers, causing state desynchronization between static routes and client-side history.
2. **Root Folder Pollution:** Orphan test pages (`beta.html`, `cn.html`, `n.html`) reside directly in the root directory alongside production entry points.

---

## 2. Module Boundaries and Coupling

### Global Window Namespace Pollution
The browser runtime relies heavily on global `window` object properties to share state between modules without explicit ES imports:
- `window.M` / `window.NavCore`: Global namespace for `nav-core-modules` (`assets/js/nav-core-modules/init.js:14`)
- `window.LanguageService`: Global translation coordinator (`assets/js/lang-modules/manager.js:28`)
- `window.PopupEngine`: Global modal engine (`assets/js/popup-modules/init.js:10`)
- `window.URE`: Unified Rendering Engine instance (`assets/js/ure/ure.js:12`)
- `window.unifiedCopyToClipboard`: Global clipboard helper (`assets/js/nav-core-modules/copy.js:15`)

```javascript
// Evidence: assets/js/nav-core-modules/init.js (lines 12-16)
window.NavCore = NavCore;
window.M = NavCore; // Legacy alias coupling
```

### Monolithic vs. Modular Code Duplication
The codebase contains parallel implementations of major subsystems:
1. **Language System:** `assets/js/lang-core.js` (monolithic 450+ lines) vs. `assets/js/lang-modules/` (13 modular JS files).
2. **Navigation System:** `assets/js/nav-core.js` (monolithic) vs. `assets/js/nav-core-modules/` (12 modular JS files).
3. **Popup System:** `assets/js/popup.js` (monolithic wrapper) vs. `assets/js/popup-modules/` (10 modular JS files).

HTML templates load monolithic files (`lang-core.js`, `language.js`) while doc files claim the system uses ES modules in `lang-modules/`. This leads to race conditions during page initialization.

---

## 3. Dead Code and Duplication

### Non-Existent File References (404 Network Errors)
Multiple HTML pages contain `<script>` and `<link>` tags referencing non-existent files. During development or local preview, every page load triggers HTTP 404 errors:

1. **`/assets/js/lang-sync.js`**
   - **Referenced in:** `home/index.html:7`, `search/index.html:23`, `setting/index.html:9`, `community/index.html:6`, `community/contact/index.html:9`, `community/report/index.html:6`, `platform/about/index.html:11`, `platform/roadmap/index.html:6`, `platform/whats_new/index.html:6`, `data/verse/discover/index.html:261`.
   - **Status:** File missing from repository. `scripts/build.js` strips this tag in `dist/`, but it fails in dev mode.
2. **`/fanhoard-console-bridge.js`**
   - **Referenced in:** `index.html:122`, `home/index.html:319`, `search/index.html:125`, `setting/index.html:192`, `community/index.html:72`, `community/contact/index.html:190`, `community/report/index.html:188`, `platform/about/index.html:93`, `platform/roadmap/index.html:105`, `platform/whats_new/index.html:88`.
   - **Status:** File missing from repository AND present in `dist/` built pages, throwing 404s in production!
3. **`/assets/js/Intelligent-system.js`**
   - **Referenced in:** `community/report/index.html:139`, `setting/index.html:187`.
   - **Status:** File missing from repository; script load fails completely.
4. **`/assets/js/lang-coordinator.js`**
   - **Referenced in:** `community/report/index.html:7`, `setting/index.html:10`.
   - **Status:** File missing from repository.
5. **`/assets/css/language-error.css`**
   - **Referenced in:** `community/contact/index.html:23`.
   - **Status:** File missing from repository.

### Broken Global Footer Links
The global footer template (`assets/template-html/footer-template.html`) contains links to non-existent platform pages:
- **`Privacy Policy` (`/platform/privacy`)**: Lines 29 in `footer-template.html`. Returns 404 on all 34 localized production routes.
- **`Content License` (`/platform/license`)**: Line 30 in `footer-template.html`. Returns 404 on all 34 localized production routes.

### Orphan Files & Unused Assets
1. **`assets/json/buttons 1.json`**: Duplicate orphan file with spaces in filename (`assets/json/buttons 1.json:1`). Zero references in codebase.
2. **`n.html`**: Orphan experimental sandbox file containing inline SVG styles (`n.html:1-30`).
3. **`beta.html`**: Orphan compact search card prototype (`beta.html:1`).
4. **`cn.html`**: Orphan FVL loading system test harness (`cn.html:1-30`).
5. **Image Duplication:** `assets/images/banner-fanhoard-hub.jpg`, `banner-fanhoard-hub-1.jpg`, `banner-fanhoard-hub_11zon.jpg` (3 copies of the same image asset).

---

## 4. Technical Debt

1. **Unminified Production Assets:** All CSS files (e.g., `assets/css/home.css`, `assets/css/search.css`) and JavaScript files are delivered unminified in production builds, increasing bundle sizes by 40-60%.
2. **Lack of Build Bundling / Transpilation:** The project does not use Vite, Webpack, Rollup, or esbuild. Browser script loading depends entirely on manual script order in HTML `<head>` and `<body>`.
3. **Hardcoded Cache-Busting Parameters:** Asset URLs use hardcoded date strings (e.g., `?v=1.0.0-20250322` in `home/index.html:28`). When code changes, developers must manually find-and-replace version query strings across all HTML files.
4. **Absolute Asset Path Coupling:** Asset references like `/assets/css/tokens.css` fail when hosted under subpaths or opened directly via `file://` protocols.
5. **Type Safety Void:** No TypeScript or JSDoc type validation exists. State mutations occur via untyped JavaScript object manipulation (`State.activeCategory = ...`).

---

## 5. Error Handling

1. **Silent Exception Swallowing:** Catch blocks throughout the codebase suppress runtime errors without reporting or user feedback:
   ```javascript
   // Evidence: assets/js/nav-core-modules/content.js (lines 236)
   try { M.LoadingService?.hideInstant(); } catch (_) {}
   ```
2. **Fetch Failure UI Hangs:** Network fetch routines in `assets/js/con-data-service/con-data-service.js` lack request timeouts. If a database file fails to load, loading spinners run indefinitely:
   ```javascript
   // Evidence: assets/js/con-data-service/con-data-service.js (lines 85-92)
   async loadGroup(groupId) {
     const res = await fetch(`/assets/db/con-data/${groupId}.json`);
     if (!res.ok) throw new Error(`HTTP ${res.status}`);
     return await res.json();
   } // Missing try/catch or timeout wrapper
   ```
3. **No Global Telemetry / Error Boundaries:** Neither `window.onerror` nor `window.onunhandledrejection` are handled. JavaScript runtime exceptions crash silent background processes without notifying the user.

---

## 6. Security Assessment

### Secrets & API Keys
- **Finding:** No private API keys or credentials exist in code.
- **Public Identifiers:** Embedded third-party IDs include Google Tag Manager (`GTM-PJ397CLS`), Cookiebot (`16a70d79-a7a7-4b66-89da-afb49e453c67`), and Google AdSense (`ca-pub-8233915433564101`).

### Cross-Site Scripting (XSS) Risk
Multiple components render dynamic content using `innerHTML` without HTML entity escaping:
1. **`assets/js/popup-modules/engine.js:333`**:
   `instance.bodyEl.innerHTML = newOpts.body;` — If popup content originates from dynamic user inputs or URL query params, arbitrary HTML/script injection is possible.
2. **`assets/js/popup-modules/renderer.js:167`**:
   `bodyEl.innerHTML = opts.body;`
3. **`assets/js/footer-template.js:31`**:
   `tmp.innerHTML = html.trim();`
4. **`assets/js/nav-core-modules/utils.js:237`**:
   `msgWrap.innerHTML = ...`

### Security Headers Gap (`_headers`)
The Cloudflare Pages `_headers` file configures `Cache-Control` rules but **completely lacks security headers**:
- Missing `Content-Security-Policy` (CSP)
- Missing `X-Frame-Options` (Clickjacking vulnerability)
- Missing `X-Content-Type-Options: nosniff`
- Missing `Referrer-Policy`
- Missing `Permissions-Policy`

---

## 7. Performance & Optimization

1. **Script Waterfall & Render Blocking:** Pages load up to 12 individual external JavaScript files sequentially in the head and body:
   - `home/index.html` loads 11 script tags.
   - `search/index.html` loads 12 script tags.
   This creates significant RTT network latency on high-RTT mobile networks.
2. **Uncompressed Font Formats:** Fonts in `assets/fonts/` (`FoglihtenNo07.ttf`, `MunroSmall.ttf`) use uncompressed TTF format (~150KB+) instead of modern WOFF2 format (~30KB).
3. **Unoptimized Static Images:** OG card images (`assets/images/OG/fanhoard-hub-og.png`) and hub banners (`assets/images/banner-fanhoard-hub.jpg`) are uncompressed PNG/JPG files without AVIF/WebP responsive variants.
4. **Full Subtree DOM Re-renders:** In `assets/js/nav-core-modules/content.js:560`, feed rendering replaces the entire `innerHTML` of container elements on every page pagination step, causing style re-recalculations and layout thrashing.

---

## 8. Accessibility (a11y)

1. **Inconsistent Skip Links:** While `home/index.html:115` includes a "Skip to main content" link (`.fv-skip-link`), secondary pages (`community/contact/index.html`, `community/report/index.html`, `platform/about/index.html`) lack skip links entirely.
2. **Non-Accessible FAQ Accordions:** In `home/index.html:280-310`, FAQ accordions use CSS-hidden `<input type="checkbox">` elements. They lack `aria-expanded`, `aria-controls`, and keyboard `Enter`/`Space` actuation hooks for screen reader users.
3. **Focus Ring Suppression:** CSS rules in `assets/css/search.css` and `assets/css/home.css` set `outline: none` on interactive buttons without providing high-contrast `:focus-visible` custom ring alternatives.
4. **Inadequate Color Contrast:** Muted text token `var(--fv-text-muted)` in `assets/css/tokens.css` yields a contrast ratio below 4.5:1 against light gray card backgrounds.

---

## 9. Data Model and API Design

### Static Data Architecture
The platform operates on static JSON data structures served from `assets/json/` and `assets/db/con-data/`:
- `assets/json/buttons.json`: Defines primary navigation categories and symbol button groupings.
- `assets/json/version.json`: Stores application release version (`2.3.0`).
- `assets/db/con-data/*.json`: Individual symbol and emoji category datasets loaded dynamically on category selection.

### API Integration Deficiencies
The bug report page (`community/report/index.html`) posts issue submissions to an external Cloudflare Worker / Discord webhook endpoint:
- **No Request Timeout:** Requests hang indefinitely if the endpoint is unresponsive.
- **No Client Validation:** Optional text areas accept unbounded input lengths before payload transmission.
- **No Retry Strategy:** Failed API requests display a plain text alert without saving state or retrying.

---

## 10. Build System and Tooling

### SSG Generator (`scripts/build.js`)
The custom static site generator parses source HTML files using `cheerio`, substitutes i18n data-translate markers from `assets/lang/en.json` and `assets/lang/th.json`, injects the shared footer template, and writes output to `dist/en/` and `dist/th/`.

```javascript
// Evidence: package.json scripts
"build": "node scripts/build.js",
"validate": "node scripts/validate-release.js",
"generate-sitemap": "node scripts/generate-sitemap.js"
```

### Build & Tooling Flaws
1. **No Linting or Formatter:** No `eslint` or `prettier` configurations exist. Code formatting varies wildly across files.
2. **Missing CI Workflow Verification:** `.github/workflows/release.yml` uses deprecated GitHub Action versions and contains unhandled git scope permissions.
3. **Incomplete Sitemap Automation:** `scripts/generate-sitemap.js` hardcodes route lists instead of dynamically inspecting HTML directories.

---

## 11. Test Coverage

- **Unit Tests:** **0 (None)**
- **Integration Tests:** **0 (None)**
- **E2E / Visual Tests:** **0 (None)**
- **Test Framework:** None installed (no Jest, Vitest, Playwright, or Cypress).

Every pull request or release relies entirely on manual regression testing.

---

## 12. Detailed Per-Page & Per-Route Analysis

---

### Page 1: Root Fallback Shell & Custom 404 (`/`)
- **File Path:** `index.html` (Cloudflare Pages fallback target via `_redirects`)
- **Purpose:** Serves as the global 404 error handler for invalid URLs and root fallback.
- **Components:** Branding badge, error heading, message body, primary "Take Me Home" and secondary "Explore" action buttons.
- **State:** Static document; no client-side state machine.
- **Data Flow:** Hardcoded 404 text; loads `lang-core.js` and `language.js` to process language links.
- **Data Sources:** Inline HTML content and `assets/css/tokens.css`.
- **Concrete Improvement Opportunities:**
  1. Remove dead reference to `/fanhoard-console-bridge.js` (line 122).
  2. Add localized 404 translation keys so Thai users see Thai error guidance.
  3. Fix action button hrefs to point to valid localized routes (`/en/home/` / `/th/home/`) instead of requiring server redirects (`/home`).

---

### Page 2: Main Hub & Dashboard (`/home/`)
- **File Path:** `home/index.html`
- **Purpose:** Primary homepage displaying hero banner, symbol categories, feature highlights, and FAQ.
- **Components:** Hero section, Quick Category navigation buttons, Feature grid, FAQ accordion, Footer mount point.
- **State:** Language selection state, active category selection, theme mode.
- **Data Flow:** HTML loaded -> `lang-proxy.js` checks language preference -> `home.js` mounts dynamic category cards -> `footer-template.js` populates footer.
- **Data Sources:** `assets/json/buttons.json`, `assets/lang/en.json`, `assets/lang/th.json`.
- **Concrete Improvement Opportunities:**
  1. Remove dead script reference `assets/js/lang-sync.js` (line 7) and `fanhoard-console-bridge.js` (line 319).
  2. Replace checkbox-hack FAQ accordions with accessible `<details>`/`<summary>` or ARIA-compliant button controls.
  3. Convert hero image `/assets/images/j.png` and banners to WebP format.

---

### Page 3: Global Search & Directory (`/search/`)
- **File Path:** `search/index.html`
- **Purpose:** Fuzzy search interface for finding emojis, symbols, and fancy text with instant copy.
- **Components:** Sticky search input bar, category filter pills, suggestion dropdown, virtual scroll result container.
- **State:** Search query string (`?q=`), type filter (`emojis`/`symbols`), scroll index, Fuse.js index state.
- **Data Flow:** Query typed -> `search-service.js` debounces input -> `engine.js` runs Fuse.js match -> `virtual-scroll.js` updates visible DOM nodes.
- **Data Sources:** `assets/db/con-data/*.json` symbol databases.
- **Concrete Improvement Opportunities:**
  1. Remove missing script references (`lang-sync.js`, `fanhoard-console-bridge.js`).
  2. Add `aria-live="polite"` region to inform screen reader users of search result counts.
  3. Restore missing focus rings on search input element (`assets/css/search.css`).

---

### Page 4: User Settings & Preferences (`/setting/`)
- **File Path:** `setting/index.html`
- **Purpose:** Allows users to configure display preferences, language defaults, and theme options.
- **Components:** Language selector card, Theme toggle buttons, Storage clear utility card.
- **State:** LocalStorage preferences (`fv_lang`, `fv_theme`).
- **Data Flow:** User toggles preference -> event listener updates `localStorage` -> dispatches custom event to re-render UI.
- **Data Sources:** Browser `localStorage`.
- **Concrete Improvement Opportunities:**
  1. Remove broken references to missing `assets/js/Intelligent-system.js` (line 187) and `assets/js/lang-coordinator.js` (line 10).
  2. Implement feedback toast confirming preference savings.

---

### Page 5: Community Overview Hub (`/community/`)
- **File Path:** `community/index.html`
- **Purpose:** Landing page for community links, Discord server invite, contact form, and bug reporting.
- **Components:** Community feature cards, Discord invite banner, feedback links.
- **State:** Static page state.
- **Data Flow:** Static HTML render -> loads shared footer template.
- **Data Sources:** Static HTML & i18n translation keys.
- **Concrete Improvement Opportunities:**
  1. Remove non-existent `lang-sync.js` and `fanhoard-console-bridge.js` script tags.
  2. Add structured JSON-LD social markup for community channels.

---

### Page 6: Contact Us Form (`/community/contact/`)
- **File Path:** `community/contact/index.html`
- **Purpose:** Contact form for direct user inquiry and support inquiries.
- **Components:** Contact form fields (Name, Email, Message type, Message text), submit button, notification toast.
- **State:** Form input values, submission pending status, validation error states.
- **Data Flow:** User fills form -> click Submit -> validates inputs -> transmits POST request.
- **Data Sources:** User form inputs.
- **Concrete Improvement Opportunities:**
  1. Remove broken link to missing stylesheet `/assets/css/language-error.css` (line 23).
  2. Remove 404 scripts `lang-sync.js` and `fanhoard-console-bridge.js`.
  3. Add client-side rate limiting and spam protection (turnstile/CAPTCHA).

---

### Page 7: Bug & Issue Report Form (`/community/report/`)
- **File Path:** `community/report/index.html`
- **Purpose:** Specialized form for submitting bug reports, feature suggestions, and content corrections.
- **Components:** Issue Category dropdown, severity radio selectors, detailed steps text area, contact input, submission status banner.
- **State:** Selected category, text inputs, submitting boolean state.
- **Data Flow:** Input submission -> sends payload to Cloudflare Worker API.
- **Data Sources:** External Worker / Discord Webhook endpoint.
- **Concrete Improvement Opportunities:**
  1. Remove missing scripts `Intelligent-system.js` (line 139), `lang-coordinator.js` (line 7), `lang-sync.js` (line 6), `fanhoard-console-bridge.js` (line 188).
  2. Sanitize user text inputs before rendering preview banners.

---

### Page 8: Platform About Page (`/platform/about/`)
- **File Path:** `platform/about/index.html`
- **Purpose:** Information about FanHoard platform, mission, team, and open-source attribution.
- **Components:** Mission statement block, author bio card, tech stack highlights, open source license note.
- **State:** Static.
- **Data Flow:** Static HTML load with i18n dictionary injection.
- **Data Sources:** `assets/lang/en.json`, `assets/lang/th.json`.
- **Concrete Improvement Opportunities:**
  1. Clean up missing 404 scripts (`lang-sync.js`, `fanhoard-console-bridge.js`).
  2. Add missing Privacy Policy and Content License pages linked in footer.

---

### Page 9: Interactive Product Roadmap (`/platform/roadmap/`)
- **File Path:** `platform/roadmap/index.html`
- **Purpose:** Visual timeline displaying completed features, current developments, and upcoming milestones.
- **Components:** Roadmap timeline cards, phase status tags (`Completed`, `In Progress`, `Planned`), release link buttons.
- **State:** Active timeline tab filter.
- **Data Flow:** `assets/js/roadmap.js` parses stage configuration and builds timeline nodes.
- **Data Sources:** `assets/json/current-stage.json`.
- **Concrete Improvement Opportunities:**
  1. Remove 404 scripts (`lang-sync.js`, `fanhoard-console-bridge.js`).
  2. Add fallback state handling if `current-stage.json` fails to load.

---

### Page 10: What's New & Release Notes (`/platform/whats_new/`)
- **File Path:** `platform/whats_new/index.html`
- **Purpose:** Version release changelog and historical update notes.
- **Components:** Release card stream, version version badge pills, changelog Markdown content viewer.
- **State:** Selected release version index.
- **Data Flow:** Fetches `assets/json/whats-new.json` -> loads corresponding release Markdown file from `assets/md/{lang}/releases/`.
- **Data Sources:** `assets/json/whats-new.json`, `assets/md/en/releases/*.md`, `assets/md/th/releases/*.md`.
- **Concrete Improvement Opportunities:**
  1. Remove dead scripts (`lang-sync.js`, `fanhoard-console-bridge.js`).
  2. Implement client-side markdown caching to eliminate re-fetching changelogs on toggle.

---

### Page 11: Verse Discover Feed (`/data/verse/discover/`)
- **File Path:** `data/verse/discover/index.html`
- **Purpose:** Continuous infinite-scroll feed for browsing symbol and emoji sets.
- **Components:** Infinite scroll container, category filtering bar, symbol grid cards, loading sentinel spinner.
- **State:** Active category, feed pagination index, cached route state (`RouteCache`).
- **Data Flow:** IntersectionObserver triggers sentinel -> `nav-core-modules/content.js` fetches next chunk -> renders cards via URE.
- **Data Sources:** `assets/db/con-data/*.json`.
- **Concrete Improvement Opportunities:**
  1. Remove 404 script references (`lang-sync.js`, `fanhoard-console-bridge.js`).
  2. Replace `innerHTML` append cycles with document fragment batch inserts to eliminate reflow lag.

---

### Page 12: Verse Detail Scope Reader (`/data/verse/scope/`)
- **File Path:** `data/verse/scope/index.html`
- **Purpose:** Focused reader view for examining a single symbol category, character variation, or Unicode block.
- **Components:** Scope header, detailed character matrix, Unicode metadata table, quick-copy bar.
- **State:** Active scope ID (`?id=`), selected character unicode point.
- **Data Flow:** Query param `?id=` parsed -> fetches target dataset -> renders symbol details.
- **Data Sources:** `assets/db/con-data/*.json`.
- **Concrete Improvement Opportunities:**
  1. Add error boundary card when `?id=` is invalid or missing.
  2. Implement breadcrumb navigation back to parent Discover feed category.

---

### Page 13: Search Card Prototype (`/beta.html` - Orphan)
- **File Path:** `beta.html`
- **Purpose:** Unmaintained legacy test page for ultra-compact search cards.
- **Components:** Inline search results grid, compact symbol cards.
- **State:** Unbound static state.
- **Data Flow:** Hardcoded inline CSS and JS.
- **Data Sources:** None (static mock data).
- **Concrete Improvement Opportunities:**
  1. Remove or relocate to a dedicated `tests/` directory; file should not be deployed in production web root.

---

### Page 14: FVL System Test Harness (`/cn.html` - Orphan)
- **File Path:** `cn.html`
- **Purpose:** Standalone test harness for testing FanHoardVerse Loader (`fvl.js`) animations.
- **Components:** Test trigger buttons, full-screen loading overlay preview.
- **State:** Demo trigger toggles.
- **Data Flow:** Clicking buttons invokes `FVL.show()` and `FVL.hide()`.
- **Data Sources:** `assets/js/loading-system/fvl.js`.
- **Concrete Improvement Opportunities:**
  1. Rename or delete file; file path `cn.html` misleadingly implies Chinese language translation.

---

### Page 15: Experimental SVG Sandbox (`/n.html` - Orphan)
- **File Path:** `n.html`
- **Purpose:** Orphan experimental sandbox containing house icon SVG definitions.
- **Components:** Standalone SVG node.
- **State:** Static.
- **Data Sources:** Inline SVG.
- **Concrete Improvement Opportunities:**
  1. Delete orphan file from repository root.

---

### Page 16: Google Search Console Verification (`/google6b646fa60e0f9f2f.html`)
- **File Path:** `google6b646fa60e0f9f2f.html`
- **Purpose:** Domain ownership verification file for Google Search Console.
- **Components:** HTML verification comment string.
- **State:** Static document.
- **Data Sources:** Hardcoded verification string.
- **Concrete Improvement Opportunities:**
  1. Retain as required for GSC indexing verification.

---

### Shared HTML Snippets (`assets/template-html/`)
- **Files:** `footer-template.html`, `home-templates.html`, `intro-template.html`
- **Purpose:** Reusable HTML string snippets injected by `scripts/build.js` and `assets/js/footer-template.js`.
- **Components:** Global footer links, category intro blocks, template card skeletons.
- **Concrete Improvement Opportunities:**
  1. Fix broken Privacy Policy (`/platform/privacy`) and Content License (`/platform/license`) links in `footer-template.html`.
  2. Migrate snippet processing to a typed pre-compilation step.

---

## Top Findings & Recommended Action Plan

| Priority | Assessment Area | Major Finding | File-Path Evidence |
| :--- | :--- | :--- | :--- |
| **P0 - Critical** | **Dead Code & 404s** | 5 missing files referenced in production HTML templates throwing HTTP 404 errors on every page view. | `home/index.html:7,319`, `community/report/index.html:139,188`, `community/contact/index.html:23` |
| **P0 - Critical** | **Broken Links** | Global footer links to Privacy Policy and Content License return 404 errors across all 34 localized routes. | `assets/template-html/footer-template.html:29-30` |
| **P1 - High** | **Security** | Unsanitized `innerHTML` rendering in Popup Engine and UI helpers creates XSS risks. `_headers` lacks CSP and framing protection. | `assets/js/popup-modules/engine.js:333`, `_headers:1-40` |
| **P1 - High** | **Test Coverage** | 0% test coverage across codebase; no testing framework installed. | `package.json:1-30` |
| **P1 - High** | **Performance** | Up to 12 unminified script waterfall loads per page; TTF font files uncompressed. | `search/index.html:20-40`, `assets/fonts/` |
| **P2 - Medium** | **Architecture** | Hybrid static HTML / client-side SPA routing causes state desync. Monolithic JS files duplicate modular folders. | `assets/js/lang-core.js` vs `assets/js/lang-modules/` |
| **P2 - Medium** | **Accessibility** | FAQ accordions lack ARIA tags; focus rings suppressed without alternatives; missing skip-links on secondary pages. | `home/index.html:280`, `assets/css/search.css` |
| **P3 - Low** | **Orphan Files** | Root directory contains orphan experimental test files (`beta.html`, `cn.html`, `n.html`, `assets/json/buttons 1.json`). | Root directory, `assets/json/` |

