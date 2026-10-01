---
version: 3.0.9
date: 2026-10-01T22:31:05.341Z
title: Loading spinner no longer vanishes during content switches
subtitle: Fixed a brief blank gap that appeared in the content area whenever the site swapped content (navigation, refresh) on a slow connection.
notify: true
---

**TL;DR** — While new content was being fetched, the spinner lived inside a container that had just been emptied. When that container's height collapsed to zero, the spinner disappeared with it and you saw a blank area until the content arrived. The loader now keeps the container from collapsing, so the spinner stays visible the whole time.

### Fixed

- **Spinner stays visible while content loads during a swap**
  The content-scoped loading overlay is positioned inside the content container. Swapping content empties that container first, which collapsed the overlay and left a blank content area for the duration of the fetch. The loading system now holds a minimum height on the container while it is empty and a loader is active, then restores the original value once loading finishes.
  - Applies only when the content container is actually empty; pages with content render exactly as before.
  - Multiple concurrent loaders on the same area coordinate so the height is restored only after the last one finishes.

### For developers

- New frozen config block `CONFIG.SCOPED_EMPTY_MIN_HEIGHT` (`THRESHOLD_PX: 240`, `MIN_HEIGHT: '60vh'`) in `fvl-modules/config.js`.
- Scoped attach/restore in `fvl-modules/engine.js` now resolves the target's window via `ownerDocument.defaultView` (fixes restore inside sandboxed/test windows).
- New test suite `tests/loading-scoped-fallback.test.ts` (5 cases). Full battery green: vitest 130/130, lint, build, Playwright 12/12.
