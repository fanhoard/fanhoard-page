---
version: 5.3.1
date: 2026-10-17T00:00:00.000Z
title: Search result cards now stay rounded on phones
subtitle: A small fix so search result cards keep their 28px rounded corners on narrow screens too.
notify: true
---

**TL;DR** — Search result cards were dropping to smaller corners on phone-width screens. They now keep the same 28px rounded corners everywhere.

### Fixed

- **Search result cards on phones** — On narrow screens the cards fell back to 16px corners instead of 28px. They now match the rounded look used on larger screens.
