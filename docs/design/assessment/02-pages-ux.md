# FanHoard Main Website — Per-Page UX & Layout Assessment

**Date:** September 19, 2026  
**Target Repository:** `github.com/fanhoard/fanhoard-page`  
**Assessment Target:** 12 Live Served Pages + Legacy Orphan Verification  
**Evaluation Standard:** Nielsen 10 Usability Heuristics, WCAG 2.2 Level AA, Impeccable Design Framework (`reference/critique.md`)

---

## Executive Summary

This report delivers a deep, evidence-based UX, layout, and visual hierarchy assessment across all 12 live pages of the FanHoard main website (`fanhoard-page`). Each page was systematically audited against its designated **Surface Mode** (*Persuade*, *Operate*, *Read*, *Experience*), design system token alignment, responsive behavior, cognitive load, accessibility compliance (WCAG 2.2 AA), and heuristic usability scores.

### Key Audit High-Level Findings

1. **Legacy Orphan Files Cleared:** Verification confirmed that deprecated legacy pages (`beta.html`, `cn.html`, `n.html`) have been completely purged from the repository tree (0 occurrences found).
2. **Flash of Invisible Text (FOUC / FOIT) Risk:** 10 out of 12 HTML documents hide the page body via inline `<body style="opacity:0">`. If JavaScript execution fails, is blocked, or experiences latency, users are left with an un-rendered blank screen.
3. **Pervasive Contrast Violations (WCAG 1.4.3 AA):** Critical call-to-action buttons and banner subtitles severely fail contrast requirements (e.g., `index.html` primary button at **1.53:1**; `whats_new/index.html` banner text at **2.32:1**; `contact/index.html` muted copy at **2.67:1**).
4. **Interactive Screen-Reader Traps & Hidden Controls:** Setting toggle `#auto-update-switch` is assigned `aria-hidden="true"`, preventing screen-reader users from altering auto-update preferences. Footer links dynamically injected via `footer.js` are wrapped in `aria-hidden="true"`, trapping focusable elements.
5. **Markup Pollution & Hardcoded Styles:** 39 inline `style="..."` attributes pollute 13 HTML files, breaking separation of concerns and forcing layout logic into static HTML rather than CSS classes.
6. **Landmark & Navigation Deficits:** 8 pages lack semantic `<main>` landmark regions (`index.html`, `community/index.html`, `community/contact/index.html`, `community/report/index.html`, `platform/about/index.html`, `platform/roadmap/index.html`, `platform/whats_new/index.html`, `data/verse/scope/index.html`). No pages provide skip-to-main-content navigation links.

---

## Ranked Cross-Page UX & Layout Problems

### P1 — High: Critical WCAG Accessibility & FOUC Deficits

1. **FOUC / FOIT Blank Screen Risk via Inline Body `opacity:0`**
   - **Scope:** 10 HTML documents (`home/index.html:188`, `setting/index.html:40`, `community/index.html:22`, `community/contact/index.html:26`, `community/report/index.html:27`, `platform/about/index.html:44`, `platform/roadmap/index.html:41`, `platform/whats_new/index.html:42`, `platform/license/index.html`, `platform/privacy/index.html`).
   - **Impact:** Pages initialize completely invisible until JavaScript removes or updates inline styles. On slow connections or JS errors, the user experiences total blank screen failure.
   - **Remediation:** Replace inline `style="opacity:0"` with a CSS class pattern (`.is-loaded`) applied gracefully post-hydration.

2. **Severe CTA & Accent Color Contrast Failures (WCAG 1.4.3 AA)**
   - **Scope:** `index.html:63` (`.btn-primary` = **1.53:1**), `index.html:43` (`.badge` = **1.92:1**), `community/contact/index.html:40` (muted text = **2.67:1**), `platform/whats_new/index.html:65` (accent banner text = **2.32:1**).
   - **Impact:** Essential interactive controls and headers are unreadable for users with low vision or when viewing under sunlight.
   - **Remediation:** Update primary interactive brand teal token to `#0d9488` (Teal 600) to ensure >= 4.5:1 contrast against light backgrounds.

3. **Screen-Reader Traps & Hidden Control Attributes**
   - **Scope:** `setting/index.html:76` (`#auto-update-switch`), `footer.js` / `footer.css`.
   - **Impact:** `#auto-update-switch` is set to `aria-hidden="true"`, preventing screen-reader users from recognizing or operating the preference toggle. Focusable links in the global footer are wrapped in `aria-hidden="true"`, creating keyboard focus traps.
   - **Remediation:** Remove `aria-hidden="true"` from focusable interactive inputs and adjust footer DOM container structure.

