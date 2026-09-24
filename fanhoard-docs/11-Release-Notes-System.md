# FanHoard Release Notes & Versioning System

- **System Described**: What's New System, Release Notes Automation, 4-Layer Release Validation, and Update Notifier
- **Entry File**: `scripts/update-version.js`
- **Dependencies**: `scripts/validate-release.js`, `assets/js/version-core.js`, `assets/js/new.js`, `.release-bypass`, `.release-bypass-counter`
- **Verification**: `node scripts/validate-release.js --staged` | `npm run test`

---

## 1. System Overview

The FanHoard Release Notes System operates under a **Closed-System Architecture**. Developers edit only two canonical frontmatter files (`assets/md/en/current.md` and `assets/md/th/current.md`). All historical releases, per-language manifests, asset query hashes, and version descriptors are automatically snapshot and generated during the release build.

### 1.1 Closed System Workflow Diagram

```
Developer edits assets/md/{lang}/current.md (en + th)
        │
        ▼
Git commit & push
        │
        ▼
Layer 1 / Layer 2 Hooks (scripts/validate-release.js)
   ├── Verifies developers touch ONLY current.md (or valid .release-bypass)
   └── Blocks unauthorized manual changes to generated artifacts
        │
        ▼
CI/CD Pipeline Execution (scripts/update-version.js)
   ├── Reads assets/json/release-dates.json registry
   ├── Bumps version or validates bypass counter
   ├── Auto-snapshots previous current.md -> assets/md/{lang}/releases/v{version}.md
   ├── Generates per-language manifest -> assets/md/{lang}/releases/index.json (Max 7 items)
   ├── Updates runtime polling marker -> assets/json/version.json
   └── Appends ?v={version} asset cache-busting strings to HTML files
        │
        ▼
Client Runtime Execution
   ├── What's New Page (assets/js/new.js): Renders current.md & historical releases from index.json
   └── Popup Notifier (assets/js/version-core.js): Displays update modal if version changes
```

---

## 2. Directory & File Map

```
assets/
├── md/
│   ├── en/
│   │   ├── current.md              # Canonical English Release Notes (Developer Editable)
│   │   └── releases/               # Auto-Generated Snapshots (DO NOT EDIT)
│   │       ├── index.json          # English Release Manifest (Max 7 history items)
│   │       └── v3.0.0.md           # Snapshot file
│   └── th/
│       ├── current.md              # Canonical Thai Release Notes (Developer Editable)
│       └── releases/               # Auto-Generated Snapshots (DO NOT EDIT)
│           ├── index.json          # Thai Release Manifest (Max 7 history items)
│           └── v3.0.0.md           # Snapshot file
├── json/
│   ├── release-dates.json          # Persistent Version Date Registry (CI Managed)
│   └── version.json                # Runtime Version Polling Metadata
└── js/
    ├── new.js                      # What's New Page UI Orchestrator
    └── version-core.js             # Update Popup Engine & State Machine
```

> ⚠️ **CRITICAL INVARIANT:** Never create or modify files inside `assets/md/{lang}/releases/` manually. Legacy files such as `whats-new.json` or root `assets/md/releases/` are obsolete and forbidden.

---

## 3. Developer File Rules & Allowlist

### 3.1 Developer Allowlist (Editable)

Developers are restricted to editing only two files when preparing user-facing updates:
- `assets/md/en/current.md`
- `assets/md/th/current.md`

#### Required Frontmatter Standard
```markdown
---
version: 3.0.0
title: "FanHoard v3.0.0 — Next-Gen Search & Redesigned UI"
subtitle: "Faster search index, non-sticky filters, and modular UI overhaul."
notify: true
---
```

- `version`: Target semantic version string (`X.Y.Z`).
- `title`: Concise release headline.
- `subtitle`: 1-2 sentence release summary.
- `notify`: `true` to trigger client popup notification; `false` to suppress popup.

