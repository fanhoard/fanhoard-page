# Toasts & Feedback Redesign v3.2.16 (r03)

## What changed in v3.2.16 (Toast & feedback system on Design Language v3)

1. **`assets/css/popup.css` — fp-toast → v3 capsule**: radius 12px → `--radius-full` (pill), background hardcoded `#ffffff` → `--surface-card`, border → `--border-subtle`, box-shadow none → `--shadow-md`. Body padding rebalanced for pill (10px 20px) with medium-weight themed text. Variant color coding moved from the old 4px left border (broken look on a pill) to a decorative status dot via `.fp-body::before` using a per-variant `--fp-toast-dot` custom property: success emerald `--color-brand-accent` (#059669), error `--color-danger` (#dc2626), warning `--color-warning` (#d97706), info `--color-brand-primary` (teal, auto-themes to teal-400 in dark).
2. **`assets/js/copyNotification.js` — cn-capsule → v3**: radius 12px → `--radius-full`, all hardcoded colors tokenized (`--surface-card`, `--border-subtle`, `--shadow-md`, `--text-main`, `--color-brand-text`, `--text-muted`, `--font-sans`); fade-in 260→250ms; both inline transition curves → `cubic-bezier(0.2, 0, 0, 1)` (v3 standard). Previously this capsule was pure white with an invisible border in dark mode.
3. **`assets/js/popup-modules/config.js`**: `TOAST_ENTER` 320 → 250ms (v3 normal motion).
4. **`assets/js/popup-modules/renderer.js`**: warning toasts now announce `aria-live="assertive"` (matching error/danger); success/info stay `polite`. role/aria-atomic already existed.
5. **`tests/popup/popup-polish.test.ts`**: the timing-consistency test pinned the old 320ms toast enter; updated to the v3 spec value 250ms (same assertion structure, new spec).

## Verification

- `npx vitest run`: 234/234 green (37 files) | `npm run build`: clean
- Real-browser verification (Playwright on vite preview, discover page, light + dark):
  - All 4 variants × 2 themes: radius `9999px`, themed bg (light `rgb(255,255,255)` / dark `rgb(30,41,59)`), themed border (`rgb(51,65,85)` in dark), shadow present
  - aria-live: success/info `polite`, error/warning `assertive`, role `status`
  - Status dots render per variant (emerald/red/amber/teal, auto-themed)
  - Copy capsule: pill `9999px`, dark bg `rgb(30,41,59)` (the hard-white-in-dark bug is gone), themed text colors, `polite`
- Backup: `/app/.agents/archive/backup_r03_20261004.tar.gz` before edits.

## Files changed

| File | Change |
|------|--------|
| `assets/css/popup.css` | fp-toast → pill capsule, themed surface, shadow, variant status dots |
| `assets/js/copyNotification.js` | cn-capsule → themed pill, tokenized colors, 250ms standard motion |
| `assets/js/popup-modules/config.js` | TOAST_ENTER 320 → 250ms |
| `assets/js/popup-modules/renderer.js` | warning toasts aria-live assertive |
| `tests/popup/popup-polish.test.ts` | toast enter timing pin updated to v3 spec (250ms) |
| `assets/md/en/current.md`, `assets/md/th/current.md` | v3.2.16 release notes |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, loaders, HTML | release pipeline artifacts |
