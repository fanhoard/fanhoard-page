# FanHoard Redesign Task Breakdown & Execution Plan

**Status:** APPROVED & AUTHORITATIVE  
**Target Repository:** `github.com/fanhoard/fanhoard-page`  
**Authoritative Reference:** `docs/design/TASK-BREAKDOWN.md`  
**Upstream Specs:** `docs/design/MASTER-PLAN.md`, `docs/design/DIRECTION.md`  

---

## Sub-Agent Sizing & Safety Rules

All sub-agent execution workers MUST strictly adhere to the following mandatory workspace and execution protocols:

1. **Mandatory Clone Workspace Rule**:
   - Sub-agents MUST clone the repository into `/tmp/fh-<chunk-id>` (e.g., `/tmp/fh-exec-tokens`) using `mkdir -p` first.
   - Sub-agents MUST NEVER clone, reset, modify, or write anywhere under `/app`. The `/app` directory is the coordinator's live workspace holding agent system state. Reading `/app` files for context is permitted.
2. **Mandatory Quality Gate**:
   - Before pushing any git commit to `main`, sub-agents MUST run and verify:
     1. `npm install` (if dependencies updated)
     2. `npm run build` (all 32 HTML pages build in <1s with 0 errors)
     3. `npm run validate` (all 57 JSON schema manifests pass with 0 errors)
     4. `npx vitest run` (all unit and integration tests green)
3. **Size Guard & Partial-Push Protocol**:
   - Each chunk is strictly bounded to a single page surface or a maximum of 3 files.
   - If a sub-agent approaches token/file limits or context limits during execution, it MUST:
     1. Verify the current partial state passes `build`, `validate`, and `vitest`.
     2. Commit conventionally and push the green partial progress to `main` via `https://$GITHUB_ACCESS_TOKEN@github.com/fanhoard/fanhoard-page.git`.
     3. Record the exact status, pushed commit hash, completed files, and remaining unexecuted scope in `manage_goal_task(action="update", status="blocked", result=...)`.
     4. The coordinator will spawn a follow-up sub-agent task to complete the remaining work.
4. **Conventional Commit Standard**:
   - All git commits MUST follow conventional commit format with appropriate scope: `feat(tokens): ...`, `refactor(zindex): ...`, `fix(fouc): ...`, `refactor(footer): ...`, `style(shell): ...`, `feat(page-search): ...`.
5. **No External Contact Capabilities**:
   - Sub-agents hold workspace execution tools only. They must not attempt to contact outside parties or look for connector tools.

---

## 16 Bounded Execution Chunks

```
                             ┌────────────────┐
                             │  exec-tokens   │
                             └───────┬────────┘
                                     │
                             ┌───────▼────────┐
                             │  exec-zindex   │
                             └───────┬────────┘
                                     │
                             ┌───────▼────────┐
                             │   exec-fouc    │
                             └───────┬────────┘
                                     │
                             ┌───────▼────────┐
                             │  exec-footer   │
                             └───────┬────────┘
                                     │
                             ┌───────▼────────┐
                             │   exec-shell   │
                             └───────┬────────┘
                                     │
    ┌────────────────┬───────────────┼───────────────┬────────────────┐
    │                │               │               │                │
┌───▼────────┐ ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐   ┌─────▼──────┐
│exec-page-  │ │exec-page-  │  │exec-page-  │  │exec-page-  │   │exec-page-  │
│index       │ │home        │  │search      │  │setting     │   │community-  │
└────────────┘ └────────────┘  └────────────┘  └────────────┘   │hub         │
                                                                └────────────┘
    ┌────────────────┬───────────────┼───────────────┬────────────────┐
    │                │               │               │                │
┌───▼────────┐ ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐   ┌─────▼──────┐
│exec-page-  │ │exec-page-  │  │exec-page-  │  │exec-page-  │   │exec-page-  │
│community-  │ │about       │  │roadmap     │  │whatsnew    │   │discover    │
│forms       │ └────────────┘  └────────────┘  └────────────┘   └────────────┘
└────────────┘
                                     │
                             ┌───────▼────────┐
                             │   exec-page-   │
                             │     scope      │
                             └────────────────┘
```

