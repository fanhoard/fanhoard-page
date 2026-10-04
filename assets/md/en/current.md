---
version: 3.3.5
date: 2026-10-04T08:26:38.000Z
title: Root Redirect Removed
subtitle: The site root serves the friendly 404 page again — the site never takes you home automatically.
notify: true
---

**TL;DR** — Following the owner's decision, the "/" → /home/ redirect from 3.3.3/3.3.4 is removed. The root once again shows the friendly 404 page, with the "Take Me Home" button for users who want it.

### Changed

- **Root redirect removed** — "/" now returns the custom 404 page (with the Take Me Home button) instead of auto-redirecting, restoring the original behavior and the permanent Google Search Console indexing fix.
- **All other routing untouched** — every other rule in the site's routing behaves exactly as before.
