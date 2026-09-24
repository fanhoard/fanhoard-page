# FanHoard Prohibited Patterns & System Invariants (AI_FORBIDDEN)

- **System Described**: Inviolable Code, Architectural, & Operational Restrictions for AI Agents
- **Entry File**: `fanhoard-docs/AI_FORBIDDEN.md`
- **Dependencies**: All repository source files, `scripts/validate-release.js`, `docs/engineering/ai-docs-guide.md`
- **Verification**: `node scripts/validate-release.js --staged` | `npm run test`

---

## 1. Priority & Severity Rules

This document defines the **highest-priority inviolable rules** for the FanHoard repository. Rules in this document supersede general conventions. Violating any invariant listed here breaks application functionality, corrupts database indices, or fails the 4-layer release validation gate.

---

## 2. Protected Files Matrix

### 2.1 Restricted Core Files (Do Not Modify Without Authorization)

| Protected File Path | Functional Role | Failure Consequence of Invalid Edits |
| :--- | :--- | :--- |
| `assets/db/con-data/index.json` | Registry of copyable content types | Breaks search engine indexing and Home page category assembly |
| `assets/json/buttons.json` | Navigation bar structure | Breaks SPA client-side routing and button links |
| `assets/lang/options/db.json` | Language options registry | Breaks static HTML build generation |
| `_redirects` & `_headers` | Cloudflare Pages routing & caching | Breaks platform HTTP redirects, security, and cache headers |
| `scripts/build.js` | Static build orchestrator | Breaks production deployment build pipeline |
| `scripts/validate-release.js` | 4-layer release validation script | Disables release safety gates and bypass verification |
| `.release-bypass-counter` | Local bypass consumption counter | **NEVER STAGE THIS FILE**. Staging causes CI pipeline failures |
| `LICENSE` & `NOTICE` | Legal licensing declarations | License violation |

### 2.2 Files Requiring Synchronized Updates

| Target File Group | Synchronization Invariant |
| :--- | :--- |
| `assets/lang/en.json` & `assets/lang/th.json` | New translation keys MUST be added to both language files simultaneously. |
| `assets/md/en/current.md` & `assets/md/th/current.md` | User-facing release updates MUST be written in both languages simultaneously. |
| Generated release files (`assets/md/{lang}/releases/*`, `version.json`) | **DO NOT EDIT DIRECTLY**. Modify `current.md` frontmatter and execute `node scripts/update-version.js`. |

---

## 3. Prohibited Code Patterns

### 3.1 Prohibited Frontend Frameworks & ES Modules
- **NO ES Module Syntax**: Browser scripts MUST use the IIFE pattern (`(function(M){ ... })(window.Namespace = window.Namespace || {})`). `import` and `export` statements in runtime scripts are strictly prohibited.
- **NO Frontend Frameworks**: The application is written in pure vanilla JavaScript. Introducing React, Vue, Svelte, Angular, or jQuery is strictly prohibited.
- **NO `var` Declarations**: Use `const` or `let` exclusively.

### 3.2 Prohibited Native Modals
- Native browser modal calls (`alert()`, `confirm()`, `prompt()`) are prohibited.
- Use `PopupSystem` (`assets/js/popup.js`):
  ```javascript
  // Prohibited
  alert('Saved successfully!');

  // Mandatory
  await PopupSystem.toast('Saved successfully!');
  ```

### 3.3 Prohibited Execution of Pruned Runtime Scripts
Build scripts prune development utilities from generated static HTML. The following files MUST NOT be imported or fetched by production runtime code:
- `lang-proxy.js`
- `lang-sync.js`
- `lang-coordinator.js`

### 3.4 Prohibited DOM & Security Patterns
- **NO Unsafe `innerHTML`**: Do NOT assign user input or unsanitized strings directly to `innerHTML`. Use `textContent` or `DocumentFragment` node construction.
- **NO Undeclared Global State**: Do NOT attach arbitrary properties directly to `window`. Export properties exclusively via designated namespaces (`window.UREModules`, `window.SearchModules`, `window.NavCoreModules`, `window.PopupModules`, `window.LangModules`, `window.ConDataService`, `window.FVLModules`).

---

## 4. Invalid Assumptions Matrix

