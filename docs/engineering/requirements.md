# Requirements Specification — Discover & Search Subsystems

> This document establishes the formal, testable requirements baseline for the Search and Discover subsystems in `fanhoard-page`.
>
> **For:** Engineers, sub-agents, and QA tools developing, fixing, or auditing Search and Discover features.
>
> **Scope:** `assets/js/search-system/`, `src/components/DiscoverFeed.ts`, `src/stores/SearchStore.ts`, and loading/nav interplay (`assets/js/loading-system/fvl.js`, `assets/js/nav-core/`).
>
> **Standards Reference:** DO-178C-inspired (High-level and Low-level requirement rigor adapted for Vite/TypeScript web applications).

---

## Table of Contents

1. [System Architecture & Boundaries](#1-system-architecture--boundaries)
2. [Search Subsystem Functional Requirements (REQ-Sxx)](#2-search-subsystem-functional-requirements-req-sxx)
3. [Discover Subsystem Functional Requirements (REQ-Dxx)](#3-discover-subsystem-functional-requirements-req-dxx)
4. [Performance Budgets (REQ-PERF-xx)](#4-performance-budgets-req-perf-xx)
5. [Stability & Reliability Requirements (REQ-STAB-xx)](#5-stability--reliability-requirements-req-stab-xx)
6. [Cross References](#6-cross-references)

---

## 1. System Architecture & Boundaries

The Search and Discover subsystems provide client-side discovery, fuzzy/substring searching, reactive state management, and virtualized feed rendering. The subsystems are divided into 5 clear layers:

| Layer | Responsibility | Modules / Files |
|---|---|---|
| **Layer 1: Ingestion & Store** | Ingest content databases, manage reactive UI state | `ConDataService`, `src/stores/SearchStore.ts`, `LanguageStore.ts` |
| **Layer 2: Search Index & Logic** | Pure, stateless search engine, indexing, scoring | `assets/js/search-system/search-modules/engine.js`, `config.js`, `types.js` |
| **Layer 3: Search Orchestration** | Search execution, URL parameter sync, history push | `search-service.js`, `url-history.js`, `input-bar.js`, `keyboard.js` |
| **Layer 4: UI & Feed Rendering** | Result card DOM rendering, URE virtual scroll, overlays | `rendering.js`, `overlay.js`, `suggestions.js`, `virtual-scroll.js` |
| **Layer 5: Discovery Feed & Actions** | YouTube-style recommendations, feed node recycling, scoped loading | `discovery.js`, `src/components/DiscoverFeed.ts`, `assets/js/loading-system/fvl.js` |

---

## 2. Search Subsystem Functional Requirements (REQ-Sxx)

### REQ-S01: Two-Tier Search Execution
- **Description:** The `SearchEngine` shall perform a two-tier search strategy: a fast synchronous substring pass followed by a Fuse.js fuzzy search pass.
- **Verification Method:** Unit Test (`tests/search.test.ts`) & Integration Test.
- **Specification Details:**
  - Substring tier matches `name`, `short_name`, `official_name`, `categoryNames`, and `typeNames`.
  - Fuzzy tier uses adaptive thresholds in `FUSE_THRESHOLDS` based on query length:
    - Query length $\le 2$: threshold `0.45` (`FUSE_THRESHOLDS.veryShort`).
    - Query length $\le 4$: threshold `0.38` (`FUSE_THRESHOLDS.short`).
    - Query length $\le 8$: threshold `0.30` (`FUSE_THRESHOLDS.medium`).
    - Query length $> 8$: threshold `0.25` (`FUSE_THRESHOLDS.long`).
  - Search returns an object containing `{ results: Array, keywords: Array }`.

### REQ-S02: Index Field Ingestion & Coverage
- **Description:** `SearchEngine.init()` shall build a comprehensive index covering primary names, alternative names, category titles, type titles, descriptions, and Unicode script characteristics.
- **Verification Method:** Unit Test (`SearchEngine.init` test suite).
- **Specification Details:**
  - Indexed document fields must include `name`, `short_name`, `official_name`, `api`, `text`, `typeNames`, `catNames`, and `description`.
  - Sub-names and category names must be standalone searchable tokens.

### REQ-S03: Text Normalization & Diacritics Stripping
- **Description:** All search queries and index entries shall undergo deterministic text normalization prior to matching.
- **Verification Method:** Unit Test (`_internals.normalizeText`).
- **Specification Details:**
  - Convert input to lowercase.
  - Strip combining diacritical marks (Unicode NFD decomposition).
  - Normalize Thai tone marks and whitespace.
  - Trim leading and trailing whitespace.

### REQ-S04: Input Bar Debounce & Focus Controls
- **Description:** Search query typing in `#searchInput` shall be debounced before invoking search execution or updating suggestions.
- **Verification Method:** E2E / Unit Test.
- **Specification Details:**
  - Debounce interval: `CONFIG.TIMING.debounceMs` = 120ms.
  - Clear button `#search-clear-btn` shall appear when input length $> 0$ and hide when empty.
  - Tapping clear button clears `#searchInput`, resets `SearchStore` query, and restores focus to input bar.

### REQ-S05: Autocomplete & Query Suggestions
- **Description:** `SuggestionService` shall generate up to `CONFIG.RENDER.suggestionMax` (8 items) inline suggestions and up to `CONFIG.RENDER.suggestionsFullscreenMax` (30 items) in overlay mode.
- **Verification Method:** Unit Test & E2E Test.
- **Specification Details:**
  - Suggestions shall include source badges (`item`, `type`, `category`).
  - Typing a type name (e.g. "Emoji") or category name (e.g. "Arrows") surfaces the corresponding badge label in the suggestion list.

### REQ-S06: Smart Query Language Detection & Re-ranking
- **Description:** `SuggestionService` shall detect query script dominance and re-rank suggestions so that suggestions matching the query language appear first.
- **Verification Method:** Unit Test (`LanguageService.detectQueryLanguage`).
- **Specification Details:**
  - Dominance threshold: `LANG_WEIGHT.dominanceRatio` = 1.5.
  - Minimum character count for dominance: `LANG_WEIGHT.minCharsForDominance` = 2.
  - Queries lacking clear language dominance fallback to active UI language (`auto`).
  - Single stray character in another script shall not trigger a language flip.

### REQ-S07: Search Overlay Lifecycle & Accessibility
- **Description:** Fullscreen search modal `#searchOverlayContainer` shall control overlay open/close lifecycle, scroll locking, and focus trap.
- **Verification Method:** E2E Test (`playwright` overlay tests).
- **Specification Details:**
  - `OverlayService.open()` locks body scrolling (`overflow: hidden`).
  - Pressing `Escape` or clicking back arrow closes overlay via `OverlayService.close('escape')` or `close('manual')`.
  - Closing overlay restores original scroll position (`scrollTo(savedScrollY)`).
  - Single authority: `OverlayService.close()` is the sole entry point for overlay teardown.

### REQ-S08: URL Parameter Synchronization & History State
- **Description:** `URLService` shall sync the active query with the browser URL (`?q=...`) using non-polluting history pushes.
- **Verification Method:** Unit Test & E2E Test.
- **Specification Details:**
  - Direct URL loads with `?q=query` trigger automatic search execution upon data load.
  - Fast URL retry: `TIMING.urlSearchRetryMs` = 120ms, max retries = 30 (`TIMING.urlSearchMaxRetries`).
  - Overlay opens modify history state without causing page reloads.

### REQ-S09: Reactive SearchStore State Management
- **Description:** `SearchStore` shall maintain application search state as a singleton with subscriber notifications.
- **Verification Method:** Unit Test (`tests/stores/SearchStore.test.ts`).
- **Specification Details:**
  - State object properties: `{ query: string, category: string|null, type: string, scrollIndex: number, resultsCount: number, isSearching: boolean }`.
  - Modifying category or type resets `scrollIndex` to 0.
  - Subscribers are notified synchronously; subscriber exceptions are caught with `[SearchStore]` error logging without breaking other subscribers.

### REQ-S10: Universal Render Engine (URE) Integration
- **Description:** `RenderingService` shall render result cards into `#searchResults` using URE virtual scroll instance reuse.
- **Verification Method:** Unit / Integration Test.
- **Specification Details:**
  - Reuses single URE handle (`_searchHandle`) across searches via `handle.setData(newResults)`.
  - Pool size capped at `CONFIG.RENDER.vsPoolMax` = 40 DOM nodes.
  - Disconnecting observer explicitly destroys URE instance.

### REQ-S11: Card Clipboard Copy & Notification Toast
- **Description:** Tapping a result card shall copy its `data-code` or target payload to the user's clipboard and trigger an accessible toast notification.
- **Verification Method:** E2E Test (`e2e/copy-symbol.spec.ts`).
- **Specification Details:**
  - Displays `#copyToast` for `CONFIG.TIMING.toastDisplayMs` = 1400ms with fade duration 250ms (`toastFadeMs`).
  - Sets `aria-live="polite"` on toast container for screen reader announcements.

### REQ-S12: Cold-Start Pending Search Queue
- **Description:** Search submissions occurring before `SearchEngine.init()` completes shall be queued in `window.__pendingSearch` and drained immediately upon init resolution.
- **Verification Method:** Unit Test.
- **Specification Details:**
  - Submitting form while docs load stashes `{ query, typeFilter }` in `__pendingSearch`.
  - `search.js` orchestrator executes queued search automatically when init finishes.

---

## 3. Discover Subsystem Functional Requirements (REQ-Dxx)

### REQ-D01: Feed DOM Node Recycling & DocumentFragment Batching
- **Description:** `DiscoverFeed` component shall manage DOM node recycling pools and batch insertions using `DocumentFragment`.
- **Verification Method:** Component Unit Test (`tests/components/DiscoverFeed.test.ts`).
- **Specification Details:**
  - Maintains `pools` object for `pages`, `groups`, `btnRows`, `cardContainers`, `buttons`, `cards`, and `headers`.
  - Recycles existing detached DOM elements rather than instantiating new DOM nodes during infinite scroll updates.
  - Batches DOM mutations into single `DocumentFragment` pass per render frame.

### REQ-D02: YouTube-Style Related Content Recommendation
- **Description:** `DiscoveryService` shall compute related items based on primary search top results using scoring weights.
- **Verification Method:** Unit Test (`engine.queryRelated` test).
- **Specification Details:**
  - Scoring weights:
    - Same type match: `DISCOVERY.weights.sameType` = 1.0.
    - Same category match: `DISCOVERY.weights.sameCategory` = 1.5.
    - Token overlap match: `DISCOVERY.weights.tokenOverlap` = 0.5.
  - Samples top `DISCOVERY.sampleTopN` = 8 primary search results to derive dominant type/category context.

### REQ-D03: Related Items Resource Bounded Bounding
- **Description:** The related content item count returned by `DiscoveryService` shall be bounded to prevent unbounded memory growth.
- **Verification Method:** Unit Test.
- **Specification Details:**
  - Maximum related items capped at `DISCOVERY.maxRelatedItems` = 60 items.
  - Minimum primary results required before discovery kicks in: `DISCOVERY.minResultsForDiscovery` = 1.

### REQ-D04: Empty-State Discovery Block
- **Description:** When primary search returns 0 results, `DiscoveryService` shall surface an empty-state recommendation section with friendly copy.
- **Verification Method:** E2E / Unit Test.
- **Specification Details:**
  - Displays up to `DISCOVERY.emptyStateMaxItems` = 12 items.
  - Empty-state copy uses non-alarming labels ("No results for this search", "Try these instead").

### REQ-D05: Content-Scoped Loading & FVL Interplay
- **Description:** Discovery feed actions and sub-navigation triggers shall utilize content-scoped loading overlays via `FVL.show({ mode: 'scoped' })`.
- **Verification Method:** Unit Test (`tests/loading-contract.test.ts`) & E2E (`e2e/discover-actions.spec.ts`).
- **Specification Details:**
  - Scoped loading overlays set `aria-busy="true"` on target content container.
  - Overlay teardown MUST invoke `FVL.hideInstant` or `FVL.hide` to clear `aria-busy` from container.
  - Content-scoped loading shall never intercept or block top-level browser navigation.

### REQ-D06: Action Loading & Hit-Testing
- **Description:** Button and card tap interactions in Discover feed shall provide visual loading feedback without breaking element hit-testing.
- **Verification Method:** E2E Test (`e2e/discover-actions.spec.ts`).
- **Specification Details:**
  - Pointer events are preserved on non-blocked regions.
  - Mobile tap targets maintain minimum 44×44px dimensions per WCAG 2.2 guidelines.

---

## 4. Performance Budgets (REQ-PERF-xx)

| Budget ID | Target Metric | Threshold / Limit | Measurement / Enforcement Method |
|---|---|---|---|
| **REQ-PERF-01** | Search Input-to-Render Latency | $\le 50\text{ ms}$ (Substring), $\le 150\text{ ms}$ (Fuse) | Measured from input event to DOM update pass |
| **REQ-PERF-02** | Cold-Start Ingestion Time | $\le 200\text{ ms}$ | `SearchEngine.init()` completion time; `conDataServiceWaitMs = 1200ms` |
| **REQ-PERF-03** | Virtual Scroll Node Pool Bound | $\le 40\text{ nodes}$ | `CONFIG.RENDER.vsPoolMax = 40` |
| **REQ-PERF-04** | Related Discovery Item Cap | $\le 60\text{ items}$ | `DISCOVERY.maxRelatedItems = 60` |
| **REQ-PERF-05** | Feed Scroll Frame Rate | $\ge 60\text{ FPS}$ | Zero forced reflows in scroll listeners; node recycling pool |
| **REQ-PERF-06** | Bundle Size Ceiling | Search system JS $\le 120\text{ KB}$ raw | Vite build bundle output audit |

---

## 5. Stability & Reliability Requirements (REQ-STAB-xx)

### REQ-STAB-01: Fail-Safe Return Defaults
All public API functions (`SearchEngine.search`, `querySuggestions`, `queryRelated`, `SearchStore.getState`, `FVL.getByMode`) shall return valid, safe fallback values (`[]`, `{ results: [], keywords: [] }`, or default state object) if internal errors or unhandled edge cases occur, never throwing unhandled exceptions to callers.

### REQ-STAB-02: Bounded Loops & No Infinite Recursion
Every loop, retry mechanism, and recursive call in search and discovery modules shall have an explicit upper iteration bound:
- URL retry cap: `urlSearchMaxRetries` = 30.
- Discovery calculation loop: bounded by `sampleTopN` (8) and `maxRelatedItems` (60).
- Poll timers: bounded by explicit clear flags.

### REQ-STAB-03: Deterministic Execution
Given identical input queries, dataset contents, and UI parameters, `SearchEngine` and `DiscoveryService` shall produce identical result ordering and scoring across executions. Randomness or time-dependent non-determinism is strictly prohibited.

### REQ-STAB-04: Complete Resource & Listener Lifecycle Cleanup
Every event listener bound to `window`, `document`, or external DOM elements, and every timer (`setTimeout`, `setInterval`, `requestAnimationFrame`), MUST be recorded and detached/cancelled upon module teardown, `OverlayService.close()`, or component unmount.

---

## 6. Cross References

- System Documentation: `fanhoard-docs/02-Search-System.md`, `fanhoard-docs/01-Virtual-Scroll-Rendering.md`, `fanhoard-docs/07-Loading-System.md`
- Verification Plan: `docs/engineering/verification-plan.md`
- Coding Standard: `docs/engineering/coding-standard.md`
- PR Review Checklist: `docs/engineering/review-checklist.md`