### P2 — Medium: Specificity Locks & Markup Pollution

4. **Extreme Search Page CSS Override Debt (`search-compact-overrides.css`)**
   - **Scope:** `assets/css/search-compact-overrides.css` (823 lines, 29.5 KB, 24 `!important` flags, 116 hardcoded color values).
   - **Impact:** Deep selector nesting (5 levels deep) and magic numbers (`padding-top: 138px!important`, `margin-top: -12px`) cause high layout fragility when resizing viewports or toggling search display modes.
   - **Remediation:** Delete `search-compact-overrides.css` and fold compact layout rules directly into `search.css` using modern CSS container queries (`@container`).

5. **Inline Style Pollution in HTML Markup**
   - **Scope:** 39 inline `style="..."` declarations across 13 files (e.g., `setting/index.html` has 10 inline style attributes; `community/contact/index.html` has 6).
   - **Impact:** Hardcoded margins, displays, and typography (`style="font-size:1.3em;font-weight:700;margin-bottom:1.5rem;"`) bypass design tokens and hinder responsive CSS maintenance.
   - **Remediation:** Purge all inline styles and replace with token-backed layout utility classes.

6. **Missing `<main>` Semantic Landmarks & Skip Links**
   - **Scope:** 8 HTML files lack `<main>` wrappers; 12 HTML files lack skip links.
   - **Impact:** Keyboard and screen-reader users cannot skip repetitive top navigation bars or jump directly to primary content.
   - **Remediation:** Wrap unique page content in `<main id="main">` and add standard `.skip-link` components across all pages.

### P3 — Medium: Form Accessibility & Dark Theme Discontinuities

7. **Missing Form Field Labels & Feedback Ellipsis Formatting**
   - **Scope:** `community/report/index.html` (inputs lack explicit `for/id` label bindings), `search/index.html:77`, `community/report/index.html:193,379`.
   - **Impact:** Screen readers announce unlabelled text inputs as generic controls. Form placeholder text uses raw triple-dots `...` instead of typographic ellipsis `…`.
   - **Remediation:** Add explicit `for` attributes on all `<label>` elements matching input `id`s; replace `...` with `…`.

8. **Hardcoded Secondary Page Background Colors Breaking Dark Theme**
   - **Scope:** `assets/css/about.css:15-80` (`#FBFEFC`), `assets/css/new.css` (20 hardcoded colors), `assets/css/roadmap.css` (17 hardcoded colors).
   - **Impact:** In dark theme mode (`[data-theme="dark"]`), hardcoded light background colors bleed onto card borders and section backgrounds.
   - **Remediation:** Replace all hardcoded hex values with `--fv-surface-*` and `--fv-border-*` semantic CSS variables.

---

## Detailed Per-Page Assessments

---

### 1. `index.html` — Custom 404 Error Page

- **Surface Mode:** **Persuade** (Re-engaging lost visitors, converting a 404 error into return navigation).
- **Layout Structure:** Single centered container (`.fv-app` -> `.wrap`), `min-height: 100svh`, flexbox layout with `padding: 28px`. Max-width 640px. No navigation bar or global footer attached.
- **Visual Hierarchy:**
  - **Focal Point:** Oversized gradient "404" heading (`font-size: 68px`) with high contrast gradient.
  - **Secondary:** Brand pill badge ("FanHoard") -> `h2` sub-heading ("Oops! Lost your way?") -> descriptive copy paragraph.
  - **Tertiary:** Dual action button group (`.actions`) containing "Take Me Home" and "Explore FanHoard".
- **Spacing & Typography Consistency vs Tokens:**
  - Internal `<style>` block consumes `var(--fv-font-stack)`, `var(--fv-surface-page)`, `var(--fv-radius-pill)`, `var(--fv-gradient-brand)`.
  - **Bypassed Tokens:** Hardcoded `#111827` on `h2`, `#9ca3af` on `.note`, `rgba(203,213,225,0.8)` on secondary button border, and `#2CEBC2` text on `.btn-primary`.
- **Inline Styles Inventory:**
  - `L101`: `style="display:none;visibility:hidden"` (GTM `<noscript>` iframe).
- **UX & Accessibility Issues:**
  - **Critical Contrast Failure:** Primary CTA `.btn-primary` (`#2CEBC2` light teal text on `#ffffff` solid white background) has a contrast ratio of **1.53:1** (WCAG AA requires >= 4.5:1).
  - **Badge Contrast Failure:** `.badge` text (`#2CEBC2`) on `rgba(0,255,184,0.1)` teal tint has a contrast ratio of **1.92:1**.
  - **Missing Landmark:** Lacks `<main>` element (`<div id="fv-app" class="fv-app">` should be `<main>`).
