# HTML Structure & Layout Architecture Assessment
**FanHoard Main Website (`fanhoard-page`)**  
**Document Code:** `docs/design/layout/01-html-structure.md`  
**Date:** September 2026  
**Status:** Completed & Green (`npm run build` verified)

---

## 1. Executive Summary

This document provides a deep, file-first HTML-structure and layout-architecture assessment of the FanHoard main website (`fanhoard/fanhoard-page`). The codebase consists of 16 source HTML files across 12 distinct page groups that build via a Vite + TypeScript Static Site Generator (SSG) pipeline into 32 localized output pages (`/dist/en/` and `/dist/th/`).

### Key Findings & Structural Debt

1. **Inconsistent Shell Scaffolding & Main Landmarks**:
   - **4 Different Main IDs**: Pages alternate between `<main id="fv-main">` (`home/`, `setting/`, `community/report`, `discover`), `<main id="main">` (`404`, `community/index`, `community/contact`, `about`, `roadmap`, `whats_new`, `scope`), and `<main id="searchResults">` (`search/`).
   - **Incomplete Page Shell Wrapping**: While 8 page groups utilize `<div class="fv-page-shell">`, 4 page groups (`index.html`, `search/`, `community/contact`, `data/verse/discover`) omit `.fv-page-shell` entirely, resulting in inconsistent outer padding and layout boundaries.
   - **Skip Link Inconsistencies**: Skip links target `#fv-main`, `#main`, or `#searchResults` depending on the page. Furthermore, 5 non-home pages (`about`, `roadmap`, `whats_new`, `discover`, `scope`) contain copy-pasted `data-translate="home-skip-link"` attributes.

2. **Fragmented Navigation & Header Systems**:
   - **4 Top Nav Implementations**:
     - Fixed Subpage Header: Fixed `<nav>` bar importing `top-navigation-bar.css` (`setting/`, `community/`, `platform/`, `scope`).
     - Dynamic Layer Header: `<div id="fv-nav-layer">` (`home/`).
     - Custom Search Header: `<header class="search-header">` with integrated sticky filter bar (`search/`).
     - Custom Banner Header: `<header role="banner">` with tabbed `<nav>` (`discover`).
   - **Nav Overlap Defect**: Subpages using `top-navigation-bar.css` define `position: fixed` with a height of `var(--fv-nav-top-h)` without applying uniform top margins or scroll offsets to `<main>`, causing content overlap.

3. **Total Bypass of Shared Layout Utilities**:
   - Although `tokens.css` imports `base.css` and `layout.css`, the layout utility classes defined in `layout.css` (`.container-narrow`, `.grid-2`, `.grid-3`, `.grid-4`, `.grid-auto-fit`, `.shell-header`) are almost completely unused across the site.
   - Pages rely heavily on ad-hoc, unstandardized utility classes such as `.m5` (margin/padding wrapper), `.w` (card wrapper), `.pad` (padding wrapper), `.con` (container section), `.hio`, and `.hub-actions`.

4. **Semantic HTML & Accessibility Gaps**:
   - **Navigation Buttons**: `community/index` and `community/contact` use `<button onclick="window.location.href='...'">` for page navigation instead of semantic `<a>` links.
   - **Screen-Reader-Only Heading Reliance**: 6 page groups (`home/`, `search/`, `setting/`, `community/index`, `whats_new/`, `scope/`) use `<h1 class="fv-sr-only">` without visible top-level headings, or place visible titles inside `<span class="page-title">` inside `<nav>`.

5. **Residual Inline Styles**:
   - Inline styles exist in 8 page groups: GTM `<iframe style="display:none;visibility:hidden">` inside `<noscript>`, manual toggle states (`style="display:none"`), and text alignment overrides (`style="text-align:center;margin:0;"`).

---

## 2. Methodology & Scope

### Environment & Build Verification
- **Sandbox Workspace**: FRESH `/tmp/fh-assess-html`
- **Dependencies**: `npm install` (204 packages installed)
- **SSG Build**: `npm run build` executed successfully.
  - Vite v8.3.0 bundled modules in 0.53s.
  - SSG Pipeline compiled 32 HTML pages (16 EN + 16 TH) in 0.25s.
  - Output directory: `/tmp/fh-assess-html/dist/`

### Page Groups Assessed
The 12 mandatory page groups cover all core user journeys:
1. `index.html` (404 Error Landing)
2. `home/` (`home/index.html`)
3. `search/` (`search/index.html`)
4. `setting/` (`setting/index.html`)
5. `community/index` (`community/index.html`)
6. `community/contact` (`community/contact/index.html`)
7. `community/report` (`community/report/index.html`)
8. `platform/about` (`platform/about/index.html`)
9. `platform/roadmap` (`platform/roadmap/index.html`)
10. `platform/whats_new` (`platform/whats_new/index.html`)
11. `data/verse/discover` (`data/verse/discover/index.html`)
12. `data/verse/scope` (`data/verse/scope/index.html`)

