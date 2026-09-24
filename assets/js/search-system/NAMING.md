# Search Page — Class Naming Conventions & Dictionary (v3.0.0)

- **System Described**: CSS Class and DOM Element Naming Standard for FanHoard Search System v3.0.0
- **Entry File**: `assets/js/search-system/search-system.css`
- **Dependencies**: `assets/js/search-system/search-modules/input-bar.js`, `overlay.js`, `rendering.js`, `suggestions.js`
- **Verification**: `npm test`

---

## 1. Naming Governance & BEM Principles

To maintain strict specificity control, consistency, and clarity across FanHoard search components, all CSS classes and DOM element attributes must conform to the following rules:

1. **Explicity Over Abbreviation**: Every class name must clearly communicate its purpose. Unclear historical abbreviations (e.g., `.sc`, `.scc`, `.sv`, `.vs-*`) are strictly prohibited and replaced.
2. **BEM Methodology**:
   - **Block**: Represents a standalone component (e.g., `.result-card`, `.search-pill`).
   - **Element**: Represents a child component tied to its parent block, delimited by double underscores `__` (e.g., `.search-pill__icon`, `.result-card__title`).
   - **Modifier**: Represents a state or variant, delimited by double hyphens `--` (e.g., `.result-card--vertical`, `.search-suggestion-badge--type`).
3. **Prefix Discipline**: All search-specific classes must begin with either `search-` or belong to the `result-card` block family.

---

## 2. Search System Class Dictionary

### 2.1 Search Bar Component (`.search-pill`)

The search bar widget consists of a pill-shaped capsule container wrapping an icon slot, an input field, and a clear button.

| Active Class / ID | Description / Semantic Purpose | Legacy Name (Deprecated) |
| :--- | :--- | :--- |
| `.search-pill` | Capsule container wrapping icon, input, and clear button | `.search-input-wrapper` |
| `.search-pill__icon` | Icon slot toggling between magnifier (🔍) and back arrow (←) | `.search-input-icon` |
| `#searchInput` | HTML `<input>` field for query entry (ID preserved for JS API) | N/A |
| `#search-clear-btn` | Dynamic ✕ clear button appended by `ClearBtnService` | N/A |

> **Disambiguation Note**:
> - **Pill (`.search-pill`)**: Refers to the entire capsule frame (border, focus state, background).
> - **Input (`#searchInput`)**: Refers strictly to the inner transparent `<input>` element.

---

### 2.2 Result Card Component (`.result-card`)

Result cards render individual search matches for items, types, or categories.

| Active Class | Description / Semantic Purpose | Legacy Name (Deprecated) |
| :--- | :--- | :--- |
| `.result-card` | Base container for a single search result item | `.sc` |
| `.result-card--vertical` | Variant layout for multi-line or long description items | `.sv` |
| `.result-card__glyph` | Primary emoji, symbol, or glyph icon on the left | `.scc` |
| `.result-card__body` | Content container holding title, subtitle, and tag rows | `.scb` |
| `.result-card__title` | Primary title/label text | `.sct` |
| `.result-card__subtitle` | Secondary description or API payload preview | `.scs` |
| `.result-card__tags` | Flex row wrapping item metadata tags | `.scg` |
| `.result-card__tag` | Individual metadata badge or category tag | `.tag` |

---

### 2.3 Search Suggestions Component (`.search-suggestion-*`)

Suggestions display real-time autocomplete candidates and source origin badges.

| Active Class | Description / Semantic Purpose | Legacy Name (Deprecated) |
| :--- | :--- | :--- |
| `.search-suggestions-fullscreen` | Fullscreen overlay drawer displaying live suggestions | `.search-suggestions-fullscreen` |
| `.search-suggestions-title` | Section heading (e.g., "Trending Searches", "Suggestions") | `.suggestions-head` |
| `.search-suggestion-item` | Single clickable suggestion row | `.suggestion-item` |
| `.search-suggestion-body` | Text content of a suggestion item | `.suggestion-body` |
| `.search-suggestion-badge` | Base badge element indicating suggestion origin source | `.suggestion-badge` |
| `.search-suggestion-badge--type` | Origin badge modifier for Type matches (e.g., `[TYPE]`) | `.suggestion-badge-type` |
| `.search-suggestion-badge--category` | Origin badge modifier for Category matches (e.g., `[CAT]`) | `.suggestion-badge-category` |

---

### 2.4 Virtual Scroll Engine Component (`.vscroll-*`)

Fallback virtual scrolling container used when URE is unmounted.

| Active Class | Description / Semantic Purpose | Legacy Name (Deprecated) |
| :--- | :--- | :--- |
| `.vscroll-container` | Virtual scroll viewport container | `.vs-container` |
| `.vscroll-item` | Absolute positioned virtual row item | `.vs-item` |

---

### 2.5 Layout & Empty State Controls

| Active Class | Description / Semantic Purpose | Legacy Name (Deprecated) |
| :--- | :--- | :--- |
| `.search-header` | Top navigation header containing `.search-pill` | N/A |
| `.search-filters-panel` | Filter pills drawer for Type and Category filtering | N/A |
| `.filter-pills-row` | Horizontal scrollable row for filter buttons | N/A |
| `.filter-pill` | Individual filter pill button | N/A |
| `.filter-pill--cat` | Active filter pill modifier | N/A |
| `.search-main-layout` | Main grid container holding search results | N/A |
| `.no-result` | Empty state container displayed when zero matches return | N/A |
| `.no-result__title` | Primary heading for empty search state | N/A |
| `.no-result__hint` | Helpful suggestions for refining query terms | N/A |
| `.search-result-placeholder` | Initial empty state message ("Results will appear here") | `.search-result-here` |

---

## 3. Rules for Adding New Classes

1. **Verify Existing Inventory**: Consult Section 2 above to avoid creating near-duplicate class names.
2. **Apply BEM & Prefix Constraints**: Always prefix new search classes with `search-` or `result-card__`.
3. **Register New Classes**: Update this document immediately whenever new CSS class names are added to `search-system.css` or module templates.
