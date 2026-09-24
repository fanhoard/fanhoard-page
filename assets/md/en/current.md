---
version: 3.0.0
date: 2026-09-24T12:00:00.000Z
title: New name FanHoard, a redesigned interface, and search that's 5× faster
subtitle: We renamed from Fantrove to FanHoard, refreshed the look of every page, and gave the search system its biggest stability and speed upgrade ever.
notify: true
---

**TL;DR** — The site has a new name: FanHoard. Every page got a visual refresh with a consistent design system, back/forward navigation now remembers your scroll position like a native app, and the search engine is over 5× faster with 20 stability defects fixed.

## A new name: FanHoard

The site formerly known as Fantrove is now FanHoard. Nothing else changed — same emojis, same links (your bookmarks still work), and everything you copied is still right where you left it. New name on the cover, same site inside.

## A redesigned interface, top to bottom

We rebuilt the design foundation from scratch, then polished every page to sit on one consistent standard — home, discover, search, settings, community pages, even the 404. Colors and contrast were tuned to meet WCAG AA so everything reads comfortably, and popups, dialogs, and toasts got a modern redesign.

## Back/forward navigation that behaves like an app

Press back (or swipe back) and the page remembers exactly where you scrolled to — you land right where you left off, not at the top. A refresh now takes you to the top, as it should. And the scroll-jank while lazy-loaded emojis stream in is gone.

## Loading where it matters, not full-screen flashes

Every navigation used to flash a full-screen loader, sometimes twice. Now the loading indicator appears only over the content that's actually loading, and first boot flows straight from the loading screen into content with no extra flashes.

## Search that's 5× faster and far more stable

The search system got a full engineering audit: 20 stability defects were fixed, including memory leaks and overly silent error handling. Repeating a previous query now answers in under 0.1ms (down from 42ms), brand-new queries run about 5× faster, and the search page passes accessibility checks with zero violations.

## Other improvements worth knowing

The discover feed packs more items per screen, the rapid-open-close popup freeze is fixed, and the update notice now shows once per version and then stays quiet.
