---
version: 3.3.3
date: 2026-10-04T08:04:29.595Z
title: Root Now Takes You Home
subtitle: The site root now redirects straight to the home page — a small detail that makes getting in (and checking the site) smoother.
notify: true
---

**TL;DR** — Visiting the site root ("/") now redirects directly to the home page instead of showing the 404 page. All other unknown addresses keep the friendly 404 page exactly as before.

### Changed

- **Root redirect** — "/" now redirects to /home/ (temporary 302), so opening the site always lands on the real home page.
- **404 behavior preserved** — every other unknown address still shows the friendly 404 page with the link home, exactly as before.
