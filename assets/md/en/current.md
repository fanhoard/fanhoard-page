---
version: 3.0.3
date: 2026-09-26T07:09:20.531Z
title: Report form was blocked by its own security policy
subtitle: The site's content security policy only allowed the report server's old address, so browsers silently blocked every submission. The policy now points at the live report server.
notify: true
---

**TL;DR** — The site's security header still whitelisted the report server's old address, so real browsers quietly blocked the report form from sending anything. The header now matches the report server actually in use, and submissions go through.

### Fixed

- **Security policy now allows the report server**
  The Content-Security-Policy header whitelisted a retired report-server domain, so browsers blocked the form's request to the current server before it was ever sent. The whitelisted address now matches the report server the site actually uses, and report submissions complete successfully.
