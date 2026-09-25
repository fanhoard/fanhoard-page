---
version: 3.0.2
date: 2026-09-25T11:55:00.000Z
title: Report form now speaks the backend's language
subtitle: The report form was sending fields the server could not read, so every submission bounced. Field names now match, and errors tell you what actually happened.
notify: true
---

**TL;DR** — The report form was filling in details under different field names than the server expects, so reports were rejected even when everything looked fine. The form now uses the correct fields, and failure messages explain the real cause instead of always blaming your internet connection.

### Fixed

- **Report submissions no longer rejected for mismatched field names**
  The form labeled its data differently than the backend reads it (details vs. message, app_version vs. version, lang vs. language), so valid reports were turned away. All fields now use the names the server expects, and extra device info (screen size, viewport) is included where the server can use it.

- **Honest error messages instead of "check your connection"**
  Every failure, including server-side problems, used to show the same "please check your network connection" message. Now the form reports what actually happened: server not ready, sending too quickly, or invalid form details.
