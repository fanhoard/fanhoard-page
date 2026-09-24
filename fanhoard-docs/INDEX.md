# FanHoard Documentation Master Index (INDEX)

- **System Described**: Master Index, System Priority Matrix, Role-Based Navigation, and Cross-Reference Map for `fanhoard-docs/`
- **Entry File**: `fanhoard-docs/INDEX.md`
- **Dependencies**: All `fanhoard-docs/` files (00-15, AI_*, RELEASE_NOTES_GUIDE)
- **Verification**: `node scripts/validate-release.js --staged` | `npm run test`

---

> Central documentation index for **FanHoard** (FanHoard Verse)—a static web platform for emojis, symbols, and text collections deployed on Cloudflare Pages.

---

## 🎯 System Priority Hierarchy

Every technical task in FanHoard must respect the project priority matrix:

| Priority Level | Domain | Impact & Governance |
| :--- | :--- | :--- |
| 🥇 **Priority #1** | **Documentation** | Documentation defines system contracts. Code changes and documentation updates MUST be committed atomically. See [`13-Documentation-Standard.md`](./13-Documentation-Standard.md) and [`docs/engineering/ai-docs-guide.md`](../docs/engineering/ai-docs-guide.md). |
| 🥈 **Priority #2** | **SEO & Discoverability** | Search visibility drives user discovery. All changes must preserve canonical URLs, structured data, and Core Web Vitals. See [`12-SEO-Guide.md`](./12-SEO-Guide.md). |
| 🥉 **Priority #3** | **Performance & Web Vitals** | Sub-second initial renders and sub-50ms search query execution. See [`08-Performance-Architecture.md`](./08-Performance-Architecture.md). |

---

## 🚀 Where to Start by Role

| User / Agent Role | Primary Starting Path |
| :--- | :--- |
| 🤖 **AI Execution Agent** | [`AI_TASK_WORKFLOW.md`](./AI_TASK_WORKFLOW.md) ──► [`AI_FORBIDDEN.md`](./AI_FORBIDDEN.md) ──► [`00-System-Architecture.md`](./00-System-Architecture.md) |
| 👨‍💻 **New Core Developer** | [`00-System-Architecture.md`](./00-System-Architecture.md) ──► Target Subsystem Guide |
| 📝 **Release Notes Author** | [`RELEASE_NOTES_GUIDE.md`](./RELEASE_NOTES_GUIDE.md) ──► `docs/engineering/release-policy.md` |
| 🎨 **Content / Emoji Manager** | [`10-Content-Guide.md`](./10-Content-Guide.md) ──► `assets/db/con-data/` |
| 🚢 **Deployment / CI Engineer** | [`09-Deployment-Guide.md`](./09-Deployment-Guide.md) ──► `scripts/validate-release.js` |
| ⚡ **Performance Specialist** | [`08-Performance-Architecture.md`](./08-Performance-Architecture.md) ──► `assets/js/ure/` |
| 🔍 **SEO / Organic Growth** | [`12-SEO-Guide.md`](./12-SEO-Guide.md) |
| 📝 **Documentation Maintainer**| [`13-Documentation-Standard.md`](./13-Documentation-Standard.md) ──► `docs/engineering/ai-docs-guide.md` |
| 🎨 **UI/UX Designer** | [`14-System-Design-And-UX.md`](./14-System-Design-And-UX.md) |

---

## 📖 Subsystem Specifications (00–15)

System specifications describe FanHoard architecture, API contracts, state machines, and file structures in full detail.

| # | Subsystem Specification | Core Functional Scope | Primary Source Files |
| :--- | :--- | :--- | :--- |
| **00** | [System Architecture](./00-System-Architecture.md) | Whole-project architectural overview, 7 core subsystems, file maps, and routing. | Entire Repository |
| **01** | [Virtual Scroll Rendering](./01-Virtual-Scroll-Rendering.md) | Universal Render Engine (URE) virtual scrolling and adaptive memory pool. | `assets/js/ure/` |
| **02** | [Search System](./02-Search-System.md) | Two-tier client search engine (substring + Fuse.js fuzzy) with candidate caching. | `assets/js/search-system/` |
| **03** | [Navigation & Content](./03-Navigation-And-Content.md) | SPA routing, early bootstrap layer, and Discover view navigation (`Nav-Core`). | `assets/js/nav-core/` |
| **04** | [Internationalization & Build](./04-Internationalization-And-Build.md) | Dual-mode client runtime i18n (`en`, `th`) and pre-built static HTML generator. | `assets/js/lang/`, `src/build/` |
| **05** | [Content Data Service](./05-Content-Data-Service.md) | Data access layer for emojis, symbols, fancy text, and card metadata (`ConData`). | `assets/js/con-data-service/` |
| **06** | [Popup System](./06-Popup-System.md) | Modular modal, alert, toast, and update dialog engine (`PopupSystem`). | `assets/js/popup.js`, `popup-modules/` |
| **07** | [Loading System](./07-Loading-System.md) | Fullscreen Visual Loading overlay (`FVL`) for transition state management. | `assets/js/loading-system/fvl.js` |
| **08** | [Performance Architecture](./08-Performance-Architecture.md) | Core Web Vitals optimization, LRU caching, web workers, and memory budgets. | Cross-cutting |
| **09** | [Deployment Guide](./09-Deployment-Guide.md) | Cloudflare Pages deployment, release bypass tokens, and CI validation gates. | `scripts/`, `_redirects`, `_headers` |
| **10** | [Content Guide](./10-Content-Guide.md) | Adding, editing, and indexing emoji, symbol, and fancy text JSON files. | `assets/db/con-data/` |
| **11** | [Release Notes System](./11-Release-Notes-System.md) | What's New view, version history, and release note markdown loading. | `assets/md/`, `assets/js/new.js` |
| **12** | [SEO Guide](./12-SEO-Guide.md) | Technical SEO, JSON-LD structured data, canonical URLs, and mobile crawling. | Cross-cutting |
| **13** | [Documentation Standard](./13-Documentation-Standard.md) | Documentation formatting rules, header standards, and code-doc sync. | Cross-cutting |
| **14** | [System Design & UX](./14-System-Design-And-UX.md) | Design tokens, mobile-first layouts, component states, and accessibility. | `assets/css/` |
| **15** | [Loading Contract & Test Plan](./15-Loading-Contract-And-Test-Plan.md) | System startup timing guarantees, loading sequence contracts, and test plans. | Cross-cutting |

