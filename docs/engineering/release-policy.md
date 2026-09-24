# FanHoard Release & Update Policy

- **System Described**: FanHoard Release, Update-Accumulation, & Version Control System
- **Entry File**: `docs/engineering/release-policy.md`
- **Dependencies**: `scripts/validate-release.js`, `scripts/update-version.js`, `.githooks/pre-commit`, `.githooks/pre-push`, `.github/workflows/release.yml`, `assets/js/version-core.js`
- **Verification**: `node scripts/validate-release.js --staged` | `node scripts/validate-release.js --pre-push` | `node scripts/validate-release.js --ci`

---

## 1. Overview & Update-Accumulation Model

FanHoard uses an **in-branch update-accumulation model** governed by a 4-layer release control pipeline.

```
+-----------------------------------------------------------------------------------+
| FEATURE BRANCH (solas/* or feature/*)                                            |
|                                                                                   |
| 1. Developers write code + update release notes in assets/md/{en,th}/current.md. |
| 2. Changes accumulate in-branch commit by commit.                                 |
| 3. Unreleased state until merged.                                                 |
+-----------------------------------------------------------------------------------+
                                         |
                                         | Pull Request / Merge
                                         v
+-----------------------------------------------------------------------------------+
| MAIN BRANCH (main)                                                                |
|                                                                                   |
| 1. CI Layer 3.1 validates release notes & version bump/bypass.                   |
| 2. CI Layer 3.2 runs scripts/update-version.js:                                  |
|    - Auto-snapshots old version into assets/md/{lang}/releases/v{prev}.md        |
|    - Syncs ISO date in current.md                                                 |
|    - Generates per-language assets/md/{lang}/releases/index.json                  |
|    - Bumps cache-busting ?v= parameters in HTML and dynamic loaders               |
| 3. CI Layer 3.4 auto-commits build artifacts back to main with [skip ci].        |
| 4. Cloudflare Pages automatically deploys published build to fantrove.pages.dev.  |
+-----------------------------------------------------------------------------------+
```

### Core Invariants
1. **In-Branch Recording**: Developers record changes in `assets/md/en/current.md` and `assets/md/th/current.md` at the time changes are implemented on feature branches, not retroactively at release time.
2. **Release Boundary**: A version is officially "released" only when merged into `main`. Commits on feature branches remain unreleased.
3. **Single Point of Developer Metadata**: Developers ONLY modify `assets/md/en/current.md` and `assets/md/th/current.md`. All other release files (`assets/md/{lang}/releases/index.json`, `assets/md/{lang}/releases/v*.md`, `assets/json/version.json`) are generated artifacts managed strictly by automated tooling.

---

## 2. Version Bump Criteria & Bypass Token Engine

To protect users from notification spam, version bumps are strictly decoupled from documentation and internal code changes.

### Version Bump Criteria
- **User-Facing Changes (Bump Required)**: Any change that alters end-user experience, feature set, UI layout, observable performance, or bug fixes affecting runtime behavior MUST bump the `version:` field in `assets/md/{en,th}/current.md` using semantic versioning (`X.Y.Z`).
- **Internal / Documentation Changes (No Bump Allowed)**: Developer documentation updates, refactoring, test additions, ESLint updates, or CI/CD script changes MUST NOT bump the version. Instead, they must utilize the **Bypass Token Mechanism**.

### 4-Layer Release Control System

| Layer | Trigger | Command / Action | Enforcement |
| :--- | :--- | :--- | :--- |
| **Layer 1** | Git Commit | `.githooks/pre-commit` -> `validate-release.js --staged` | Local block on commit |
| **Layer 2** | Git Push | `.githooks/pre-push` -> `validate-release.js --pre-push` | Local block on push |
| **Layer 3** | CI Pipeline | `.github/workflows/release.yml` -> `validate-release.js --ci --allow-generated` | CI build block |
| **Layer 4** | Deployment | Cloudflare Pages Git Integration (deploys `main` branch) | Deployment trigger |

