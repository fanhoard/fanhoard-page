---
version: 3.0.0
date: 2026-09-24T05:20:16.195Z
title: New name FanHoard, a redesigned interface, and search that's 5× faster
subtitle: We renamed from Fantrove to FanHoard, refreshed the look of every page, and gave the search system its biggest stability and speed upgrade ever.
notify: true
---

**TL;DR** — The site has a new name: FanHoard. Every page got a visual refresh with a consistent design system, back/forward navigation now remembers your scroll position like a native app, and the search engine is over 5× faster with 20 stability defects fixed.

### New

- **A new name: Fantrove is now FanHoard**
  The site formerly known as Fantrove is now FanHoard. Nothing else changed — same emojis, same links (your bookmarks still work), and everything you copied is still right where you left it. New name on the cover, same site inside.

- **A redesigned interface, top to bottom**
  We rebuilt the design foundation from scratch, then polished every page to sit on one consistent standard — home, discover, search, settings, community pages, even the 404. Colors and contrast were tuned to meet WCAG AA, and popups, dialogs, and toasts got a modern redesign.

- **Back/forward navigation that behaves like an app**
  Press back (or swipe back) and the page remembers exactly where you scrolled to — you land right where you left off, not at the top. A refresh now takes you to the top, as it should.

- **Loading where it matters, not full-screen flashes**
  Every navigation used to flash a full-screen loader, sometimes twice. Now the loading indicator appears only over the content that's actually loading, and first boot flows straight from the loading screen into content with no extra flashes.

### Improved

- **Search that's over 5× faster**
  Repeating a previous query now answers in under 0.1ms (down from 42ms) thanks to a new results cache, brand-new queries run about 5× faster via a bucket index that only scans plausible candidates, and typing feels snappier with 30–50ms less input latency.

- **A denser discover feed**
  The grid was retuned to fit more items per screen at every size, phantom gaps inside category groups are gone, and every button on the discover page is now uniform.

- **Update notices show once per version**
  You see the what's-new notice once; after you dismiss it, it stays quiet instead of popping up on every page.

### Fixed

- **20 stability defects eliminated**
  The search and discover systems got a full engineering audit: memory leaks, listeners that accumulated and were never removed, and overly silent error handling are all fixed. Console errors during normal use are now zero.

- **No more popup freeze on rapid toggling**
  The freeze when quickly opening and closing popups — and the desynced state that followed — is fixed.

- **Full WCAG 2.2 accessibility compliance**
  Home, discover, and search pages pass axe-core scans with zero violations. The search box now has proper combobox and listbox roles, and focus returns to the input when the suggestion overlay closes.