---

### Foundation Chunks (Chunks 1–5)

#### Chunk 1: `exec-tokens`
- **Description**: Rewrite `assets/css/tokens.css` to establish the single source of truth for the FanHoard design token system. Define full semantic color palettes for light and dark modes (primary interactive teal `#0d9488` light / `#2dd4bf` dark), fluid minor-third typography scale (`--step--1` through `--step-5`), 4px baseline spacing scale (`--space-1` to `--space-16`), motion tokens with `@media (prefers-reduced-motion)` guards, and the 8-tier z-index scale (`0` to `700`).
- **Exact Files Touched**:
  1. `assets/css/tokens.css`
  2. `assets/css/variables.css`
- **Estimated Effort**: Small (1.5 hours)
- **Dependencies**: None (Foundation Chunk 1)
- **Done Criteria**:
  - `assets/css/tokens.css` contains all custom properties defined in `docs/design/DIRECTION.md`.
  - Contrast of `--color-brand-primary` (`#0d9488`) on light surfaces is ≥4.5:1 (4.88:1 actual).
  - Dark mode token mappings function via `@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

#### Chunk 2: `exec-zindex`
- **Description**: Standardize stacking contexts across CSS and JS files to enforce the 8-tier z-index scale (`0` to `700`). Eliminate escalated arbitrary z-index declarations (`1,500,000` in `copyNotification.js`, `99999` in `home.css`, `17500` in `loading-system.css`, and `16000–19000` legacy tokens).
- **Exact Files Touched**:
  1. `assets/css/popup.css`
  2. `assets/css/loading-system.css`
  3. `assets/js/copyNotification.js`
- **Estimated Effort**: Small (1 hour)
- **Dependencies**: `exec-tokens`
- **Done Criteria**:
  - Maximum z-index across touched files is `700` (`var(--z-toast)`).
  - Zero hardcoded numeric z-index values exceeding 700 in `popup.css`, `loading-system.css`, or `copyNotification.js`.
  - Modals, overlays, toasts, and loading spinners stack correctly without visual clipping.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

#### Chunk 3: `exec-fouc`
- **Description**: Implement the `.is-loaded` CSS transition pattern and eliminate render-blocking inline `<body style="opacity:0">` declarations across primary pages. Add JavaScript loading trigger in `assets/js/modern-navigation.js` on `DOMContentLoaded` with a 150ms timeout safety fallback and `<noscript>` guard.
- **Exact Files Touched**:
  1. `assets/js/modern-navigation.js`
  2. `home/index.html`
  3. `setting/index.html`
- **Estimated Effort**: Small (1.5 hours)
- **Dependencies**: `exec-zindex`
- **Done Criteria**:
  - `home/index.html` and `setting/index.html` no longer contain `style="opacity:0"`.
  - Body transitions opacity smoothly via `.is-loaded` class without FOUC/FOIT.
  - Page renders immediately when JavaScript is disabled (`<noscript>`).
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

#### Chunk 4: `exec-footer`
- **Description**: Purge all 193 `!important` declarations from `assets/css/footer.css` by rewriting it into a clean, token-based component CSS. Fix `assets/js/footer-template.js` where focusable navigation links (`<a>`) were incorrectly enclosed inside `aria-hidden="true"` parent containers. Update footer text contrast to WCAG AA standard.
- **Exact Files Touched**:
  1. `assets/css/footer.css`
  2. `assets/js/footer-template.js`
  3. `assets/template-html/footer-template.html`
- **Estimated Effort**: Medium (2 hours)
- **Dependencies**: `exec-fouc`
- **Done Criteria**:
  - `assets/css/footer.css` contains exactly 0 `!important` declarations.
  - Footer navigation links are accessible to screen readers (`aria-hidden="true"` trap eliminated).
  - Footer copyright and sub-link text achieves ≥4.5:1 contrast against dark slate background.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

#### Chunk 5: `exec-shell`
- **Description**: Standardize shared shell styles in `assets/css/nav-core.css`, `assets/css/top-navigation-bar.css`, and `assets/js/modern-navigation.js`. Upgrade shell controls to WCAG AA contrast (`.btn-primary` `#0d9488`, `.badge` text contrast). Fix navigation ARIA role structure (`role="menuitem"` without parent `role="menu"` removed).
- **Exact Files Touched**:
  1. `assets/css/nav-core.css`
  2. `assets/css/top-navigation-bar.css`
  3. `assets/js/modern-navigation.js`
