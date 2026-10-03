# Community & Forms Redesign v3.2.22 (r09)

## What changed in v3.2.22 (Community pages on Design Language v3)

### assets/css/report.css (report/contact/community forms)
- Form fields (`.report-textinput`, `.report-textarea`, selects): surface `--surface-base` → `--surface-card` (true white inputs on the #FAFAFC canvas), border fallback rgba(0,0,0,0.15) → rgba(15,23,42,0.16), radius fallback 0.5rem → 12px (token already 12px)
- Focus ring: faint old `0 0 0 3px rgba(0,150,136,0.15)` → v3 `0 0 0 3px rgba(13,148,136,0.35)`; focus-visible outline 2px → 3px teal v3 standard
- GHOST TOKEN fixed: `--color-brand-primary-hover` (never defined in tokens.css — same bug class as r02/r04) → real `--color-brand-hover` (2 uses)
- Select chevron SVG data-URI: old material teal `%23009688` → `%230d9488`
- Buttons: `.report-submit` + `.contact-action-btn` → pill `--radius-full`; CTA background normalized to `--color-brand-primary` (was brand-hover as resting CTA), hover → `--color-brand-hover`, active `#0b726b` hardcoded → token
- 5 legacy `var(--duration-fast, 150ms) ease-out` transitions → `var(--transition-fast, 150ms ease)` (v3 easing)
- Hairline fallbacks rgba(0,0,0,0.06) → rgba(15,23,42,0.08); muted fallbacks #757575 → #475569; nested var() doubled fallbacks simplified
- Unboxed hairline-row layout for community links / contact rows kept intentionally (low-noise design method, consistent with settings rows)

### Pages (no markup changes needed)
- /community, /community/contact, /community/report render through report.css tokens; S10 form behavior (aria-invalid, aria-describedby, focus restoration, custom page input) untouched

## Verification

- Unit 234/234 (37 files) | build clean | **full e2e 16/16** (report-submission journey green)
- Real browser (Playwright, light+dark): inputs 12px on white/dark card surfaces with subtle themed borders; submit pill 9999px teal (light #0D9488 / dark teal-400); contact-action-btn pill teal; empty submit → 3 visible error texts + 3 aria-invalid + focus moves to first invalid field; keyboard focus on fields → teal border + 3px teal ring (verified after 150ms transition settles; earlier "missing ring" was a probe artifact reading at t=0 of the transition)
- Version update popup opens and dismisses via the real dismiss button (scroll-lock releases correctly)

## Files changed

| File | Change |
|------|--------|
| `assets/css/report.css` | v3 surfaces, focus rings, pill buttons, ghost-token + old-teal purge |
| `assets/md/en/current.md`, `assets/md/th/current.md` | v3.2.22 release notes |
| release pipeline artifacts | registry/version/HTML asset strings (v3.2.22) |
