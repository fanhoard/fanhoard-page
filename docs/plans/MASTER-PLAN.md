# FanHoard Master Development Plan

**Document Version:** 1.0.0  
**Target Repositories:** `fanhoard/fanhoard-page` (Web) & `Jeffy2600II/community-fanhoard` (Edge API Worker)  
**Date:** September 19, 2026  
**Status:** Approved Architectural Target  

---

## 1. Vision & Architecture Overview

The FanHoard platform provides a multi-language (English/Thai) web hub for discovering, copying, and organizing symbols, emojis, and unicode text art. The project architecture consists of two primary components:
1. **`fanhoard/fanhoard-page`**: Static Site Generated (SSG) web application deployed to Cloudflare Pages, utilizing localized HTML pre-rendering with client-side interactive modules.
2. **`Jeffy2600II/community-fanhoard`**: Cloudflare Worker microservice running on the V8 edge runtime, handling user feedback, contact inquiries, and bug reporting with Discord integration and rate limiting.

### Current State vs. Target State Transformation

| Dimension | Legacy / Current State | Target Industrial-Grade Standard |
| :--- | :--- | :--- |
| **Language & Typing** | Plain ES5/ES6 JavaScript, zero type safety, heavy reliance on untyped global `window.M` namespace. | TypeScript 5.x across frontend & edge worker (`strict: true`), zero `any` policy, exported interface contracts. |
| **Asset Delivery** | 12+ unminified script waterfall loads per page, raw TTF fonts (~150KB), PNG/JPG images without WebP/AVIF. | Vite SSG bundle build with content hashing, minification, tree-shaking, WOFF2 fonts (<30KB), WebP/AVIF formats. |
| **Testing** | 0% test coverage; no test runner or automated unit/E2E test setup. | Vitest for unit & integration testing (>80% coverage), Playwright for E2E user flow automation. |
| **CI/CD Quality Gates** | Manual deployment, deprecated GitHub Actions workflows with zero code validation. | GitHub Actions CI enforcing TypeScript type-checks, ESLint/Prettier formatting, Vitest, Playwright, and deployment. |
| **Security & Edge** | Missing CSP/security headers in `_headers`, unauthenticated worker endpoint, raw Discord Markdown injection. | Cloudflare Pages CSP & OWASP security headers, Turnstile anti-bot CAPTCHA, Cloudflare KV rate limiting, string sanitization. |
| **Accessibility (a11y)** | Suppressed focus rings, checkbox hack accordions, missing skip links, screen-reader blind spots. | WCAG 2.1 AA compliant, native `<details>`/`<summary>` accordions, high-contrast `:focus-visible` rings, `aria-live` regions. |

---

## 2. Industry-Grade Standard Definition

To ensure long-term maintainability, reliability, and developer velocity, all future code added to FanHoard must strictly adhere to the six pillars of our **Industry-Grade Engineering Standard**:

