---
version: 3.2.2
date: 2026-10-03T13:38:00.000Z
title: Boot Loader Scroll-Lock Fix & Reliable Unlocking
subtitle: Resolved scroll-lock inversion where background page remained scrollable during boot loading and got stuck locked after loading finished.
notify: true
---

**TL;DR** — We fixed a scroll-lock inversion issue during page boot and loading transitions. Background page scrolling is now strictly locked from the earliest boot phase and guaranteed to unlock immediately after loading completes across all completion paths.

### Fixed

- **Scroll-lock inversion during boot loader and loading transitions**
  Fixed an issue where the background page could still scroll while the initial boot loader was displayed, but became stuck in a locked state after loading finished. Scroll locking is now enforced from the earliest boot phase, and all loading completion pathways (including readiness handshake and boot loader removal) reliably release the lock so the page scrolls normally immediately after loading.
