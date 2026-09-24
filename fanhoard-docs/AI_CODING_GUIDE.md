# FanHoard AI Coding Guide (AI_CODING_GUIDE)

- **System Described**: Code Quality, Style Conventions, Architecture Patterns, SEO, and Documentation Rules for AI Agents
- **Entry File**: `fanhoard-docs/AI_CODING_GUIDE.md`
- **Dependencies**: All repository source files, `scripts/validate-release.js`, `docs/engineering/ai-docs-guide.md`, `fanhoard-docs/AI_FORBIDDEN.md`
- **Verification**: `node scripts/validate-release.js --staged` | `npm run test`

---

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [File Organization](#2-file-organization)
3. [Module Pattern (IIFE)](#3-module-pattern-iife)
4. [Naming Conventions](#4-naming-conventions)
5. [Code Style](#5-code-style)
6. [Comments & Documentation](#6-comments--documentation)
7. [Error Handling](#7-error-handling)
8. [Async Patterns](#8-async-patterns)
9. [DOM Patterns](#9-dom-patterns)
10. [Performance Patterns](#10-performance-patterns)
11. [SEO-Friendly Code Patterns](#11-seo-friendly-code-patterns)
12. [Documentation Maintenance Patterns](#12-documentation-maintenance-patterns)
13. [Summary Matrix](#13-summary-matrix)

---

## 1. Core Principles

### 1.1 Gold Rule: Match Existing Style
Before writing new code, inspect existing code in the target file and adjacent files. Replicate existing patterns and conventions exactly—consistency within the codebase supersedes external preference.

### 1.2 Silver Rule: Do Not Reinvent Wheels
Before implementing a new function or utility, verify whether it already exists:
- Check system namespaces (`window.UREModules`, `window.NavCoreModules`, `window.SearchModules`, etc.).
- Inspect utility modules in `assets/js/*-modules/utils.js`.
- Grep the codebase for keywords matching the target functionality.

### 1.3 Bronze Rule: Preserve Existing Architecture
- If a file uses the IIFE pattern, do not introduce ES module syntax (`import`/`export`).
- If a file contains `'use strict';`, maintain `'use strict';` across all modules.
- Do not remove existing error handling or logging mechanisms.

---

## 2. File Organization

### 2.1 Standard JavaScript File Structure

```javascript
/**
 * module-name.js — Concise summary of module responsibility
 *
 * Part of: {System Name} (e.g., URE, Search, Nav-Core, Popup)
 * Namespace: window.{Namespace}
 *
 * Dependencies:
 *   - {dependency-module}.js (must load before this file)
 *
 * Public API:
 *   - M.functionName()
 *   - M.CONSTANT_NAME
 */

(function(M) {
  'use strict';

  // ── Constants ──────────────────────────────────────────────
  const CONSTANT_NAME = 'value';

  // ── Module State (private) ─────────────────────────────────
  let moduleState = null;

  // ── Private Functions ──────────────────────────────────────
  function privateHelper(arg) {
    // Internal logic
  }

  // ── Public API ─────────────────────────────────────────────
  function publicFunction(arg) {
    // Interface logic
  }

  // ── Exports ────────────────────────────────────────────────
  M.PublicFunction = publicFunction;
  M.CONSTANT_NAME = CONSTANT_NAME;

})(window.SomeNamespace = window.SomeNamespace || {});
```

### 2.2 File Placement Matrix

| File Type | Directory Location | Example Path |
| :--- | :--- | :--- |
| Subsystem Module | `assets/js/{system}-modules/` | `assets/js/ure-modules/pool.js` |
| Subsystem Entry Point | `assets/js/{system}/` or `assets/js/` | `assets/js/search-system/search.js` |
| Independent Script | `assets/js/{name}.js` | `assets/js/home.js` |
| Page-Specific Script | `assets/js/{page}.js` | `assets/js/roadmap.js` |
| Stylesheet | `assets/css/{name}.css` | `assets/css/popup.css` |
| Build / Automation Script | `scripts/{name}.js` | `scripts/validate-release.js` |

### 2.3 Naming Rules
- Use `kebab-case` for file paths: `nav-core.js`, `con-data-service.js`.
- Do not use `camelCase` or `snake_case` in file names.
- One module per file—do not combine multiple distinct subsystem modules into a single file.

---

## 3. Module Pattern (IIFE)

### 3.1 Standard IIFE Pattern

```javascript
(function(M) {
  'use strict';
  
  function MyFunction() {}

  M.MyFunction = MyFunction;
})(window.MyNamespace = window.MyNamespace || {});
```

### 3.2 System Namespace Registry

| Subsystem | Internal Module Namespace | Public API Namespace |
| :--- | :--- | :--- |
| **URE** | `window.UREModules` | `window.URE` |
| **Search Engine** | `window.SearchModules` | `window.SearchEngine`, `window.__searchUI` |
| **Nav-Core** | `window.NavCoreModules` | `window.NavCore` |
| **Language** | `window.LangModules` | `window.languageManager`, `window.FvLang` |
| **Popup System** | `window.PopupModules` | `window.PopupSystem` |
| **FVL Loader** | `window.FVLModules` | `window.FVL` |
| **ConData** | `window.ConDataService` | `window.ConDataRegistry` |

### 3.3 IIFE Invariants
- Include `'use strict';` as the first statement inside every IIFE function body.
- Export public interfaces strictly via namespace assignment (`M.FunctionName = FunctionName`).
- Do not use ES6 `export` or `import` statements in browser runtime files.
- Do not use CommonJS `require()` in browser runtime files.

---

## 4. Naming Conventions

### 4.1 Identifiers

```javascript
// camelCase for variables and functions
const itemScore = 100;
function calculateTotalScore() {}

// PascalCase for constructors and classes
function MemoryManager() {}

// UPPER_SNAKE_CASE for constants
const RESULT_CACHE_CAP = 50;
const IDLE_TIMEOUT_MS = 5400000;
```

### 4.2 Public vs Private Function Conventions

```javascript
// Private helper (not exported) — prefix with underscore or keep scope internal
function _internalCalculation() {}

// Public function (exported via namespace) — standard camelCase or PascalCase export
function processQuery() {}
M.ProcessQuery = processQuery;
```

### 4.3 Boolean Identifiers
Use `is`, `has`, `can`, or `should` prefixes for boolean variables:

```javascript
// Correct
const isVisible = true;
const hasLoaded = false;
const canBypass = true;
const shouldRefresh = false;

// Incorrect
const visible = true;
const loaded = false;
```

### 4.4 Event Handlers
Prefix event handlers with `on` or `handle`:

```javascript
// Correct
function onButtonClick(event) {}
function handleScrollEnd() {}

// Incorrect
function clickButton() {}
function scrollEnd() {}
```

---

## 5. Code Style

### 5.1 Syntax Rules
- **Indentation**: Exactly 2 spaces per level. Do not use tab characters.
- **Semicolons**: Mandatory on every statement.
- **Quotes**: Single quotes `'...'` for JavaScript strings; double quotes `"..."` inside embedded HTML strings; backticks `` `...` `` for ES6 template literals.
- **Braces**: K&R style (opening brace on the same line). Include braces for all control blocks including single-line `if` statements.
- **Line Length**: Max 120 characters per line.
- **Trailing Commas**: Required on multi-line array and object literals.

```javascript
// Correct Braces and Quotes
if (hasPermission) {
  const message = 'Access granted';
  executeAction(message);
}

// Correct Trailing Comma
const configuration = {
  timeout: 1200,
  cacheCap: 50,
  enabled: true,
};
```

---

## 6. Comments & Documentation

### 6.1 File Header Comment
Every file must open with a standard descriptive JSDoc block stating module scope, subsystem, namespace, dependencies, and exported API.

### 6.2 Function Comments
Use JSDoc for public functions and exported methods:

```javascript
/**
 * Processes and filters input documents according to active search options.
 *
 * @param {Array<Object>} docs - Array of searchable document objects.
 * @param {Object} [options={}] - Search option configuration.
 * @param {boolean} [options.strictMode=false] - Enforces exact term matching when true.
 * @returns {Promise<Array<Object>>} Filtered document results.
 */
async function processSearchDocs(docs, options = {}) {
  // Logic implementation
}
```

### 6.3 Inline Comments & Dead Code
- Write inline comments explaining *why* logic exists, not *what* JavaScript syntax does.
- Do not leave commented-out code blocks in commits. Remove unused code entirely.
- Mark pending or fragile items using standardized tags: `// TODO(author): text`, `// FIXME(author): text`, `// HACK: text`.

---

## 7. Error Handling

### 7.1 Async Error Handling
Wrap async operations in `try...catch` blocks with explicit error logging:

```javascript
async function fetchReleaseNotes(version) {
  try {
    const response = await fetch(`/assets/md/en/releases/v${version}.md`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('[ReleaseNotes] Fetch failed for version:', version, error);
    return null;
  }
}
```

### 7.2 Input Validation
Validate function arguments before executing core logic:

```javascript
function renderCardBatch(cards) {
  if (!Array.isArray(cards)) {
    throw new TypeError('[RenderEngine] cards parameter must be an Array');
  }
  // Processing logic
}
```

### 7.3 User-Facing Notifications
Use `PopupSystem` rather than native browser alerts or throwing unhandled top-level errors:

```javascript
// Correct user-facing error dialog
await PopupSystem.alert('Failed to load requested release notes. Please try again.');
```

---

## 8. Async Patterns

### 8.1 Async / Await Standard
Prefer `async/await` syntax over raw Promise chain cascades (`.then()`).

```javascript
// Correct
async function loadSystemConfig() {
  const response = await fetch('/assets/json/version.json');
  return await response.json();
}
```

### 8.2 Parallel Async Execution
Use `Promise.all()` to execute independent async requests concurrently:

```javascript
// Efficient concurrent fetching
const [enNotes, thNotes] = await Promise.all([
  fetchReleaseNotes('en'),
  fetchReleaseNotes('th'),
]);
```

---

## 9. DOM Patterns

### 9.1 Query Caching
Cache DOM element selections instead of re-querying the document tree during repeated operations.

```javascript
// Correct DOM query caching
const searchInput = document.querySelector('#search-input');

function clearSearch() {
  if (searchInput) {
    searchInput.value = '';
  }
}
```

### 9.2 Event Delegation
Attach single event listeners to container elements rather than binding listeners to individual child elements.

```javascript
// Correct event delegation
container.addEventListener('click', (event) => {
  const card = event.target.closest('.card-item');
  if (!card) return;
  handleCardSelect(card.dataset.id);
});
```

### 9.3 Batch DOM Mutations
Use `DocumentFragment` to batch insert multiple DOM elements, avoiding repeated layout reflows.

```javascript
const fragment = document.createDocumentFragment();
items.forEach((item) => {
  const el = document.createElement('div');
  el.className = 'item-row';
  el.textContent = item.name;
  fragment.appendChild(el);
});
container.appendChild(fragment);
```

### 9.4 XSS Prevention
Never assign unsanitized user input or raw strings to `innerHTML`. Use `textContent` or text node creation.

```javascript
// Correct (XSS Safe)
element.textContent = userProvidedString;
```

---

## 10. Performance Patterns

### 10.1 Animation Synchronization
Use `requestAnimationFrame` for visual animations or scroll handlers to sync with browser repaint cycles.

### 10.2 Debouncing Event Triggers
Apply debounce wrappers to high-frequency events such as text input, window resize, or scroll handling.

```javascript
const debouncedInputHandler = debounce((query) => {
  executeSearch(query);
}, 300);

inputElement.addEventListener('input', (e) => {
  debouncedInputHandler(e.target.value);
});
```

### 10.3 Layout Thrashing Prevention
Separate DOM read operations (`offsetHeight`, `getBoundingClientRect()`) from DOM write operations (`style.width`, `classList.add()`) to prevent forced synchronous layouts.

---

## 11. SEO-Friendly Code Patterns

For full SEO specifications, see [`12-SEO-Guide.md`](./12-SEO-Guide.md). For forbidden SEO anti-patterns, see [`AI_FORBIDDEN.md`](./AI_FORBIDDEN.md).

### 11.1 Semantic HTML Markup
Always structure document layouts using native semantic elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`).

### 11.2 Heading Hierarchy Invariants
- Exactly one `<h1>` element per page.
- Sequential heading levels without skipping levels (`<h1>` -> `<h2>` -> `<h3>`).

### 11.3 Image Attributes
Every `<img>` element must specify `alt`, `width`, and `height` attributes to eliminate Cumulative Layout Shift (CLS) and ensure screen reader accessibility.

```html
<img src="/assets/images/hero.jpg" alt="FanHoard Hero Banner" width="1200" height="630" loading="eager">
<img src="/assets/images/card.jpg" alt="Emoji Card" width="400" height="300" loading="lazy" decoding="async">
```

### 11.4 Crawlable Navigation Links
Use standard `<a href="...">` elements for page navigation so web crawlers can discover routes. Do not rely on JavaScript `onclick` handlers on `<div>` or `<span>` elements for primary navigation.

---

## 12. Documentation Maintenance Patterns

For comprehensive documentation standards, see [`13-Documentation-Standard.md`](./13-Documentation-Standard.md).

### 12.1 Atomic Code & Documentation Synchronization
Code modifications and corresponding documentation updates must be committed together within the same pull request or commit step.
- When adding or changing a module under `assets/js/{system}-modules/`, update the corresponding subsystem specification in `fanhoard-docs/`.
- When updating public API signatures or configuration constants, update JSDoc comments and subsystem documentation simultaneously.

### 12.2 Cross-Reference Integrity Verification
Before committing documentation changes, verify cross-reference links using automated checks:

```bash
# Verify no legacy rebranded system names remain
grep -rn "FanVerse" fanhoard-docs/
grep -rn "Fantrove" fanhoard-docs/

# Verify Markdown cross-references resolve to existing files
ls fanhoard-docs/*.md | sort > /tmp/existing.txt
grep -ohE '\./[A-Za-z0-9_-]+\.md' fanhoard-docs/*.md | sort -u | sed 's|^\./||' > /tmp/refs.txt
comm -23 /tmp/refs.txt /tmp/existing.txt
```

---

## 13. Summary Matrix

| Principle Category | Invariant Rule | Enforcement Method |
| :--- | :--- | :--- |
| **Code Style** | Match existing codebase conventions; 2 spaces indent; mandatory semicolons; single quotes. | ESLint / Code Review |
| **Module Pattern** | IIFE wrapper with `'use strict';` and explicit namespace exports (`M.X = X`). No ES6 modules in runtime JS. | Browser Runtime Check |
| **Async Operations** | `async/await` syntax with explicit `try...catch` logging. Concurrent fetching via `Promise.all()`. | Code Review |
| **DOM & Security** | Cache DOM queries; use `DocumentFragment` for batch writes; use `textContent` to prevent XSS. | Code Review / Vitest |
| **SEO Markup** | Semantic HTML structure; single `<h1>`; explicit `<img>` dimensions; crawlable `<a href="...">` links. | Static Analysis / HTML Audit |
| **Documentation** | Atomic code + doc commits; JSDoc on all public methods; 100% facts verified against source code. | `validate-release.js` / Release Gate |
