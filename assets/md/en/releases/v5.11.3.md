---
version: 5.11.3
date: 2026-10-17T21:43:08.403Z
notify: true
title: Update history is complete again, with real release times
subtitle: Versions that were missing from the update history are back, and every release shows the exact time it was released.
---

**TL;DR** — The update history stopped recording new versions after 5.8.0, and some releases did not show a release time. Both problems are fixed, and the system now records the release time automatically so they cannot happen again.

### Fixed

- **Missing update history** Versions from 5.9.0 onwards were missing from the update history. They are all back.
- **No release time shown** The update list and each version now show the exact time that version was released. The time is recorded automatically when a version is released and can never change afterwards.
- **Two wrong times corrected** The times shown for 5.8.0 and 5.8.1 were the time of a rebuild, not the real release time. They now show the real times.
