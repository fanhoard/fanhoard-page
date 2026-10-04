---
version: 3.3.4
date: 2026-10-04T08:15:36.782Z
title: Root Redirect Fix
subtitle: The root-to-home redirect announced in 3.3.3 now actually ships in the build output — a build-pipeline miss, now corrected.
notify: true
---

**TL;DR** — The root redirect from the previous release didn't reach the deployed site because the rules file is generated at build time. The generator now includes it, so "/" will redirect to /home/ once this build goes live.

### Fixed

- **Root redirect now ships** — the "/" → /home/ 302 rule was added to the wrong file (a dev-only copy); it is now generated into the build output the site actually serves.
