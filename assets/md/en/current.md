---
version: 3.2.26
date: 2026-10-04T06:21:58.665Z
title: Loading That Truly Locks the Page
subtitle: The background can no longer scroll behind the fullscreen loading overlay — fixed at the root, plus a CSS safety net.
notify: true
---

**TL;DR** — The page behind the fullscreen loading overlay is now truly frozen while the overlay is visible, and unlocks cleanly when it disappears. Fixed at the root cause, with a CSS backstop so it stays fixed.

### Fixed

- **Real scroll lock** — the background no longer scrolls behind the fullscreen loading overlay while it is still visible, including during the short delay before the overlay fades out.
- **Single scroll-lock authority** — navigation no longer force-clears the page's inline lock styles; every lock and unlock now goes through the shared ScrollLockCore, so popups, search and loading overlays can never unlock each other.
- **CSS safety net** — a backstop rule freezes the page whenever the lock state is active, even if a script error ever loses the inline styles.
- **Error recovery** — if a page fails to load, the error screen now always releases the scroll lock first, so the page never stays frozen behind an overlay.
