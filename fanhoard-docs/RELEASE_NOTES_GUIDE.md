# FanHoard Release Notes Writing Standard (RELEASE_NOTES_GUIDE)

- **System Described**: Writing Standard, Tone Guidelines, Structure, & Templates for FanHoard Release Notes
- **Entry File**: `fanhoard-docs/RELEASE_NOTES_GUIDE.md`
- **Dependencies**: `assets/md/en/current.md`, `assets/md/th/current.md`, `scripts/update-version.js`, `scripts/validate-release.js`
- **Verification**: `node scripts/validate-release.js --staged` | `node scripts/update-version.js`

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Five Core Authoring Principles](#2-five-core-authoring-principles)
3. [Technical Terminology Translation Guide](#3-technical-terminology-translation-guide)
4. [Standard Release Note Structure](#4-standard-release-note-structure)
5. [Subsystem Explanations for User Context](#5-subsystem-explanations-for-user-context)
6. [The Four Change Categories](#6-the-four-change-categories)
7. [Item Detail Writing Rules](#7-item-detail-writing-rules)
8. [Copy & Paste Markdown Template](#8-copy--paste-markdown-template)
9. [Full Standard Example](#9-full-standard-example)

---

## 1. Purpose & Scope

This document specifies the mandatory writing standard for FanHoard release notes. Every user-facing release entry in `assets/md/en/current.md` and `assets/md/th/current.md` must follow these formatting, tone, and structural rules.

FanHoard contains complex internal subsystems (`URE`, `Nav-Core`, `Popup System`, `Language System`, `ConData Service`). Release notes must translate developer-centric code changes into clear, user-perceivable benefits without ungrounded jargon or marketing hyperbole.

---

## 2. Five Core Authoring Principles

### 2.1 Accessible Without Technical Jargon
Readers include students, professionals, and casual web users seeking emojis or symbols. Avoid uncontextualized terms like "virtual scrolling", "race condition", or "DOM node pooling". If technical terms are necessary, immediately follow them with plain explanations or parenthetical definitions.

### 2.2 Explain Subsystem Context Before Detail
Before describing improvements, state what subsystem is involved and its role in the application. Telling users "URE is 30% faster" is meaningless unless they know URE handles large-scale rendering.

### 2.3 Explicit User Impact
Every entry must answer: *"How does this affect my user experience?"*
- **Bug Fixes**: Describe the observed issue first, then explain how it was resolved.
- **New Features**: Explain what new interaction or control is visible.
- **Performance Updates**: Describe the perceived speed or responsiveness improvement.

### 2.4 Consistent Tone Across All Releases
Maintain a friendly, direct, and conversational tone. Do not use marketing buzzwords like "revolutionary", "game-changing", or "premium experience". Use plain descriptive language (e.g., "Page loading no longer stutters").

### 2.5 Honest Communication
Do not exaggerate fix coverage or feature stability. If a fix resolves an issue under specific conditions or if a feature is an initial release, state the scope accurately.

---

## 3. Technical Terminology Translation Guide

Use this glossary to translate internal engineering concepts into user-understandable phrasing:

| Technical / Internal Term | Recommended User-Facing Phrasing | Context Explanation |
| :--- | :--- | :--- |
| **race condition** | Conflicting system actions | Multiple rapid clicks causing loading confusion |
| **virtual scrolling** | Viewport-only rendering | Rendering visible items first to prevent slowdowns |
| **DOM node pooling** | Element recycling | Reusing screen elements instead of recreating them |
| **Shadow DOM isolation** | Component separation | Preventing styles from bleeding across UI components |
| **Web Worker** | Background processing thread | Processing data off the main UI thread |
| **Custom Events** | Internal system signals | Communication between modular subsystems |
| **IIFE pattern** | Standard code wrapper | Internal code structure (omit from notes) |
| **cache-bust** | Forced version refresh | Ensuring browsers fetch the latest assets |
| **GC pressure** | Memory cleanup load | Reducing browser memory overhead |
| **pre-built static page** | Pre-rendered web page | Pre-computed HTML pages for faster initial load |
| **SPA navigation** | Seamless page transitions | Changing views without full page reloads |

---

## 4. Standard Release Note Structure

Every release note entry must include these structural sections in order:

### 4.1 Frontmatter Metadata

```yaml
---
version: 3.0.0
date: 2026-09-24T00:00:00.000Z
title: Smoother Page Loading & Click Prevention
subtitle: Upgraded fullscreen loading dialogs and eliminated rapid click state conflicts.
notify: true
---
```

- **`version`**: Semantic version matching `assets/md/{lang}/current.md` frontmatter.
- **`date`**: ISO timestamp matching release build date.
- **`title`**: Concise headline summary (max 60 characters).
- **`subtitle`**: 1-2 sentence user-focused overview (max 200 characters).
- **`notify`**: Set `true` to trigger client update popup dialogs (`assets/js/version-core.js`).

### 4.2 TL;DR Section
A 1-3 sentence summary placed immediately after frontmatter for quick reading:

```markdown
**TL;DR** — Page transitions are smoother, rapid button clicks no longer stall loading, and background content flash has been eliminated.
```

### 4.3 Subsystem Context Section
A 1-paragraph overview introducing the updated subsystem before listing specific changes:

```markdown
## About This System

Fullscreen Visual Loading (FVL) is the loading screen displayed when switching emoji or symbol categories. It covers the screen temporarily while new dataset items prepare, preventing flickering. This update refines transition timing and prevents rapid navigation stalls.
```

### 4.4 Change Categories
Organized under four standard H3 headers: `### New`, `### Improved`, `### Fixed`, and `### Removed`.

### 4.5 User Impact Summary
A final bulleted summary of 2-4 items highlighting perceivable UI changes:

```markdown
### What You Will Notice

- Rapid category button clicks no longer freeze the loading overlay.
- Background content transitions seamlessly without flicker.
- Page scrolling is paused during loading transitions to prevent misclicks.
```

---

## 5. Subsystem Explanations for User Context

Use these standardized context descriptions when detailing updates to core FanHoard subsystems:

### 5.1 URE (Universal Render Engine)
> URE is the rendering system that displays thousands of emojis and symbols without slowing down the page. It renders items currently inside your viewport and dynamically updates as you scroll, ensuring smooth performance even on large datasets.

### 5.2 Search System
> The search system enables instant query matching across emojis, symbols, and text collections. It performs real-time matching as you type, supporting both exact terms and partial word queries.

### 5.3 Nav-Core
> Nav-Core powers category routing and navigation across Discover views. It manages category state, enables instant transitions without full page reloads, and handles dynamic dataset loading.

### 5.4 Language System (i18n)
> The language system manages seamless switching between supported languages. It updates page text instantly, saves your preferred language, and synchronizes active locale settings across open browser tabs.

### 5.5 Con-Data Service
> Con-Data Service acts as the central data registry for all emoji, symbol, and fancy text collections. It decouples dataset storage from rendering UI, allowing instant updates when new collections are added.

### 5.6 Popup System
> The Popup System controls modal dialogs and notification banners across the application, ensuring consistent appearance, accessibility, and dismiss behavior.

### 5.7 Build System
> The build system pre-renders static HTML pages across supported locales prior to deployment, ensuring optimal loading speed and web search crawler accessibility.

---

## 6. The Four Change Categories

### 6.1 `### New`
Used strictly for newly added user-facing features or capabilities.
```markdown
- **New "Scroll to Top" Control**
  A smooth floating button now appears in the bottom-right corner when scrolling down long lists, allowing instant return to the top header.
```

### 6.2 `### Improved`
Used for enhancements to existing UI features, performance optimizations, or usability updates.
```markdown
- **40% Faster Search Query Execution**
  Search query execution time has been reduced by nearly half for multi-word queries.
```

### 6.3 `### Fixed`
Used for bug fixes. Describe the observed user issue first, followed by the resolution.
```markdown
- **Resolved Loading Stall During Rapid Category Clicks**
  Rapidly clicking category buttons previously caused loading overlays to stall. The system now cancels superseded requests automatically and retains only the latest selection.
```

### 6.4 `### Removed`
Used when removing obsolete features. Include rationale and alternative workflows.
```markdown
- **Removed Staggered Entrance Animations**
  Legacy fade-in animations on individual card items have been removed in favor of instant viewport rendering, reducing loading latency.
```

---

## 7. Item Detail Writing Rules

Each entry under `New`, `Improved`, `Fixed`, or `Removed` must follow a 3-part structure:
1. **Bold Short Name**: Concise title summary.
2. **What Changed**: Clear description of the modified behavior from a user perspective.
3. **Why / Impact**: Explanation of the benefit or problem resolved.

Keep item entries between 2 and 4 sentences. Avoid using internal acronyms (`FVL`, `URE`, `SSOT`) inside item title headers—place acronyms in the context section instead.

---

## 8. Copy & Paste Markdown Template

```markdown
---
version: {VERSION}
date: {ISO_TIMESTAMP}
title: {CONCISE_TITLE_MAX_60_CHARS}
subtitle: {USER_FOCUSED_SUBTITLE_MAX_200_CHARS}
notify: {true|false}
---

**TL;DR** — {1-3 SENTENCE_EXECUTIVE_SUMMARY}

## About This System

{SUBSYSTEM_CONTEXT_PARAGRAPH}

### New

- **{FEATURE_NAME}**
  {WHAT_CHANGED_DESCRIPTION}. {USER_BENEFIT_EXPLANATION}.

### Improved

- **{ENHANCEMENT_NAME}**
  {WHAT_CHANGED_DESCRIPTION}. {PERCEIVED_IMPROVEMENT_EXPLANATION}.

### Fixed

- **{BUG_NAME}**
  {OBSERVED_ISSUE_DESCRIPTION}. {RESOLUTION_DESCRIPTION}.

### Removed

- **{REMOVED_ITEM_NAME}**
  {REMOVED_ITEM_DESCRIPTION}. {RATIONALE_AND_ALTERNATIVE}.

### What You Will Notice

- {PERCEIVABLE_OUTCOME_1}
- {PERCEIVABLE_OUTCOME_2}
- {PERCEIVABLE_OUTCOME_3}
```

---

## 9. Full Standard Example

```markdown
---
version: 3.0.0
date: 2026-09-24T00:00:00.000Z
title: Redesigned Interface & Faster Search Engine
subtitle: Upgraded to FanHoard v3.0.0 with redesigned UI layout, sub-millisecond search query execution, and modernized update notification dialogs.
notify: true
---

**TL;DR** — FanHoard v3.0.0 introduces a redesigned layout, faster search results with short query caching, and silent background updates for documentation releases.

## About This System

FanHoard v3.0.0 unifies search, rendering, navigation, and popup notifications into a cohesive application. This update optimizes search result caching and brings a modernized UI layout across all supported devices.

### New

- **Redesigned Filter Control Bar**
  Filter options now scroll naturally alongside category pills, maximizing visible screen space on mobile devices and desktop displays.

### Improved

- **Sub-Millisecond Short Query Search**
  Queries with 3 or fewer characters now execute using character-bucket indexing, delivering search results instantly as you type.

### Fixed

- **Eliminated Duplicate Update Notifications**
  Resolved an issue where update dialogs resurfaced after being dismissed in the same browsing session. Dismissal states are now preserved across session windows.

### What You Will Notice

- Instant search candidate matching while typing short queries.
- Expanded visible reading area on search results pages.
- Persistent dismiss behavior for update notification popups.
```
