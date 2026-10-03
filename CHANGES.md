# Platform Pages Polish v3.2.23 (r10)

## What changed in v3.2.23 (Platform pages on Design Language v3)

### assets/css/about.css (about/license/privacy share it)
- Old material teal fallbacks `#009688` ×4 → `#0d9488` (h1/links/accents — resolved via token now)
- Focus ring 2px → v3 `3px solid rgba(13,148,136,0.35)`; `radius-sm` fallback 4px → 8px; `150ms ease-out` fallback → `150ms ease`; hairline fallback rgba(0,0,0,0.06) → rgba(15,23,42,0.08)

### assets/css/roadmap.css
- Muted fallbacks `#757575` ×5 (timeline dots, labels) → `#475569`; hairlines → rgba(15,23,42,0.08); nested var() doubled fallbacks simplified. Unboxed Read-surface timeline layout kept intentionally (consistent with the site's low-noise content pages)

### assets/css/new.css (What's New)
- Old teal `#009688` ×6 → `#0d9488` (banner, badges, current-release divider, focus); muted `#757575` ×5 → `#475569`
- `.wn-time-chip`: hardcoded `#0f766e` text → `--color-brand-hover`; background `var(--teal-50, #f0fdf4)` (greenish legacy tint) → `rgba(13,148,136,0.09)` teal tint working in both themes; chip border old rgba(0,150,136,0.2) → rgba(13,148,136,0.2)
- `.wn-history-label` `#0f766e` → `--color-brand-hover`
- Focus ring 2px → 3px rgba(13,148,136,0.35)

### Hotfix included (commit 47c2fc4, pre-release)
- v3.2.22 release notes rewritten in the parser-compatible `- **Title** — desc` bullet format — the in-app update modal's parseMD requires bold-titled bullets; plain bullets produced an empty item list in the user-facing dialog. Registry copies v3.2.22 regenerated; unit tests 234/234 restored.

## Verification

- Unit 234/234 (37 files, incl. version-notification parser suite) | build clean | full e2e 16/16
- Real browser (Playwright, light+dark × 5 pages): bodies themed (#FAFAFC / #0F172A); headings/links teal themed (light #0D9488 / dark teal-400); What's New version badge pill 9999px teal; time chips teal tint rgba(13,148,136,0.09) + brand-hover text both themes

## Files changed

| File | Change |
|------|--------|
| `assets/css/about.css`, `roadmap.css`, `new.css` | v3 normalization: old-teal/muted purge, teal-tint chips, v3 focus rings |
| `assets/md/en/current.md`, `assets/md/th/current.md` | v3.2.23 release notes (parser-compatible format) |
| `assets/md/{en,th}/releases/v3.2.22.md` | regenerated parseable copies (hotfix 47c2fc4) |
| release pipeline artifacts | registry/version/HTML asset strings (v3.2.23) |
