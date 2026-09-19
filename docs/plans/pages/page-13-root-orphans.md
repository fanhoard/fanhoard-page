# Page Plan 13: Legacy Root Orphans Cleanup (`beta.html`, `cn.html`, `n.html`)

**Target Paths:** `beta.html`, `cn.html`, `n.html`, `assets/json/buttons 1.json`  

---

## 1. Technical Assessment Findings

1. **Root Folder Pollution**: Orphan experimental test files reside directly in repository root:
   - `beta.html`: Legacy compact search card prototype.
   - `cn.html`: Legacy FVL loader demo page.
   - `n.html`: Experimental SVG icon sandbox.
   - `assets/json/buttons 1.json`: Duplicate JSON file with spaces in filename.

---

## 2. Exact Cleaning Steps

1. **Phase 1 Clean Task**:
   - Safely delete `beta.html`, `cn.html`, `n.html` from repository root.
   - Safely delete `assets/json/buttons 1.json` from `assets/json/`.
   - Update build scripts and sitemap generator to ignore deleted paths.
2. **Verification**:
   - Run `git status`: verify files are deleted.
   - Execute `npm run build`: verify build completes cleanly without missing orphan references.