---

## 3. Per-Page Structure Map

### 3.1 `index.html` (404 Error Page)
- **DOM Hierarchy**:
  ```html
  <body>
    <noscript><iframe style="display:none;visibility:hidden">...</iframe></noscript>
    <a href="#main" class="skip-link">Skip to main content</a>
    <main id="main" class="fv-app" data-page="404">
      <div class="wrap">
        <div class="badge">FanHoard</div>
        <h1>404</h1>
        <h2>Oops! Lost your way?</h2>
        <p>...</p>
        <div class="actions">
          <a wave href="/home" class="btn-primary">Take Me Home</a>
          <a wave href="/data/verse/discover/..." class="btn-secondary">Explore FanHoard</a>
        </div>
        <div class="note">...</div>
      </div>
    </main>
  </body>
  ```
- **Landmarks**: `<main id="main">` present. `<header>`, `<nav>`, `<footer>` missing.
- **Outer Shell**: Lacks `<div id="fv-app">` and `<div class="fv-page-shell">`. Uses `<main class="fv-app">` directly.
- **Footer Mount**: Lacks `<div id="fv-footer-mount">`. `footer-template.js` falls back to appending `<footer>` directly to `<body>`.
- **CSS Loaded**: `tokens.css`.
- **Inline Styles**: `1` (GTM iframe in `<noscript>`).
- **Semantic Gaps**: No `<header>` or `<nav>` landmark.
- **Utility CSS Usage**: Uses `.skip-link`, `.btn-primary`, `.btn-secondary`, `.badge` from `base.css`. Custom wrapper `.wrap` bypasses `layout.css`.

---

### 3.2 `home/` (`home/index.html`)
- **DOM Hierarchy**:
  ```html
  <body>
    <a href="#fv-main" class="skip-link fv-skip-link" data-translate="home-skip-link">...</a>
    <div id="fv-app" class="fv-app" data-page="home">
      <h1 class="fv-sr-only" data-translate="home-seo-title">FanHoard — Emoji & Symbols Hub</h1>
      <div id="fv-nav-layer"></div>
      <div class="fv-page-shell">
        <main id="fv-main" class="fv-main">
          <div class="blur-overlay-top"></div>
          <div class="hio"><div class="img-d1"><picture>...</picture></div></div>
          <section class="hero nob">
            <div class="fv-hero-display h1" ...></div>
            <p class="hero-sub">...</p>
            <div class="hero-btns">...</div>
          </section>
          <div class="container">
            <div class="features-grid">
              <section class="feature-card">...</section> (x3)
            </div>
            <div class="faq-grid">
              <div class="faq-card">...</div>
            </div>
          </div>
        </main>
        <div id="fv-footer-mount"></div>
      </div>
    </div>
  </body>
  ```
- **Landmarks**: `<main id="fv-main">` present. `<section>` (x7) present. `<header>`, `<nav>`, `<footer>` absent in static HTML (`#fv-nav-layer` and `#fv-footer-mount` populated dynamically).
- **Outer Shell**: Uses `<div id="fv-app">` -> `<div class="fv-page-shell">` -> `<main id="fv-main">`.
- **Footer Mount**: `<div id="fv-footer-mount">` correctly nested inside `.fv-page-shell`.
- **CSS Loaded**: `tokens.css`, `bg.css`, `home.css`, `back-to-top.css`.
- **Inline Styles**: `0`.
- **Semantic Gaps**: Screen-reader-only `<h1>`. Visible display heading uses `<div class="fv-hero-display h1">`. FAQ items use `<div>` instead of `<details>`/`<summary>` or `<article>`.
- **Utility CSS Usage**: Uses `.container` from `layout.css`. Custom grids (`.features-grid`, `.faq-grid`) bypass `layout.css` grid utilities (`.grid-3`, `.grid-auto-fit`).

---

### 3.3 `search/` (`search/index.html`)
- **DOM Hierarchy**:
  ```html
  <body>
    <a href="#searchResults" class="skip-link fv-skip-link">...</a>
    <h1 class="fv-sr-only">Search Emoji and Symbols — FanHoard</h1>
    <div id="fv-app" class="fv-app" data-page="search">
      <div id="search-sticky">
        <header class="search-header" role="banner">
          <form id="searchForm" role="search">
            <div class="search-input-wrapper">...<input type="search" ... /></div>
            <nav class="search-filters-panel" aria-label="Search filters">
              <div class="filter-pills-row">...</div>
            </nav>
          </form>
        </header>
      </div>
      <main id="searchResults" role="main" aria-live="polite">
        <!-- Dynamic search cards injected by search.js -->
      </main>
    </div>
  </body>
  ```
