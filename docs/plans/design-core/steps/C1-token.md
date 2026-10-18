# Design Core — Step C1 Specification: Token Foundation

## 1. Overview
This specification details Step C1 (Token Foundation) of the Design Core system for `fanhoard-stage0`.
The C1 step establishes a 3-tier Material-style design token architecture built on CSS custom properties in `assets/css/design-core-tokens.css`, utilizing the approved **Emerald Fresh** palette, Google Fonts **Anuphan** body typography, and high-radius / capsule shape scales following the **ArchiveTune** design language.

## 2. Approved Emerald Fresh Palette & Contrast Standards
All color pairs in the system strictly adhere to WCAG 2.1 AA standards (Minimum 4.5:1 for normal body text, 3.0:1 for large text / UI component borders and states).

### Base Palette Swatches
- **Canvas (Background)**: `#FAF8F1` (Warm Cream Canvas)
- **Card (Surface)**: `#FFFFFF` (Pure White Card)
- **Primary (Emerald Brand)**: `#0FA36B` (Vibrant Emerald)
- **Primary Dark (Accessible Text/Button)**: `#087049` (Deep Emerald for body text / solid buttons)
- **Green Tint (Container)**: `#DDF3E7` (Soft Mint Tint)
- **Accent Amber**: `#F5B301` (Golden Amber Accent)
- **Accent Dark (Text/Border)**: `#945C00` (Deep Amber for accessible text)
- **Dark (Neutral Surface/Text)**: `#1B1B17` (Charcoal Neutral Dark)
- **Ink Primary (Body Text)**: `#1B1A15` (Deep Espresso Ink)
- **Ink Secondary (Muted Text)**: `#57544A` (Slate Muted Ink)

### Key AA Contrast Verification Matrix
| Element / Role | Text / Foreground | Background | Calculated Ratio | WCAG AA Requirement | Status |
|---|---|---|---|---|---|
| Primary Body Text | Ink Primary `#1B1A15` | Canvas `#FAF8F1` | 16.40:1 | ≥ 4.5:1 | PASS (AAA) |
| Secondary Body Text | Ink Muted `#57544A` | Canvas `#FAF8F1` | 7.13:1 | ≥ 4.5:1 | PASS (AAA) |
| Card Body Text | Ink Primary `#1B1A15` | Card `#FFFFFF` | 17.42:1 | ≥ 4.5:1 | PASS (AAA) |
| Card Muted Text | Ink Muted `#57544A` | Card `#FFFFFF` | 7.58:1 | ≥ 4.5:1 | PASS (AAA) |
| Accessible Primary Link/Text | Primary Dark `#087049` | Canvas `#FAF8F1` | 5.77:1 | ≥ 4.5:1 | PASS (AA) |
| Accessible Primary Link on Card | Primary Dark `#087049` | Card `#FFFFFF` | 6.13:1 | ≥ 4.5:1 | PASS (AA) |
| Large Emerald Headline / Icon | Primary `#0FA36B` | Canvas `#FAF8F1` | 3.05:1 | ≥ 3.0:1 (Large) | PASS (AA) |
| Container Text on Green Tint | Ink Primary `#1B1A15` | Green Tint `#DDF3E7` | 14.98:1 | ≥ 4.5:1 | PASS (AAA) |
| Container Primary Text on Mint | Primary Dark `#087049` | Green Tint `#DDF3E7` | 5.27:1 | ≥ 4.5:1 | PASS (AA) |
| Button Text (Solid Primary) | White `#FFFFFF` | Primary Dark `#087049` | 6.13:1 | ≥ 4.5:1 | PASS (AA) |
| Accent Box Text | Dark `#1B1B17` | Accent Amber `#F5B301` | 9.32:1 | ≥ 4.5:1 | PASS (AAA) |
| Accent Text on Canvas | Accent Dark `#945C00` | Canvas `#FAF8F1` | 5.21:1 | ≥ 4.5:1 | PASS (AA) |

## 3. 3-Tier Token Schema (Material 3 Pattern)

