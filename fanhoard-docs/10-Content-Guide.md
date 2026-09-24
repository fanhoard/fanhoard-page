# FanHoard Content System Guide

- **System Described**: Content System, Raw Data Architecture (`con-data/`), and Content Descriptor Pipeline (`content/*.json`)
- **Entry File**: `assets/js/con-data-service/con-data-service.js`
- **Dependencies**: `assets/js/con-data-service/con-data-registry.js`, `assets/js/nav-core-modules/content.js`, `assets/js/nav-core-modules/data.js`
- **Verification**: `npm run test`

---

## 1. System Overview

FanHoard separates content into two distinct layers:
1. **Raw Database Layer (`assets/db/con-data/`)**: Canonical JSON data files containing emojis, symbols, fancy text, and collections.
2. **Content Descriptor Layer (`assets/json/content/*.json`)**: Lightweight descriptor files defining which categories to fetch and how to render them.

This separation allows UI layouts to change without mutating raw dataset items and allows dataset expansions without breaking page layouts.

### 1.1 Content Pipeline Flow

```
assets/db/con-data/              # Raw data layer
    │
    ▼
ConDataService                   # Reads & indexes into assembled memory DB
    │
    ▼
assets/json/content/*.json       # Content Descriptors ("What to fetch & how to render")
    │
    ▼
ContentService                   # Translates descriptor -> fetches data -> renders
    │
    ▼
URE (Unified Render Engine)      # Virtual scrolling DOM rendering
```

---

## 2. Two Content Architectures: Copyable vs Collection

FanHoard partitions data into two strict categories:

| Category Type | Examples | Storage Path | Fetch Mechanism | UI Render Target |
| :--- | :--- | :--- | :--- | :--- |
| **Copyable** | Emoji, Symbol, Fancy Text | Listed in `assets/db/con-data/index.json` | `ConDataService.getAssembled()` | Interactive Copy Buttons |
| **Collection** | Cards, Packages | `assets/db/con-data/cards/*.json` | `fetchCategoryDirect(type, id)` | Rich Cards with Image/Link |

> ⚠️ **CRITICAL INVARIANT:** Never register Collection types (such as `cards`) inside `assets/db/con-data/index.json`. The assembled database feeds search, home carousel, and copy notification pipelines which assume all items are copyable text items.

### 2.1 Feature Comparison Matrix

| Property | Copyable Data | Collection Data |
| :--- | :--- | :--- |
| **UI Component** | Interactive Button | Rich Card (Image, Description, External Link) |
| **Click Action** | Copies text to Clipboard | Opens URL link in new tab |
| **Index Registration** | Required in `index.json` | **Prohibited** in `index.json` |
| **Search Engine Coverage** | Included in Search Index | Excluded from Search Index |
| **Home Carousel** | Supported | Not Supported |

---

## 3. Directory File Map

```
assets/
├── db/
│   └── con-data/
│       ├── index.json             # Registry for Copyable types ONLY
│       ├── emoji.json             # Subcategory registry for Emoji
│       ├── symbol.json            # Subcategory registry for Symbol
│       ├── fancy.json             # Subcategory registry for Fancy
│       ├── emoji/                 # Raw item JSON files
│       │   └── *.json             # Items array [{ api, text, name }]
│       ├── symbol/
│       │   └── *.json
│       ├── fancy/
│       │   └── *.json
│       └── cards/                 # Collection raw data (Direct fetch, NOT in index.json)
│           └── *.json             # Card items [{ api, text, name, description, image, link }]
├── json/
│   ├── buttons.json               # Navigation bar button definitions
│   └── content/                   # Content Descriptors ONLY
│       ├── emojis-page1.json
│       ├── symbols.json
│       └── packages.json
└── js/
    ├── con-data-service/
    │   ├── con-data-registry.js
    │   └── con-data-service.js
    └── nav-core-modules/
        ├── content.js             # ContentService (Descriptor processor)
        └── data.js                # DataService (Fetch & cache manager)
```

---

## 4. Raw Data Schemas (`con-data/`)

### 4.1 Copyable Item Schema (`emoji`, `symbol`, `fancy`)

```json
{
  "api": "U+1F600",
  "text": "😀",
  "name": {
    "en": "Grinning Face",
    "th": "Smiling Face"
  }
}
```

- `api` (string, required): Unicode codepoint or unique string identifier.
- `text` (string, required): Character string copied to clipboard upon click.
- `name` (object, required): Multilingual name map (`name.en` required, `name.th` optional).

### 4.2 Collection Item Schema (`cards`)

```json
{
  "api": "card-openai",
  "text": "OpenAI",
  "name": {
    "en": "OpenAI",
    "th": "OpenAI"
  },
  "description": {
    "en": "Creator of ChatGPT",
    "th": "Creator of ChatGPT"
  },
  "image": "/assets/images/cards/openai.png",
  "link": "https://openai.com",
  "className": "custom-card-style"
}
```

- `description` (object/string, optional): Card summary.
- `image` (string, optional): Image thumbnail URL.
- `link` (string, optional): Target URL opened on card click.

---

## 5. Content Descriptors (`assets/json/content/*.json`)

Descriptor JSON files instruct `ContentService` how to fetch and render content for a specific view.

### 5.1 Type Source Descriptor (`source`)

Fetches all categories belonging to a registered copyable type:

```json
[
  {
    "source": "emoji",
    "as": "buttons",
    "only": ["smileys_emotion", "activities"]
  }
]
```

### 5.2 Subcategory Descriptor (`category`)

**Copyable Subcategory Descriptor**:
```json
[
  {
    "category": "arrows",
    "as": "buttons"
  }
]
```

**Collection Subcategory Descriptor**:
```json
[
  {
    "category": "ai_tools",
    "type": "cards",
    "as": "cards",
    "horizontal": true
  }
]
```

- `type` (string): Required for collection categories to specify source directory (`assets/db/con-data/{type}/`).
- `as` (string): Render target (`"buttons"` or `"cards"`).
- `horizontal` (boolean): Enables horizontal scrolling layout for card groups.

---

## 6. Prohibited Practices

| Prohibited Action | System Impact |
| :--- | :--- |
| Writing raw item data inside `assets/json/content/*.json` | Breaks descriptor architecture and cache layer. |
| Registering collection types (`cards`) in `assets/db/con-data/index.json` | Breaks search engine, home carousel, and copy notifications. |
| Modifying existing item `api` or `text` values | Corrupts saved user favorites and search index references. |
| Omitting `"as": "cards"` when declaring a collection descriptor | Causes cards to render improperly as button elements. |

---

## 7. Cross-References

- [`00-System-Architecture.md`](./00-System-Architecture.md) — Platform architectural overview
- [`05-Content-Data-Service.md`](./05-Content-Data-Service.md) — ConDataService neutral API contract
- [`docs/engineering/ai-docs-guide.md`](../docs/engineering/ai-docs-guide.md) — AI-first documentation standards