- **Landmarks**: `<header class="search-header">`, `<nav class="search-filters-panel">`, `<main id="searchResults">`.
- **Outer Shell**: Uses `<div id="fv-app">`. Omits `<div class="fv-page-shell">`.
- **Footer Mount**: Lacks `<div id="fv-footer-mount">`. `footer-template.js` appends `<footer>` to `<body>`.
- **CSS Loaded**: `tokens.css`, `search.css`, `bg.css`, `back-to-top.css`.
- **Inline Styles**: `0`.
- **Semantic Gaps**: Main ID is `searchResults` instead of `fv-main` or `main`. Skip link points to `searchResults`.
- **Utility CSS Usage**: Bypasses `layout.css`. Search grid is dynamically generated in JS with custom CSS in `search.css`.

---

### 3.4 `setting/` (`setting/index.html`)
- **DOM Hierarchy**:
  ```html
  <body>
    <noscript><iframe style="display:none;visibility:hidden">...</iframe></noscript>
    <a href="#fv-main" class="skip-link fv-skip-link">...</a>
    <div id="fv-app" class="fv-app" data-page="setting">
      <h1 class="fv-sr-only">Settings — FanHoard</h1>
      <div class="fv-page-shell">
        <main id="fv-main">
          <p class="fv-section-label" data-translate="page-setting"></p>
          <section>
            <div id="language-selector-container">
              <div class="m5"><div class="w"><button id="language-button" class="tap" ...></button></div></div>
            </div>
            <div class="m5">
              <div class="w">
                <div class="buttons auto-update-toggle" id="auto-update-toggle-btn">
                  <div class="setting-item-inner">...</div>
                </div>
              </div>
            </div>
          </section>
          ...
        </main>
        <div id="fv-footer-mount"></div>
      </div>
    </div>
  </body>
  ```
- **Landmarks**: `<main id="fv-main">`, `<section>` (x4). Lacks `<header>` and `<nav>` elements in static markup despite loading `top-navigation-bar.css`.
- **Outer Shell**: Standard `<div id="fv-app">` -> `<div class="fv-page-shell">` -> `<main id="fv-main">`.
- **Footer Mount**: `<div id="fv-footer-mount">` present.
- **CSS Loaded**: `tokens.css`, `setting.css`, `bg.css`, `top-navigation-bar.css`, Google Fonts (Sofia).
- **Inline Styles**: `1` (GTM iframe).
- **Semantic Gaps**: Top navigation CSS loaded but no `<nav>` bar in HTML. Page label is `<p class="fv-section-label">` rather than `<h2` or `<h1>`. Heavy use of non-semantic nested divs (`.m5 > .w > .buttons`).
- **Utility CSS Usage**: Totally ignores `layout.css`. Uses `.m5` and `.w` wrappers for card styling.

---

### 3.5 `community/index` (`community/index.html`)
- **DOM Hierarchy**:
  ```html
  <body>
    <a href="#main" class="skip-link fv-skip-link">...</a>
    <div id="fv-app" class="fv-app" data-page="contact">
      <h1 class="fv-sr-only">Contact FanHoard</h1>
      <nav aria-label="Page navigation">
        <button class="back-button" id="back-button" aria-label="Go back">...</button>
        <span class="page-title" data-translate="page-contact-main"></span>
      </nav>
      <div class="fv-page-shell">
        <main id="main" class="fv-main">
          <section class="con">
            <p class="fv-section-label" data-translate="contact-main-title"></p>
            <p class="fv-section-desc" data-translate="contact-main-desc"></p>
          </section>
          <div class="pad">
            <section class="hub-actions">
              <button class="buttons m5" onclick="window.location.href='./contact/'" type="button">...</button>
              <button class="buttons" onclick="window.location.href='./report/'" type="button">...</button>
            </section>
          </div>
        </main>
        <div id="fv-footer-mount"></div>
      </div>
    </div>
  </body>
  ```
- **Landmarks**: `<nav>`, `<main id="main">`, `<section>` (x2).
- **Outer Shell**: `<div id="fv-app">` -> `<div class="fv-page-shell">` -> `<main id="main">`. (Note: Main ID is `main`, not `fv-main`).
- **Footer Mount**: `<div id="fv-footer-mount">` present.
- **CSS Loaded**: `tokens.css`, `setting.css`, `bg.css`, `top-navigation-bar.css`.
- **Inline Styles**: `0`.
- **Semantic Gaps**:
  - **Navigation Anti-Pattern**: Navigation options are `<button onclick="window.location.href='...'">` instead of semantic `<a href="...">`.
  - Section titles use `<p class="fv-section-label">` instead of heading tags.
- **Utility CSS Usage**: Bypasses `layout.css`. Uses `.con`, `.pad`, `.m5`, `.buttons`, `.hub-actions`.

---

