---
version: 3.0.4
date: 2026-09-30T05:55:00.000Z
title: Search page now recovers on its own after a refresh
subtitle: If the data files fail or time out during a refresh, the page used to stay blank forever until you searched again. It now retries, clears the bad cache and shows results on its own.
notify: true
---

**TL;DR** — The site's security header still whitelisted the report server's old address, so real browsers quietly blocked the report form from sending anything. The header now matches the report server actually in use, and submissions go through.

### Fixed

- **Security policy now allows the report server**
  The Content-Security-Policy header whitelisted a retired report-server domain, so browsers blocked the form's request to the current server before it was ever sent. The whitelisted address now matches the report server the site actually uses, and report submissions complete successfully.