- **Heuristic Usability Scores (Nielsen 10):**
  - *Error Recovery (H9):* 4/4 — Excellent guidance back to home or catalog.
  - *Visibility of System Status (H1):* 4/4 — Clear 404 indication.
  - *Aesthetic & Minimalist Design (H8):* 2/4 — Ruined by unreadable white-on-light-teal primary CTA text.
- **Cognitive Load & Emotional Journey:** Extremely low cognitive load (only 2 choices). Turns a dead end into a helpful redirect.
- **One-Line Verdict:** Friendly, focused 404 recovery page crippled by unreadable white-on-light-teal primary CTA text (1.53:1 contrast).

---

### 2. `home/index.html` — Main Landing Page

- **Surface Mode:** **Persuade** (Brand presentation, value proposition, entry into symbol search).
- **Layout Structure:** Multi-section landing page: Hero section (`#hero-section`), search bar prompt, feature highlights grid (3 columns), popular symbol categories card matrix, and dynamic footer.
- **Visual Hierarchy:**
  - **Focal Point:** Bold hero headline "Copy Emojis & Symbols with One Tap" with emerald badge accent.
  - **Secondary:** Quick search input bar with category pill shortcuts.
  - **Tertiary:** Feature value props ("Instant Copy", "Zero Dependencies", "Bilingual Support") and category cards.
- **Spacing & Typography Consistency vs Tokens:**
  - Styled via `assets/css/home.css` (552 lines).
  - **Deficits:** `home.css` contains 18 `!important` flags and 46 hardcoded hex/rgba values (`#FBFEFC`, `#21383c`, `#00CEB0`, `#00dfbe`, `#23272f`). Mixes arbitrary units (`28px`, `1.5rem`, `18px`, `1.1em`).
- **Inline Styles Inventory:**
  - `L188`: `style="opacity:0"` on `<body>`.
  - `L204`: `style="opacity:0;"` duplicated on nested wrapper.
- **UX & Accessibility Issues:**
  - **FOUC / FOIT Risk:** `body style="opacity:0"` hides the entire DOM until JavaScript removes or updates the inline opacity style.
  - Hardcoded card background colors (`#FBFEFC`) break dark mode rendering.
  - Category pill grid lacks keyboard focus indicator styling on desktop browsers.
- **Heuristic Usability Scores (Nielsen 10):**
  - *Recognition Rather Than Recall (H6):* 4/4 — Instant visual previews of emoji and symbol categories.
  - *Aesthetic & Minimalist Design (H8):* 3/4 — Vibrant visual identity, but section spacing is fragmented.
  - *Flexibility & Efficiency (H7):* 4/4 — Direct copy triggers in hero.
- **Cognitive Load & Emotional Journey:** High emotional resonance with cheerful typography and colors. Smooth onboarding flow from hero to symbol discovery.
- **One-Line Verdict:** Engaging, high-converting brand hero with instant copy capabilities, marred by `opacity:0` FOUC risk and hardcoded colors in `home.css`.

---

### 3. `search/index.html` — Search Engine & Symbol Search

- **Surface Mode:** **Operate** (High-efficiency keyword search, filtering, and single-tap copying).
- **Layout Structure:** Sticky search header containing input field -> Horizontal category filter pill track -> Virtualized symbol search result grid -> Item detail modal drawer.
- **Visual Hierarchy:**
  - **Focal Point:** Dominant search input field with instant keystroke response.
  - **Secondary:** Horizontal filter pills ("All", "Faces", "Math", "Arrows", "Fancy").
  - **Tertiary:** Uniform 8-column symbol grid layout.
- **Spacing & Typography Consistency vs Tokens:**
  - Relies on `search.css` overloaded by `assets/css/search-compact-overrides.css` (823 lines, 29.5 KB).
  - **Deficits:** 24 `!important` flags and 116 hardcoded color values. Uses magic numbers (`padding-top: 138px!important`, `margin-top: -12px`) forcing position states.
- **Inline Styles Inventory:**
  - `0` inline styles in HTML markup (clean separation in HTML!).
- **UX & Accessibility Issues:**
  - Form input placeholder uses triple-dots `Search symbols...` instead of typographic ellipsis `…`.
  - High layout fragility: Deeply nested selectors (5 levels) cause horizontal layout overflow on narrow mobile screens (<360px).
  - Category filter track lacks visible scroll indicators on non-touch devices.