- **Estimated Effort**: Medium (2 hours)
- **Dependencies**: `exec-footer`
- **Done Criteria**:
  - Shell CSS files contain 0 `!important` declarations.
  - Shell buttons (`.btn-primary`) and badges achieve ≥4.5:1 contrast in light and dark themes.
  - Menu ARIA hierarchy fixed in `modern-navigation.js`.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

### Page Redesign Chunks (Chunks 6–16)

#### Chunk 6: `exec-page-index`
- **Description**: Redesign `index.html` (Landing / 404 Portal) body in Persuade surface mode. Apply tokenized styling, inject top skip link `<a href="#main" class="skip-link">`, wrap portal content in semantic `<main id="main">` landmark, and verify WCAG AA contrast on CTA controls.
- **Exact Files Touched**:
  1. `index.html`
- **Estimated Effort**: Small (1 hour)
- **Dependencies**: `exec-shell`
- **Done Criteria**:
  - `index.html` includes top skip link and `<main id="main">` landmark tag.
  - Primary CTA button `.btn-primary` achieves 4.88:1 contrast using `--color-brand-primary` (`#0d9488`).
  - Landing page renders crisply in both English and secondary locale builds.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

#### Chunk 7: `exec-page-home`
- **Description**: Redesign `home/index.html` (Fan Hub Dashboard) body in Persuade surface mode. Replace hardcoded hex colors and mixed spacing units in `assets/css/home.css` with semantic tokens. Tokenize dashboard card background, border, and shadow properties. Ensure FOUC fix remains intact.
- **Exact Files Touched**:
  1. `home/index.html`
  2. `assets/css/home.css`
- **Estimated Effort**: Medium (2 hours)
- **Dependencies**: `exec-shell`
- **Done Criteria**:
  - `home.css` uses semantic design tokens for all card colors, borders, and margins.
  - Dashboard card grid is fully responsive with `--space-6` (24px) gap.
  - Bilingual routes (`/home/index.html`) build and validate with 0 errors.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

#### Chunk 8: `exec-page-search`
- **Description**: Redesign `search/index.html` body in Operate surface mode. Migrate responsive search layout rules into `assets/css/search.css` using CSS Container Queries (`@container`). Remove stylesheet import and delete `assets/css/search-compact-overrides.css` (29.5 KB). Add visible focus rings and ARIA live status region for search result counter.
- **Exact Files Touched**:
  1. `search/index.html`
  2. `assets/css/search.css`
  3. `assets/css/search-compact-overrides.css` (DELETED)
- **Estimated Effort**: Large (2.5 hours)
- **Dependencies**: `exec-shell`
- **Done Criteria**:
  - `assets/css/search-compact-overrides.css` is completely deleted from the repo.
  - Responsive search card states handled via `@container` queries in `search.css`.
  - Search inputs feature visible focus rings and `aria-live="polite"` result counter.
  - `search-system.test.js` and all Vitest/Playwright tests pass green.

---

#### Chunk 9: `exec-page-setting`
- **Description**: Redesign `setting/index.html` body in Operate surface mode. Tokenize settings preference card layout. Remediate `#auto-update-switch` ARIA accessibility bug (remove `aria-hidden="true"` and `display:none`; add custom switch control with `role="switch"` and explicit `<label for="auto-update-switch">`). Strip all 10 inline `style="..."` attributes from HTML. Replace non-performant `transition: all` in `setting.css`.
- **Exact Files Touched**:
  1. `setting/index.html`
  2. `assets/css/setting.css`
- **Estimated Effort**: Medium (2 hours)
- **Dependencies**: `exec-shell`
- **Done Criteria**:
  - `#auto-update-switch` is fully operable via keyboard and accessible to screen readers.
  - Zero inline styles remain in `setting/index.html`.
  - Preferences state changes persist accurately.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

