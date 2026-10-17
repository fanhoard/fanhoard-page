---
version: 3.0.4
title: Update history is sorted correctly
subtitle: Past updates are now listed newest first by version number, and missing entries can be rebuilt.
notify: false
---

**TL;DR** — The list of past updates is now ordered by version number, and the release tool can rebuild entries that were never saved.

### Fixed

- **Update history order** Past updates are listed by version number, newest first, instead of by a date that could be wrong.
- **Missing past updates** The release tool can now rebuild entries that were never saved, using the project's own change history.
