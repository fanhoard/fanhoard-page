# FanHoard AI-First Documentation Guide

- **System Described**: FanHoard AI-First Documentation Standard & Architecture Guide
- **Entry File**: `docs/engineering/ai-docs-guide.md`
- **Dependencies**: `scripts/validate-release.js`, `scripts/update-version.js`, `assets/js/version-core.js`, `assets/js/search-system/`
- **Verification**: `node scripts/validate-release.js --staged` | `npm run test`

---

## 1. Context-First Opening Section

Every developer-facing documentation file in FanHoard MUST begin with an explicit Context Header block. This eliminates ambiguity for AI agents and human developers by establishing system boundaries, entry points, dependencies, and verification mechanics before any narrative text.

### Required Header Format
```markdown
# [Document Title]

- **System Described**: [Exact name of system/subsystem]
- **Entry File**: `[relative/path/to/entry/file]`
- **Dependencies**: `[dep1]`, `[dep2]`, `[dep3]`
- **Verification**: `[command to verify system status/tests]`
```

### Repo-Grounded Context Examples

#### Example 1.1: Popup Notification System
```markdown
# FanHoard Popup System

- **System Described**: Modular Modal & Toast Notification System
- **Entry File**: `assets/js/popup.js`
- **Dependencies**: `assets/js/popup-modules/types.js`, `config.js`, `state.js`, `utils.js`, `animator.js`, `overlay.js`, `queue.js`, `renderer.js`, `theme.js`, `a11y.js`, `init.js`
- **Verification**: `npm run test` (runs `tests/popup.test.ts`)
```

#### Example 1.2: Release & Version Validation System
```markdown
# FanHoard 4-Layer Release Control System

- **System Described**: Release Validation & Bypass Engine
- **Entry File**: `scripts/validate-release.js`
- **Dependencies**: `.release-bypass`, `.release-bypass-counter`, `assets/md/{lang}/current.md`, `scripts/update-version.js`
- **Verification**: `node scripts/validate-release.js --staged`
```

---

## 2. Contracts Over Prose

Narrative descriptions fail when AI agents interpret system behavior. All documentation MUST prioritize explicit contracts over free-form prose. Every document must contain State Machines, Input/Output Contracts, File Maps, and System Invariants.

### 2.1 State Machines

Define states, trigger events, transitions, and side-effects in tabular or structured code blocks.

#### Example 2.1: 4-Layer Release Bypass State Machine (`scripts/validate-release.js`)
```
 [Staged/CI Change]
         │
         ▼
 ┌───────────────┐        Counter <= Used        ┌──────────────────────┐
 │ Check Bypass  │──────────────────────────────►│ Reject Release       │
 │    Token      │                               │ (Bypass Exhausted)   │
 └───────┬───────┘                               └──────────────────────┘
         │
         │ Counter > Used
         ▼
 ┌───────────────┐     Version Changed           ┌──────────────────────┐
 │ Version Bump  │──────────────────────────────►│ Pass Layer Check     │
 │ Check         │                               │ (Version Bumped)     │
 └───────┬───────┘                               └──────────────────────┘
         │
         │ Version Unchanged & Bypass Valid
         ▼
 ┌───────────────┐
 │ Consume       │──► Advance .release-bypass-counter
 │ Bypass        │──► Pass Layer Check (Bypassed)
 └───────────────┘
```

### 2.2 Input/Output Contracts

#### Example 2.2: Version Synchronization Contract (`scripts/update-version.js`)

- **Input**:
  - `assets/md/en/current.md` (Frontmatter: `version`, `date`, `notify`, `title`, `subtitle`)
  - `assets/md/th/current.md` (Frontmatter: `version`, `date`, `notify`, `title`, `subtitle`)
  - `.release-bypass` (Counter integer)
- **Output**:
  - `assets/md/{lang}/releases/v{version}.md` (Auto-snapshot of previous current.md)
  - `assets/md/{lang}/releases/index.json` (Per-language manifest, max 7 historical versions)
  - `assets/json/version.json` (Backward compatibility marker for client polling)
  - Asset query string update in HTML files (`?v={version}`)

### 2.3 File Maps

Directory structures must explicitly separate source files from auto-generated artifacts:

```
assets/md/
├── en/
│   ├── current.md                  # Developer SSOT (Manual Edit)
│   └── releases/                   # Generated Artifacts (DO NOT EDIT)
│       ├── index.json              # Generated Manifest (Max 7 items)
│       └── v3.0.0.md               # Auto-Snapshot History File
└── th/
    ├── current.md                  # Developer SSOT (Manual Edit)
    └── releases/                   # Generated Artifacts (DO NOT EDIT)
        ├── index.json              # Generated Manifest (Max 7 items)
        └── v3.0.0.md               # Auto-Snapshot History File
```

### 2.4 System Invariants

System invariants are non-negotiable assertions enforced by code:

| Invariant | System Location | Enforcing Code / Constant |
| :--- | :--- | :--- |
| **LRU Result Cache Limit** | Search Engine | `RESULT_CACHE_CAP = 50` (`assets/js/search-system/search-modules/engine.js:122`) |
| **Short Query Acceleration** | Search Engine | `nq.length <= 3` queries bypass full scan using `_bucketIndex` Map (`engine.js:616`) |
| **Update Dismiss Token** | Version Notifier | `localStorage.getItem('fv_dismissed_v' + version) === '1'` (`assets/js/version-core.js:33`) |
| **Session Idle Timeout** | Version Notifier | `IDLE_MS = 90 * 60 * 1000` (90 minutes) (`assets/js/version-core.js:21`) |
| **Bypass Validation Token** | Release Pipeline | `.release-bypass` value > `.release-bypass-counter` value (`scripts/validate-release.js:138`) |

---

## 3. Single Source of Truth (SSOT)

Every system fact has exactly ONE home file. Never restate or duplicate facts across multiple files; link to the SSOT file using relative Markdown links.

### SSOT Rules Matrix

1. **Active Release Version Number**:
   - **SSOT**: `assets/md/{lang}/current.md` (Frontmatter field `version`).
   - **Dependent/Generated Files**: `assets/json/version.json`, `assets/md/{lang}/releases/index.json`.
   - **Rule**: Do NOT edit generated files directly. Edit `current.md` and execute `node scripts/update-version.js`.

2. **Release Validation Gate Rules**:
   - **SSOT**: `scripts/validate-release.js`.
   - **Rule**: Documentation in `docs/engineering/` must reference `scripts/validate-release.js` rather than re-describing bypass check algorithms.

3. **Search Engine Performance Constants**:
   - **SSOT**: `assets/js/search-system/search-modules/config.js` and `assets/js/search-system/search-modules/engine.js`.
   - **Rule**: Document constants by citing exact source line numbers rather than hardcoding values in narrative text.

---

## 4. Grounded Code Examples

Every non-trivial technical rule or architectural assertion MUST include an actual code snippet directly extracted from the repository.

### Example 4.1: Bypass Token Validation (`scripts/validate-release.js`)

```javascript
function checkBypass() {
  const counter = readBypassCounter();
  const used = readBypassUsedCounter();

  if (counter === 0) {
    return {
      bypass: false,
      counter: 0,
      used: used,
      message: 'ไม่มี bypass token (ไฟล์ .release-bypass ว่างหรือเป็น 0)',
    };
  }

  if (counter <= used) {
    return {
      bypass: false,
      counter: counter,
      used: used,
      message: `bypass token ${counter} ถูกใช้แล้ว (counter=${used}) — ต้องเพิ่มเป็น ${used + 1} เพื่อ bypass อีกครั้ง`,
    };
  }

  return {
    bypass: true,
    counter: counter,
    used: used,
    message: `bypass token ${counter} ใช้ได้ (counter=${counter} > used=${used})`,
  };
}
```

### Example 4.2: Update Dialog Notification Logic (`assets/js/version-core.js`)

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

function isDismissed(ver)  { return ls(CFG.KEY_DISMISSED + ver) === '1'; }
function setDismissed(ver) { lsSet(CFG.KEY_DISMISSED + ver, '1'); }
```

### Example 4.3: Query Cache & Bucket Index Optimization (`assets/js/search-system/search-modules/engine.js`)

```javascript
/** PF-02: Query result cache (Map, capped at 50 entries). */
const RESULT_CACHE_CAP = 50;

/** PF-04: Candidate bucket index Map: char -> SearchDoc[] */
let _bucketIndex = new Map();