#### Chunk 10: `exec-page-community-hub`
- **Description**: Redesign `community/index.html` (Community Hub) body in Read surface mode. Tokenize resource tile layout, strip inline `style="..."` attributes, inject `<main id="main">` landmark tag, add top skip link, and ensure smooth FOUC-free loading.
- **Exact Files Touched**:
  1. `community/index.html`
- **Estimated Effort**: Small (1 hour)
- **Dependencies**: `exec-shell`
- **Done Criteria**:
  - `community/index.html` wraps contents in `<main id="main">` and includes skip link.
  - Zero inline styles remain in HTML markup.
  - Community hub cards render with tokenized surface colors and shadows.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

#### Chunk 11: `exec-page-community-forms`
- **Description**: Redesign `community/contact/index.html` and `community/report/index.html` form bodies in Read/Operate surface mode. Add explicit `<label for="...">` associations for all form fields (`#report-page-custom` and contact inputs). Strip inline styles. Fix sub-nav muted text contrast (≥4.5:1). Replace empty `<h1>` SSG nodes with static headings.
- **Exact Files Touched**:
  1. `community/contact/index.html`
  2. `community/report/index.html`
  3. `assets/css/report.css`
- **Estimated Effort**: Medium (2 hours)
- **Dependencies**: `exec-shell`
- **Done Criteria**:
  - All form controls in both contact and report pages have explicit label bindings.
  - Sub-navigation text achieves ≥4.5:1 WCAG AA contrast.
  - Form submission functionality and Playwright E2E specs (`report.spec.js`) pass green.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

#### Chunk 12: `exec-page-about`
- **Description**: Redesign `platform/about/index.html` body in Persuade surface mode. Tokenize story narrative layout and ecosystem metrics cards. Fix hardcoded dark background rules in `assets/css/about.css` that broke light theme rendering. Inject `<main id="main">` landmark tag and skip link.
- **Exact Files Touched**:
  1. `platform/about/index.html`
  2. `assets/css/about.css`
- **Estimated Effort**: Small (1.5 hours)
- **Dependencies**: `exec-shell`
- **Done Criteria**:
  - About page renders seamlessly in both light and dark theme modes.
  - FOUC/FOIT eliminated; page loading smooth.
  - Landmark `<main id="main">` and skip link present.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

#### Chunk 13: `exec-page-roadmap`
- **Description**: Redesign `platform/roadmap/index.html` body in Read surface mode. Tokenize milestone timeline, replacing 17 hardcoded hex colors in `assets/css/roadmap.css` with semantic variables. Inject missing `<main id="main">` landmark tag and top skip link. Tokenize timeline vertical spine (`2px solid var(--border-subtle)`).
- **Exact Files Touched**:
  1. `platform/roadmap/index.html`
  2. `assets/css/roadmap.css`
- **Estimated Effort**: Medium (1.5 hours)
- **Dependencies**: `exec-shell`
- **Done Criteria**:
  - Roadmap timeline spine and milestone cards use semantic tokens.
  - `<main id="main">` landmark tag and skip link present.
  - Milestone badges achieve ≥4.5:1 contrast in light and dark modes.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

#### Chunk 14: `exec-page-whatsnew`
- **Description**: Redesign `platform/whats_new/index.html` body in Read surface mode. Upgrade header banner subtitle text contrast from 2.32:1 to `--text-muted` (≥4.5:1). Strip all inline `style="..."` attributes from HTML. Eliminate dark mode background color leaks where dark container styles leaked into light theme.
- **Exact Files Touched**:
  1. `platform/whats_new/index.html`
- **Estimated Effort**: Small (1 hour)
- **Dependencies**: `exec-shell`
- **Done Criteria**:
  - Header banner subtitle text satisfies WCAG AA contrast (≥4.5:1).
  - Zero inline style attributes remain in `platform/whats_new/index.html`.
  - Zero dark mode background color leaks in light theme mode.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