- **Heuristic Usability Scores (Nielsen 10):**
  - *Flexibility & Efficiency of Use (H7):* 4/4 — Lightning fast real-time search filtering.
  - *Consistency & Standards (H4):* 2/4 — Heavy CSS override file creates unpredictable layout behavior across viewport sizes.
  - *Match Between System & Real World (H2):* 4/4 — Intuitive emoji and symbol categorization.
- **Cognitive Load & Emotional Journey:** Operational speed is excellent; search results appear instantly with satisfying copy notifications.
- **One-Line Verdict:** Exceptionally fast, utility-focused search engine trapped under 29.5 KB of fragile, over-specific CSS override debt.

---

### 4. `setting/index.html` — User Preferences & Settings

- **Surface Mode:** **Operate** (Configuring site preferences: auto-update, language, dark theme, local cache).
- **Layout Structure:** Vertical settings card stack inside a max-width 720px main container. Each card contains setting title, sub-label description, and interactive toggle/select control.
- **Visual Hierarchy:**
  - **Focal Point:** "Settings" page heading (`h1`).
  - **Secondary:** Setting card titles ("Auto Update", "Language Preference", "Dark Mode", "Clear Cache").
  - **Tertiary:** Sub-text descriptions and toggle switches aligned right.
- **Spacing & Typography Consistency vs Tokens:**
  - Styled via `assets/css/setting.css`.
  - **Deficits:** 9 `!important` declarations, 16 hardcoded colors, and 3 non-performant `transition: all` declarations (`L64,125,140`).
- **Inline Styles Inventory:**
  - `L40`: `style="opacity:0"` on `<body>`.
  - `L41`: `style="display:none;visibility:hidden"` (GTM).
  - `L76`: `style="display:none"` on hidden checkbox.
  - `L89,98,107,121,130,144,153`: 7 instances of `style="display:inline-flex;align-items:center;gap:15px;"`.
- **UX & Accessibility Issues:**
  - **Critical Screen-Reader Failure:** Checkbox `#auto-update-switch` (`L76`) is assigned `aria-hidden="true"`. Screen readers ignore this interactive toggle entirely, preventing non-sighted users from changing auto-update preferences!
  - `body style="opacity:0"` FOUC risk.
  - Excessive inline `gap:15px;` layout pollution in HTML.
- **Heuristic Usability Scores (Nielsen 10):**
  - *User Control & Freedom (H3):* 2/4 — Compromised by broken accessibility on switch control.
  - *Consistency & Standards (H4):* 2/4 — Heavy inline style pollution and non-performant CSS transitions.
  - *Aesthetic & Minimalist Design (H8):* 3/4 — Clean card layout structure visually.
- **Cognitive Load & Emotional Journey:** Low cognitive load; grouped controls are easy to scan visually.
- **One-Line Verdict:** Functional settings card list severely compromised by `aria-hidden="true"` on the primary switch and 10 inline layout style attributes.

---

### 5. `community/index.html` — Community Hub

- **Surface Mode:** **Read** (Community navigation portal linking to support, issue reporting, and external platforms).
- **Layout Structure:** Hub layout with introductory header section, 3-column action card grid (Contact Us, Report Issue / Request Symbol, Join Discord), and dynamic footer.
- **Visual Hierarchy:**
  - **Focal Point:** Page header "Community".
  - **Secondary:** Grid of 3 elevated feature cards with iconography and titles.
  - **Tertiary:** Card action link buttons.
- **Spacing & Typography Consistency vs Tokens:**
  - Relies on global CSS and inline HTML styles for card typography.
- **Inline Styles Inventory:**
  - `L22`: `style="opacity:0"` on `<body>`.
  - `L41`: `style="font-size:1.3em;font-weight:700;margin-bottom:1.5rem;"`.
  - `L42`: `style="margin-bottom:2rem;font-size:1.1em;line-height:1.6;"`.
- **UX & Accessibility Issues:**
  - **Footer Screen-Reader Trap:** Focusable `<a>` links inside `footer.js` are wrapped in `aria-hidden="true"`, causing screen readers to skip footer navigation while keeping tab focus active.
  - **Missing Landmark:** Lacks `<main>` element wrapper.
  - Inline typography styles pollute markup instead of utilizing design system CSS classes.
- **Heuristic Usability Scores (Nielsen 10):**
  - *Recognition Rather Than Recall (H6):* 4/4 — Clear visual cards for community destinations.
  - *Consistency & Standards (H4):* 2/4 — Typography and margins declared directly in HTML `style` attributes.
  - *Aesthetic & Minimalist Design (H8):* 3/4 — Clean grid structure.
