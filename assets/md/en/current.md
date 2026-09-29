---
version: 3.0.5
date: 2026-09-30T06:35:00.000Z
title: Refresh now shows result cards even when the renderer loads late
subtitle: When you refreshed the search page with a query in the URL, the results counter showed but the cards never appeared until you searched again. The renderer now waits for the render engine and draws the cards on its own.
notify: true
---

**TL;DR** — The site's security header still whitelisted the report server's old address, so real browsers quietly blocked the report form from sending anything. The header now matches the report server actually in use, and submissions go through.

### Fixed

- **Security policy now allows the report server**
  The Content-Security-Policy header whitelisted a retired report-server domain, so browsers blocked the form's request to the current server before it was ever sent. The whitelisted address now matches the report server the site actually uses, and report submissions complete successfully.
