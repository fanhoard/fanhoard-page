---
version: 5.12.0
date: 2026-10-17T23:14:45.691Z
notify: true
title: Language switching now works in every browser, and every page shares one design system
subtitle: The red error box when changing language is gone for good, and all 14 pages load the same design system styles.
---

**TL;DR** — On some browsers, the site's security policy blocked the part of the site that translates the page, so changing the language showed a red error box and parts of the page stayed untranslated. That whole path is rebuilt and tested in a real browser, and every page now loads the design system the same way.

### Fixed

- **Red error box when changing language** The security policy of the site blocks small helper threads, and on some browsers the translator did not notice in time, showing a red error box instead of switching the language. The translator now notices both immediately and mid-way through, and finishes the translation on the main thread instead.
- **Half-translated pages** If the translator stopped mid-way, the sections still waiting could stay in the old language. Every pending section now completes even after such a failure.
- **Silently blocked stylesheet on every page** One small stylesheet was squeezed into the page in a way the security policy blocks, so it never loaded anywhere. All stylesheets now load as proper files.
- **Missing logos in Discover** The AI tool cards (OpenAI and Anthropic) on the Discover page had no logos. The logos are now included and load correctly.

### Changed

- **One design system for all pages** All 14 pages now load the design system stylesheet the same way, instead of a mix of page-specific methods.
- **Contact page** The contact page now shows a single status card saying the contact form is under development and will arrive in a future release.