### 3.6 `community/contact` (`community/contact/index.html`)
- **DOM Hierarchy**:
  ```html
  <body>
    <a href="#main" class="skip-link fv-skip-link">...</a>
    <nav aria-label="Page navigation">
      <button class="back-button" id="back-button">...</button>
      <span class="page-title" data-translate="page-contact">Contact</span>
    </nav>
    <main id="main" class="fv-main">
      <section class="con">
        <h1 class="fv-section-label" data-translate="contact-other-title">Contact Us</h1>
        <p class="fv-section-desc" data-translate="contact-other-desc">...</p>
      </section>
      <div class="pad">
        <div class="setting-item">
          <label for="contact-method">Contact Method</label>
          <section><select id="contact-method" class="setting-item select">...</select></section>
        </div>
        <div class="setting-item" id="contact-form-section" style="display:none;">...</div>
        <div class="setting-item" id="gmail-section">
          ...
          <button id="goto-gmail-btn" onclick="window.location.href='mailto:...'" class="buttons tap">...</button>
        </div>
      </div>
    </main>
  </body>
  ```
- **Landmarks**: `<nav>`, `<main id="main">`, `<section>` (x4).
- **Outer Shell**: **MISSING BOTH `<div id="fv-app">` AND `<div class="fv-page-shell">`**.
- **Footer Mount**: **MISSING `<div id="fv-footer-mount">`**.
- **CSS Loaded**: `tokens.css`, `setting.css`, `bg.css`, `top-navigation-bar.css`.
- **Inline Styles**: `1` (`style="display:none;"` on `#contact-form-section`).
- **Semantic Gaps**: Lacks outer app shell and page shell wrappers. Uses `<button onclick="location.href='mailto:...'">` for an email link.
- **Utility CSS Usage**: Bypasses `layout.css`. Uses `.con`, `.pad`, `.setting-item`, `.select`, `.m5`.

---

### 3.7 `community/report` (`community/report/index.html`)
- **DOM Hierarchy**:
  ```html
  <body>
    <a href="#fv-main" class="skip-link fv-skip-link">...</a>
    <div id="fv-app" class="fv-app" data-page="report">
      <nav aria-label="Page navigation">
        <button class="back-button" id="back-button">...</button>
        <span class="page-title" data-translate="page-report">Report an Issue</span>
      </nav>
      <h1 class="fv-sr-only" data-translate="page-report">Report an Issue</h1>
      <div class="fv-page-shell">
        <main id="fv-main">
          <section>
            <div class="m5"><div class="w">
              <p class="fv-section-label" data-translate="report-new-title"></p>
              <p class="report-desc" data-translate="report-new-desc"></p>
            </div></div>
          </section>
          <section>
            <form id="report-form">
              <div class="setting-item"><label>...</label><input class="report-textinput" ... /></div>
              <div class="setting-item"><label>...</label><select class="setting-item select">...</select></div>
              <div class="setting-item"><label>...</label><textarea class="report-textarea" ...></textarea></div>
              <div id="status-container" style="text-align:center;margin:0;"></div>
              <button type="submit" class="report-submit">Submit</button>
            </form>
          </section>
        </main>
        <div id="fv-footer-mount"></div>
      </div>
    </div>
  </body>
  ```
- **Landmarks**: `<nav>`, `<main id="fv-main">`, `<section>` (x2).
- **Outer Shell**: `<div id="fv-app">` -> `<div class="fv-page-shell">` -> `<main id="fv-main">`.
- **Footer Mount**: `<div id="fv-footer-mount">` present.
- **CSS Loaded**: `tokens.css`, `setting.css`, `bg.css`, `top-navigation-bar.css`, `report.css`.
- **Inline Styles**: `1` (`style="text-align:center;margin:0;"` on `#status-container`).
- **Semantic Gaps**: Heading `<h1>` is screen-reader-only. Form container uses `.setting-item` class designed for setting rows.
- **Utility CSS Usage**: Bypasses `layout.css`. Uses `.m5`, `.w`, `.setting-item`, `.report-textarea`.

---

### 3.8 `platform/about` (`platform/about/index.html`)
- **DOM Hierarchy**:
  ```html
  <body>
    <a href="#main" class="skip-link fv-skip-link" data-translate="home-skip-link">...</a>
    <noscript><iframe style="display:none;visibility:hidden">...</iframe></noscript>
    <div id="fv-app" class="fv-app" data-page="about">
      <nav aria-label="Page navigation">
        <button class="back-button" id="back-button">...</button>
        <span class="page-title" data-translate="page-about"></span>
      </nav>
      <div class="fv-page-shell">
        <main id="main">
          <h1 class="page-title-about">About FanHoard</h1>
          <section class="section" aria-labelledby="about-concept">
            <h2 class="title" id="about-concept" data-translate="1title"></h2>
            <p class="content" data-translate="1content"></p>
          </section>
          <section class="section" aria-labelledby="about-license">
            <h2 class="title" id="about-license" data-translate="2title"></h2>
            <p class="content" data-translate="2content"></p>
          </section>
        </main>
        <div id="fv-footer-mount"></div>
      </div>
    </div>
  </body>
  ```