- **Cognitive Load & Emotional Journey:** Clear 3-choice decision matrix; invites user participation without clutter.
- **One-Line Verdict:** Straightforward community gateway polluted by inline element typography and footer screen-reader hidden link traps.

---

### 6. `community/contact/index.html` — Contact Directory

- **Surface Mode:** **Operate / Read** (Direct contact options, support channels, feedback access).
- **Layout Structure:** Back button sub-navigation header -> Contact options card container (Email, Discord, GitHub) -> Dynamic footer.
- **Visual Hierarchy:**
  - **Focal Point:** "Contact Us" header (`h1`).
  - **Secondary:** Sub-nav back button and muted intro text.
  - **Tertiary:** Direct email link and social platform buttons.
- **Spacing & Typography Consistency vs Tokens:**
  - Hardcoded margin overrides scattered throughout HTML markup.
- **Inline Styles Inventory:**
  - `L26`: `style="opacity:0"` on `<body>`.
  - `L40`: `style="margin-bottom:1.5rem;"`.
  - `L42`: `style="margin-bottom:1.5rem;"`.
  - `L50`: `style="margin-bottom:1rem;"`.
  - `L58`: `style="display:none;"`.
  - `L64`: `style="width:100%;"`.
- **UX & Accessibility Issues:**
  - **Low Contrast Muted Copy:** Muted description text contrast ratio is **2.67:1** against the background (WCAG AA requires >= 4.5:1).
  - Missing explicit `<label for="...">` or `aria-label` bindings on contact action cards.
  - `body style="opacity:0"` FOUC risk on launch.
  - Missing `<main>` landmark element.
- **Heuristic Usability Scores (Nielsen 10):**
  - *Aesthetic & Minimalist Design (H8):* 2/4 — Plagued by low text contrast and inline margin pollution.
  - *Visibility of System Status (H1):* 3/4 — Clear contact paths provided.
- **Cognitive Load & Emotional Journey:** Low cognitive load; direct contact details are immediately visible.
- **One-Line Verdict:** Simple contact directory degraded by poor sub-navigation text contrast (2.67:1) and scattered inline layout overrides.

---

### 7. `community/report/index.html` — Report Issue & Request Symbol Form

- **Surface Mode:** **Operate** (Multi-field user submission form for reporting bugs or requesting new symbols).
- **Layout Structure:** Back-button header -> Tab/Radio toggle (Report Bug vs Request Symbol) -> Multi-field input form (Issue type, Title, Symbol details, Description, Contact email) -> Submit CTA button -> Form response status box.
- **Visual Hierarchy:**
  - **Focal Point:** "Report Issue & Request Symbol" header and issue category selector.
  - **Secondary:** Form fields with input boxes and textareas.
  - **Tertiary:** `.btn-submit` button ("Submit Report").
- **Spacing & Typography Consistency vs Tokens:**
  - Form CSS uses raw `...` triple-dots in input placeholder text (`L193,379`) instead of typographic ellipsis `…`.
- **Inline Styles Inventory:**
  - `L27`: `style="opacity:0"` on `<body>`.
  - `L438`: `style="text-align:center;margin:0;"` on status box.
- **UX & Accessibility Issues:**
  - **Missing Form Field Associations:** `<input>` and `<textarea>` controls lack explicit `<label for="...">` bindings, causing screen readers to announce unlabelled form fields.
  - Submitting state feedback displays raw `...` triple-dot text.
  - `body style="opacity:0"` FOUC risk.
  - Missing `<main>` landmark region.
- **Heuristic Usability Scores (Nielsen 10):**
  - *Error Prevention & Help (H5):* 3/4 — Good field validation, but unlabelled form controls create accessibility errors.
  - *Flexibility & Efficiency of Use (H7):* 3/4 — Tab switching between bug report and symbol request works smoothly.
  - *Consistency & Standards (H4):* 2/4 — Missing `label/for` HTML standards.
- **Cognitive Load & Emotional Journey:** Medium cognitive load; form fields are logically grouped, providing reassuring submission feedback.
- **One-Line Verdict:** Comprehensive submission form lacking explicit WCAG `label/for` field bindings and proper typographic feedback indicators.

---

### 8. `platform/about/index.html` — About & Platform Story

- **Surface Mode:** **Persuade / Read** (Brand story, mission statement, tech stack overview, creator background).
- **Layout Structure:** Single-column narrative flow: Hero banner -> Mission story section -> Technical principles card grid -> Ecosystem links -> Dynamic footer.
- **Visual Hierarchy:**
  - **Focal Point:** "About FanHoard" hero headline (`h1`).
  - **Secondary:** Section headings (`h2` "Our Mission", "Core Principles").
  - **Tertiary:** Card grid highlighting SSG performance and open data standards.
