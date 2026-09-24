# Coding Standard — Discover & Search Subsystems

> Mandatory engineering standard and coding guidelines for the Discover and Search subsystems in `fanhoard-page`.
>
> **For:** All software engineers, sub-agents, and automated code review tools working in `assets/js/search-system/`, `src/components/DiscoverFeed.ts`, `src/stores/SearchStore.ts`, and loading/nav modules.
>
> **Derivation:** Distilled from project architecture (`assets/js/search-system/NAMING.md`, `eslint.config.cjs`, `fanhoard-docs/AI_CODING_GUIDE.md`), recent commits, and aerospace software reliability rules (NASA Power of Ten / SpaceX flight software standards).

---

## Table of Contents

1. [Architectural Principles & Module Boundaries](#1-architectural-principles--module-boundaries)
2. [Naming Conventions & Class Taxonomy](#2-naming-conventions--class-taxonomy)
3. [Module Pattern & Dependency Injection](#3-module-pattern--dependency-injection)
4. [Error Handling Rules (No Silent Catches)](#4-error-handling-rules-no-silent-catches)
5. [Listener & Timer Lifecycle Management](#5-listener--timer-lifecycle-management)
6. [Loading Contract & FVL Interplay](#6-loading-contract--fvl-interplay)
7. [DOM & Performance Patterns](#7-dom--performance-patterns)
8. [Cross References](#8-cross-references)

---

## 1. Architectural Principles & Module Boundaries

The Discover and Search subsystems enforce strict single-responsibility module boundaries across 5 logical layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MODULE ARCHITECTURE LAYERS                      │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 1: Data Ingestion & Reactive Store                               │
│ • ConDataService, SearchStore.ts, LanguageStore.ts                     │
│ • Rule: Pure state container; zero direct DOM manipulation.            │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 2: Pure Search Engine & Indexing                                 │
│ • engine.js, config.js, types.js                                       │
│ • Rule: Stateless search algorithm & Fuse.js index. MUST NOT touch DOM.│
├────────────────────────────────────────────────────────────────────────┤
│ Layer 3: Orchestration & URL Routing                                   │
│ • search-service.js, url-history.js, input-bar.js, keyboard.js          │
│ • Rule: Manages query submission, history pushState, and input events.  │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 4: UI & Virtual Scroll Rendering                                 │
│ • rendering.js, overlay.js, suggestions.js, virtual-scroll.js          │
│ • Rule: Renders DOM result cards, URE virtual scroll, and overlay.     │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 5: Discovery Feed & Scoped Loading                               │
│ • discovery.js, DiscoverFeed.ts, fvl.js                                │
│ • Rule: Manages YouTube-style related recommendations & scoped loader. │
└────────────────────────────────────────────────────────────────────────┘
```

### Boundary Rules:
1. `SearchEngine` (`engine.js`) is strictly stateless and DOM-agnostic. It takes data and query strings and returns pure result arrays. It shall never access `document` or `window.location`.
2. `SearchStore` (`SearchStore.ts`) is a pure reactive state container. UI components subscribe to `SearchStore`, but `SearchStore` never directly mutates DOM nodes.
3. `DiscoveryService` (`discovery.js`) owns the discovery DOM section (`#searchDiscovery`) and its URE handle. It reads primary search results from `SearchEngine.queryRelated()` but never modifies primary search result cards.
4. Entry points expose public APIs on global namespaces (`window.SearchEngine`, `window.__searchUI`, `window.FVL`).

---

## 2. Naming Conventions & Class Taxonomy

Naming standards are strictly enforced per `assets/js/search-system/NAMING.md`:

### 2.1 CSS & DOM Class Naming Rules
1. **Rule of Clarity:** 1 class = 1 single explicit meaning. Cryptic abbreviations (such as legacy `.sc`, `.scc`, `.sv`, `.vs-*`) are strictly forbidden.
2. **BEM Methodology:** Use BEM format `block__element` for sub-elements and `block--modifier` for variants.
3. **Domain Prefixes:** All CSS classes in the search page domain must be prefixed with `search-` or belong to the `result-card` taxonomy.

### 2.2 Class Taxonomy Table

| Component Category | Target Element | Class Name | Description / Variant |
|---|---|---|---|
| **Search Bar** | Capsule Wrapper | `.search-pill` | Capsule container wrapping icon and input |
| | Input Icon | `.search-pill__icon` | Magnifying glass / back arrow SVG icon |
| | Input Field | `#searchInput` | Native `<input>` element (ID preserved for JS API) |
| **Result Card** | Single Card | `.result-card` | Result card container |
| | Vertical Card | `.result-card--vertical` | Variant for multi-line / vertical content |
| | Glyph Column | `.result-card__glyph` | Left-side emoji or character glyph |
| | Content Body | `.result-card__body` | Right-side text container |
| | Title | `.result-card__title` | Primary title heading |
| | Subtitle | `.result-card__subtitle` | Secondary description label |
| | Tag Container | `.result-card__tags` | Row container for metadata tags |
| | Tag Pill | `.result-card__tag` | Individual category/type tag |
| **Suggestions** | Fullscreen Overlay | `.search-suggestions-fullscreen` | Fullscreen suggestion modal container |
| | Title Heading | `.search-suggestions-title` | Section title ("Trending", "Related searches") |
| | Suggestion Item | `.search-suggestion-item` | Single suggestion row element |
| | Suggestion Body | `.search-suggestion-body` | Text content of suggestion |
| | Suggestion Badge | `.search-suggestion-badge` | Source badge (`--type` or `--category`) |
| **Discovery** | Section Container | `#searchDiscovery` | Related content container |
| | Section Header | `.discovery-header` | Title and hint text container |
| | Mount Container | `.discovery-list` | Target container for URE discovery mount |

### 2.3 JavaScript & TypeScript Code Naming
- Variable & function names: `camelCase` (e.g. `doSearch`, `detectQueryLanguage`).
- Private module functions: Leading underscore `camelCase` (e.g. `_normalizeText`, `_syncState`).
- Constants: `UPPER_SNAKE_CASE` inside `CONFIG` objects (e.g. `TIMING.debounceMs`, `DISCOVERY.maxRelatedItems`).
- Classes & Interfaces: `PascalCase` (e.g. `SearchStore`, `DiscoverFeed`, `SearchState`).

---

## 3. Module Pattern & Dependency Injection

All search modules in `assets/js/search-system/search-modules/` MUST wrap execution inside an Immediately Invoked Function Expression (IIFE) with strict mode enabled:

```javascript
// @ts-check
/**
 * @file module-name.js
 * Module description and purpose.
 *
 * @module module-name
 * @depends {config.js, state.js, utils.js}
 */
(function (M) {
  'use strict';

  // 1. Destructure dependencies from module namespace 'M'
  const { CONFIG, State, DOMService } = M;

  // 2. Local module implementation
  function internalHelper() { ... }

  // 3. Export public surface onto module namespace 'M'
  M.ModuleName = Object.freeze({
    publicMethod: function() { ... }
  });

})(window.__searchSystemModules = window.__searchSystemModules || {});
```

---

## 4. Error Handling Rules (No Silent Catches)

While ESLint config permits empty catch blocks (`'no-empty': ['error', { allowEmptyCatch: true }]`) for low-level environment detection, **silent empty catch blocks in business logic are strictly prohibited**.

### Rules for Exception Handling:
1. **Structured Logging Prefix:** Every catch block MUST output a console error or warning with a structured module tag:
   - Search Engine: `[SearchEngine]`
   - Discovery Service: `[Discovery]`
   - Search Store: `[SearchStore]`
   - Overlay Service: `[Overlay]`
   - Loading System: `[FVL]`
2. **Fail-Safe Fallback Returns:** Public API methods encountering exceptions MUST log the error and return a valid fallback structure rather than throwing or returning `undefined`:
   ```javascript
   try {
     return _fuse.search(query);
   } catch (err) {
     console.error('[SearchEngine] Fuzzy search error:', err);
     return []; // Fail-safe fallback array
   }
   ```
3. **No Silent State Corruption:** Exceptions occurring during subscriber notifications or state updates must be caught per-subscriber so that one subscriber failure does not block remaining subscribers.

---

## 5. Listener & Timer Lifecycle Management

Uncleaned event listeners and running timers cause memory leaks and detached DOM retention.

### Rules for Event Listeners:
1. **Reference Tracking:** When attaching event listeners to `window`, `document`, or external DOM containers, store the exact function reference in a module variable or cleanup array.
2. **Mandatory Removal:** Remove all attached listeners in `destroy()`, `close()`, or component unmount functions using `removeEventListener`:
   ```javascript
   function close(reason) {
     document.removeEventListener('keydown', _handleKeyDown);
     window.removeEventListener('resize', _handleResize);
     // ... rest of teardown
   }
   ```
3. **Single Attachment Guard:** Guard event registration with initialization flags (e.g. `_initialized`) or `Set` collections to prevent duplicate listener attachments during re-initialization.

### Rules for Timers & Animation Frames:
1. **Handle Retention:** Store handles returned by `setTimeout`, `setInterval`, and `requestAnimationFrame`.
2. **Pre-execution Clearing:** Before setting a new debounce or retry timer, explicitly cancel the pending handle:
   ```javascript
   if (_debounceTimer) clearTimeout(_debounceTimer);
   _debounceTimer = setTimeout(runSearch, CONFIG.TIMING.debounceMs);
   ```
3. **Teardown Clearance:** Clear all pending timer handles during module destroy or overlay close.

---

## 6. Loading Contract & FVL Interplay

The loading lifecycle follows the central loading system contract (`assets/js/loading-system/fvl.js`):

1. **Content-Scoped Loading:** Long-running async actions inside Discover feed or Search results MUST use content-scoped loading:
   ```javascript
   window.FVL.show({ mode: 'scoped', target: contentElement });
   ```
2. **Instant Cleanup API (`FVL.hideInstant`):** When clearing a scoped loading state, call `FVL.hideInstant(target)` or `FVL.hide(target)` to ensure `aria-busy="true"` is immediately stripped from the target container and accessibility attributes are restored.
3. **No Navigation Interception:** Content-scoped loaders must affect only their target container and MUST NOT block global browser navigation or top-level UI interactions.

---

## 7. DOM & Performance Patterns

1. **Batching with DocumentFragment:** When creating multiple result elements outside URE, build them off-DOM in a `DocumentFragment` and append in a single DOM mutation pass.
2. **DOM Node Recycling in DiscoverFeed:** `DiscoverFeed.ts` MUST recycle elements from its `pools` object (e.g., `pools.cards`, `pools.buttons`) before instantiating new DOM nodes.
3. **Layout Thrash Avoidance:** NEVER read layout properties (`offsetHeight`, `getBoundingClientRect`, `scrollTop`) immediately after setting DOM styles or innerHTML within the same synchronous loop.

---

## 8. Cross References

- Requirements Specification: `docs/engineering/requirements.md`
- Verification Plan: `docs/engineering/verification-plan.md`
- PR Review Checklist: `docs/engineering/review-checklist.md`
- Naming Reference: `assets/js/search-system/NAMING.md`
- Documentation Standard: `fanhoard-docs/13-Documentation-Standard.md`
