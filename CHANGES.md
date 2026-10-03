# FanHoard Fullscreen Scroll-Lock Fix & Release Notes Update v3.2.1

## What changed

The FVL (FanHoardVerse Loader) fullscreen scroll-lock implementation, user-facing release notes, and developer documentation have been updated to ensure effective scroll locking and strict adherence to release workflow standards:

1. **Dual-Container Viewport Scroll Locking**: `ScrollLockManager` now locks both `document.documentElement` (`html`) and `document.body` with `overflow: hidden` and `overscroll-behavior: none` (plus `position: fixed` and scrollbar width compensation on body), addressing unconstrained viewport scrolling on modern standard HTML5 pages.
2. **Comprehensive Gesture & Key Interception**: Non-passive event listeners on `document` intercept `wheel`, `touchmove`, and navigation `keydown` events (Space, PageUp, PageDown, End, Home, Arrow keys), bypassing only `.fvl-scrollable` elements and editable input controls. Fullscreen overlay CSS enforces `touch-action: none`.
3. **Boot Loader Synchronization**: Synchronized scroll lock state during early boot loader adoption in `loading.js` and ensured clean release upon readiness handshake.
4. **Exact Style Restoration**: Saved and restored inline style attributes for both `documentElement` and `body`, detached event listeners, and restored original scroll position (`window.scrollTo(0, savedScrollY)`).
5. **User-Facing Release Notes & Docs Alignment**: Updated canonical user-facing release notes in `assets/md/en/current.md` and `assets/md/th/current.md` to `version: 3.2.1` consolidating unreleased rounds, and updated system documentation (`07-Loading-System.md`, `15-Loading-Contract-And-Test-Plan.md`, and `11-Release-Notes-System.md`).

## Files in this release

| File | Status | Purpose |
|---|---|---|
| `assets/js/loading-system/fvl-modules/utils.js` | MODIFIED | Dual-container scroll lock (`html` + `body`), non-passive event listeners (`wheel`, `touchmove`, `keydown`), exact style/offset restoration. |
| `assets/js/loading-system/fvl-modules/engine.js` | MODIFIED | Auto scroll-lock trigger on fullscreen and viewport-covering overlays, overlay ARIA modal attributes, focus trap/restore, Escape key handler. |
| `assets/js/loading-system/fvl-modules/renderer.js` | MODIFIED | ARIA roles (`role="dialog"`, `aria-modal="true"`, `role="progressbar"`), default spinner centering class (`.fvl-spinner--center`), inline `touch-action: none`. |
| `assets/css/loading-system.css` | MODIFIED | Fullscreen overlay `touch-action: none` and `overscroll-behavior: none` rules, `@media (prefers-reduced-motion: reduce)` rules. |
| `assets/js/nav-core-modules/loading.js` | MODIFIED | Boot loader adoption scroll-lock sync and handshake release logic. |
| `assets/md/en/current.md` | MODIFIED | Updated English user-facing release notes for v3.2.1. |
| `assets/md/th/current.md` | MODIFIED | Updated Thai user-facing release notes for v3.2.1. |
| `tests/loading-contract.test.ts` | MODIFIED | Unit tests for dual-container scroll lock, event interception, boot loader sync, and style restoration. |
| `fanhoard-docs/07-Loading-System.md` | MODIFIED | Corrected Scroll-Lock Architecture section and added Version History entry v3.2.1. |
| `fanhoard-docs/15-Loading-Contract-And-Test-Plan.md` | MODIFIED | Updated Scroll-Lock Contract (Section 2.9) and Test Seam (Seam 8). |
| `fanhoard-docs/11-Release-Notes-System.md` | MODIFIED | Clarified rule that every release must update user-facing release notes (`assets/md/{en,th}/current.md`). |
| `PATCH_NOTES.md` | MODIFIED | Updated patch summary notes in Thai. |
| `CHANGES.md` | MODIFIED | Updated release changelog in English. |
