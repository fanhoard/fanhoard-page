---
version: 6.2.0
date: 2026-10-18T09:59:59.973Z
notify: true
title: No more automatic language redirects
subtitle: Pages without a language code now stay exactly where they are, which also fixes Google Search Console redirect issues.
---

**TL;DR** — The site no longer moves you to a language-coded address on its own. Links are no longer rewritten behind the scenes, and your browser language no longer decides anything at load time. You change language only with the language menu.

### Changed

- **No automatic redirects** Opening any page without a language code (for example /home/) keeps you right there. No silent switch to /en/ or /th/ anymore.
- **Links stay as written** Internal links are no longer automatically rewritten to add a language code while you browse.
- **Your choice still works** Picking a language from the language menu still takes you to that language's address, exactly as before.
- **Search engine friendly** With the automatic redirects gone, pages no longer register as "Page with redirect" in Google Search Console.
