---
version: 3.0.6
date: 2026-09-30T07:45:00.000Z
title: Search system restructure: clearer names, same behavior
subtitle: Internal code names were cleaned up for easier development (search-controller, search UI controller). No visual or functional change.
notify: true
---

**TL;DR** — The site's security header still whitelisted the report server's old address, so real browsers quietly blocked the report form from sending anything. The header now matches the report server actually in use, and submissions go through.

### Fixed

- **Security policy now allows the report server**
  The Content-Security-Policy header whitelisted a retired report-server domain, so browsers blocked the form's request to the current server before it was ever sent. The whitelisted address now matches the report server the site actually uses, and report submissions complete successfully.