### 3.2 System Blocklist (Generated / Immutable)

- `assets/md/{lang}/releases/v*.md` — Created automatically during version bump.
- `assets/md/{lang}/releases/index.json` — Generated manifest listing up to 7 historical releases.
- `assets/json/release-dates.json` — Tracks initial build timestamps for each version to guarantee stable dates.
- `assets/json/version.json` — Polling payload for client update detection.

---

## 4. 4-Layer Version Control & Release Gate

FanHoard enforces version discipline across 4 automated layers:

| Layer | Trigger | Executor | Policy Enforced |
| :--- | :--- | :--- | :--- |
| **Layer 1** | Local Git Commit | `.githooks/pre-commit` | Checks `validate-release.js --staged`. Verifies version bump or bypass token. |
| **Layer 2** | Local Git Push | `.githooks/pre-push` | Checks `validate-release.js --pre-push`. Verifies uncommitted generated artifacts. |
| **Layer 3** | GitHub Actions CI | `.github/workflows/*.yml` | Runs `validate-release.js --ci`. Enforces committed bypass counter check. |
| **Layer 4** | Build & Deploy | `scripts/update-version.js` | Executes snapshot, manifest generation, and asset query string updates. |

---

## 5. Bypass Token Engine

For documentation-only or internal refactoring changes where no user-facing version bump is required, developers use the bypass token workflow.

### 5.1 Bypass Invariant Formula
A commit is permitted without bumping `version:` in `current.md` if and only if:
$$\text{Bypass Token (`.release-bypass`)} > \text{Used Counter (`.release-bypass-counter`)}$$

### 5.2 Bypass Execution Recipe
```bash
V=$(cat .release-bypass-counter)
echo $((V+1)) > .release-bypass
git add <target-files> .release-bypass
git commit -m "docs: update system documentation"
echo $((V+1)) > .release-bypass
git push origin <branch-name>
```

---

## 6. Client Update Notifier (`assets/js/version-core.js`)

The client runtime checks version changes using local and session storage tokens.

### 6.1 Storage Token Invariants

```javascript
var CFG = {
  CURRENT_MD_PERLANG: '/assets/md/{lang}/current.md',
  WHATS_NEW_PAGE:     '/platform/whats_new/',
  KEY_SHOWN_BUILD:    'fv_shown_build',
  KEY_DISMISSED:      'fv_dismissed_v',
  KEY_DISABLE:        'fv_noupdate',
  SS_SHOWN:           'fv_ss_shown_',
  SS_LAST_ACTIVE:     'fv_last_active',
  IDLE_MS:            90 * 60 * 1000,
  POPUP_GROUP:        'update-notification'
};
```

| Token Name | Key Pattern / Standard Value | Purpose |
| :--- | :--- | :--- |
| `KEY_SHOWN_BUILD` | `localStorage.fv_shown_build` | Stores last build version seen by user. |
| `KEY_DISMISSED` | `localStorage.fv_dismissed_v{version}` | Set to `'1'` when user explicitly dismisses modal. |
| `KEY_DISABLE` | `localStorage.fv_noupdate` | Set to `'1'` to disable all update notifications. |
| `SS_SHOWN` | `sessionStorage.fv_ss_shown_{version}` | Prevents repeat popups during active session. |
| `SS_LAST_ACTIVE` | `sessionStorage.fv_last_active` | Tracks user activity timestamp for 90-minute idle check. |
| `IDLE_MS` | `5400000` (90 minutes) | Required idle duration before re-evaluating update dialog. |

---

## 7. Cross-References

- [`06-Popup-System.md`](./06-Popup-System.md) — Modal & Notification Popup System
- [`09-Deployment-Guide.md`](./09-Deployment-Guide.md) — Build, CI/CD, and Cloudflare Pages deployment
- [`docs/engineering/release-policy.md`](../docs/engineering/release-policy.md) — Release accumulation & version bump policy