### Bypass Token Mechanics (`.release-bypass` vs `.release-bypass-counter`)
When pushing non-user-facing changes without a version bump, the release validator blocks commits/pushes unless a valid bypass token is presented.

- **`.release-bypass`**: The requested bypass token value (committed to git).
- **`.release-bypass-counter`**: The consumed bypass counter value (git-tracked baseline).
- **Condition for Bypass**: `.release-bypass` value MUST be strictly greater than `.release-bypass-counter` (`counter > used`).
- **Local Consumption Rule**: When `validate-release.js` consumes a bypass locally, it updates `.release-bypass-counter` on disk BUT explicitly DOES NOT stage `.release-bypass-counter`. This ensures the commit contains `.release-bypass = V+1` while committed `.release-bypass-counter = V`, allowing CI to verify the bypass remotely.

---

## 3. Decision Matrix

| Change Category | Version Bump? | Client Popup Triggered? | Bypass Token Required? | Workflow Action |
| :--- | :--- | :--- | :--- | :--- |
| **New User Feature** | **YES** | **YES** | NO | Update `current.md` version & add release notes under `### New`. |
| **UI / UX Overhaul** | **YES** | **YES** | NO | Update `current.md` version & add release notes under `### Improved`. |
| **User Bug Fix** | **YES** | **YES** | NO | Bump patch version in `current.md` & add release notes under `### Fixed`. |
| **User-Facing (Silent)** | **YES** | **NO** | NO | Bump version in `current.md` AND set `notify: false` in frontmatter. |
| **Developer / AI Docs** | **NO** | **NO** | **YES** | Keep version unchanged. Increment `.release-bypass` by 1. |
| **Internal Refactoring** | **NO** | **NO** | **YES** | Keep version unchanged. Increment `.release-bypass` by 1. |
| **Test Suite / CI Script** | **NO** | **NO** | **YES** | Keep version unchanged. Increment `.release-bypass` by 1. |

---

## 4. Execution Recipes

### Path A: User-Facing Release (Version Bump)

Use this recipe when delivering features, UI updates, performance improvements, or user bug fixes.

1. **Update `assets/md/en/current.md` and `assets/md/th/current.md`**:
   ```yaml
   ---
   version: 3.1.0
   date: 2026-09-24
   notify: true
   title:
     en: Feature Release Title
     th: ชื่อหัวข้อการอัปเดต
   subtitle:
     en: Brief summary of user-facing changes.
     th: สรุปการเปลี่ยนแปลงสั้นๆ
   ---

   ### New
   - **Feature Name**: Description of the new capability.

   ### Improved
   - **UI Component**: Description of the improvement.
   ```

2. **Stage and Commit**:
   ```bash
   git add assets/md/en/current.md assets/md/th/current.md <code-files>
   git commit -m "feat: implement user-facing feature X"
   git push origin <branch-name>
   ```

---

### Path B: Doc-Only / Internal Update (Bypass Token Recipe)

Use this recipe for documentation, internal maintenance, CI/CD scripts, or refactoring where no user popup should be triggered.

1. **Read counter, increment token, and stage changed files**:
   ```bash
   V=$(cat .release-bypass-counter)
   echo $((V+1)) > .release-bypass
   git add <changed-doc-or-code-files> .release-bypass
   ```

2. **Commit and Push**:
   ```bash
   git commit -m "docs: update release policy documentation"
   git push origin <branch-name>
   ```

> **CRITICAL INVARIANT**: Do NOT run `git add .release-bypass-counter`. The `.release-bypass-counter` file must remain unstaged locally so that remote CI sees `.release-bypass` > committed `.release-bypass-counter`.

---

## 5. Client Update Notification System Behavior

The client update notification engine is implemented in `assets/js/version-core.js` and utilizes `window.PopupSystem`.

### Evaluation Pipeline & Execution Flow

