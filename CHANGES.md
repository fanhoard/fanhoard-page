# FanHoard Design Language v3 Foundation v3.2.14

## What changed in v3.2.14 (Design Token Foundation — White-First, High-Radius)

First release of the full-site visual redesign: the design token foundation every page and component reads from now speaks FanHoard Design Language v3.

1. **White-first page canvas (`assets/css/tokens.css`)**:
   `--surface-base` light theme moved from slate-50 (`#f8fafc`) to the soft off-white `#FAFAFC`; cards stay pure white (`--surface-card: #ffffff`) floating on the canvas. `--fv-surface-page` now resolves to the page canvas (distinct from cards) in both light and dark themes — dark keeps `#0F172A` page / `#1E293B` card parity via the existing ThemeCore system.

2. **Radius scale raised (`assets/css/tokens.css`)**:
   `--radius-sm` 6→8px, `--radius-md` 8→12px, `--radius-lg` 12→16px, `--radius-xl` 16→24px, `--radius-2xl` 24→28px (xs 4px and pill 9999px unchanged). Because every component references the tokens, the entire site becomes high-radius in one move.

3. **Subtle borders (`assets/css/tokens.css`)**:
   Light `--border-subtle` slate-200 → `rgba(15, 23, 42, 0.08)`; `--border-strong` slate-300 → `rgba(15, 23, 42, 0.16)`. Dark borders unchanged.

4. **Softer shadows & focus ring (`assets/css/tokens.css`)**:
   `--shadow-sm/md/lg` tuned to the v3 layering spec (md `0 4px 16px -2px rgba(0,0,0,.08)`, lg `0 12px 32px -4px rgba(0,0,0,.12)`); focus ring alpha 0.45 → 0.35.

5. **Standardized motion (`assets/css/tokens.css`)**:
   Added `--ease-standard: cubic-bezier(0.2, 0, 0, 1)`; composite `--transition-fast/normal/slow` now use it (150/250/350ms kept). `--ease-out`/`--ease-in-out` remain defined for direct references. The nav `.active` springy underline animation from v3.2.13 is untouched (hardcoded curves, not token-driven).

6. **Shell buttons go pill (`assets/css/base.css`)**:
   `.btn-primary` / `.btn-secondary` border-radius now `var(--radius-full)` (9999px pill) per the v3 high-radius language.

## Verification

- `npx vitest run`: 234/234 tests green across 37 test files (no tests assert token values — confirmed by grep before editing).
- `npm run build`: SSG + Vite clean, 16 sitemap entries.
- Effective-DOM verification on `vite preview` (Playwright, 1280×900): light body computed `rgb(250,250,252)` + text `rgb(15,23,42)`, primary button radius `9999px`; dark discover body `rgb(15,23,42)`. Screenshots captured in v3-shots/ during QA (not committed).
- All existing custom-property names kept working (aliases untouched); 20+ dependent CSS files needed zero edits by design.

## Files changed in v3.2.14

| File | Change |
|------|--------|
| `assets/css/tokens.css` | Design Language v3.0: white-first canvas, raised radius scale, subtle borders, softer shadows, --ease-standard, fv-surface-page=canvas |
| `assets/css/base.css` | Shell buttons (.btn-primary/.btn-secondary) → pill radius |
| `assets/md/en/current.md`, `assets/md/th/current.md` | v3.2.14 release notes |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, loaders, HTML | Release pipeline artifacts |
