# Data Verse Redesign v3.2.19 (r06)

## What changed in v3.2.19 (Data Verse on Design Language v3)

### assets/css/nav-core-ext.css (discover feed)
- Feed cards: radius token changed `--radius-xl`→`--radius-lg` (16px per spec, since v3 tokens raised xl to 24px); hover gets `--shadow-sm` lift (was flat border-flip); box-shadow added to the card transition so the lift animates smoothly
- Focus rings (tiles, cards, sub-nav pills): 2px → v3 standard `3px solid rgba(13,148,136,0.35)` (3 controls)
- Active pill/tile surfaces: old material-teal fallback rgba(0,150,136,0.08) → rgba(13,148,136,0.08) (2 spots)
- Stale border fallbacks rgba(0,0,0,0.06) → rgba(15,23,42,0.08) (3 spots); tile radius fallback 12→16
- Nested var() weirdness simplified (text-main, border-strong, color-brand-primary); scrollbar thumb fallbacks fixed
- .card-image top corners follow the card radius (lg)

### assets/js/ure/ure.css (engine visual layer — positioning untouched)
- Skeleton shimmer gradient fallbacks: rgba(0,0,0,0.05)/0.12 → rgba(15,23,42,0.04)/0.10 (neutral v3 surface); skeleton radius fallback 8→12px
- ure-appear / ure-appear-fade curves: cubic-bezier(0.16,1,0.3,1) → v3 standard cubic-bezier(0.2,0,0,1) (2 spots)
- Render-error surface: old palette (#c0392b/#ffeaea/#ffd0d0/#fff5f5) → rgba(220,38,38) danger family (theme-agnostic tint)
- IRON RULE intact: `.ure-visible` wrappers still animate opacity ONLY (ure-appear-fade); the transform reveal stays on .cm-group/.feed-page content INSIDE positioned wrappers (by design, CLS-safe)

### assets/css/modern-styles.css (scope + bottom nav)
- Scope cards: fallbacks modernized (radius-lg 16, border-subtle v3, shadow-sm); note: pages use `.scope-card fv-card` — the global fv-card atom (24px radius-xl, zero resting shadow = S-series single-layer card standard) takes precedence, which IS the site-wide card language — verified and accepted
- Scope code block + kv colors: fallbacks → v3 palette (slate text, #fafafc base)
- Bottom nav: --nav-radius fallback 24px, item radius 8px; old material teal #009688 fallbacks → #0d9488 (stroke + ring border); active label → var(--color-brand-hover); teal-hover surface fallback → brand teal; border fallbacks → rgba(15,23,42,0.08)

## Verification

- `npx vitest run`: 234/234 green (37 files) | `npm run build`: clean
- Discover e2e suite + scroll-lock: 9 passed (discover-boot-lifecycle, discover-actions, card-markup-check, scroll-lock)
- Full e2e: 16/16
- Real-browser verification (Playwright, discover × light+dark × 375/768/1280 + scope × light+dark):
  - Discover: 180 tiles + 2 feed cards rendered; tiles/cards radius 16px, light rgb(255,255,255) / dark rgb(30,41,59), subtle borders; responsive grid 4 cols @375 → 6 cols @768/1280
  - Scope: fv-card atom standard confirmed (24px, themed bg, subtle border, zero resting shadow) in both themes
- Backup: `/app/.agents/archive/backup_r06_20261004.tar.gz` before edits.

## Files changed

| File | Change |
|------|--------|
| `assets/css/nav-core-ext.css` | feed cards/tiles: radius-lg + shadow-sm hover, v3 focus rings, old teal purge |
| `assets/js/ure/ure.css` | skeleton neutral surface, v3 appear curves, danger palette error state |
| `assets/css/modern-styles.css` | scope-card fallbacks, bottom-nav old-teal purge |
| `assets/md/en/current.md`, `assets/md/th/current.md` | v3.2.19 release notes |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, HTML/loaders | release pipeline artifacts |
