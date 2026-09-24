# FanHoard AI Commit, PR, & Release Workflow Standard

- **System Described**: Git Commit Standards, Pull Request Format, & Release Workflows for AI Agents
- **Entry File**: `fanhoard-docs/AI_COMMIT_GUIDE.md`
- **Dependencies**: `scripts/validate-release.js`, `scripts/update-version.js`, `.release-bypass`, `.release-bypass-counter`
- **Verification**: `node scripts/validate-release.js --staged`

---

## 1. Commit Message Specifications

All commit messages created by AI agents or human developers in the FanHoard repository MUST adhere to the **Conventional Commits** specification (v1.0.0).

### 1.1 Structural Envelope

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### 1.2 Header Rules
- **Length Constraint**: The entire header line MUST NOT exceed **72 characters**.
- **Imperative Mood**: The `<subject>` MUST use imperative, present-tense verbs (e.g., "Add", "Fix", "Refactor", "Update", NOT "Added", "Fixed", "Updated").
- **Case & Punctuation**: The subject MUST start with a lowercase letter (unless referencing a proper name) and MUST NOT end with a period.

### 1.3 Body Rules
- Leave exactly one blank line between the header and body.
- Wrap body lines at **100 characters**.
- Focus the body on **why** the change was made rather than repeating **what** was changed.
- Use bullet points (`- `) for itemized explanations.

### 1.4 Footer Rules
- Leave exactly one blank line between the body and footer.
- Breaking changes MUST begin with `BREAKING CHANGE: ` followed by a detailed migration description.
- Issue references MUST use standard keywords (`Closes #123`, `Fixes #456`, `Refs #789`).

---

## 2. Type and Scope Matrices

### 2.1 Permitted Commit Types

| Type | Purpose | Example |
| :--- | :--- | :--- |
| `feat` | New end-user or developer feature | `feat(search): add fuzzy matching tier` |
| `fix` | Bug fix in code or stylesheet | `fix(popup): close topmost dialog on ESC key` |
| `docs` | Documentation changes only | `docs(ure): update rendering API reference` |
| `style` | Code formatting, missing semicolons, zero logic change | `style(css): align indentations in popup.css` |
| `refactor` | Code restructuring without feature or bug change | `refactor(nav-core): extract router module` |
| `perf` | Performance improvements | `perf(search): cache bucket index queries` |
| `test` | Adding or updating tests | `test(popup): add unit test for dismissal token` |
| `build` | Build system or external dependency changes | `build: update cheerio build script dependency` |
| `ci` | CI/CD workflow script changes | `ci: add validate-release step to pipeline` |
| `chore` | Maintenance tasks (e.g., updating .gitignore) | `chore: update repository ignore paths` |
| `revert` | Reverting a previous commit | `revert: feat(search): add fuzzy matching tier` |
| `release` | Formal version bump commit | `release: v3.0.0` |

### 2.2 Standard Repository Scopes

| Scope | Subsystem Target | Key Source Paths |
| :--- | :--- | :--- |
| `ure` | Universal Render Engine | `assets/js/ure/` |
| `search` | Search Engine & Modules | `assets/js/search-system/search-modules/` |
| `nav-core` | Navigation Engine | `assets/js/nav-core.js`, `assets/js/nav-core-modules/` |
| `language` | i18n & Language Management | `assets/js/language.js`, `assets/js/lang-core.js` |
| `con-data` | Content Data Service | `assets/js/con-data-service/` |
| `popup` | Popup Notification System | `assets/js/popup.js`, `assets/js/popup-modules/` |
| `fvl` | Fullscreen Visual Loader | `assets/js/loading-system/fvl.js` |
| `build` | Build & Version Scripts | `scripts/build.js`, `scripts/update-version.js` |
| `docs` | Repository Documentation | `docs/`, `fanhoard-docs/` |
| `content` | Database & Collection Items | `assets/db/con-data/` |
| `deps` | Package Dependencies | `package.json`, `package-lock.json` |

---