| Common False Assumption | Fact & Code Evidence |
| :--- | :--- |
| **"System is named FanHoard Page"** | The official system name is **FanHoard** (or **FanHoard Verse**). "FanHoard Page" is repository folder name only. |
| **"Build step uses React / Next.js"** | `scripts/build.js` uses **Cheerio** for static HTML AST manipulations; there is no JSX or React compiler. |
| **"Translations run strictly at runtime"** | Dual execution: Production pages are pre-translated at build time into static HTML; Development (`localhost`) translates via `assets/js/language.js`. |
| **"Service Worker handles all caching"** | Caching is managed primarily by Cloudflare Pages HTTP headers defined in `_headers`. |
| **"Search indexes all data types"** | Search engine indexes **copyable items only** (emoji, symbol, fancy) registered in `index.json`. Cards and packages are excluded. |
| **"Popup and Dialog are separate engines"** | Modal dialogs, toasts, and popups all run on `PopupSystem` (`assets/js/popup.js`). |

---

## 5. Content Data Invariants

1. **Content Descriptor Rule**: Files in `assets/db/con-data/content/*.json` MUST contain source descriptors (`[{ "source": "emoji" }]`), NOT raw item data.
2. **Copyable Index Scope**: `assets/db/con-data/index.json` stores ONLY copyable items (emoji, symbol, fancy). Card collections MUST NOT be added to `index.json`.
3. **Preserve Item Data Schema**: Never delete or rename core item fields (`api`, `text`, `name`) in item objects. Deleting these fields corrupts search index lookups and user favorites.

---

## 6. Internationalization Invariants

1. **Language Accessor**: Do NOT access `localStorage.getItem('selectedLang')` directly. Read current active language from `FvLang.lang` (`assets/js/lang-core.js`).
2. **Language Event Invariant**: Use `fv:langchange` custom event. Legacy `languageChange` event is deprecated.
3. **No Hardcoded HTML Strings**: User-visible strings in static templates MUST use `data-translate="key.path"` attributes paired with `assets/lang/{en,th}.json`.

---

## 7. Performance & DOM Invariants

1. **Query Caching**: Never execute `document.querySelector` inside loops.
2. **Layout Batching**: Batch DOM read operations (`offsetHeight`, `getBoundingClientRect`) before DOM write operations (`style.height`, `classList.add`).
3. **Loop Rendering**: Use `DocumentFragment` or URE (`assets/js/ure/ure.js`) for rendering lists.
4. **Animation Timing**: Use `requestAnimationFrame` for UI animations. `setInterval` for animations is prohibited.
5. **Search Engine Invariants**:
   - `RESULT_CACHE_CAP = 50` (`assets/js/search-system/search-modules/engine.js:122`).
   - `nq.length <= 3` fast path checks `_bucketIndex` Map (`engine.js:616`).

---

## 8. Release Control & Staging Invariants

1. **Never Commit `.release-bypass-counter`**: `.release-bypass-counter` tracks local bypass token usage and MUST NOT be staged in Git commits.
2. **Bypass Token Recipe**: Increment `.release-bypass` to bypass release checks for doc-only pushes:
   ```bash
   V=$(cat .release-bypass-counter)
   echo $((V+5)) > .release-bypass
   git add <doc-file> .release-bypass
   git commit -m "docs: description"
   ```
3. **Automated Version Updating**: Never manually edit generated release files (`assets/md/{lang}/releases/*`, `version.json`). Edit `assets/md/{lang}/current.md` and execute `node scripts/update-version.js`.

---

## 9. SEO Invariants

1. **Mandatory Meta Tags**: Every static HTML page MUST contain unique `<title>`, `<meta name="description">`, `<link rel="canonical">`, and `<link rel="alternate" hreflang="...">` tags.
2. **Static HTML Content**: Critical page content (headings, main text, titles) MUST exist in static HTML so search engine crawlers can index it without JavaScript execution.
3. **Heading Hierarchy**: Exactly ONE `<h1>` tag per page. Sub-sections MUST follow strictly sequential hierarchy (`<h2>` -> `<h3>`).
4. **Image Optimization**: Non-hero images MUST include `loading="lazy"` and `decoding="async"` attributes, alongside explicit `alt` text.
