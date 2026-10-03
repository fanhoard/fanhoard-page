# Search Redesign v3.2.18 (r05)

## What changed in v3.2.18 (Search system on Design Language v3)

Note: a background executor had begun this task and went offline mid-way; its verified-quality partial CSS work was salvaged per rescue discipline and the task was completed on top of it (no work discarded, no duplicated edits).

### Design changes (assets/css/search.css + assets/js/search-system/search-system.css)
- Result cards: `--radius-lg` 16px, `--border-subtle`, resting `--shadow-sm`, hover lift (`--shadow-md` + brand-tinted border rgba(13,148,136,0.24) + `--surface-hover`)
- Search pill: true capsule, focus ring → v3 spec `0 0 0 3px rgba(13,148,136,0.35)` (was 2px/0.15 old teal)
- Suggestion items → rounded chips: `--radius-md` 12px, margin insets, `--surface-hover` hover, `--transition-fast` motion, 3px focus ring with -2px inset offset; keyboard focus verified in real DOM
- Suggestion badges → pill `--radius-full`; type badge material-green rgba(19,180,127)/#0f7a55 → brand teal rgba(13,148,136,0.12)/#0F766E; dark variant rgba(45,212,191,0.18)/#5EEAD4
- Overlay + sticky header motion → `--transition-fast`/`--transition-normal` standard (was 180/160/220ms old cubic-bezier curves)
- Old material teal (#009688 family) eliminated: focus ring, hover tints (rgba(0,150,136)→rgba(13,148,136) ×4), fallbacks
- Stale var fallbacks normalized (radius-lg 12→16, radius-md 16/20→12, radius-sm 10→8, border-subtle → rgba(15,23,42,0.08))

### IRON RULES verified
- URE wrappers: `ure-appear-fade` keyframes remain opacity-only (from{opacity:0} to{opacity:1}); no transform on `.ure-visible`
- e2e `search-refresh-regression.spec.ts`: 3/3 including the no-stacking guard

## Verification

- `npx vitest run`: 234/234 green (37 files) | `npm run build`: clean | full e2e: 16/16
- Real-browser verification (Playwright on vite preview, /search/?q=heart + overlay):
  - 12 result cards, ALL at distinct positions (tops 211/329/447/564/682 — no stacking) in light AND dark
  - Cards: radius 16px, light bg rgb(255,255,255)/dark rgb(30,41,59), border subtle/themed, shadow present
  - Search pill radius 9999px; suggestion chips radius 12px, 30 items in overlay
  - Keyboard nav: ArrowDown moves focus into suggestion items (activeElement verified)
- Backup: `/app/.agents/archive/backup_r05_20261004.tar.gz` before task start.

## Files changed

| File | Change |
|------|--------|
| `assets/css/search.css` | result cards, pill, focus rings, hover surfaces, stale fallbacks, old teal removal |
| `assets/js/search-system/search-system.css` | overlay motion, suggestion chips, badges, old teal removal |
| `assets/md/en/current.md`, `assets/md/th/current.md` | v3.2.18 release notes |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, loaders, HTML | release pipeline artifacts |
