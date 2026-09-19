# FanHoard Phased Master Roadmap

**Document Version:** 1.0.0  
**Target Repositories:** `fanhoard/fanhoard-page` & `Jeffy2600II/community-fanhoard`  
**Execution Strategy:** Incremental, self-contained, independently verifiable development phases.  

---

## Roadmap Summary Matrix

| Phase | Title | Focus Area | Scope & Core Deliverables | Estimated Risk | Dependencies |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **1** | **Zero-Debt Baseline & Security** | Web Infrastructure | Remove 404 dead script references, fix broken footer links, clean orphan files, configure OWASP security headers in `_headers`, establish ESLint, Prettier, TypeScript config, and privacy/license routes. | Low | None |
| **2** | **Community Edge API Modernization** | Worker Microservice | Refactor worker to TypeScript + Hono, configure Cloudflare KV rate limiting, Turnstile bot protection, Discord Markdown/ping sanitization, dynamic origin CORS, and Vitest suite. | Medium | Phase 1 |
| **3** | **Typed Data, API Client & State Store** | Data & Client State | Define Zod schemas for symbol JSON data, create typed `CommunityApiClient` with request timeouts, refactor `LanguageStore`, `PreferenceStore`, and `SearchStore` to ES Modules without `window` globals. | Low | Phase 1, Phase 2 |
| **4** | **UI System, Asset & WCAG 2.1 a11y** | Design & Accessibility | WOFF2 fonts, WebP/AVIF images, CSS tokens in `tokens.css`, native `<details>` FAQ accordions, `:focus-visible` rings, `aria-live` announcers, dynamic TypeScript `PopupEngine`. | Low | Phase 3 |
| **5** | **Component Modernization & Vite SSG** | Frontend & Bundling | Vite bundler pipeline, TS Cheerio SSG build generator, DOM recycling in Discover Feed (`data/verse/discover/`), Markdown cache in What's New, zero unminified waterfalls. | Medium | Phase 4 |
| **6** | **Testing, CI/CD Gates & Automation** | Quality Assurance | Vitest unit/integration tests (>80% coverage), Playwright E2E browser tests, GitHub Actions CI workflow blocking PR failures, automated release tagging. | Low | Phase 5 |

---

## Phase 1: Zero-Debt Baseline & Infrastructure Security

### Scope & Objective
Establish a clean, error-free foundation across all 16 web routes and worker microservice. Eliminate all HTTP 404 network errors caused by missing script tags or stylesheets, fix global broken footer links, clean up legacy orphan prototype files, configure OWASP security headers in Cloudflare Pages `_headers`, and set up baseline package tooling (TypeScript, ESLint, Prettier).

### Exact Task List
- [ ] **Task 1.1: Remove Non-Existent 404 Script & Style References**
  - Search and purge `<script src="/assets/js/lang-sync.js">` across 10 HTML templates.
  - Purge `<script src="/fanhoard-console-bridge.js">` across 10 HTML templates and `dist/` built pages.
  - Purge `<script src="/assets/js/Intelligent-system.js">` in `community/report/index.html` and `setting/index.html`.
  - Purge `<script src="/assets/js/lang-coordinator.js">` in `community/report/index.html` and `setting/index.html`.
  - Purge `<link rel="stylesheet" href="/assets/css/language-error.css">` in `community/contact/index.html`.
- [ ] **Task 1.2: Implement Missing Legal Documentation Routes & Fix Footer Links**
  - Create `/platform/privacy/index.html` (Privacy Policy page template and i18n keys).
  - Create `/platform/license/index.html` (Open Source Content License template and i18n keys).
  - Update `assets/template-html/footer-template.html` lines 29–30 to point to `/platform/privacy/` and `/platform/license/`.
  - Update SSG `scripts/build.js` to process and build localized privacy and license pages (`dist/en/platform/privacy/`, `dist/th/platform/privacy/`, etc.).
- [ ] **Task 1.3: Clean Up Orphan Files & Asset Duplicates**
  - Safely delete `beta.html` (legacy search card test page).
  - Safely delete `cn.html` (legacy FVL test harness).
  - Safely delete `n.html` (legacy SVG icon sandbox).
  - Safely delete `assets/json/buttons 1.json` (orphan space-named file).
  - Deduplicate `assets/images/banner-fanhoard-hub.jpg`, `banner-fanhoard-hub-1.jpg`, `banner-fanhoard-hub_11zon.jpg`.
