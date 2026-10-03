# Global Consistency Sweep v3.2.24 (r11) — Final Code Round

## What changed in v3.2.24

### Shared components normalized to v3 (uncommitted r11 sweep, committed here)
- `assets/css/footer.css`: legacy `--ease-in-out`/`--ease-out` transition groups → `var(--transition-fast/normal)`; nested var() fallbacks simplified; 3 focus outlines → 3px solid rgba(13,148,136,0.35)
- `assets/css/back-to-top.css`: #009688 → #0d9488; hover fallback #00897b → #0F766E; enter/exit curves → transition tokens; outline → 3px teal
- `assets/css/base.css`: 2 ghost `--ease-out` transitions → transition tokens
- `assets/css/modern-styles.css`: #757575 → #475569
- `assets/js/footer-template.js` (from the audit worker): footer injection guard `footer.fv-footer` → `footer.fv-footer a` — an empty (linkless) footer no longer blocks re-injection

### REAL BUG FIXED — settings first-visit theme (found by the 14-page audit)
- `theme-core.js` `_getStoredTheme()` returned hardcoded `'dark'` when no preference stored ("FanHoard default theme is dark" — a v2-era decision). The other 13 pages follow the OS via CSS (`@media prefers-color-scheme { :root:not([data-theme="light"]) }`), so a fresh OS-light visitor got a DARK settings page while the rest of the site was light. Default changed to `'system'` — now resolves via matchMedia like every other page.
- `setting-ui.js` radio/effective fallbacks `'dark'` → `'system'` (consistency)
- `tests/settings-polish.test.ts` default pin updated 'dark' → 'system' per v3 spec (assertion structure unchanged, same class as the r03 timing pin)

### Audit false alarms cleared (no product change)
- 404 "white focus ring": outline-style is `none` (color=currentColor artifact in computed read); the skip-link indicates focus by appearing, standard pattern
- license "white ring": the first interactive element is a hidden Cookiebot iframe — not user-facing

## Full-site audit results (14 pages × light+dark, 1280 + 375 overflow spot-check)

All 28 combos: body themed (#FAFAFC light / #0F172A dark), footer present with 12 links (no dupes, no empty footers), 0 horizontal overflow at 1280 and 375, focus rings 3px teal on real interactive elements. Screenshots in `r11-shots/` (28 files, committed). Reduced-motion verified in r07 (0.00001s transitions).

| Page | Light | Dark | Overflow 1280/375 |
|---|---|---|---|
| 404 (/) | ✓ #FAFAFC | ✓ #0F172A | none |
| /home/ | ✓ | ✓ | none |
| /search/?q=heart | ✓ | ✓ | none |
| /setting/ | ✓ (fixed) | ✓ | none |
| /community/ | ✓ | ✓ | none |
| /community/contact/ | ✓ | ✓ | none |
| /community/report/ | ✓ | ✓ | none |
| /platform/about/ | ✓ | ✓ | none |
| /platform/license/ | ✓ | ✓ | none |
| /platform/privacy/ | ✓ | ✓ | none |
| /platform/roadmap/ | ✓ | ✓ | none |
| /platform/whats_new/ | ✓ | ✓ | none |
| /data/verse/discover/ | ✓ | ✓ | none |
| /data/verse/scope/ | ✓ | ✓ | none |

## Verification

- Unit 234/234 (37 files) | build clean | full e2e 16/16 (incl. scroll-lock 3/3, theme-toggle, report-submission)
- Live fix verification: fresh OS-light context → settings body #FAFAFC, radio=System, data-theme=light; fresh OS-dark → body #0F172A, radio=System, data-theme=dark

## Notes format

Release notes EN/TH use the parser-compatible `- **Bold** — desc` bullet format (in-app update modal renders full item lists).
