# Verification Plan — Discover & Search Subsystems

> This document defines the formal verification strategy, test execution protocol, and requirement traceability matrix for the Discover and Search subsystems in `fanhoard-page`.
>
> **For:** Developers, AI sub-agents, test runners, and reviewers verifying requirements compliance.
>
> **Scope:** All requirements specified in `docs/engineering/requirements.md` (`REQ-S01`–`REQ-S12`, `REQ-D01`–`REQ-D06`, `REQ-PERF-*`, `REQ-STAB-*`).
>
> **Standards Reference:** DO-178C inspired software verification process (adapted for static Vite TypeScript web apps).

---

## Table of Contents

1. [Verification Strategy & Levels](#1-verification-strategy--levels)
2. [Test Execution Tools & Commands](#2-test-execution-tools--commands)
3. [Requirement-to-Test Traceability Matrix](#3-requirement-to-test-traceability-matrix)
4. [Pass/Fail Acceptance Criteria](#4-passfail-acceptance-criteria)
5. [Regression Testing Protocol](#5-regression-testing-protocol)
6. [Cross References](#6-cross-references)

---

## 1. Verification Strategy & Levels

Following DO-178C software verification principles, verification is structured into three distinct activity levels:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      VERIFICATION ACTIVITY LEVELS                      │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Acceptance & E2E Verification (HLV - High Level Verification)       │
│    • System-level flows, browser interactions, overlay lifecycle      │
│    • Framework: Playwright (chromium)                                  │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Unit & Integration Verification (LLV - Low Level Verification)     │
│    • Pure function logic, state transitions, algorithms, contracts     │
│    • Framework: Vitest + jsdom                                         │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Static Verification & Quality Gates (SV - Static Verification)     │
│    • Syntax, type safety, lint rules, build bundle integrity           │
│    • Tools: ESLint, TypeScript compiler (tsc), Vite build              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Test Execution Tools & Commands

All verification activities are executable via standard project scripts defined in `package.json`:

| Verification Gate | Command | Execution Scope |
|---|---|---|
| **Static Linting** | `npm run lint` | ESLint verification across source files (`eslint.config.cjs`) |
| **Type Safety** | `npm run type-check` | TypeScript compiler type validation (`tsc --noEmit`) |
| **Unit Test Suite** | `npm test` | Vitest test runner executing unit & store tests (`tests/*.test.ts`) |
| **Coverage Report** | `npm run test:coverage` | Vitest coverage report generation |
| **Production Build** | `npm run build` | Vite production bundle compilation check |
| **E2E Test Suite** | `npm run test:e2e` | Playwright browser automated testing (`e2e/*.spec.ts`) |

---

## 3. Requirement-to-Test Traceability Matrix

Every requirement defined in `docs/engineering/requirements.md` maps directly to an automated test file or static verification check.

| Requirement ID | Requirement Summary | Verification Level | Test File / Verification Method | Target Verdict |
|---|---|---|---|---|
| **REQ-S01** | Two-Tier Search Execution | LLV (Unit) | `tests/search.test.ts` | Pass |
| **REQ-S02** | Index Field Coverage | LLV (Unit) | `tests/search.test.ts` | Pass |
| **REQ-S03** | Text Normalization | LLV (Unit) | `tests/search.test.ts` | Pass |
| **REQ-S04** | Debounce & Clear Button | HLV (E2E) / LLV | `e2e/discover-actions.spec.ts` | Pass |
| **REQ-S05** | Query Suggestions & Badges | LLV (Unit) | `tests/search.test.ts` | Pass |
| **REQ-S06** | Smart Language Detection | LLV (Unit) | `tests/i18n.test.ts`, `tests/search.test.ts` | Pass |
| **REQ-S07** | Search Overlay Lifecycle | HLV (E2E) | `e2e/discover-boot-lifecycle.spec.ts` | Pass |
| **REQ-S08** | URL Parameter Sync | LLV (Unit) | `tests/search.test.ts` | Pass |
| **REQ-S09** | Reactive SearchStore State | LLV (Unit) | `tests/stores/SearchStore.test.ts` | Pass |
| **REQ-S10** | URE Virtual Scroll Integration | LLV / HLV | `tests/search.test.ts` | Pass |
| **REQ-S11** | Card Copy & Toast Notification | HLV (E2E) | `e2e/copy-symbol.spec.ts` | Pass |
| **REQ-S12** | Cold-Start Pending Search Queue | LLV (Unit) | `tests/search.test.ts` | Pass |
| **REQ-D01** | DiscoverFeed Node Recycling | LLV (Unit) | `tests/components/DiscoverFeed.test.ts` | Pass |
| **REQ-D02** | YouTube-Style Discovery | LLV (Unit) | `tests/search.test.ts` | Pass |
| **REQ-D03** | Related Items Cap (60) | LLV (Unit) | `tests/search.test.ts` | Pass |
| **REQ-D04** | Empty-State Discovery | HLV / LLV | `e2e/discover-actions.spec.ts` | Pass |
| **REQ-D05** | Scoped Loading & FVL Interplay | LLV / HLV | `tests/loading-contract.test.ts`, `e2e/discover-actions.spec.ts` | Pass |
| **REQ-D06** | Action Loading & Hit-Testing | HLV (E2E) | `e2e/discover-actions.spec.ts` | Pass |
| **REQ-PERF-01** | Input Latency ($\le 50/150\text{ ms}$) | Performance | Benchmark script / manual trace | Pass |
| **REQ-PERF-02** | Cold-Start Ingestion ($\le 200\text{ ms}$) | Performance | Benchmark script / manual trace | Pass |
| **REQ-PERF-03** | VS Node Pool Bound ($\le 40$) | SV (Static) | `assets/js/search-system/search-modules/config.js` | Pass |
| **REQ-PERF-04** | Related Item Cap ($\le 60$) | SV (Static) | `assets/js/search-system/search-modules/config.js` | Pass |
| **REQ-PERF-05** | Feed Scroll 60 FPS | Performance | Playwright trace / layout thrash audit | Pass |
| **REQ-PERF-06** | Bundle Size Ceiling ($\le 120\text{ KB}$) | SV (Build) | `npm run build` asset audit | Pass |
| **REQ-STAB-01** | Fail-Safe Return Defaults | LLV (Unit) | `tests/search.test.ts` | Pass |
| **REQ-STAB-02** | Bounded Execution Loops | SV (Static) | Code audit (`search-modules/*.js`) | Pass |
| **REQ-STAB-03** | Deterministic Output | LLV (Unit) | `tests/search.test.ts` | Pass |
| **REQ-STAB-04** | Listener/Timer Cleanup | LLV / HLV | `tests/loading-contract.test.ts`, `e2e/discover-boot-lifecycle.spec.ts` | Pass |

---

## 4. Pass/Fail Acceptance Criteria

A verification run for branch or pull request approval is considered **PASSED** if and only if all of the following conditions are met:

1. **Gate 1 (Lint):** `npm run lint` exits with code 0 (zero errors; warnings permitted if matched to allowed ESLint pattern).
2. **Gate 2 (Type Check):** `npm run type-check` exits with code 0 (zero TypeScript errors).
3. **Gate 3 (Unit Tests):** `npm test` passes 100% of test cases across all test suites.
4. **Gate 4 (Build):** `npm run build` completes successfully with output produced in `dist/`.
5. **Gate 5 (E2E Tests):** `npm run test:e2e` passes all end-to-end tests for Discover and Search flows.
6. **Gate 6 (Traceability):** Every requirement in `docs/engineering/requirements.md` has a corresponding passing test or verified static constraint.

---

## 5. Regression Testing Protocol

When a bug or defect (DS-xx) is identified in the Search or Discover subsystem:

1. **Step 1 — Reproduce with Test:** Write a failing Vitest or Playwright test reproducing the defect prior to modifying any source code.
2. **Step 2 — Verify Failure:** Execute the test on the unpatched codebase to verify that it fails as expected.
3. **Step 3 — Implement Fix:** Modify source code in the target module according to the coding standard.
4. **Step 4 — Verify Pass:** Re-run the new regression test and verify that it passes.
5. **Step 5 — Run Full Suite:** Execute `npm run lint && npm run type-check && npm test && npm run build` to ensure no regressions were introduced elsewhere.

---

## 6. Cross References

- Requirements Specification: `docs/engineering/requirements.md`
- Coding Standard: `docs/engineering/coding-standard.md`
- PR Review Checklist: `docs/engineering/review-checklist.md`
- System Architecture: `fanhoard-docs/00-System-Architecture.md`