- **Landmarks**: `<nav>`, `<main id="main">`, `<section>` (x2).
- **Outer Shell**: `<div id="fv-app">` -> `<div class="fv-page-shell">` -> `<main id="main">`.
- **Footer Mount**: `<div id="fv-footer-mount">` present.
- **CSS Loaded**: `tokens.css`, `bg.css`, `about.css`, `top-navigation-bar.css`, Google Fonts (Sofia).
- **Inline Styles**: `1` (GTM iframe).
- **Semantic Gaps**:
  - Skip link contains copy-pasted `data-translate="home-skip-link"`.
  - Main ID is `main` instead of `fv-main`.
- **Utility CSS Usage**: Bypasses `layout.css`. Custom `.section`, `.title`, `.content` classes in `about.css`.

---

### 3.9 `platform/roadmap` (`platform/roadmap/index.html`)
- **DOM Hierarchy**:
  ```html
  <body>
    <a href="#main" class="skip-link fv-skip-link" data-translate="home-skip-link">...</a>
    <noscript><iframe style="display:none;visibility:hidden">...</iframe></noscript>
    <div id="fv-app" class="fv-app" data-page="roadmap">
      <nav aria-label="Page navigation">
        <button class="back-button" id="back-button">...</button>
        <span class="page-title" data-translate="page-planned-features"></span>
      </nav>
      <div class="fv-page-shell">
        <main id="main">
          <div class="container">
            <div class="roadmap-header">
              <div class="roadmap-version-badge" id="version-badge-display">...</div>
              <h1 class="roadmap-title" data-translate="roadmap_title">Planned Features</h1>
              <p class="roadmap-subtitle" data-translate="roadmap_desc">...</p>
            </div>
            <section id="features" aria-label="Feature list">
              <!-- Dynamic roadmap feature list injected by JS -->
            </section>
          </div>
        </main>
        <div id="fv-footer-mount"></div>
      </div>
    </div>
  </body>
  ```
- **Landmarks**: `<nav>`, `<main id="main">`, `<section id="features">`.
- **Outer Shell**: `<div id="fv-app">` -> `<div class="fv-page-shell">` -> `<main id="main">`.
- **Footer Mount**: `<div id="fv-footer-mount">` present.
- **CSS Loaded**: `tokens.css`, `bg.css`, `roadmap.css`, `top-navigation-bar.css`.
- **Inline Styles**: `1` (GTM iframe).
- **Semantic Gaps**: Skip link contains copy-pasted `data-translate="home-skip-link"`.
- **Utility CSS Usage**: Uses `.container` class inside `<main>`, but `roadmap.css` redefines `.container` margins and padding, bypassing `layout.css`.

---

### 3.10 `platform/whats_new` (`platform/whats_new/index.html`)
- **DOM Hierarchy**:
  ```html
  <body>
    <a href="#main" class="skip-link fv-skip-link" data-translate="home-skip-link">...</a>
    <noscript><iframe style="display:none;visibility:hidden">...</iframe></noscript>
    <div id="fv-app" class="fv-app" data-page="whats-new">
      <nav aria-label="Page navigation">
        <button class="back-button" id="back-button">...</button>
        <span class="page-title"><span data-translate="page-What's-New"></span></span>
      </nav>
      <div class="fv-page-shell">
        <main id="main">
          <h1 class="fv-sr-only">What's New in FanHoard — Release Notes</h1>
          <div class="wn-header-banner" aria-hidden="true">...</div>
          <section id="whats-new-container" aria-label="Release notes">
            <!-- Dynamic release notes injected by whats_new.js -->
          </section>
        </main>
        <div id="fv-footer-mount"></div>
      </div>
    </div>
  </body>
  ```
- **Landmarks**: `<nav>`, `<main id="main">`, `<section id="whats-new-container">`.
- **Outer Shell**: `<div id="fv-app">` -> `<div class="fv-page-shell">` -> `<main id="main">`.
- **Footer Mount**: `<div id="fv-footer-mount">` present.
- **CSS Loaded**: `tokens.css`, `bg.css`, `new.css`, `top-navigation-bar.css`.
- **Inline Styles**: `1` (GTM iframe).
- **Semantic Gaps**:
  - Skip link contains copy-pasted `data-translate="home-skip-link"`.
  - Visible title is rendered inside a decorative banner (`.wn-header-banner`) rather than standard heading markup.
- **Utility CSS Usage**: Bypasses `layout.css`. Uses custom `new.css` layout rules.

---

