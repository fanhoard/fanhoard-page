# Settings Redesign v3.2.21 (r08)

## What changed in v3.2.21 (Settings on Design Language v3)

### setting/index.html
- New Appearance block at the top of the settings group: accessible `fieldset` (aria-label + sr-only legend) with 3 radio choice cards — System ◐ / Light ☀ / Dark ☾ — sr-only inputs, visual card labels (44px+ touch targets preserved)
- theme-core.js now loads early (head) on the settings page for correct ThemeCore wiring

### assets/css/setting.css
- `.fv-setting-group`: white/dark surface card, --radius-lg 16px, subtle border, shadow-sm
- `.theme-choice-card`: 12px rounded choice cards; selected state = teal border + brand tint via color-mix 9% + brand-hover text; hover --surface-hover; transitions on --transition-fast; reduced-motion off
- Focus rings v3: 3px rgba(13,148,136,0.35) on choice cards (via input:focus-visible), selects, language button, buttons, toggle slider
- Selects/buttons hover: --surface-hover + subtle border; section labels on type scale (18px semibold); mobile 480px tightening

### assets/js/setting-system/setting-ui.js
- `setupThemeControl()` gains a radio-based path: syncs checked state from ThemeCore.getTheme(), on change calls ThemeCore.setTheme(value, {transition:true}) + success toast, listens `fv:themechange` to stay in sync; legacy switch path kept as fallback when radios absent

## Behavior notes
- System choice resolves via ThemeCore to OS preference (stored `fv_theme: "system"`, effective theme applied to DOM)
- Choice persists across reload (fv_theme); language button + selects restyled but untouched logically
- Save feedback toast uses the r03 toast system

## Verification

- Unit 234/234 (37 files) | build clean | full e2e 16/16 (incl. theme-toggle journey)
- Real browser (dark OS context): groups 16px white/#1E293B surfaces, choice cards 12px; picked Light → data-theme=light + fv_theme=light + toast; reload → still light, radio=light, body #FAFAFC; picked System → fv_theme=system, effective dark (OS); focus-visible on choice = 3px solid rgba(13,148,136,0.35) teal
- Version update popup (notify:true) renders on first load and dismisses cleanly

## Files changed

| File | Change |
|------|--------|
| `setting/index.html` | Appearance fieldset UI, early theme-core load, v3.2.21 asset strings |
| `assets/css/setting.css` | card groups, theme choice cards, v3 focus rings, hover states |
| `assets/js/setting-system/setting-ui.js` | radio theme control wired to ThemeCore |
| `assets/md/en/current.md`, `assets/md/th/current.md` | v3.2.21 release notes |
| `assets/md/{en,th}/releases/v3.2.20.md, v3.2.21.md`, `assets/json/version.json`, HTML assets strings, `assets/md/{en,th}/releases/index.json` | release pipeline registry (incl. previously untracked v3.2.20 entries) |