- **Spacing & Typography Consistency vs Tokens:**
  - Styled via `assets/css/about.css` (116 lines).
  - **Deficits:** `about.css` uses hardcoded background color `#FBFEFC` (`L15-80`), bypassing `tokens.css`. In dark theme (`[data-theme="dark"]`), this hardcoded light surface creates light-bleed bugs. Mixes arbitrary units (`18px`, `28px`, `1.5rem`).
- **Inline Styles Inventory:**
  - `L44`: `style="opacity:0"` on `<body>`.
  - `L45`: `style="display:none;visibility:hidden"` (GTM).
- **UX & Accessibility Issues:**
  - `body style="opacity:0"` causes FOUC blank screen risk on initial page load.
  - Hardcoded `#FBFEFC` background breaks dark mode aesthetic consistency.
  - Missing `<main>` landmark tag wrapper.
- **Heuristic Usability Scores (Nielsen 10):**
  - *Aesthetic & Minimalist Design (H8):* 3/4 — Clean typography, but broken by dark-mode light-bleed.
  - *Match Between System & Real World (H2):* 4/4 — Inspiring brand story copy.
- **Cognitive Load & Emotional Journey:** Very low cognitive load; smooth reading rhythm reinforces trust and brand credibility.
- **One-Line Verdict:** Elegant brand narrative page harmed by dark-mode light-bleed due to hardcoded `#FBFEFC` background colors and FOUC opacity hiding.

---

### 9. `platform/roadmap/index.html` — Product Roadmap & Timeline

- **Surface Mode:** **Read** (Chronological milestone timeline, feature progress tracking).
- **Layout Structure:** Vertical timeline layout (`.timeline`) with connecting vertical border lines -> Milestone feature cards -> Status pill indicators (Completed, In Progress, Planned).
- **Visual Hierarchy:**
  - **Focal Point:** Title "FanHoard Roadmap" (`h1`).
  - **Secondary:** Version milestone cards ("v1.0 Core Launch", "v1.2 Verse Engine", "v2.0 Expansion").
  - **Tertiary:** Status pills and feature bullet lists.
- **Spacing & Typography Consistency vs Tokens:**
  - Styled via `assets/css/roadmap.css` (122 lines).
  - **Deficits:** Contains 17 hardcoded color declarations and hardcoded CSS gradient borders (`border-image: linear-gradient(...)`), bypassing token variables.
- **Inline Styles Inventory:**
  - `L41`: `style="opacity:0"` on `<body>`.
  - `L42`: `style="display:none;visibility:hidden"` (GTM).
- **UX & Accessibility Issues:**
  - **Color-Only Status Indicators:** Milestone status badges rely exclusively on color pills (green/teal/gray) without supplementary text patterns or `aria-label` context for colorblind users.
  - Missing `<main>` landmark tag and skip link.
  - `body style="opacity:0"` FOUC risk.
- **Heuristic Usability Scores (Nielsen 10):**
  - *Visibility of System Status (H1):* 4/4 — Excellent transparency on past and upcoming platform updates.
  - *Consistency & Standards (H4):* 2/4 — Hardcoded gradient CSS overrides token consistency.
- **Cognitive Load & Emotional Journey:** Easy to scan chronologically; builds trust with transparent feature status tracking.
- **One-Line Verdict:** Well-structured feature roadmap timeline suffering from hardcoded CSS gradient borders and missing WCAG landmark structure.

---

### 10. `platform/whats_new/index.html` — What's New & Release Log

- **Surface Mode:** **Read** (Release history log, changelogs, feature release notes).
- **Layout Structure:** Top header banner with title and highlight badge -> Vertical release log timeline rendered dynamically via `ReleaseCacheService.ts` and `assets/js/new.js` -> Footer.
- **Visual Hierarchy:**
  - **Focal Point:** Header banner "What's New in FanHoard".
  - **Secondary:** Version numbers ("v1.0.0", "v0.9.5") with release date badges.
  - **Tertiary:** Categorized release tags (`[Feature]`, `[Fix]`, `[Refactor]`) and bullet points.
- **Spacing & Typography Consistency vs Tokens:**
  - Styled via `assets/css/new.css` (180 lines).
  - **Deficits:** `new.css` has 20 hardcoded color declarations. Header banner uses an intrusive inline style attribute (`L65`).