#### Chunk 15: `exec-page-discover`
- **Description**: Redesign `data/verse/discover/index.html` body in Operate surface mode. Apply tokenized symbol catalog grid styling. Add `aria-live="polite"` and `aria-busy="true"` status attributes to boot loading spinner. Remove `aria-hidden="true"` from symbol card character container (`.scc`) in `assets/js/search-modules/rendering.js:113` so screen readers can announce symbol characters.
- **Exact Files Touched**:
  1. `data/verse/discover/index.html`
  2. `assets/js/search-modules/rendering.js`
- **Estimated Effort**: Small (1.5 hours)
- **Dependencies**: `exec-shell`
- **Done Criteria**:
  - Boot loading spinner features `aria-live="polite"` status region.
  - Symbol card characters (`.scc`) are accessible to screen readers (`aria-hidden` removed).
  - Virtualized symbol list rendering remains fast and performant.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

#### Chunk 16: `exec-page-scope`
- **Description**: Redesign `data/verse/scope/index.html` body in Read surface mode. Tokenize scope detail viewer card and monospace metadata grid (`--font-mono`). Inject missing `<main id="main">` landmark tag around scope viewer card. Add top skip link and fix heading hierarchy by adding `<h2>` headings for detail sections.
- **Exact Files Touched**:
  1. `data/verse/scope/index.html`
  2. `assets/css/modern-styles.css`
- **Estimated Effort**: Small (1 hour)
- **Dependencies**: `exec-shell`
- **Done Criteria**:
  - Scope viewer wraps content in `<main id="main">` landmark and includes skip link.
  - Section headings use proper semantic `<h2>` hierarchy.
  - Code and metadata viewer blocks legible with tokenized fonts and colors.
  - `npm run build`, `npm run validate`, and `npx vitest run` pass green.

---

## Execution Chunk Summary Table

| Chunk ID | Name / Scope | Files Touched | Effort | Upstream Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| `exec-tokens` | Design Token System | `tokens.css`, `variables.css` | Small (1.5h) | None |
| `exec-zindex` | Z-Index Standardization | `popup.css`, `loading-system.css`, `copyNotification.js` | Small (1.0h) | `exec-tokens` |
| `exec-fouc` | FOUC / Loading Pattern | `modern-navigation.js`, `home/index.html`, `setting/index.html` | Small (1.5h) | `exec-zindex` |
| `exec-footer` | Footer Purge & Modernize | `footer.css`, `footer-template.js`, `footer-template.html` | Medium (2.0h) | `exec-fouc` |
| `exec-shell` | Shell Components & Nav | `nav-core.css`, `top-navigation-bar.css`, `modern-navigation.js` | Medium (2.0h) | `exec-footer` |
| `exec-page-index` | Landing / 404 Page | `index.html` | Small (1.0h) | `exec-shell` |
| `exec-page-home` | Fan Hub Dashboard | `home/index.html`, `home.css` | Medium (2.0h) | `exec-shell` |
| `exec-page-search` | Search Interface | `search/index.html`, `search.css`, delete `search-compact-overrides.css` | Large (2.5h) | `exec-shell` |
| `exec-page-setting` | Settings Panel | `setting/index.html`, `setting.css` | Medium (2.0h) | `exec-shell` |
| `exec-page-community-hub` | Community Hub | `community/index.html` | Small (1.0h) | `exec-shell` |
| `exec-page-community-forms` | Community Contact & Report | `community/contact/index.html`, `community/report/index.html`, `report.css` | Medium (2.0h) | `exec-shell` |
| `exec-page-about` | About Story Page | `platform/about/index.html`, `about.css` | Small (1.5h) | `exec-shell` |
| `exec-page-roadmap` | Milestone Roadmap | `platform/roadmap/index.html`, `roadmap.css` | Medium (1.5h) | `exec-shell` |
| `exec-page-whatsnew` | Changelog / Release Log | `platform/whats_new/index.html` | Small (1.0h) | `exec-shell` |
| `exec-page-discover` | Symbol Discover Catalog | `data/verse/discover/index.html`, `rendering.js` | Small (1.5h) | `exec-shell` |
| `exec-page-scope` | Detail Scope Viewer | `data/verse/scope/index.html`, `modern-styles.css` | Small (1.0h) | `exec-shell` |

