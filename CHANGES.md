# FanHoard Search Rendering Fix & Animation Restore v3.2.13

## What changed in v3.2.13 (Search Results Rendering Fix + Original Active-Button Animation)

Fixed the search page result-card stacking bug found in real-browser testing, restored the original premium `.active` button animation, and added an E2E regression guard.

1. **Search result cards no longer stack on one spot (`assets/js/ure/ure.css`)**:
   The URE virtual scroll engine positions every wrapper with an inline `transform` (`virtual-list.js`). The content-appear animation added in v3.2.8 also animated `transform` on `.ure-visible` wrappers, and CSS animations override inline styles — so every card in the first window stacked at `translateY(0)` with only the topmost card visible. Added a dedicated opacity-only `ure-appear-fade` keyframe for `.ure-visible:not(.ure-settled)` wrappers so the engine's positioning is never overridden; in-flow `.cm-group` / `.feed-page` groups keep the existing `ure-appear` reveal.

2. **Original active-button animation restored (`assets/css/nav-core.css`)**:
   The main navigation underline indicator returns to its designed dynamics: ease-in `transform 200ms` when inactive, springy overshoot `transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)` on `.active` (replacing the flattened uniform 250ms curve from v3.2.5).

3. **Category pills no longer shrink while selected (`assets/css/nav-core-ext.css`)**:
   Removed the permanent `transform: scale(0.97)` from `.button-sub.active` (introduced in v3.2.5); the shrink now applies only to the momentary `:active` press state, keeping the selected pill at full size as originally designed.

4. **E2E regression guard (`e2e/search-refresh-regression.spec.ts`)**:
   New test `result cards render at distinct positions (no transform-override stacking)` — asserts result cards occupy unique positions after render; fails on the broken state, passes after the fix.

## Verification

- `npx vitest run`: 234/234 tests green across 37 test files.
- `npx playwright test`: full E2E suite 16/16 passing (scroll-lock 3/3 included).
- Real-browser effective-DOM verification: 12/12 first-window search cards render at unique positions and are visible; discover feed groups render in normal flow at correct offsets.

## Files changed in v3.2.13

| File | Change |
|------|--------|
| `assets/js/ure/ure.css` | Opacity-only `ure-appear-fade` for URE wrappers; transform appear reserved for in-flow groups |
| `assets/css/nav-core.css` | Restore original underline spring animation on `.active` |
| `assets/css/nav-core-ext.css` | Remove permanent shrink on `.button-sub.active` |
| `e2e/search-refresh-regression.spec.ts` | New no-stacking regression test |
| `assets/md/en/current.md`, `assets/md/th/current.md` | v3.2.13 release notes |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, loaders, HTML | Release pipeline artifacts (v3.2.13) |