- **Inline Styles Inventory:**
  - `L42`: `style="opacity:0"` on `<body>`.
  - `L43`: `style="display:none;visibility:hidden"` (GTM).
  - `L65`: `style="text-align:center;padding:24px 16px 0;font-size:1.3em;font-weight:700;color:var(--fv-brand-teal);"`.
- **UX & Accessibility Issues:**
  - **Low Contrast Banner Accent:** Subtitle text `color:var(--fv-brand-teal)` (`#13b47f`) against white background yields a contrast ratio of **2.32:1** (below 4.5:1 required by WCAG AA).
  - Dark mode leaks: Hardcoded card border colors in `new.css` render bright white borders in dark theme.
  - Missing `<main>` landmark tag.
- **Heuristic Usability Scores (Nielsen 10):**
  - *Visibility of System Status (H1):* 4/4 — Detailed release logs update users on changes.
  - *Aesthetic & Minimalist Design (H8):* 2/4 — Banner contrast failure and dark-theme border leaks degrade visual quality.
- **Cognitive Load & Emotional Journey:** Low cognitive load; categorized tags make changelogs effortless to digest.
- **One-Line Verdict:** Informative release changelog hampered by low banner text contrast (2.32:1), inline header styles, and dark-theme border leaks.

---

### 11. `data/verse/discover/index.html` — Discover Verse Symbol Catalog

- **Surface Mode:** **Operate / Experience** (Interactive symbol catalog with DOM virtualization, live filtering, and symbol inspector).
- **Layout Structure:** Sticky top navigation bar -> Sub-navigation mode track -> Category filter pill bar -> Virtualized symbol matrix grid -> Pagination control bar.
- **Visual Hierarchy:**
  - **Focal Point:** Symbol matrix grid items with instant hover and copy interactions.
  - **Secondary:** Category filter pills ("All", "Math", "Arrows", "Currency", "Technical").
  - **Tertiary:** Sub-nav bar and pagination triggers.
- **Spacing & Typography Consistency vs Tokens:**
  - Styled via `nav-core-ext.css` and `loading-system.css`.
  - **Deficits:** `nav-core-ext.css` contains 17 `!important` declarations. `loading-system.css` escalates z-index up to `17,500`, bypassing token scales.
- **Inline Styles Inventory:**
  - `L234`: `style="display:none;visibility:hidden"` (GTM).
  - `L248`: `style="display:none"` (sub-nav toggle).
- **UX & Accessibility Issues:**
  - **Missing Accessible Live Region:** Boot spinner displayed during initial catalog symbol load lacks `aria-live="polite"` or `role="status"`, leaving screen readers without loading feedback.
  - Escalated z-index values (`17,500`) risk obscuring popup modals or copy toasts.
  - Sub-navigation relies on inline `style="display:none"` toggling instead of CSS state classes (`.is-hidden`).
- **Heuristic Usability Scores (Nielsen 10):**
  - *Flexibility & Efficiency of Use (H7):* 4/4 — Outstanding catalog rendering performance with virtualized DOM.
  - *Recognition Rather Than Recall (H6):* 4/4 — Clear symbol visual glyph previews.
  - *Visibility of System Status (H1):* 2/4 — Boot spinner lacks accessible live region announcement.
- **Cognitive Load & Emotional Journey:** High interaction delight; symbol copy triggers provide immediate visual and toast reassurance.
- **One-Line Verdict:** High-performance virtualized symbol catalog, requiring live-region feedback for boot spinners and cleanup of escalated loading z-index values.

---

### 12. `data/verse/scope/index.html` — Scope Viewer Shell

- **Surface Mode:** **Read / Operate** (Embedded code/data viewer shell for symbol scopes).
- **Layout Structure:** Minimalist 15-line HTML shell container loading data viewer scripts.
- **Visual Hierarchy:**
  - **Focal Point:** Code viewer canvas rendering symbol scope tree structures.
- **Spacing & Typography Consistency vs Tokens:**
  - Extremely clean, imports `tokens.css`.
- **Inline Styles Inventory:**
  - `0` inline styles in HTML markup.
- **UX & Accessibility Issues:**
  - Lacks semantic `<main>` landmark element (`<div>` container used instead of `<main>`).
  - Missing page heading (`<h1>` element absent in initial static HTML structure).
- **Heuristic Usability Scores (Nielsen 10):**
  - *Flexibility & Efficiency of Use (H7):* 4/4 — Lean shell loads quickly.
  - *Consistency & Standards (H4):* 2/4 — Missing standard `<main>` and `<h1>` structural markup.
