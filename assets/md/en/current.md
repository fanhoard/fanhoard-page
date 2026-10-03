---
version: 3.2.1
date: 2026-10-03T13:00:00.000Z
title: Seamless Discover Spinner, System Polish, & Fullscreen Scroll Lock
subtitle: Integrated centered loading spinners across Discover and Search, introduced comprehensive accessibility and navigation stability polish, and enforced background scroll locking during fullscreen overlays.
notify: true
---

**TL;DR** — We integrated smooth, inline loading feedback across Discover and Search without disruptive screen flashes, implemented site-wide navigation and stability polish, and completely locked background page scrolling whenever a fullscreen loading overlay is open.

### New

- **Seamless inline spinners for Discover and Search transitions**
  When browsing categories in Discover or executing new search queries, lightweight centered loading spinners now appear directly inside the active content section instead of showing full-screen loading overlays or blank gaps. Search pending states and content rendering update smoothly with clear visual feedback.

### Improved

- **Comprehensive site polish, accessibility, and motion controls**
  Enhanced loading overlays with centered spinner options and dynamic scrollbar compensation to prevent layout shifts. Added keyboard navigation controls (ESC key support), screen reader ARIA roles, focus management, and `prefers-reduced-motion` support across all main site style sheets.
- **Navigational and data loader stability**
  Guarded history back/forward button transitions against out-of-order page state updates, added graceful fallback handling for network request errors on the home feed, and introduced passive scroll listeners and resize throttling to reduce browser CPU overhead.

### Fixed

- **Background page scrolling locked during fullscreen overlays**
  Opening a fullscreen loading overlay now reliably freezes all background scrolling across desktop and mobile devices. Scroll locks are now applied to both the HTML document root and body elements with touch and wheel gesture suppression, preventing background drift while restoring your exact scroll position when loading completes.
