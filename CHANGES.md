# Navigation Redesign v3.2.15 (r02)

## What changed in v3.2.15 (Navigation on Design Language v3)

1. **Dark-mode top bar fix (9 pages)** — `assets/css/top-navigation-bar.css` referenced `--fv-surface-nav`, a token that was never defined anywhere, silently falling back to `#ffffff` in every theme. About, License, Privacy, Roadmap, What's New, Community, Contact, Report and Data Verse Scope therefore rendered a hard white bar in dark mode. Now uses `--fv-surface-page` (theme-aware).
2. **Top bar border tokenized** — hard-coded `rgba(0,0,0,0.06)` divider (invisible in dark) → `var(--border-subtle)`.
3. **Back button pill** — radius `--fv-radius-sm` → `--radius-full` (circular touch target); `:active` background `rgba(0,0,0,0.07)` → `var(--surface-hover)` (theme-aware).
4. **One motion language** — all previously hard-coded `180ms cubic-bezier(0.16,1,0.3,1)` transition curves in `nav-core.css` (main pill tabs), `nav-core-ext.css` (sub-nav pills, content tiles, feed cards — 10 curves) and `top-navigation-bar.css` (back button + icon — 4 curves) normalized to `var(--transition-fast)` = 150ms `--ease-standard`.
5. **Iron rule preserved** — the springy `.active` underline animation (`transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)` overshoot, restored in v3.2.13) is untouched; asserted in code before writing and verified in the browser afterwards.
6. Everything else (active pill tint, teal accents, radius bumps to 12/16/24px, subtle borders, #FAFAFC header canvas) shifted automatically through the v3 tokens from r01 — verified rather than assumed.

## Verification

- `npx vitest run`: 234/234 green (37 files) | `npm run build`: clean | `npx playwright test e2e/scroll-lock.spec.ts`: 3/3
- Effective-DOM check (Playwright, discover page, light+dark × 375/768/1280 = 6 combos):
  - header bg light `rgb(250,250,252)` / dark `rgb(15,23,42)` ✓
  - nav button transition `0.15s cubic-bezier(0.2, 0, 0, 1)` ✓ (all 6 combos)
  - active pill: teal text + tinted bg + teal border, themed ✓
  - `.active::after` = `transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)` — spring intact in all 6 combos ✓
- Top bar dark fix on `/platform/about/`: nav bg `rgb(15,23,42)`, border `rgb(51,65,85)`, back button radius `9999px` ✓

## Files changed

| File | Change |
|------|--------|
| `assets/css/top-navigation-bar.css` | themed surface + border, pill back button, 150ms motion |
| `assets/css/nav-core.css` | main tab motion → --transition-fast (springy underline untouched) |
| `assets/css/nav-core-ext.css` | sub-nav/content-tile/feed-card motion → --transition-fast (10 curves) |
| `assets/md/en/current.md`, `assets/md/th/current.md` | v3.2.15 release notes |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, loaders, HTML | release pipeline artifacts |
