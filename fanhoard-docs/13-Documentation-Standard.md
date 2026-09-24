# FanHoard Documentation Standard

- **System Described**: Developer & AI Agent Documentation Architecture, Formatting Rules, and Verification Policy
- **Entry File**: `docs/engineering/ai-docs-guide.md`
- **Dependencies**: `scripts/validate-release.js`, `fanhoard-docs/`
- **Verification**: `node scripts/validate-release.js --staged` | `npm run test`

---

## 1. System Overview

Documentation in FanHoard is a primary engineering artifact. AI agents and human developers rely on documentation to navigate and modify the codebase safely. Inaccurate or ambiguous documentation leads to system bugs, broken build gates, and invalid release snapshots.

### 1.1 Priorities Hierarchy

1. 🥇 **Documentation & Architecture Standards** (SSOT accuracy, zero ambiguity)
2. 🥈 **SEO & Web Vitals** (Search visibility and rendering performance)
3. 🥉 **Feature Expansion** (New features must pass existing documentation gates before merging)

---

## 2. Mandatory Document Structure

Every developer-facing markdown document in `fanhoard-docs/` MUST follow this exact section sequence:

1. **H1 Title**: `# FanHoard [Subsystem Name] Guide`
2. **Context-First Block**: Header list defining `System Described`, `Entry File`, `Dependencies`, and `Verification`.
3. **Table of Contents**: Linked section index.
4. **System Architecture / Flow Diagrams**: High-level visual map.
5. **Contracts over Prose**: Tabular state machines, I/O schemas, file maps, and system invariants.
6. **Code Examples**: Real snippets extracted from active repo files (`assets/js/`, `scripts/`).
7. **Prohibited Practices**: Explicit table of anti-patterns and system impacts.
8. **Cross-References**: Relative markdown links to SSOT documentation files.

---

## 3. Formatting & Terminology Rules

### 3.1 Language & Voice
- **Language**: English ONLY for all developer and AI documentation.
- **Tense**: Imperative present tense ("Execute", "Return", "Verify", "Render"). Prohibit modal ambiguity ("should generally", "normally").
- **Brand Naming**: Always use **FanHoard** (never legacy names like "FanVerse" or "Fantrove").

### 3.2 Single Source of Truth (SSOT)
Each architectural fact has exactly ONE owner document:
- **Search Constants**: `assets/js/search-system/search-modules/config.js`
- **Popup Storage Tokens**: `assets/js/version-core.js`
- **Release Validation Rules**: `scripts/validate-release.js`
- **Documentation Standards**: `docs/engineering/ai-docs-guide.md`

Other files MUST link to the SSOT file using relative paths rather than duplicating descriptions.

---

## 4. Grounded Code Example Rules

All code examples MUST reflect live repository paths and active modular code:

```javascript
// ✅ CORRECT: Citing active modular search engine path
// File: assets/js/search-system/search-modules/engine.js:122
const RESULT_CACHE_CAP = 50;

// ❌ FORBIDDEN: Citing obsolete pre-refactor search files (e.g. search-engine.js)
```

---

## 5. Documentation Maintenance Lifecycle

```
Code Change Committed
        │
        ▼
Verify Impacted Subsystem Docs (fanhoard-docs/*.md)
        │
        ▼
Update Context Header & Grounded Line References
        │
        ▼
Validate Internal Links & Markdown Syntax
        │
        ▼
Commit Docs & Code Symmetrically (using Bypass Token if doc-only)
```

---

## 6. Cross-References

- [`docs/engineering/ai-docs-guide.md`](../docs/engineering/ai-docs-guide.md) — AI-first documentation approach guide
- [`00-System-Architecture.md`](./00-System-Architecture.md) — High-level platform architecture
- [`11-Release-Notes-System.md`](./11-Release-Notes-System.md) — Release notes & bypass counter validation
