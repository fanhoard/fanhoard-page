# FanHoard Content Data Service Architecture

- **System Described**: ConData Neutral Data Service & Database Engine
- **Entry File**: `assets/js/con-data-service/con-data-service.js`
- **Dependencies**: `assets/js/con-data-service/con-data-registry.js`, `assets/db/con-data/index.json`
- **Verification**: `npm run test`

---

## 1. Architectural Overview

ConData Service is the neutral, single source of truth for structured static data in FanHoard (emojis, symbols, fancy text styles, and curated collection cards). It operates as a decoupled data provider that exposes normalized data to consumers (`home.js`, `search-ui.js`, `copyNotification.js`, `language.js`) without leaking filesystem details or layout schemas.

### 1.1 Data Service Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA CONSUMERS                           │
│  home.js │ search-ui.js │ copyNotification.js │ language.js │
└────┬──────────┬────────────────┬──────────────────┬─────────┘
     │          │                │                  │
     ▼          ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              window.ConDataService (PUBLIC API)             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  request() │ getAssembled() │ resolveItem() │ search() │ │
│  │  getFormatted() │ findByApi() │ findByText()           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐ │
│  │  _fetcher    │ │ _indexEngine │ │    _eventBus        │ │
│  │  (TTL Cache) │ │ (Fast Lookups)│ │ (Pub/Sub Events)   │ │
│  └──────────────┘ └──────────────┘ └─────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  _loader (Assembly Pipeline)                           │ │
│  │  index.json → {type}.json → {subcategory}.json        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ConDataRegistry (Schema/Path/Validate/Normalize)      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
     │          │                │                  │
     ▼          ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              JSON DATABASE FILES (Static Assets)             │
│  /assets/db/con-data/index.json                             │
│  /assets/db/con-data/emoji.json                             │
│  /assets/db/con-data/symbol.json                            │
│  /assets/db/con-data/fancy.json                             │
│  /assets/db/con-data/cards.json                             │
│  /assets/db/con-data/cards/ai_tools.json                    │
│  /assets/db/con-data/emoji/smileys_emotion.json             │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Design Principles & Invariants

| Principle | Description | Code Invariant |
| :--- | :--- | :--- |
| **Neutral Service** | Exposes data in any requested format (`raw`, `flat`, `grouped`, `search-index`) without UI coupling. | `ConDataService.getFormatted(format, opts)` |
| **Single Source of Truth** | All static content items are served from `/assets/db/con-data/`. | `ConDataRegistry.BASE_PATH = '/assets/db/con-data'` |
| **Auto-Preload** | Data loading begins immediately upon script import; callers receive instant responses or pending promises. | Auto-executed `ConDataService.preload()` |
| **Fetch Deduplication** | Parallel calls to the same endpoint share a single active HTTP Promise. | `_fetcher._pending.has(url)` check |
| **In-Memory TTL Caching** | HTTP responses are cached in memory for up to 2 hours. | `_fetcher._CACHE_TTL = 2 * 60 * 60 * 1000` |
| **Fetch Timeout** | Fetch requests abort after 8 seconds. | `_fetcher._TIMEOUT_MS = 8000` |

---

## 3. Directory File Map

```
assets/
├── js/
│   └── con-data-service/
│       ├── con-data-registry.js     # Path resolver, schema definitions, validation, normalization
│       └── con-data-service.js      # Fetcher, index engine, assembly pipeline, public API
└── db/
    └── con-data/
        ├── index.json               # Top-level index listing all data categories & files
        ├── emoji.json               # Emoji category index
        ├── symbol.json              # Symbol category index
        ├── fancy.json               # Fancy text category index
        ├── cards.json               # Collection cards index
        ├── emoji/                   # Subcategory data files (e.g. smileys_emotion.json)
        ├── symbol/                  # Subcategory data files (e.g. arrows.json)
        ├── fancy/                   # Subcategory data files (e.g. math_bold.json)
        └── cards/                   # Collection card data files (e.g. ai_tools.json)
```

---

