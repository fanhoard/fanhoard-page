# Search Page — Class Naming Conventions & Dictionary (v3.1.0)

- **System Described**: CSS Class and DOM Element Naming Standard for FanHoard Search System
- **Entry File**: `assets/js/search-system/search-system.css`
- **Dependencies**: `assets/js/search-system/search-modules/ui.js`, `search-assist.js`
- **Verification**: `npm test`

---

## 1. Naming Governance & BEM Principles

All CSS classes and DOM element attributes conform strictly to:

1. **Explicity Over Abbreviation**: Clear semantic names (`.search-card`, `.search-pill`).
2. **BEM Methodology**: Block (`.search-card`), Element (`.search-card__symbol`), Modifier (`.suggestion-item--trending`).
3. **Prefix Discipline**: Prefixed with `search-`, `suggestion-`, or `discovery-`.

---

## 2. Search System Component Dictionary

### 2.1 Search Bar Component (`.search-pill`)

| Active Class / ID | Description / Semantic Purpose |
| :--- | :--- |
| `.search-pill` | Capsule container wrapping icon, input, and clear button |
| `.search-pill__icon` | Icon slot toggling between magnifier (🔍) and back arrow (←) |
| `#searchInput` | HTML `<input>` field for query entry |
| `#search-clear-btn` | Dynamic clear button managed by `ClearBtnService` |

---

### 2.2 Result Card Component (`.search-card`)

| Active Class | Description / Semantic Purpose |
| :--- | :--- |
| `.search-card` | Base container for a single search result item |
| `.search-card-main` | Card body container holding symbol and name |
| `.search-card-symbol` | Symbol/API badge text |
| `.search-card-name` | Display title/label |

---

### 2.3 Search Assist & Discovery (`.suggestion-*`, `.discovery-*`)

| Active Class / ID | Description / Semantic Purpose |
| :--- | :--- |
| `#search-suggestions-overlay` | Fullscreen overlay drawer for live suggestions |
| `.suggestion-group` | Suggestion section wrapper |
| `.suggestion-item` | Clickable autocomplete suggestion item |
| `.suggestion-badge` | Source origin badge (type or category) |
| `.discovery-card` | Related content card (YouTube-style) |
| `#search-discovery-section` | Container for related content cards |