## 3. Grounded Commit Examples

### 3.1 Feature Commit
```
feat(search): implement bucket index acceleration for short queries

Introduces _bucketIndex Map for queries <= 3 characters to bypass
full array scan in engine.js. Decreases short query execution time
from 12ms to <1ms.

Closes #142
```

### 3.2 Bug Fix Commit
```
fix(popup): handle ESC key press at document root

Previously ESC key listeners were scoped strictly to active dialog body,
failing when focus was outside popup elements. Attaches root listener to
OverlayService to guarantee topmost popup dismissal.

Fixes #98
```

### 3.3 Breaking Change Commit
```
feat(language)!: migrate event listener from languageChange to fv:langchange

BREAKING CHANGE: Custom event 'languageChange' has been removed in favor
of namespaced 'fv:langchange' event payload.

Migration:
- window.addEventListener('languageChange', handler);
+ window.addEventListener('fv:langchange', handler);
```

### 3.4 Release Bypass Token Commit (Doc / Non-User Changes)
```
docs: rewrite AI_COMMIT_GUIDE.md following AI-first standard

Updates commit standards to cover 4-layer release control, bypass counter
staging rules, and active search module paths.
```

---

## 4. Release Control & Bypass Token Mechanics

FanHoard uses a 4-layer release validation pipeline enforced by `scripts/validate-release.js` and Git hooks (`scripts/hooks/pre-commit`, `pre-push`).

### 4.1 Release Bypass Rules
- Documentation-only or internal refactoring pushes MUST NOT bump semantic version numbers in `assets/md/{lang}/current.md`.
- To bypass version bump checks on non-user-facing commits, developers MUST increment `.release-bypass`.
- **CRITICAL INVARIANT**: `.release-bypass-counter` MUST NEVER BE STAGED FOR COMMIT. Staging `.release-bypass-counter` breaks CI validation.

### 4.2 Incremental Commit & Push Recipe

```bash
# 1. Fetch and rebase against target branch
git pull --rebase origin solas/docs-overhaul-20260924

# 2. Read counter and set bypass token
V=$(cat .release-bypass-counter)
echo $((V+1)) > .release-bypass

# 3. Stage changes and bypass token (EXCLUDE .release-bypass-counter)
git add <files> .release-bypass

# 4. Commit and push
git commit -m "docs: description of changes"
git push origin solas/docs-overhaul-20260924
```

---

## 5. Pull Request & Release Note Standards

### 5.1 Release Notes Architecture (No Standalone CHANGELOG.md)
FanHoard does NOT maintain a manual `CHANGELOG.md`. Release notes live in `assets/md/{lang}/current.md` frontmatter and markdown body. Running `node scripts/update-version.js` automatically creates historical snapshots in `assets/md/{lang}/releases/v{version}.md` and updates `assets/md/{lang}/releases/index.json`.

### 5.2 Pull Request Checklist
Every Pull Request submitted by an AI agent MUST include the following verification details:

```markdown
## Summary
Short summary of modifications and objective.

## Changes
- Detailed list of implementation steps.

## Verification Checklist
- [x] Executed `node scripts/validate-release.js --staged` locally.
- [x] Verified code against `fanhoard-docs/AI_FORBIDDEN.md` invariants.
- [x] Confirmed zero UI/behavioral regression.
- [x] Verified all language translations in `assets/lang/{en,th}.json`.
```

---

## 6. Prohibited Commit Anti-Patterns

1. ❌ **Vague Header Subjects**: `fix bug`, `update file`, `wip`, `asdf`.
2. ❌ **Mixing Unrelated Changes**: Combining feature additions, formatting refactors, and bug fixes into a single commit.
3. ❌ **Staging `.release-bypass-counter`**: Including `.release-bypass-counter` in `git add`.
4. ❌ **Mismatched Commit Types**: Tagging a breaking architectural change as `style` or `chore`.
5. ❌ **Past Tense Verbs in Subject**: `feat(search): added fuzzy search` (MUST be `add`).