```
[Page Load / DOMContentLoaded]
              |
              v
[Check Page Context: meta fv-page == 'whats-new'?] ---> (YES) ---> Exits (No Popup)
              |
             (NO)
              v
[Check User Preference: fv_noupdate == '1'?] -----------> (YES) ---> Exits (No Popup)
              |
             (NO)
              v
[Fetch /assets/md/{lang}/current.md]
              |
              v
[Parse MD Frontmatter]
              |
              v
[Frontmatter notify == false?] -------------------------> (YES) ---> Exits (No Popup)
              |
             (NO)
              v
[Check Dismiss Token: fv_dismissed_v{version} == '1'?]-> (YES) ---> Exits (No Popup)
              |
             (NO)
              v
[Check Session Freshness & Build Match]
  - Is fv_shown_build != version? OR
  - Is fv_ss_shown_{version} != '1'? OR
  - Is (Date.now() - fv_last_active) >= 90 min (3600000ms * 1.5)?
              |
             (YES)
              v
[Trigger PopupSystem.open()]
  - Set localStorage.fv_shown_build = version
  - Set sessionStorage.fv_ss_shown_{version} = '1'
  - Update sessionStorage.fv_last_active
  - Render update dialog
```

### Token Reference Table

| Key Name | Storage Type | Value | Trigger / Function |
| :--- | :--- | :--- | :--- |
| `fv_shown_build` | `localStorage` | `string` (e.g. `3.0.0`) | Records last shown build ID on user device. |
| `fv_dismissed_v<ver>` | `localStorage` | `'1'` | Set when user clicks "Don't show again for this update" (`setDismissed(ver)`). |
| `fv_noupdate` | `localStorage` | `'1'` | Set when user toggles off auto-updates in settings (`setDisabled()`). |
| `fv_ss_shown_<build>` | `sessionStorage` | `'1'` | Prevents duplicate popups within the same browser session. |
| `fv_last_active` | `sessionStorage` | `timestamp` (ms) | Session idle timer. Triggers popup re-check if idle >= 90 minutes (`90 * 60 * 1000` ms). |

---

## 6. Code Verification & Discrepancies Summary

Every policy statement in this document was verified against the repository implementation. The following technical implementation details and code behavior nuances were identified during verification:

### 1. CI `HEAD` Timing Bug Fixes (`validate-release.js` v1.5 & `update-version.js` v6.2)
- **Code Reality**: In a CI environment post-push, `git show HEAD:assets/md/{lang}/current.md` returns the *newly pushed* version, causing naive comparisons (`current === lastCommitted`) to report "version not bumped" even on valid releases.
- **Verification Result**: Both scripts check if `HEAD` matches disk content. If identical, they query `git log --format=%H -n 2 -- assets/md/{lang}/current.md` to fetch commit `hashes[1]` as the true baseline version.

### 2. Bypass Counter Consumption & Staging Rule
- **Code Reality**: `validate-release.js` function `consumeBypass()` writes the consumed value into `.release-bypass-counter` on disk but explicitly refrains from staging it.
- **Verification Result**: If a developer mistakenly runs `git add .release-bypass-counter`, committed `counter` equals committed `used`, causing CI Layer 3.1 to reject the commit.

### 3. Generated Artifact Restrictions
- **Code Reality**: `validate-release.js` enforces an allowlist containing strictly `assets/md/en/current.md` and `assets/md/th/current.md`.
- **Verification Result**: Manual editing of generated files (`assets/md/{lang}/releases/index.json`, `assets/md/{lang}/releases/v*.md`, `assets/json/version.json`) triggers a violation and fails pre-commit / pre-push unless `--allow-generated` or `--ci` flags are passed.

### 4. Deployment Pipeline Status (Layer 4)
- **Code Reality**: In `.github/workflows/release.yml`, Layer 4 (Cloudflare Pages Action) is disabled/removed.
- **Verification Result**: Production deployment is handled natively by Cloudflare Pages Git Integration listening directly to `main` branch pushes. CI Layer 3.4 commits build artifacts directly to `main` with `[skip ci]`.