### Tier 1: Primitive Palette Tokens (`--fh-ref-*`)
Raw colors, absolute radii, base spacing units, and font families.
- `--fh-ref-color-canvas`: `#FAF8F1`
- `--fh-ref-color-surface`: `#FFFFFF`
- `--fh-ref-color-primary`: `#0FA36B`
- `--fh-ref-color-primary-dark`: `#087049`
- `--fh-ref-color-primary-tint`: `#DDF3E7`
- `--fh-ref-color-accent`: `#F5B301`
- `--fh-ref-color-accent-dark`: `#945C00`
- `--fh-ref-color-dark`: `#1B1B17`
- `--fh-ref-color-ink-primary`: `#1B1A15`
- `--fh-ref-color-ink-muted`: `#57544A`
- `--fh-ref-radius-none`: `0px`
- `--fh-ref-radius-sm`: `8px`
- `--fh-ref-radius-md`: `14px`
- `--fh-ref-radius-lg`: `20px`
- `--fh-ref-radius-xl`: `28px`
- `--fh-ref-radius-full`: `9999px`
- `--fh-ref-font-body`: `'Anuphan', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- `--fh-ref-font-brand`: `'FoglihtenNo07calt', 'Anuphan', serif`

### Tier 2: Semantic System Tokens (`--fh-sys-*`)
Role-based properties mapped to primitives, providing dark theme / context overrides without changing components.
- `--fh-sys-color-bg`: `var(--fh-ref-color-canvas)`
- `--fh-sys-color-surface`: `var(--fh-ref-color-surface)`
- `--fh-sys-color-surface-tint`: `var(--fh-ref-color-primary-tint)`
- `--fh-sys-color-primary`: `var(--fh-ref-color-primary)`
- `--fh-sys-color-primary-text`: `var(--fh-ref-color-primary-dark)`
- `--fh-sys-color-on-primary`: `#FFFFFF`
- `--fh-sys-color-accent`: `var(--fh-ref-color-accent)`
- `--fh-sys-color-accent-text`: `var(--fh-ref-color-accent-dark)`
- `--fh-sys-color-text-main`: `var(--fh-ref-color-ink-primary)`
- `--fh-sys-color-text-muted`: `var(--fh-ref-color-ink-muted)`
- `--fh-sys-color-border`: `rgba(27, 26, 21, 0.12)`
- `--fh-sys-radius-card`: `var(--fh-ref-radius-xl)`
- `--fh-sys-radius-pill`: `var(--fh-ref-radius-full)`
- `--fh-sys-radius-control`: `var(--fh-ref-radius-full)`

### Tier 3: Component Class Tokens (`--fh-comp-*`)
Component-specific property bindings for buttons, cards, pills, search bars, and dialogs.
- `--fh-comp-button-bg-primary`: `var(--fh-ref-color-primary-dark)`
- `--fh-comp-button-text-primary`: `#FFFFFF`
- `--fh-comp-button-radius`: `var(--fh-sys-radius-pill)`
- `--fh-comp-card-bg`: `var(--fh-sys-color-surface)`
- `--fh-comp-card-radius`: `var(--fh-sys-radius-card)`
- `--fh-comp-card-shadow`: `0 8px 24px rgba(27, 26, 21, 0.06)`
- `--fh-comp-chip-bg`: `var(--fh-sys-color-surface-tint)`
- `--fh-comp-chip-text`: `var(--fh-sys-color-primary-text)`
- `--fh-comp-chip-radius`: `var(--fh-sys-radius-pill)`

## 4. Typography Scale & Font Loading
- **Font Link**: Loaded directly from Google Fonts (`https://fonts.googleapis.com/css2?family=Anuphan:wght@300;400;500;600;700&display=swap`). No local font binaries created.
- **Type Scale**:
  - `Display`: 2.25rem (36px) / 1.2 line-height / Weight 700
  - `Headline`: 1.75rem (28px) / 1.3 line-height / Weight 600
  - `Title`: 1.25rem (20px) / 1.4 line-height / Weight 600
  - `Body Large`: 1.125rem (18px) / 1.5 line-height / Weight 400
  - `Body Medium`: 1.0rem (16px) / 1.5 line-height / Weight 400
  - `Body Small`: 0.875rem (14px) / 1.5 line-height / Weight 400
  - `Caption`: 0.75rem (12px) / 1.4 line-height / Weight 400

## 5. Spacing Scale (ArchiveTune Spacious Concept)
- `--fh-ref-space-1`: `4px`
- `--fh-ref-space-2`: `8px`
- `--fh-ref-space-3`: `12px`
- `--fh-ref-space-4`: `16px`
- `--fh-ref-space-5`: `20px`
- `--fh-ref-space-6`: `24px`
- `--fh-ref-space-8`: `32px`
- `--fh-ref-space-10`: `40px`
- `--fh-ref-space-12`: `48px`

## 6. Strict Guidelines & Invariants
1. **Discover Main Group Capsules**: Original markup, classes, and styles for the main group capsules in Discover are untouched.
2. **Original Animations**: Existing keyframe animations and transition timing functions preserved 100%.
3. **Brand Font & Logo**: `FoglihtenNo07calt` and SVG logo preserved.
4. **Release System & Branch**: `develop` / `design/restart-stage0` branch only. Main branch remains untouched.
5. **Backups**: Every modified file backed up to `.state/backup/<filename>.bak-c1`.

## 7. Verification Plan & Artifacts
1. Run Interrogator Gate (`python3 /app/.agents/skills/grillme-interrogator/scripts/run.py --spec docs/plans/design-core/steps/C1-token.md --task c1-token-core`).
2. Create token CSS file `assets/css/design-core-tokens.css` and token demo page `assets/demo/c1-token-demo.html`.
3. Capture full-page demo screenshot via Playwright script to `assets/demo/c1-token-demo.png`.
4. Execute test suite `npm test` verifying 257/257 tests pass.
5. Export JSON report to `/app/.agents/.state/work/design-core/c1-token-core.json`.
