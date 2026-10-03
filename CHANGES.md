# Popup & Modal Redesign v3.2.17 (r04)

## What changed in v3.2.17 (Popup/modal + loading system on Design Language v3)

### Real bugs fixed
1. **Malformed CSS block (popup.css lines 210-217)** — the "WCAG AA Small Text Teal Overrides" selector list ended with a bare `.fp-popup` and no braces, so CSS parsing swallowed the `.fp-alert-body` rule into the same selector chain: every `.fp-popup` inherited `color:#334155` (low-contrast in dark) and `padding:16px 0`. Block completed correctly (small/badge/tag/teal meta → `--color-brand-hover`), `.fp-popup` no longer in the chain.
2. **Five ghost tokens in theme.js** — light/brand themes referenced `--fv-text-heading`, `--fv-text-muted`, `--fv-text-body`, `--fv-border-default`, `--fv-border-teal-strong`, `--fv-brand-cyan-accent`, `--fv-radius-md`, `--fv-shadow-lg`: none defined in tokens.css (same class of bug as r02's `--fv-surface-nav`). All now point to real tokens (text-main/text-faint/text-muted/border-subtle/border-brand/color-teal-400/radius-xl/shadow-lg).
3. **Off-brand dark popup palette** — dark theme used `#1a1f2e` navy family with `#e8edf5` text; now the exact site dark palette: bg `#1E293B` (slate-800), text `#F8FAFC` (slate-50), secondary `#CBD5E1`, muted `#94A3B8`.

### Design changes (popup.css)
- `.fp-popup` surface: radius 14px → `--radius-xl` (24px) via theme, border → `--border-subtle`, box-shadow none → `--shadow-lg`; bg → `--surface-card`
- `.fp-btn` + `.fp-close-btn` → `--radius-full` pills, 150ms `--transition-fast`
- `.fp-btn-primary:hover` `#00897b` → `--color-brand-hover`; secondary → `--text-main` + `--border-strong` + `--surface-hover` hover
- Alert/confirm body `#334155` → `--text-muted`
- Enter/exit motion: 6 position transitions (200/220ms ease) → `--transition-normal` (250ms standard); overlay fade → `--transition-normal`
- Side drawers → 24px leading edges; bottom sheet → `--radius-xl` top corners + `--surface-card` + pill grab handle
- Tooltip → `--radius-md` themed surface + `--shadow-md`; popover → `--radius-lg` themed + `--shadow-md`
- Fullscreen popup → `--fv-surface-page` canvas

### Behavior change (engine.js)
- Popups now **auto-follow the site theme**: default theme resolves from `data-theme` attr, falling back to `prefers-color-scheme` (previously hardcoded `'light'`).

### Loading system
- Surveyed: spinner (track/arc) already fully tokenized (teal primary) from the S-series; no progress bar component exists in the system — nothing to redesign there, nothing invented (no over-engineering).

## Verification

- `npx vitest run`: 234/234 green (37 files) | `npm run build`: clean | `npx playwright test e2e/scroll-lock.spec.ts`: 3/3
- Real-browser verification (Playwright, discover page, light + dark, dialog + confirm):
  - radius `24px` both types/themes; light bg `rgb(255,255,255)` + text `rgb(15,23,42)`; dark bg `rgb(30,41,59)` + border `rgb(51,65,85)` + shadow themed + text `rgb(248,250,252)`
  - Auto-theme confirmed: dark context renders dark palette popups
  - Alert/confirm body color = `--text-main` in light (the `#334155` leak is gone)
- Backup: `/app/.agents/archive/backup_r04_20261004.tar.gz` before edits.

## Files changed

| File | Change |
|------|--------|
| `assets/css/popup.css` | malformed block fixed; v3 surfaces/radius/pills/motion; themed tooltip/popover/sheet/fullscreen |
| `assets/js/popup-modules/theme.js` | ghost tokens → real tokens; dark palette → v3 slate; radius → 24px |
| `assets/js/popup-modules/engine.js` | popups auto-follow site theme (data-theme → prefers-color-scheme) |
| `assets/md/en/current.md`, `assets/md/th/current.md` | v3.2.17 release notes |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, loaders, HTML | release pipeline artifacts |
