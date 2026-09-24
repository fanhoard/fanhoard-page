# FanHoard Master Roadmap

- **System Described**: FanHoard Development Phases & System Evolution Roadmap
- **Entry File**: `docs/plans/ROADMAP.md`
- **Dependencies**: `assets/js/popup.js`, `assets/js/version-core.js`, `scripts/validate-release.js`, `scripts/update-version.js`, `assets/js/search-system/`
- **Verification**: `node scripts/validate-release.js --staged` | `npm run test`

---

## Roadmap Overview & System Status

This document defines the multi-phase engineering roadmap for the **FanHoard** platform (live active version: `v3.0.0`). The roadmap tracks completed baseline refactoring and guides future development across the static frontend repository (`fanhoard/fanhoard-page`) and edge worker microservice (`Jeffy2600II/community-fanhoard`).

---

## Roadmap Summary Matrix

| Phase | Title | Focus Area | Scope & Core Deliverables | Status | Dependencies |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **1** | **Zero-Debt Baseline & Security** | Infrastructure | Eliminate HTTP 404 script tags, fix footer links, purge orphan prototypes, and configure OWASP security headers in `_headers`. | **Completed (v3.0.0)** | None |
| **2** | **Community Edge API Modernization** | Worker Microservice | Refactor worker to TypeScript + Hono, Cloudflare KV rate limiting, Turnstile anti-bot protection, and Discord webhook sanitization. | **Completed (v3.0.0)** | Phase 1 |
| **3** | **Typed Data, State & Version Notifier** | Data & Client State | Modular `assets/js/version-core.js` notifier, `localStorage` tokens (`fv_shown_build`, `fv_dismissed_v*`), 90m session idle rule, and i18n language sync. | **Completed (v3.0.0)** | Phase 1, Phase 2 |
| **4** | **Modular Search Architecture & Performance** | Search Engine | Modular search system under `assets/js/search-system/`, LRU result cache cap 50, bucket index early-exit (`<=3` chars), and `OverlayService`. | **Completed (v3.0.0)** | Phase 3 |
| **5** | **Modular Popup System & Asset Optimization** | UI & Popups | Modular popup architecture (`assets/js/popup.js` & `assets/js/popup-modules/`), WOFF2 font optimization, and accessible modal overlays. | **Completed (v3.0.0)** | Phase 4 |
| **6** | **4-Layer Release Control & Automation** | Quality Assurance | `scripts/validate-release.js`, `scripts/update-version.js`, bypass token mechanism (`.release-bypass`), git hooks, and Vitest suite. | **Active / Ongoing** | Phase 5 |

---

## Phase 1: Zero-Debt Baseline & Infrastructure Security

### Scope & Objective
Establish an error-free foundation across all 16 web routes and worker endpoints. Eliminate HTTP 404 network errors caused by missing legacy scripts (`lang-sync.js`, `lang-coordinator.js`, `Intelligent-system.js`), fix broken legal footer links, clean orphan prototype files, and configure OWASP security headers in `_headers`.

### Task List
- [x] **Task 1.1: Remove Non-Existent Legacy Script & Style References**
  - Purge `<script src="/assets/js/lang-sync.js">` across HTML templates.
  - Purge `<script src="/assets/js/Intelligent-system.js">` and `lang-coordinator.js` from settings and community routes.
  - Purge `<link rel="stylesheet" href="/assets/css/language-error.css">` from contact routes.
- [x] **Task 1.2: Implement Legal Documentation Routes & Update Footer**
  - Establish localized Privacy Policy (`/platform/privacy/`) and Content License (`/platform/license/`) routes.
  - Update `assets/js/footer-template.js` to point to `/platform/privacy/` and `/platform/license/`.
- [x] **Task 1.3: Clean Up Orphan Prototypes**
  - Purge unreferenced prototype HTML files (`beta.html`, `cn.html`, `n.html`) and duplicate assets.
- [x] **Task 1.4: Configure Security Headers**
  - Configure OWASP security headers in Cloudflare Pages `_headers` (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).