### 3.11 `data/verse/discover` (`data/verse/discover/index.html`)
- **DOM Hierarchy**:
  ```html
  <body>
    <a href="#fv-main" class="skip-link fv-skip-link" data-translate="home-skip-link">...</a>
    <div id="fv-boot-loader" role="status">...</div>
    <div id="fv-app" class="fv-app" data-page="discover">
      <h1 class="fv-sr-only">Discover Emoji and Symbols — FanHoard</h1>
      <header role="banner">
        <div class="fv-discover-header">
          <a href="/home" class="fv-discover-logo">...</a>
          <nav aria-label="Content type navigation">...</nav>
        </div>
      </header>
      <main id="fv-main" role="main">
        <div id="category-nav" class="fv-cat-nav">...</div>
        <div id="discover-grid" class="fv-discover-grid">...</div>
        <div id="empty-state" class="fv-empty-state" style="display:none">...</div>
      </main>
    </div>
  </body>
  ```
- **Landmarks**: `<header role="banner">`, `<nav>`, `<main id="fv-main">`.
- **Outer Shell**: Uses `<div id="fv-app">`. **MISSING `<div class="fv-page-shell">`**.
- **Footer Mount**: **MISSING `<div id="fv-footer-mount">`**.
- **CSS Loaded**: `tokens.css`, `loading.css`, `nav-core.css`, `nav-core-ext.css`, `bg.css`, `back-to-top.css`.
- **Inline Styles**: `2` (GTM iframe + `style="display:none"` on `#empty-state`).
- **Semantic Gaps**: Skip link contains copy-pasted `data-translate="home-skip-link"`. Lacks page shell and footer mount point.
- **Utility CSS Usage**: Bypasses `layout.css`. Custom header and category navigation in `nav-core.css`.

---

### 3.12 `data/verse/scope` (`data/verse/scope/index.html`)
- **DOM Hierarchy**:
  ```html
  <body>
    <a href="#main" class="skip-link fv-skip-link" data-translate="home-skip-link">...</a>
    <div id="fv-app" class="fv-app" data-page="scope">
      <h1 class="fv-sr-only">Scope Detail Viewer</h1>
      <nav aria-label="Page navigation">
        <button class="back-button" id="back-button">...</button>
        <span class="page-title">Scope Viewer</span>
      </nav>
      <div class="fv-page-shell">
        <main id="main" class="fv-main">
          <div class="scope-shell">
            <section class="scope-card">
              <h2 class="scope-section-heading">Scope Overview</h2>
              <div class="scope-metadata-grid">...</div>
            </section>
            <section class="scope-card">
              <h2 class="scope-section-heading">Schema & Properties</h2>
              ...
            </section>
          </div>
        </main>
        <div id="fv-footer-mount"></div>
      </div>
    </div>
  </body>
  ```
- **Landmarks**: `<nav>`, `<main id="main">`, `<section class="scope-card">` (x2).
- **Outer Shell**: `<div id="fv-app">` -> `<div class="fv-page-shell">` -> `<main id="main">`.
- **Footer Mount**: `<div id="fv-footer-mount">` present.
- **CSS Loaded**: `tokens.css`, `bg.css`, `top-navigation-bar.css`, `modern-styles.css`.
- **Inline Styles**: `0`.
- **Semantic Gaps**:
  - Main tag has `id="main" class="fv-main"`, but skip link points to `#main`.
  - Skip link contains copy-pasted `data-translate="home-skip-link"`.
- **Utility CSS Usage**: Bypasses `layout.css`. Scope cards use custom grid layout in `modern-styles.css`.

---

## 4. Structural Inconsistency Matrix

| Page Group | Outer Shell (`#fv-app`) | Page Shell (`.fv-page-shell`) | Main Landmark ID | Header / Nav Implementation | Footer Mount (`#fv-footer-mount`) | Skip Link Target | Heading Strategy |
| :--- | :---: | :---: | :---: | :--- | :---: | :---: | :--- |
| **`index.html`** | `class="fv-app"` on `<main>` | ❌ No | `#main` | ❌ None | ❌ No | `#main` | Visible `<h1>404` |
| **`home/`** | ✅ Yes | ✅ Yes | `#fv-main` | `#fv-nav-layer` (Dynamic) | ✅ Yes | `#fv-main` | Sr-only `<h1>` + Hero display |
| **`search/`** | ✅ Yes | ❌ No | `#searchResults` | Sticky Header + Filters Nav | ❌ No | `#searchResults` | Sr-only `<h1>` |
| **`setting/`** | ✅ Yes | ✅ Yes | `#fv-main` | Nav CSS loaded, no HTML `<nav>` | ✅ Yes | `#fv-main` | Sr-only `<h1>` |
| **`community/index`** | ✅ Yes | ✅ Yes | `#main` | `<nav>` with Back Button | ✅ Yes | `#main` | Sr-only `<h1>` |
| **`community/contact`** | ❌ No | ❌ No | `#main` | `<nav>` with Back Button | ❌ No | `#main` | Visible `<h1>` in `<section>` |
| **`community/report`** | ✅ Yes | ✅ Yes | `#fv-main` | `<nav>` with Back Button | ✅ Yes | `#fv-main` | Sr-only `<h1>` |
| **`platform/about`** | ✅ Yes | ✅ Yes | `#main` | `<nav>` with Back Button | ✅ Yes | `#main` | Visible `<h1>About FanHoard` |
| **`platform/roadmap`** | ✅ Yes | ✅ Yes | `#main` | `<nav>` with Back Button | ✅ Yes | `#main` | Visible `<h1>Planned Features` |
| **`platform/whats_new`** | ✅ Yes | ✅ Yes | `#main` | `<nav>` with Back Button | ✅ Yes | `#main` | Sr-only `<h1>` + Banner |
| **`data/verse/discover`** | ✅ Yes | ❌ No | `#fv-main` | `<header>` + Tabbed `<nav>` | ❌ No | `#fv-main` | Sr-only `<h1>` |
| **`data/verse/scope`** | ✅ Yes | ✅ Yes | `#main` | `<nav>` with Back Button | ✅ Yes | `#main` | Sr-only `<h1>` |

