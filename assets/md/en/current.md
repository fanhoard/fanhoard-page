---
version: 6.2.1
date: 2026-10-18T10:07:15.568Z
notify: true
title: Central pages removed
subtitle: Addresses without a language code no longer serve any page. Only /en/ and /th/ addresses exist.
---

**TL;DR** — Following up on v6.2.0: leftover central (language-less) pages are now removed from the build entirely. Opening an address without /en/ or /th/ now lands on the not-found page instead of showing page content.

### Changed

- **No central pages** Every page now exists only under its language address (/en/... and /th/...). The unprefixed copies of pages are gone from the server.
- **Clear not-found behavior** Opening an address without a language code shows the not-found page with a working link to the English home page.
- **Footer and error page links fixed** All links on the not-found page and the footer now point to proper language addresses, so nothing leads to a dead end.