- [ ] **Task 1.4: Configure OWASP Security Headers in Cloudflare Pages `_headers`**
  - Append security headers to `_headers`:
    ```
    /*
      Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://community-fanhoard.pages.dev https://*.cloudflare.com; frame-src https://challenges.cloudflare.com;
      X-Frame-Options: DENY
      X-Content-Type-Options: nosniff
      Referrer-Policy: strict-origin-when-cross-origin
      Permissions-Policy: camera=(), microphone=(), geolocation=()
    ```
- [ ] **Task 1.5: Setup Baseline Package Tooling & Type Configs**
  - In `fanhoard-page`: Initialize `tsconfig.json` (`strict: true`, `target: ES2022`), install `typescript`, `eslint`, `prettier`, `@typescript-eslint/parser` as devDependencies.
  - In `community-fanhoard`: Create `package.json`, `tsconfig.json` (`target: ES2022`, `@cloudflare/workers-types`), install `wrangler`, `hono`, `typescript` as devDependencies.

### Acceptance Criteria
1. Opening browser DevTools network tab on any of the 16 routes yields **0 HTTP 404 network errors**.
2. Clicking "Privacy Policy" or "Content License" in the footer loads valid HTML pages without redirect errors.
3. No orphan prototype files (`beta.html`, `cn.html`, `n.html`) exist in the repository root.
4. Security header scanners (e.g. securityheaders.com) detect active CSP, X-Frame-Options, and nosniff headers.
5. `npm run type-check` and `npm run lint` execute successfully in both repositories.

### Risk Notes & Mitigation
- *Risk*: Stripping missing scripts might break unspoken dependencies if inline scripts expected functions declared in missing files.
- *Mitigation*: Inspection confirms all 5 purged files were completely non-existent in repo; Purging eliminates browser 404 attempts without functional loss.

### Dependencies
- None (First Phase).

---

## Phase 2: Community Edge API Modernization (`community-fanhoard`)

### Scope & Objective
Transform `Jeffy2600II/community-fanhoard` into a robust, type-safe Cloudflare Worker microservice built with Hono and TypeScript. Eliminate security vulnerabilities including in-memory rate limiting bypasses, raw Discord Markdown injection, unauthenticated submission abuse, and hardcoded CORS restrictions.

### Exact Task List
- [ ] **Task 2.1: Restructure Worker Repository & Hono Migration**
  - Migrate single-file `index.js` into modular TypeScript layout under `src/`:
    - `src/index.ts`: Hono app entry point and routing middleware.
    - `src/routes/report.ts`: `POST /report` handler.
    - `src/middleware/rateLimit.ts`: Cloudflare KV rate limiting middleware.
    - `src/middleware/turnstile.ts`: Cloudflare Turnstile token verification middleware.
    - `src/services/discord.ts`: Discord webhook payload formatter and client.
    - `src/utils/sanitize.ts`: Markdown & @everyone/@here mention sanitization utility.
    - `src/types/env.ts`: Worker environment bindings interface (`DISCORD_WEBHOOK_URL`, `RATE_LIMIT_KV`, `TURNSTILE_SECRET_KEY`).
- [ ] **Task 2.2: Implement Cloudflare KV Persistent Rate Limiting**
  - Configure `RATE_LIMIT_KV` namespace binding in `wrangler.toml`.
  - Build IP-based sliding window rate limiter in `src/middleware/rateLimit.ts` enforcing max 5 requests per 10-minute window per IP address across edge nodes.
  - Return HTTP `429 Too Many Requests` with `Retry-After` header when limit exceeded.