### Pillar 1: Strict Static Type Safety
- **Compiler Configuration**: `tsconfig.json` configured with `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, and `noUnusedLocals: true`.
- **Data Models**: All static JSON datasets (`con-data/*.json`, `buttons.json`, `whats-new.json`) governed by Zod schemas and TypeScript interfaces (`types/data.ts`).
- **DOM & API Contracts**: Window globals removed; explicit interface types for DOM events, local storage preference schemas, and API request/response payloads.

### Pillar 2: Automated Testing Rigor
- **Unit Testing**: Vitest testing core business logic, including i18n translation interpolation, symbol search index construction, preference storage, and string escaping.
- **Integration Testing**: Testing client API handlers against mocked worker endpoints and validating component DOM mounting.
- **End-to-End (E2E) Testing**: Playwright test suite executing critical browser workflows: copying symbol to clipboard, switching language (EN/TH), toggling dark/light theme, and submitting bug reports.

### Pillar 3: Continuous Integration (CI) Quality Gates
- **Automated Validation**: Every pull request must automatically pass the `.github/workflows/ci.yml` matrix:
  1. `npm run type-check` (tsc validation)
  2. `npm run lint` (ESLint & Prettier code style)
  3. `npm run test` (Vitest unit/integration tests)
  4. `npm run test:e2e` (Playwright E2E browser tests)
  5. `npm run build` (Vite / Cheerio SSG build verification)
- **Zero Tolerance Policy**: PRs with failing type checks, lint errors, or broken tests are strictly blocked from merging to `main`.

### Pillar 4: Strict Code Review & Commit Hygiene
- **Pre-commit Hooks**: Husky + lint-staged executing Prettier formatting and ESLint auto-fix on modified files prior to commit creation.
- **Conventional Commits**: Commit messages following `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, or `chore:` prefix conventions.

### Pillar 5: Security, Headers & Telemetry
- **Defense in Depth**: OWASP security headers configured in `_headers` (`Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`).
- **Input Sanitization**: Client-side Zod input validation combined with server-side Discord payload escaping to eliminate injection vectors (@everyone/@here triggers and Markdown exploits).
- **Error Telemetry**: Structured error handling (`ErrorBoundary` pattern on frontend, structured JSON logging with correlation IDs on worker).

### Pillar 6: Living Documentation Architecture
- **Co-located Documentation**: Comprehensive plan files under `docs/plans/` updated alongside code changes.
- **JSDoc Standards**: Every exported class, utility function, and API client documented with JSDoc parameters, return types, and example usages.

---

## 3. Guiding Principles

1. **Incremental Execution**: Development proceeds phase by phase as defined in `ROADMAP.md`. No monolithic, "big-bang" rewrites.
2. **Backward Compatibility**: Preserve existing URL routes (`/en/home/`, `/th/home/`, `/search/`) and static asset paths to avoid breaking external links or search engine indexes.
3. **Zero Console 404 Tolerance**: All legacy 404 script references (`lang-sync.js`, `fanhoard-console-bridge.js`, etc.) and broken links must be eliminated in Phase 1.
4. **Performance First**: LCP < 1.0s, INP < 100ms, CLS < 0.05, and 100/100 Lighthouse Performance score across mobile and desktop.
5. **Universal Accessibility**: Accessible to screen readers, keyboard-only users, and users requiring high-contrast visual cues without requiring mouse interactions.

---

## 4. Master Repository Plan Architecture

The master plan documentation under `docs/plans/` is structured as follows:

```
docs/plans/
├── MASTER-PLAN.md                     # Target architecture, standards, guiding principles
├── ROADMAP.md                         # Ordered phases, exact tasks, acceptance criteria, dependencies
├── pages/                             # Per-page & per-route detailed migration plans
│   ├── page-01-root-shell.md          # Custom 404 / Root Fallback Shell (index.html)
│   ├── page-02-home.md                # Main Hub & Dashboard (home/index.html)
│   ├── page-03-search.md              # Global Search & Directory (search/index.html)
│   ├── page-04-setting.md             # User Preferences & Settings (setting/index.html)
│   ├── page-05-community-hub.md       # Community Hub (community/index.html)
│   ├── page-06-community-contact.md   # Contact Us Form (community/contact/index.html)
│   ├── page-07-community-report.md    # Bug & Issue Report Form (community/report/index.html)
│   ├── page-08-platform-about.md      # Platform About Page (platform/about/index.html)
│   ├── page-09-platform-roadmap.md    # Product Roadmap (platform/roadmap/index.html)
│   ├── page-10-platform-whats-new.md  # Release Notes / What's New (platform/whats_new/index.html)
│   ├── page-11-data-verse-discover.md # Verse Discover Feed (data/verse/discover/index.html)
│   ├── page-12-data-verse-scope.md    # Symbol Scope Detail View (data/verse/scope/index.html)
│   ├── page-13-root-orphans.md        # Legacy Root Orphans Cleanup (beta.html, cn.html, n.html)
│   ├── page-14-template-html-snippets.md # Shared HTML Templates (assets/template-html/)
│   └── page-15-community-worker-routes.md # Edge Worker Routes (POST /report, OPTIONS /report, ALL /*)
└── subsystems/                        # Core Subsystem Architecture & Migration Plans
    ├── data-subsystem.md              # Data Models, Schemas & Validation
    ├── auth-subsystem.md              # Security, Headers, CORS & CAPTCHA
    ├── api-subsystem.md               # API Client & Worker Endpoint Architecture
    ├── ui-subsystem.md                # Component Architecture, Tokens & Accessibility
    ├── state-subsystem.md             # Client State, i18n & Local Storage
    └── build-ci-subsystem.md          # Vite Bundler, SSG Pipeline, Vitest & CI/CD
```