---

## 5. Candidate Material-Component Pattern Inventory

To unify the HTML structure into a Material-level reusable component architecture, the following 8 candidate component patterns must be standardized across all pages:

### 1. App Shell Layout (`<fv-app-shell>` / `.fv-page-shell`)
- **Current State**: Fragmented across `.fv-app`, `.fv-page-shell`, `.fv-main`, `#main`, and `#searchResults`.
- **Target Specification**:
  ```html
  <div id="fv-app" class="fv-app" data-page="{page_identifier}">
    <a href="#fv-main" class="skip-link fv-skip-link">Skip to main content</a>
    <fv-top-app-bar></fv-top-app-bar>
    <div class="fv-page-shell">
      <main id="fv-main" class="fv-main">
        <!-- Page Content -->
      </main>
      <div id="fv-footer-mount"></div>
    </div>
  </div>
  ```

### 2. Top App Bar / Navigation Header (`<fv-top-app-bar>`)
- **Current State**: Bypassed or copy-pasted as raw `<nav>` on 8 pages, `<header>` on 2 pages, `#fv-nav-layer` on 1 page.
- **Target Specification**:
  ```html
  <header class="fv-top-app-bar" role="banner">
    <nav class="fv-nav-container" aria-label="Page navigation">
      <button class="fv-back-button" id="back-button" aria-label="Go back">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">...</svg>
      </button>
      <span class="fv-nav-title" data-translate="page-title-key">Title</span>
      <div class="fv-nav-actions"><!-- Action Slot --></div>
    </nav>
  </header>
  ```

### 3. Material Card Primitive (`<fv-card>`)
- **Current State**: Implemented with inconsistent wrapper markup (`.setting-item`, `.feature-card`, `.scope-card`, `.m5 .w`).
- **Target Specification**:
  ```html
  <article class="fv-card [fv-card--outlined|fv-card--elevated]">
    <div class="fv-card__content">...</div>
  </article>
  ```

### 4. Section Header Component (`<fv-section-header>`)
- **Current State**: Ad-hoc pairing of `.fv-section-label` and `.fv-section-desc` wrapped inside `<section class="con">` or non-semantic `<div>`s.
- **Target Specification**:
  ```html
  <header class="fv-section-header">
    <h2 class="fv-section-title" data-translate="...">Title</h2>
    <p class="fv-section-desc" data-translate="...">Description</p>
  </header>
  ```

### 5. Settings / Form Row Component (`<fv-list-item>` / `<fv-setting-row>`)
- **Current State**: Over-nested `<div>` structures (`.m5 > .w > .setting-item-inner`).
- **Target Specification**:
  ```html
  <div class="fv-setting-row">
    <div class="fv-setting-row__leading"><svg class="fv-icon">...</svg></div>
    <div class="fv-setting-row__body">
      <label class="fv-setting-row__label">Label</label>
      <span class="fv-setting-row__desc">Description</span>
    </div>
    <div class="fv-setting-row__trailing"><!-- Control (Toggle, Select, Arrow) --></div>
  </div>
  ```

### 6. Hero Header Banner (`<fv-hero-header>`)
- **Current State**: Custom hero sections (`.hero.nob`, `.wn-header-banner`, `.roadmap-header`).
- **Target Specification**:
  ```html
  <header class="fv-hero-header">
    <span class="fv-badge">Badge</span>
    <h1 class="fv-hero-title">Headline</h1>
    <p class="fv-hero-sub">Subtitle text</p>
  </header>
  ```