// Fast-path candidate retrieval for short queries
if (nq.length <= 3 && _bucketIndex) {
  const firstChar = nq.charAt(0);
  if (_bucketIndex.has(firstChar)) {
    candidates = _bucketIndex.get(firstChar);
  }
}
```

---

## 5. Imperative Present Tense & Terminology

### Writing Rules
- **Tense**: Write exclusively in active, imperative present tense ("Run", "Execute", "Verify", "Return").
- **Prohibited Tenses**: Future ("will run"), passive ("is executed by"), modal ambiguity ("should perform").
- **Single Meaning Per Term**: Use identical terms across all documents. Do not substitute synonyms.

### System Glossary

| Term | Exact Definition |
| :--- | :--- |
| **Build ID / Version** | Semantic versioning string defined in `assets/md/{lang}/current.md` frontmatter. |
| **Bypass Token** | Integer in `.release-bypass` controlling hook/CI check bypass. |
| **Bypass Counter** | Integer in `.release-bypass-counter` tracking consumed bypass tokens. |
| **Auto-Snapshot** | Automatic copy of prior `current.md` created as `assets/md/{lang}/releases/v{version}.md` during version update by `scripts/update-version.js`. |
| **Bucket Index** | Character-indexed map (`Map<string, SearchDoc[]>`) in search engine speeding up short queries (<= 3 chars). |
| **Dismiss Token** | LocalStorage entry `fv_dismissed_v{version}` preventing popups for a user-dismissed version. |
| **Session Freshness** | Determination via `fv_ss_shown_{build}` and `fv_last_active` whether 90 minutes of idle time elapsed. |

---

## 6. Verifiable Statements Only

Documentation MUST contain only statements that can be verified automatically via scripts, tests, or exact code paths. Soft or subjective language is prohibited.

### Prohibited Soft Phrases
- ❌ "Developers should generally update documentation."
- ❌ "Search queries are usually fast."
- ❌ "Bypass tokens normally prevent pipeline errors."
- ❌ "It is recommended to run tests before committing."

### Compliant Verifiable Rules
- ✅ **Rule**: All doc-only commits MUST increment `.release-bypass` token when version number is unchanged.
  - *Verification*: `node scripts/validate-release.js --staged` returns exit code `0`.
- ✅ **Rule**: Search result cache MUST NOT exceed 50 entries.
  - *Verification*: `engine.js` line 122 `RESULT_CACHE_CAP = 50`.
- ✅ **Rule**: `scripts/update-version.js` MUST retain a maximum of 7 historical releases in `index.json`.
  - *Verification*: `MAX_HISTORY = 7` in `scripts/update-version.js:27`.

---

## 7. Sub-Agent Task Sizing & Timeout Prevention

To prevent worker sub-agent timeouts and uncommitted state loss during documentation overhauls, sub-agent tasks MUST follow small task sizing and incremental git push workflows.

### Task Sizing Requirements
1. **Maximum Scope**: No single sub-agent task may modify or rewrite more than **6 documentation files**.
2. **Incremental Push Cycle**: Sub-agents MUST commit and push changes incrementally after updating each logical file group or single file.
3. **Doc-Only Commit Recipe**:

```bash
V=$(cat .release-bypass-counter)
echo $((V+1)) > .release-bypass
git add <modified-files> .release-bypass
git commit -m "docs: <summary of specific changes>"
git push origin solas/docs-overhaul-20260924
```

### Worker Task Execution Checklist
- [ ] Task scope contains <= 6 target files.
- [ ] Read target files and verification scripts prior to making changes.
- [ ] Modify target file(s) applying AI-First principles (Sections 1–6).
- [ ] Execute validation check: `node scripts/validate-release.js --staged`.
- [ ] Execute bypass commit recipe and push incrementally.
- [ ] Update task status via `manage_goal_task`.

---

## 8. English-Only Standard for Developer Documentation

All developer-facing technical documentation in FanHoard MUST be written exclusively in English.

### Scope Coverage
- **English-Only Required**:
  - `README.md`, `CHANGES.md`, `PATCH_NOTES.md`
  - All files in `docs/` (`docs/engineering/`, `docs/design/`, `docs/plans/`)
  - All module documentation (e.g., `assets/js/search-system/*.md`)
  - Repository scripts, code comments, and inline documentation
- **Bilingual Exception**:
  - End-user content in `assets/md/en/` and `assets/md/th/` (managed via `current.md` i18n structure and translated UI strings).