- **Cognitive Load & Emotional Journey:** Minimalist, zero-distraction view for inspecting symbol schema scopes.
- **One-Line Verdict:** Lightweight, zero-inline-style viewer shell lacking semantic `<main>` wrapper and fallback heading structure.

---

## Summary Verdict Table Across All 12 Pages

| Page Path | Surface Mode | Inline Styles | FOUC Risk | Main Landmark | Critical UX / A11y Issue | One-Line Verdict |
|---|---|---|---|---|---|---|
| `index.html` (404) | **Persuade** | 1 | No | ❌ Missing | Primary CTA contrast **1.53:1** | Friendly 404 recovery page crippled by unreadable white-on-light-teal primary CTA text (1.53:1 contrast). |
| `home/` | **Persuade** | 2 | ⚠️ Yes (`opacity:0`) |  Present | 18 `!important` flags & 46 hardcoded colors in `home.css` | Engaging brand hero with instant copy capabilities, marred by `opacity:0` FOUC risk and hardcoded colors. |
| `search/` | **Operate** | 0 | No |  Present | 29.5 KB `search-compact-overrides.css` override debt | Exceptionally fast search engine trapped under 29.5 KB of fragile, over-specific CSS override debt. |
| `setting/` | **Operate** | 10 | ⚠️ Yes (`opacity:0`) |  Present | `#auto-update-switch` has `aria-hidden="true"` | Functional settings list compromised by `aria-hidden="true"` on switch and 10 inline layout attributes. |
| `community/` | **Read** | 3 | ⚠️ Yes (`opacity:0`) | ❌ Missing | Footer links trapped inside `aria-hidden` wrapper | Straightforward community gateway polluted by inline element typography and footer screen-reader traps. |
| `community/contact` | **Operate/Read** | 6 | ⚠️ Yes (`opacity:0`) | ❌ Missing | Muted text contrast **2.67:1** | Simple contact directory degraded by poor sub-navigation text contrast (2.67:1) and scattered inline overrides. |
| `community/report` | **Operate** | 2 | ⚠️ Yes (`opacity:0`) | ❌ Missing | Form fields lack explicit `label/for` bindings | Comprehensive submission form lacking explicit WCAG `label/for` field bindings and typographic indicators. |
| `platform/about` | **Persuade/Read** | 2 | ⚠️ Yes (`opacity:0`) | ❌ Missing | Hardcoded `#FBFEFC` causes dark-mode light bleed | Elegant brand narrative page harmed by dark-mode light-bleed due to hardcoded `#FBFEFC` background colors. |
| `platform/roadmap` | **Read** | 2 | ⚠️ Yes (`opacity:0`) | ❌ Missing | Hardcoded gradient CSS borders; color-only status | Well-structured feature roadmap timeline suffering from hardcoded CSS gradient borders and missing landmarks. |
| `platform/whats_new` | **Read** | 3 | ⚠️ Yes (`opacity:0`) | ❌ Missing | Header subtitle text contrast **2.32:1** | Informative release changelog hampered by low banner text contrast (2.32:1), inline styles, and dark leaks. |
| `data/verse/discover` | **Operate/Exp.** | 2 | No |  Present | Boot spinner lacks `aria-live` region | High-performance virtualized catalog requiring live-region feedback for boot spinners and z-index cleanup. |
| `data/verse/scope` | **Read/Operate** | 0 | No | ❌ Missing | Missing `<main>` wrapper and fallback `<h1>` | Lightweight, zero-inline-style viewer shell lacking semantic `<main>` wrapper and fallback heading structure. |

---

## Strategic UX Remediation Roadmap

The findings from this assessment directly inform the 16 execution chunks in the FanHoard redesign plan:

1. **`exec-tokens`:** Standardize primary interactive teal to `#0d9488` (WCAG AA >= 4.5:1 contrast) and map native dark theme tokens to prevent light-bleed.
2. **`exec-fouc`:** Remove `body style="opacity:0"` across all 10 affected pages and replace with `.is-loaded` hydration transitions.
3. **`exec-footer`:** Purge 131 `!important` flags from `footer.css` and unwrap focusable footer links from `aria-hidden="true"`.
4. **`exec-shell`:** Add semantic `<main id="main">` wrappers and skip-link components across all 8 deficient pages.
5. **`exec-page-search`:** Delete `search-compact-overrides.css` (29.5 KB) and rebuild compact search using container queries in `search.css`.
6. **`exec-page-setting`:** Remove `aria-hidden="true"` from `#auto-update-switch` and convert 10 inline style attributes to CSS utility classes.
7. **`exec-page-community-forms`:** Add explicit `for/id` bindings on all report form fields and fix sub-nav contrast.