## 4. 3-Layer Data Hierarchy & Schemas

### Layer 1: Top-Level Index (`assets/db/con-data/index.json`)
Defines main dataset categories, language metadata, and file pointers.

```json
{
  "version": "1.0.0",
  "categories": [
    { "id": "emoji", "name": { "en": "Emoji", "th": "อีโมจิ" }, "file": "emoji.json", "kind": "copyable" },
    { "id": "symbol", "name": { "en": "Symbol", "th": "สัญลักษณ์" }, "file": "symbol.json", "kind": "copyable" },
    { "id": "cards", "name": { "en": "Cards", "th": "การ์ด" }, "file": "cards.json", "kind": "collection" }
  ]
}
```

### Layer 2: Type Index (`assets/db/con-data/{type}.json`)
Lists subcategories belonging to a specific type.

```json
{
  "id": "emoji",
  "name": { "en": "Emoji", "th": "อีโมจิ" },
  "categories": [
    { "id": "smileys_emotion", "name": { "en": "Smileys & Emotion", "th": "รอยยิ้มและอารมณ์" }, "file": "emoji/smileys_emotion.json" }
  ]
}
```

### Layer 3: Subcategory Data File (`assets/db/con-data/{type}/{subcat}.json`)
Contains individual data items. Standard copyable items supply `api`, `text`, and `name`. Collection items (such as card collections) include optional descriptive and link attributes.

```json
{
  "id": "ai_tools",
  "name": { "en": "AI Tools", "th": "เครื่องมือ AI" },
  "data": [
    {
      "api": "card_chatgpt",
      "text": "ChatGPT",
      "name": { "en": "ChatGPT", "th": "ChatGPT" },
      "description": { "en": "Conversational AI model by OpenAI", "th": "โมเดล AI สนทนาโดย OpenAI" },
      "link": "https://chatgpt.com",
      "className": "card-item-ai"
    }
  ]
}
```

---

## 5. Public API Contract

### `ConDataService.request(options)`
Requests data matching the provided criteria.
- **Input Options**:
  - `type` (string, optional): Filter by type ID (e.g. `'emoji'`, `'cards'`).
  - `subcategory` (string, optional): Filter by subcategory ID (e.g. `'ai_tools'`).
  - `format` (string, default `'raw'`): Output format (`'raw'`, `'flat'`, `'grouped'`, `'search-index'`).
- **Output**: Returns a Promise resolving to the requested data structure.

### `ConDataService.getAssembled()`
Returns the full assembled data object containing all preloaded types and subcategories.

### `ConDataService.resolveItem(params)`
Neutral lookup utility resolving an item from partial parameters.
- **Input Object**: `{ text?: string, api?: string, lang?: string }`
- **Output**: Full item context object or `null`.

```javascript
// Example: Lookup item by API token
const item = ConDataService.resolveItem({ api: 'card_chatgpt' });
```

---

## 6. Implementation References

### Fetcher Deduplication & TTL (`assets/js/con-data-service/con-data-service.js`)

```javascript
const _fetcher = {
  _cache: new Map(),
  _pending: new Map(),
  _CACHE_TTL: 2 * 60 * 60 * 1000,
  _TIMEOUT_MS: 8000,

  _isCacheValid(entry) {
    return entry && (Date.now() - entry.ts) < this._CACHE_TTL;
  },

  async fetch(url) {
    const cached = this._cache.get(url);
    if (this._isCacheValid(cached)) return cached.data;
    if (this._pending.has(url)) return this._pending.get(url);

    const promise = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this._TIMEOUT_MS);
      try {
        const resp = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
        clearTimeout(timer);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} — ${url}`);
        const text = await resp.text();
        const data = JSON.parse(text);
        this._cache.set(url, { data, ts: Date.now() });
        return data;
      } finally {
        clearTimeout(timer);
        this._pending.delete(url);
      }
    })();

    this._pending.set(url, promise);
    return promise;
  }
};
```

---

## 7. Verification

Verify data service structures and validation logic by running:

```bash
npm run test
```