---

## 🤖 AI Agent Specifications

Mandatory standards and operational workflows for AI agents working in this repository:

| Document Path | Operational Focus |
| :--- | :--- |
| [AI_CODING_GUIDE.md](./AI_CODING_GUIDE.md) | Coding style, IIFE module patterns, DOM caching, and SEO code rules. |
| [AI_TASK_WORKFLOW.md](./AI_TASK_WORKFLOW.md) | Structured 5-phase execution workflow: Comprehend ──► Plan ──► Execute ──► Verify ──► Deliver. |
| [AI_COMMIT_GUIDE.md](./AI_COMMIT_GUIDE.md) | Commit message formatting, PR summary structure, and changelog rules. |
| [AI_REVIEW_CHECKLIST.md](./AI_REVIEW_CHECKLIST.md) | Quality checklist required before completing tasks or submitting commits. |
| [AI_FORBIDDEN.md](./AI_FORBIDDEN.md) | Highest-priority inviolable rules, prohibited code patterns, and protected files. |

---

## 📝 Operating & Policy Guides

| Document Path | Operational Focus |
| :--- | :--- |
| [RELEASE_NOTES_GUIDE.md](./RELEASE_NOTES_GUIDE.md) | Standard for writing user-facing release notes entries in `current.md`. |
| [docs/engineering/release-policy.md](../docs/engineering/release-policy.md) | Release accumulation policy, version bump decision matrix, and bypass counter. |
| [docs/engineering/ai-docs-guide.md](../docs/engineering/ai-docs-guide.md) | AI-first documentation standards, context headers, and contracts. |

---

## 🗺️ Documentation Cross-Reference Map

```
                          INDEX.md (Master Index)
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
  System Specs (00-15)       AI Specifications       Policy & Release
  (00-System-Architecture)    (AI_TASK_WORKFLOW)      (RELEASE_NOTES_GUIDE)
           │                        │                        │
           ▼                        ▼                        ▼
  00-System-Architecture ──► AI_FORBIDDEN         ──► release-policy.md
  13-Doc-Standard        ──► AI_CODING_GUIDE       ──► ai-docs-guide.md
  12-SEO-Guide           ──► AI_REVIEW_CHECKLIST
```

---

## 📌 Common Task Scenarios

### Scenario 1: AI Agent Fixing a Search Bug
1. Read [`AI_TASK_WORKFLOW.md`](./AI_TASK_WORKFLOW.md) to establish task phases.
2. Read [`AI_FORBIDDEN.md`](./AI_FORBIDDEN.md) for system invariants.
3. Read [`02-Search-System.md`](./02-Search-System.md) to understand engine candidate caching.
4. Apply fix adhering to [`AI_CODING_GUIDE.md`](./AI_CODING_GUIDE.md).
5. Verify locally using `node scripts/validate-release.js --staged` and `npm run test`.
6. Run [`AI_REVIEW_CHECKLIST.md`](./AI_REVIEW_CHECKLIST.md) before final delivery.

### Scenario 2: Adding a New Release Entry
1. Read [`RELEASE_NOTES_GUIDE.md`](./RELEASE_NOTES_GUIDE.md) for structure and technical translation rules.
2. Edit `assets/md/en/current.md` and `assets/md/th/current.md` (SSOT files).
3. Verify release gate using `node scripts/validate-release.js --staged`.

---

## 📅 Documentation Maintenance Procedure

- **New Subsystem**: Assign a new sequential number (e.g., `16-New-Subsystem.md`) and register it in `INDEX.md`.
- **Architectural Update**: Update the target subsystem specification and update `00-System-Architecture.md` simultaneously.
- **Code & Documentation Synchronization**: Stage and commit code modifications and corresponding documentation updates together in a single commit.