- [ ] **Task 2.3: Implement Discord Payload Sanitization & Anti-Bot Protection**
  - Build `sanitizeDiscordText(text: string): string` in `src/utils/sanitize.ts` to escape Markdown characters (`*`, `_`, `` ` ``, `~`, `|`) and remove mention triggers (`@everyone`, `@here`, `<@&...>`, `<@...>`).
  - Integrate Cloudflare Turnstile token validation middleware on `POST /report`.
- [ ] **Task 2.4: Standardize CORS & Error Response Contracts**
  - Implement dynamic CORS middleware checking origin against allowed domains (`https://fanhoard.pages.dev`, `https://fanhoard.com`, `http://localhost:*`).
  - Update HTTP status codes: Return `201 Created` on successful report delivery with `{ success: true, report_id: "rep_..." }`.
  - Return structured JSON errors (`400 Bad Request`, `429 Too Many Requests`, `500 Internal Server Error`).
- [ ] **Task 2.5: Build Vitest Suite for Edge Worker**
  - Write unit tests in `tests/sanitize.test.ts` verifying Markdown and mention escaping.
  - Write integration tests in `tests/report.test.ts` using `@cloudflare/vitest-pool-workers` testing `POST /report`, rate limiting, and Turnstile validation.

### Acceptance Criteria
1. Worker compiles cleanly with TypeScript `strict: true`.
2. Sending a payload with `@everyone *bold*` to `POST /report` delivers sanitized plain text to Discord without triggering user mentions.
3. Rapidly sending 6 requests from the same IP returns HTTP 429 on the 6th request.
4. Requests from `http://localhost:5173` receive correct `Access-Control-Allow-Origin` headers.
5. All Vitest tests in `community-fanhoard` pass with 100% route coverage.

### Risk Notes & Mitigation
- *Risk*: Turnstile verification will reject submissions from frontend clients that do not pass a Turnstile token.
- *Mitigation*: Make Turnstile verification optional in local dev environment (`ENVIRONMENT === 'development'`) until frontend Turnstile component is deployed in Phase 3.

### Dependencies
- Phase 1.

---

## Phase 3: Typed Data, API Client & State Store Architecture

### Scope & Objective
Establish a unified, type-safe data model and state management layer across `fanhoard-page`. Transition from untyped global `window` object properties (`window.M`, `window.LanguageService`) to modular ES TypeScript singletons, build Zod runtime data validators for static datasets, and construct a typed frontend API client with fetch timeouts.

### Exact Task List
- [ ] **Task 3.1: Define TypeScript Interfaces & Zod Schemas for Static Datasets**
  - Create `src/types/data.ts` and `src/schemas/data.ts` defining Zod schemas for:
    - Symbol Databases (`assets/db/con-data/*.json`)
    - Button Category Config (`assets/json/buttons.json`)
    - Release Stage & Changelogs (`assets/json/current-stage.json`, `whats-new.json`)
  - Build CLI validation script `scripts/validate-data.ts` runnable via `npm run validate:data`.
- [ ] **Task 3.2: Refactor State Stores to ES Modules (Eliminate Window Globals)**
  - Build `src/stores/LanguageStore.ts`: Manages `en`/`th` i18n dictionaries, locale switching, and subscriber callbacks.
  - Build `src/stores/PreferenceStore.ts`: Manages user preferences (`fv_lang`, `fv_theme`) with LocalStorage fallback and Zod schema validation.
  - Build `src/stores/SearchStore.ts`: Manages active search query, category filters, and virtual scroll index state.
  - Remove window assignment bindings (`window.LanguageService = ...`, `window.NavCore = ...`).
- [ ] **Task 3.3: Build Typed `CommunityApiClient`**
  - Create `src/api/CommunityApiClient.ts`:
    - Wraps `fetch` requests to `https://community-fanhoard.pages.dev/report`.
    - Enforces 10-second `AbortController` timeout.
    - Implements exponential backoff retries (up to 2 retries) for transient network failures.
    - Integrates Cloudflare Turnstile token passing.
- [ ] **Task 3.4: Unit Test State Stores & API Client**
  - Write unit tests in `tests/stores/LanguageStore.test.ts` and `PreferenceStore.test.ts`.
  - Write unit tests in `tests/api/CommunityApiClient.test.ts` with mocked `fetch` responses.

### Acceptance Criteria
1. `npm run validate:data` validates every JSON file in `assets/db/con-data/` and `assets/json/` with 0 schema errors.
2. Opening browser dev console and inspecting `window.M` or `window.LanguageService` reveals no global leaks; state is managed exclusively via ES modules.
3. `CommunityApiClient` correctly aborts hanging network requests after 10 seconds and throws typed error instances.
4. Unit tests for stores and API client achieve 100% pass rate.

### Risk Notes & Mitigation
- *Risk*: Removing window globals might break inline scripts on un-refactored secondary pages.
- *Mitigation*: Provide temporary deprecation proxy accessors with console warnings during transition until Phase 5 converts all pages to Vite bundles.

### Dependencies
- Phase 1, Phase 2.

---

## Phase 4: UI System, Asset Optimization & WCAG 2.1 AA Accessibility

### Scope & Objective
Modernize the visual asset foundation and design token system while bringing the entire FanHoard web interface into 100% compliance with WCAG 2.1 AA accessibility standards. Convert uncompressed TTF fonts and raw image assets into modern web formats (WOFF2, WebP/AVIF), replace non-accessible checkbox accordions, and enforce high-contrast focus rings and screen reader live announcers.

### Exact Task List
- [ ] **Task 4.1: Font & Image Asset Optimization**
  - Convert `assets/fonts/FoglihtenNo07.ttf` and `MunroSmall.ttf` to compressed `WOFF2` format (<30KB each) and update `@font-face` rules in `assets/css/tokens.css`.
  - Convert PNG/JPG images (`banner-fanhoard-hub.jpg`, `j.png`, OG cards) to WebP and AVIF formats with responsive `<picture>` fallback tags.
- [ ] **Task 4.2: Standardize CSS Token Engine & Focus Ring Restoration**
  - Refactor `assets/css/tokens.css` into unified design token variables (colors, typography, spacing, elevation, focus rings).
  - Purge `outline: none` suppression rules across `assets/css/search.css` and `assets/css/home.css`.
  - Add explicit `:focus-visible` ring styling (`outline: 3px solid var(--fv-focus-ring); outline-offset: 2px;`).
- [ ] **Task 4.3: Refactor Accordions & Interactive Components to WCAG Standard**
  - Replace CSS checkbox hack accordions in `home/index.html` with native HTML5 `<details>` and `<summary>` elements with `aria-expanded` state tracking.
  - Add "Skip to main content" (`.fv-skip-link`) accessibility link to all 16 page templates.
  - Add `aria-live="polite"` result announcer container to `search/index.html` for announcing search hit counts to screen readers.
- [ ] **Task 4.4: Refactor Dynamic Modal & Popup Engine**
  - Rewrite `assets/js/popup-modules/` into typed `src/components/PopupEngine.ts`.
  - Eliminate unsafe `innerHTML` dynamic string assignments; use DOMParser / textContent node creation to eliminate XSS vectors.
  - Add keyboard `Escape` key listener and modal focus trapping (`focus-trap`).
- [ ] **Task 4.5: Automated Accessibility Testing**
  - Execute automated accessibility audits using `@axe-core/cli` across all 16 routes.

### Acceptance Criteria
1. Total font payload size reduced by >75% (WOFF2 files <30KB).
2. Tabbing through interactive elements on any page highlights active controls with visible 3px focus rings.
3. Screen readers announce accordion expansion/collapse states and search result updates.
4. `@axe-core/cli` reports **0 critical or serious accessibility violations** across all 16 routes.
5. Lighthouse Accessibility score = 100 across mobile and desktop audits.

### Risk Notes & Mitigation
- *Risk*: Switching checkbox accordions to `<details>` might cause visual style shifts if CSS selectors depend on sibling checkbox input state.
- *Mitigation*: Update CSS rules in `assets/css/home.css` to target `details[open] summary` selectors.

### Dependencies
- Phase 3.

---

## Phase 5: Component Modernization & Vite SSG Bundling

### Scope & Objective
Consolidate the multi-file JavaScript and CSS waterfall loading strategy into a modern, minified, content-hashed Vite build pipeline. Refactor page controllers and SSG pre-rendering engines to produce zero-waterfall static HTML pages, optimize virtual scroll rendering in Discover Feed (`data/verse/discover/`), and implement client-side Markdown caching in What's New (`platform/whats_new/`).

### Exact Task List
- [ ] **Task 5.1: Configure Vite Build Pipeline & Bundler**
  - Configure `vite.config.ts` in `fanhoard-page` with multi-page SSG entry points and asset minification (Terser / ESBuild).
  - Configure CSS PostCSS processing and asset hashing (`[name]-[hash].js`, `[name]-[hash].css`).
- [ ] **Task 5.2: Modernize Cheerio SSG Generator Script**
  - Refactor `scripts/build.js` into TypeScript `src/build/ssg.ts`.
  - Automatically parse all source HTML templates, inject i18n translation keys from `en.json`/`th.json`, substitute shared footer/header snippets, and write localized pages to `dist/en/` and `dist/th/`.
- [ ] **Task 5.3: Refactor Discover Feed Engine (`data/verse/discover/`)**
  - Rewrite `assets/js/nav-core-modules/content.js` feed engine into typed `src/components/DiscoverFeed.ts`.
  - Replace full subtree `innerHTML` re-renders with DOM node recycling / DocumentFragment batch updates to eliminate layout thrashing during infinite scrolling.
  - Implement `IntersectionObserver` for seamless pagination loading.
- [ ] **Task 5.4: Implement Client-Side Markdown Cache (`platform/whats_new/`)**
  - Create `src/services/ReleaseCacheService.ts` to cache parsed changelog Markdown documents in memory and `sessionStorage`.
  - Prevent duplicate network fetches when toggling between release versions or languages.
- [ ] **Task 5.5: Page Bundle Verification**
  - Validate that every page in `dist/` loads at most 1 minified CSS bundle and 1 minified JS bundle.

### Acceptance Criteria
1. `npm run build` generates fully static localized sites in `dist/en/` and `dist/th/` in under 5 seconds.
2. Network waterfall inspection shows 1 JS bundle load per page instead of 11–12 sequential script tags.
3. Discover Feed infinite scroll maintains 60 FPS performance without visual stutter or DOM thrashing.
4. Toggling release notes in What's New retrieves cached Markdown instantly without repeated network fetch calls.
5. Lighthouse Performance score = 100 on desktop and mobile.

### Risk Notes & Mitigation
- *Risk*: Bundling scripts might alter execution timing compared to plain `<script defer>` tag sequences.
- *Mitigation*: Ensure initialization logic executes inside `DOMContentLoaded` or `requestAnimationFrame` lifecycle hooks in Vite entry modules.

### Dependencies
- Phase 4.

---

## Phase 6: Automated Testing, CI/CD Gates & Release Automation

### Scope & Objective
Achieve an industrial-grade engineering standard by implementing comprehensive automated unit, integration, and E2E browser testing backed by GitHub Actions CI/CD workflows. Block broken code from ever reaching `main`, automate pre-release validation, and establish automated release tagging.

### Exact Task List
- [ ] **Task 6.1: Build Vitest Unit & Integration Test Suite**
  - Expand unit test coverage across:
    - i18n translation interpolation engine (`tests/i18n.test.ts`)
    - Search indexing & Fuse.js matcher (`tests/search.test.ts`)
    - Preference storage & LocalStorage sync (`tests/preferences.test.ts`)
    - Symbol scope reader & breadcrumb generator (`tests/scope.test.ts`)
  - Target >80% code coverage across all core modules.
- [ ] **Task 6.2: Build Playwright E2E Test Suite**
  - Setup Playwright testing environment in `e2e/`.
  - Write E2E browser tests covering:
    - `e2e/copy-symbol.spec.ts`: Clicking symbol copies content to clipboard and triggers copy toast notification.
    - `e2e/language-switch.spec.ts`: Toggling language switch updates page content, URL path, and `lang` attribute.
    - `e2e/theme-toggle.spec.ts`: Toggling theme switches CSS token variables and persists to `localStorage`.
    - `e2e/report-submission.spec.ts`: Filling out bug report form submits payload and displays success state.
- [ ] **Task 6.3: Configure GitHub Actions CI Workflows**
  - Update `.github/workflows/ci.yml` in both repositories:
    - Node.js 20.x environment matrix.
    - Run type check: `npm run type-check`
    - Run lint check: `npm run lint`
    - Run unit tests: `npm run test`
    - Run E2E tests: `npm run test:e2e`
    - Run build validation: `npm run build`
  - Enable Branch Protection rules on `main` branch requiring passing CI checks prior to PR merging.
- [ ] **Task 6.4: Configure Automated Release Pipeline**
  - Update `.github/workflows/release.yml` with modern GitHub Actions (`actions/checkout@v4`, `actions/setup-node@v4`).
  - Automate semantic version tagging (`v2.x.x`) and changelog generation upon merging release PRs.

### Acceptance Criteria
1. `npm run test` executes all Vitest unit and integration tests with >80% code coverage and 100% pass rate.
2. `npm run test:e2e` executes all Playwright E2E browser tests in headless Chromium/Firefox/WebKit with 100% pass rate.
3. Submitting a Pull Request with a intentional type error or broken test triggers red build status in GitHub Actions CI and blocks merge.
4. Release workflow builds and deploys clean packages to Cloudflare Pages and Workers automatically.

### Risk Notes & Mitigation
- *Risk*: Playwright E2E tests executing in GitHub Actions environments may experience transient timing issues or clipboard permission blocks.
- *Mitigation*: Configure Playwright with `--override-plugin-power` and mock clipboard API permissions (`grantPermissions(['clipboard-read', 'clipboard-write'])`).

### Dependencies
- Phase 5.