### Acceptance Criteria
1. DevTools network inspection on all 16 routes yields **0 HTTP 404 network errors**.
2. Footer links for Privacy Policy and Content License navigate to valid localized pages.
3. OWASP security header scanner verifies active CSP and frame protection headers.

### Dependencies
- None.

---

## Phase 2: Community Edge API Modernization (`community-fanhoard`)

### Scope & Objective
Modernize the Cloudflare Worker microservice (`community-fanhoard`) with TypeScript and Hono. Implement persistent rate limiting via Cloudflare KV, anti-bot protection via Cloudflare Turnstile, and Discord payload sanitization.

### Task List
- [x] **Task 2.1: Worker Refactoring & Hono Migration**
  - Refactor monolithic worker endpoint into modular TypeScript architecture using Hono framework.
- [x] **Task 2.2: Cloudflare KV Persistent Rate Limiting**
  - Enforce IP-based sliding window rate limiter (max 5 requests per 10-minute window) backed by `RATE_LIMIT_KV`.
- [x] **Task 2.3: Anti-Bot & Discord Payload Sanitization**
  - Integrate Cloudflare Turnstile token validation middleware on report submissions.
  - Escape Markdown characters (`*`, `_`, `` ` ``, `~`) and remove mention triggers (`@everyone`, `@here`) before forwarding to Discord.
- [x] **Task 2.4: Standardize CORS & Error Response Contracts**
  - Restrict CORS origins to authorized FanHoard domains (`https://fantrove.pages.dev`, `https://fanhoard.com`).

### Acceptance Criteria
1. Worker compiles cleanly with TypeScript `strict: true`.
2. Submission payloads containing mention syntax deliver sanitized plain text without triggering Discord ping alerts.
3. Exceeding request thresholds returns HTTP 429 Too Many Requests with `Retry-After` header.

### Dependencies
- Phase 1.

---

## Phase 3: Typed Data, State Store & Version Notifier Architecture

### Scope & Objective
Establish a unified state management layer and version notification system. Replace untyped global variables with modular singletons (`LanguageStore.ts`, `assets/js/version-core.js`) and implement update tracking with session freshness controls.

### Task List
- [x] **Task 3.1: Version Notifier Core Architecture**
  - Build `assets/js/version-core.js` to manage version checks against `assets/md/{lang}/current.md` frontmatter.
  - Implement LocalStorage preference keys: `fv_shown_build`, `fv_dismissed_v{version}`, and `fv_noupdate`.
- [x] **Task 3.2: Session Idle & Freshness Rule**
  - Implement SessionStorage tracking (`fv_ss_shown_{build}`, `fv_last_active`) with a 90-minute session idle timeout (`IDLE_MS = 5400000`).
- [x] **Task 3.3: Language Synchronization Store**
  - Refactor language management into `assets/js/language.js` and `src/stores/LanguageStore.ts` supporting bilingual switching (`en` / `th`).

### Acceptance Criteria
1. Dismissing an update banner writes `fv_dismissed_v3.0.0 = '1'` to `localStorage`, suppressing popups for version `3.0.0`.
2. User activity resets `fv_last_active`; inactivity exceeding 90 minutes triggers session re-check.
3. Language toggle updates document `lang` attribute, URL path, and content strings seamlessly.

### Dependencies
- Phase 1, Phase 2.

---

## Phase 4: Modular Search Architecture & Search Performance

### Scope & Objective
Replace monolithic search logic with a modular search system under `assets/js/search-system/search-modules/`. Implement high-performance query caching and candidate bucket indexing for sub-10ms search response times.

### Task List
- [x] **Task 4.1: Search Engine Refactoring**
  - Split search functionality into modular components: `config.js`, `engine.js`, `overlay.js`, `keyboard.js`, `ui.js`.
- [x] **Task 4.2: LRU Query Cache Implementation**
  - Implement LRU query result cache capped at 50 entries (`RESULT_CACHE_CAP = 50`) in `assets/js/search-system/search-modules/engine.js`.
- [x] **Task 4.3: Bucket Index Short-Query Acceleration**
  - Implement candidate bucket index Map (`char -> SearchDoc[]`) for short queries (`nq.length <= 3`), bypassing full dataset scanning.
- [x] **Task 4.4: Centralized Escape Listener & Overlay Service**
  - Route all Escape key close requests centrally through `OverlayService.close('escape')` in `overlay.js`.
- [x] **Task 4.5: Service Timeout Optimization**
  - Reduce data service pre-load wait timeout (`conDataServiceWaitMs`) from 5000ms to 1200ms in `config.js`.

### Acceptance Criteria
1. Repeated queries resolve instantly from LRU cache without re-executing search filters.
2. Short queries (`<= 3` characters) use bucket index fast-path execution.
3. Pressing Escape key smoothly closes active search overlays via `OverlayService`.

### Dependencies
- Phase 3.

---

## Phase 5: Modular Popup System & UI Asset Optimization

### Scope & Objective
Implement a modular notification popup engine (`assets/js/popup.js` and `assets/js/popup-modules/`) replacing legacy popup components. Optimize web typography and modal accessibility.

### Task List
- [x] **Task 5.1: Popup System Refactoring**
  - Refactor popup mechanics into modular scripts: `types.js`, `animator.js`, `overlay.js`, `queue.js`, `renderer.js`, `theme.js`, `a11y.js`, `init.js`.
- [x] **Task 5.2: WOFF2 Font Delivery & Asset Optimization**
  - Convert custom typography to compressed WOFF2 format (<30KB per font file).
  - Serve optimized responsive images from `data/cards/` CDN structure.
- [x] **Task 5.3: WCAG 2.1 Accessibility Compliance**
  - Implement visible high-contrast focus rings (`:focus-visible`), native `<details>`/`<summary>` accordions, and `aria-live` region announcements.

### Acceptance Criteria
1. `assets/js/popup.js` orchestrates popup queueing, theme switching, and smooth entrance/exit animations.
2. Accordion elements utilize WCAG-compliant native `<details>` semantics.
3. Total typography asset payloads are reduced by over 70%.

### Dependencies
- Phase 4.

---

## Phase 6: 4-Layer Release Control, Automated Testing & Continuous Integration

### Scope & Objective
Enforce strict quality gates across git commits, pre-push checks, and CI/CD pipelines. Maintain single source of truth versioning and automated changelog distribution.

### Task List
- [x] **Task 6.1: 4-Layer Release Control Engine**
  - Implement `scripts/validate-release.js` enforcing 4 validation layers:
    - Layer 1: Git pre-commit hook token check.
    - Layer 2: Git pre-push hook bypass token validation.
    - Layer 3: GitHub Actions CI workflow check (`node scripts/validate-release.js --ci`).
    - Layer 4: Version synchronization gate.
- [x] **Task 6.2: Release Bypass Token Mechanics**
  - Support silent doc-only and internal commits via `.release-bypass` counter token increment (`.release-bypass` > `.release-bypass-counter`).
- [x] **Task 6.3: Version Synchronization Pipeline**
  - Build `scripts/update-version.js` to automatically snapshot previous `current.md` to `assets/md/{lang}/releases/v{version}.md` and update `assets/md/{lang}/releases/index.json` manifests.
- [ ] **Task 6.4: Vitest & Playwright Test Expansion**
  - Maintain Vitest unit coverage for search, popup, and version core logic.
  - Expand Playwright E2E browser tests for symbol copy actions, language toggles, and theme switching.

### Acceptance Criteria
1. Commits without version bumps are blocked unless valid `.release-bypass` tokens are provided.
2. Executing `node scripts/update-version.js` generates snapshot releases and updates per-language index manifests (`assets/md/{lang}/releases/index.json`).
3. GitHub Actions CI pipeline passes all type checks, lint rules, and test suites before allowing PR merges to `main`.

### Dependencies
- Phase 5.
