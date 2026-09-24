# Pull Request Review Checklist — Discover & Search Subsystems

> Formal PR gate checklist and review criteria for pull requests modifying the Discover and Search subsystems in `fanhoard-page`.
>
> **For:** Human reviewers, sub-agents, and automated verification tools evaluating pull requests.
>
> **Scope:** Code changes in `assets/js/search-system/`, `src/components/DiscoverFeed.ts`, `src/stores/SearchStore.ts`, and loading/nav interplay.
>
> **Gate Standard:** Every PR MUST satisfy all mandatory criteria across Gates 1 through 7 prior to approval and merge into main branches.

---

## Table of Contents

1. [Gate 1: Automated Tooling Baseline](#1-gate-1-automated-tooling-baseline)
2. [Gate 2: Architecture & Naming Compliance](#2-gate-2-architecture--naming-compliance)
3. [Gate 3: Error Handling & Fail-Safe Verification](#3-gate-3-error-handling--fail-safe-verification)
4. [Gate 4: Resource & Listener Lifecycle](#4-gate-4-resource--listener-lifecycle)
5. [Gate 5: Performance & Memory Budgets](#5-gate-5-performance--memory-budgets)
6. [Gate 6: Accessibility & Loading System Contract](#6-gate-6-accessibility--loading-system-contract)
7. [Gate 7: Test Coverage & Commit Hygiene](#7-gate-7-test-coverage--commit-hygiene)
8. [Review Verdict & Sign-Off](#8-review-verdict--sign-off)
9. [Cross References](#9-cross-references)

---

## 1. Gate 1: Automated Tooling Baseline

- [ ] **Lint Verification:** `npm run lint` executes cleanly with code 0.
- [ ] **Type Check Verification:** `npm run type-check` executes cleanly with code 0 (zero TypeScript errors).
- [ ] **Unit Test Suite:** `npm test` executes cleanly with code 0 (100% test cases passing).
- [ ] **Production Build:** `npm run build` completes successfully and produces valid bundle output in `dist/`.
- [ ] **E2E Test Suite:** `npm run test:e2e` passes all end-to-end tests touching Search and Discover flows.

---

## 2. Gate 2: Architecture & Naming Compliance

- [ ] **Class Naming Standard:** All added or modified DOM/CSS classes follow `assets/js/search-system/NAMING.md`:
  - 1 class = 1 explicit meaning (no cryptic abbreviations like `.sc`, `.sv`, `.vscroll-*`).
  - Strict BEM formatting (`block__element`, `block--modifier`).
  - Prefix `search-` or `result-card` taxonomy applied.
- [ ] **Module Boundaries:**
  - `SearchEngine` (`engine.js`) remains pure, stateless, and DOM-agnostic.
  - `SearchStore` (`SearchStore.ts`) handles state only and does not perform direct DOM mutations.
  - `DiscoveryService` (`discovery.js`) stays strictly within `#searchDiscovery` container and does not alter primary results.
- [ ] **Compile-Time Config:** All magic numbers, timeouts, limits, and scoring weights are declared in `config.js` and `Object.freeze()`'d.

---

## 3. Gate 3: Error Handling & Fail-Safe Verification

- [ ] **No Silent Empty Catches:** All `catch` blocks in business logic include structured domain logging (`[SearchEngine]`, `[Discovery]`, `[SearchStore]`, `[Overlay]`, `[FVL]`).
- [ ] **Fail-Safe Fallbacks:** Public API functions return valid fallback values (`[]`, default state object) if exceptions occur, avoiding unhandled throws to callers.
- [ ] **Subscriber Isolation:** In `SearchStore`, exceptions inside subscriber callbacks are caught individually so remaining subscribers continue receiving updates.

---

## 4. Gate 4: Resource & Listener Lifecycle

- [ ] **EventListener Cleanup:** Every `addEventListener` on `window`, `document`, or external targets has a corresponding `removeEventListener` in `close()`, `destroy()`, or unmount routines.
- [ ] **Timer Handle Clearance:** All `setTimeout` / `setInterval` / `requestAnimationFrame` calls store handles and are cancelled via `clearTimeout` / `clearInterval` / `cancelAnimationFrame` before re-issuing or during teardown.
- [ ] **DOM Pool Preservation:** Node recycling pools in `DiscoverFeed.ts` (`pools.cards`, `pools.buttons`, etc.) are maintained without leaking un-recycled nodes.

---

## 5. Gate 5: Performance & Memory Budgets

- [ ] **Debounce Applied:** Input event handlers in `#searchInput` utilize 120ms debounce (`CONFIG.TIMING.debounceMs`).
- [ ] **Bounded Iterations:** All loops have explicit upper bounds (e.g. `DISCOVERY.maxRelatedItems = 60`, `sampleTopN = 8`, `urlSearchMaxRetries = 30`). No unbounded scans or while loops.
- [ ] **Zero Layout Thrashing:** No reading of layout geometry (`offsetHeight`, `getBoundingClientRect`) immediately after DOM style/innerHTML writes in hot loops or scroll event handlers.

---

## 6. Gate 6: Accessibility & Loading System Contract

- [ ] **FVL Loading Teardown:** Content-scoped loading overlays correctly call `FVL.hideInstant(target)` or `FVL.hide(target)` to strip `aria-busy="true"` from target containers.
- [ ] **Overlay Focus & Scroll Trap:** Search overlay modal traps keyboard focus when open and locks body scroll (`overflow: hidden`).
- [ ] **Escape & Back Navigation:** Tapping `Escape` key or back arrow gracefully closes search overlay and restores exact previous page scroll position.
- [ ] **Touch Target Size:** Interactive buttons, cards, and filter tags maintain minimum 44×44px tap targets per WCAG 2.2 guidelines.

---

## 7. Gate 7: Test Coverage & Commit Hygiene

- [ ] **Regression Test Included:** Any bug fix or feature addition includes at least one corresponding unit test (`tests/*.test.ts`) or E2E spec (`e2e/*.spec.ts`).
- [ ] **Traceability Matrix Updated:** If new requirements (`REQ-*`) were added, `docs/engineering/verification-plan.md` matrix is updated.
- [ ] **Conventional Commit Format:** Commits follow conventional commit syntax (`docs: ...`, `fix(search): ...`, `feat(discover): ...`).
- [ ] **Goal Tag:** Commits associated with stability efforts include `(goal: discover-search-stability)` in commit title or body.

---

## 8. Review Verdict & Sign-Off

The PR reviewer shall record one of the following verdicts:

- **APPROVE:** All 7 gates passed cleanly. Code is ready for merge.
- **APPROVE WITH NOTES:** Non-blocking minor suggestions provided. All gates passed.
- **REJECT / CHANGES REQUESTED:** One or more gate criteria failed (e.g., failed test gate, missing listener cleanup, silent catch block). PR must be updated and re-reviewed.

---

## 9. Cross References

- Requirements Specification: `docs/engineering/requirements.md`
- Verification Plan: `docs/engineering/verification-plan.md`
- Coding Standard: `docs/engineering/coding-standard.md`
- Naming Convention: `assets/js/search-system/NAMING.md`
