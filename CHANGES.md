# FanHoard Popup System Polish v3.2.7

## What changed in v3.2.7 (Popup System Polish)

Elevated the Popup System (dialogs, alerts, confirms, bottom sheets, drawers, toasts, tooltips, popovers, and full-screen overlays) to top-platform standards:

1. **Animation Timing & Preset Easing Consistency**: Aligned open and close animation durations and transition curves across all popup presets (dialog, sheet, drawer, toast, fullscreen) with smooth `cubic-bezier(0.4, 0, 0.2, 1)` enter and `cubic-bezier(0.4, 0, 1, 1)` exit transitions.
2. **Hardened Focus Trap & Keyboard Focus Management**: Fixed focus trap element resolution by exporting `AUTO_FOCUS_SELECTOR` in `config.js` and filtering hidden/disabled elements, enabling smooth Tab and Shift+Tab focus wraparound across all interactive controls.
3. **Toast Status Variants & Visual Accents**: Introduced typed toast notification helper methods (`toast.success`, `toast.error`, `toast.warning`, `toast.info`) with custom status border accents and live announcer screen reader feedback.
4. **ESC Key & Overlay Click Protection**: Hardened Escape key handling to ignore default-prevented widget keypresses, and updated backdrop clicks to track `mousedown` targets so text selection dragging inside popups does not trigger accidental backdrop dismissal.
5. **Accessibility & Reduced Motion Enforcement**: Added `aria-modal="true"`, `aria-live` and `aria-atomic` status attributes for screen readers, high-contrast `:focus-visible` ring styling, and explicit `@media (prefers-reduced-motion: reduce)` zero-animation overrides.
6. **Automated Popup Polish Test Suite**: Created dedicated unit test suite `tests/popup/popup-polish.test.ts` validating popup module Exports, Focus Trap, Toast Variants, Backdrop Guard, Keyboard Accessibility, and Animation curves.

## Files in v3.2.7

| File | Status | Purpose |
|---|---|---|
| `assets/js/popup-modules/a11y.js` | MODIFIED | Hardened focus trap element resolution, auto-focus handling, and screen reader announcements. |
| `assets/js/popup-modules/animator.js` | MODIFIED | Unified animation duration constants and cubic-bezier enter/exit easing curves. |
| `assets/js/popup-modules/config.js` | MODIFIED | Exported `AUTO_FOCUS_SELECTOR` and default configuration defaults. |
| `assets/js/popup-modules/engine.js` | MODIFIED | Added typed toast variants (`toast.success`, `error`, `warning`, `info`) and status handlers. |
| `assets/js/popup-modules/init.js` | MODIFIED | Clean lifecycle event binding, Escape key handling, and backdrop click guard. |
| `assets/js/popup-modules/overlay.js` | MODIFIED | Stacking z-index tracking and ScrollLockCore integration verification. |
| `assets/js/popup-modules/renderer.js` | MODIFIED | ARIA attribute injection (`aria-modal`, `aria-live`) and toast variant border DOM styling. |
| `assets/js/popup-modules/utils.js` | MODIFIED | Utility functions for DOM queries and focusable element resolution. |
| `assets/css/popup.css` | MODIFIED | Toast variant border accents, focus-visible rings, and prefers-reduced-motion rules. |
| `tests/popup/popup-polish.test.ts` | NEW | Unit test suite for popup polish, focus trap, toast variants, and accessibility. |
| `assets/md/en/current.md` | MODIFIED | Release notes for v3.2.7 in English. |
| `assets/md/th/current.md` | MODIFIED | Release notes for v3.2.7 in Thai. |
| `CHANGES.md` | MODIFIED | Release changelog covering v3.2.7 popup system polish in English. |
| `PATCH_NOTES.md` | MODIFIED | Release patch summary covering v3.2.7 popup system polish in Thai. |