### 7. Semantic Action Primitive (`<fv-button>`)
- **Current State**: Non-semantic `<button onclick="window.location.href='...'">` anti-patterns used for links.
- **Target Specification**:
  - For page navigation: `<a href="..." class="btn-primary|btn-secondary">Link Text</a>`
  - For form submission / modal triggers: `<button type="submit|button" class="btn-primary|btn-secondary">Action</button>`

### 8. Standard Footer Mount (`<fv-footer>`)
- **Current State**: Missing `#fv-footer-mount` target on 4 page groups.
- **Target Specification**: Standardize `<div id="fv-footer-mount"></div>` as a mandatory child of `.fv-page-shell` across every page.

---

## 6. Deviation List & Anti-Pattern Audit

1. **Main Landmark ID Mismatch**:
   - `id="fv-main"`: `home/`, `setting/`, `community/report`, `data/verse/discover`
   - `id="main"`: `index.html`, `community/index`, `community/contact`, `platform/about`, `platform/roadmap`, `platform/whats_new`, `data/verse/scope`
   - `id="searchResults"`: `search/`

2. **Skip Link Misconfigurations**:
   - `platform/about`, `platform/roadmap`, `platform/whats_new`, `data/verse/discover`, `data/verse/scope` all contain `data-translate="home-skip-link"` on non-home pages.
   - Target IDs in `href="#..."` do not match across all pages due to the main ID mismatch.

3. **Missing Outer App Shell**:
   - `community/contact/index.html` lacks `<div id="fv-app">` and `<div class="fv-page-shell">`.
   - `index.html` uses `<main class="fv-app">` instead of wrapping main in `<div id="fv-app">`.

4. **Missing Footer Mount Points**:
   - `index.html`, `search/`, `community/contact`, and `data/verse/discover` omit `<div id="fv-footer-mount">`.

5. **Navigation Buttons Using `onclick` Scripting**:
   - `community/index.html`: `<button onclick="window.location.href='./contact/'">` and `<button onclick="window.location.href='./report/'">`
   - `community/contact/index.html`: `<button onclick="window.location.href='mailto:...'">`

6. **Bypass of `layout.css` Utilities**:
   - Grid classes (`.grid-2`, `.grid-3`, `.grid-4`, `.grid-auto-fit`) defined in `layout.css` are entirely unused.
   - Container class `.container` is overridden in `roadmap.css` rather than leveraging `layout.css`.
   - Obsolete utility wrappers (`.m5`, `.w`, `.pad`, `.con`) dominate layout scaffolding in `setting/` and `community/`.

7. **Inline Styles Inventory**:
   - GTM iframe inside `<noscript>`: `style="display:none;visibility:hidden"` (`index.html`, `setting/`, `about/`, `roadmap/`, `whats_new/`, `discover/`).
   - Hidden state toggles: `style="display:none;"` (`community/contact/index.html`, `data/verse/discover/index.html`).
   - Inline text align: `style="text-align:center;margin:0;"` (`community/report/index.html`).

---

## 7. Refactor Recommendations

1. **Standardize Page Shell Contract**:
   - Apply a single, strict HTML envelope contract to all 12 page groups:
     ```html
     <div id="fv-app" class="fv-app" data-page="{page_name}">
       <a href="#fv-main" class="skip-link fv-skip-link">Skip to main content</a>
       <!-- Optional Top Navigation Header -->
       <div class="fv-page-shell">
         <main id="fv-main" class="fv-main">
           <!-- Page Content -->
         </main>
         <div id="fv-footer-mount"></div>
       </div>
     </div>
     ```

2. **Normalize Main Landmark IDs**:
   - Change all `<main id="main">` and `<main id="searchResults">` to `<main id="fv-main" class="fv-main">`. Update all skip link targets to `href="#fv-main"`.

3. **Clean Up Skip Link Translations**:
   - Remove `data-translate="home-skip-link"` from non-home pages or introduce generic translation keys (e.g. `data-translate="skip-to-main"`).

4. **Convert Pseudo-Link Buttons to Semantic Anchors**:
   - Replace `<button onclick="window.location.href='...'">` in `community/index` and `community/contact` with semantic `<a href="...">` elements styled with `.btn-primary` or `.btn-secondary`.

5. **Eliminate Non-Standard Layout Wrappers**:
   - Deprecate `.m5`, `.w`, `.pad`, and `.con` classes. Refactor card containers to use standard `.fv-card` classes and `layout.css` flex/grid utilities.

6. **Incorporate Footer Mount Target Site-Wide**:
   - Add `<div id="fv-footer-mount"></div>` inside `.fv-page-shell` on `index.html`, `search/`, `community/contact`, and `data/verse/discover`.

7. **Extract Inline Styles into Base/Utility CSS Classes**:
   - Replace GTM inline styles with a global utility class `.fv-hidden-iframe` or `.fv-sr-only`.
   - Replace manual `style="display:none"` inline attributes with class-based visibility toggles or `[hidden]` HTML attributes.
