# FanHoard Fullscreen Scroll-Lock Inversion Fix & Release Notes Update v3.2.2

## What changed

The FVL (FanHoardVerse Loader) fullscreen scroll-lock implementation and developer documentation have been updated to resolve an inverted scroll-lock bug and ensure strict lock/unlock call-pair invariance across all boot adoption and loading lifecycles:

1. **Inverted Scroll-Lock Bug Fix**: Resolved root cause where the background page remained scrollable during early boot loading (before module init) and became permanently locked after loading disappeared (due to missing FVL instance lookup during boot adoption handshake).
2. **Early Boot Lock at Module Load**: Added early boot lock checks during IIFE module initialization in `assets/js/loading-system/fvl-modules/engine.js` (line 673) and `assets/js/nav-core-modules/loading.js` (line 131) to lock page scrolling as soon as `#fv-boot-loader` or `#nc-early-overlay` is detected.
3. **Balanced Boot-Adoption & Handshake Unlock**: Added `_ensureBootLock()` and `_releaseBootLock()` to `LoadingService`, and `_cleanBootLock()` to `Engine`, ensuring boot lock reference count (`_bootScrollLocked`) is tracked symmetrically and released unconditionally during `readinessHandshake()`, `hideInstant()`, `_forceReset()`, or direct fallback `window.__removeBootLoader` calls.
4. **Lock/Unlock Call-Pair Invariant & Regression Tests**: Verified that all lock triggers (`lockMgr.lock()`) have corresponding release triggers (`lockMgr.unlock()`). Added 4 dedicated regression tests in `tests/loading-contract.test.ts` covering boot loader adoption, early module init locking, multi-show ref-counting, and transition sequences.
5. **Developer Documentation & System Contract Updates**: Updated system documentation in `fanhoard-docs/07-Loading-System.md` and `fanhoard-docs/15-Loading-Contract-And-Test-Plan.md` with Scroll-Lock Architecture details, boot loader adoption lifecycle contracts, call-pair invariants, regression test seam definitions, and version history entries for `v3.2.2`.

## Files in this release

| File | Status | Purpose |
|---|---|---|
| `assets/js/nav-core-modules/loading.js` | MODIFIED | Boot loader adoption scroll-lock balance (`_ensureBootLock`, `_releaseBootLock`), `__removeBootLoader` wrapper, and handshake release logic. |
| `assets/js/loading-system/fvl-modules/engine.js` | MODIFIED | Early boot lock check at module load (`engine.js:673`) and `_cleanBootLock()` release trigger in `readinessHandshake()`. |
| `tests/loading-contract.test.ts` | MODIFIED | Inverted scroll-lock regression test suite covering boot adoption, early init lock, ref-counting symmetry, and transition sequences. |
| `fanhoard-docs/07-Loading-System.md` | MODIFIED | Updated Scroll-Lock Architecture section with boot loader adoption lock lifecycle and added Version History entry v3.2.2. |
| `fanhoard-docs/15-Loading-Contract-And-Test-Plan.md` | MODIFIED | Updated Scroll-Lock Contract (Section 2.9) with call-pair invariant and Test Seam 8 with inverted-symptom regression tests. |
| `PATCH_NOTES.md` | MODIFIED | Updated patch summary notes in Thai for v3.2.2 fix release. |
| `CHANGES.md` | MODIFIED | Updated release changelog in English for v3.2.2 fix release. |
