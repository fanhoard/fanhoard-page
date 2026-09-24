# FanHoard Performance Architecture

- **System Described**: System-Wide Performance, Memory Management & Rendering Optimizations
- **Entry File**: `assets/js/search-system/search-modules/engine.js`
- **Dependencies**: `assets/js/ure/`, `assets/js/con-data-service/con-data-service.js`
- **Verification**: `npm run test`

---

## 1. Architectural Overview

FanHoard delivers high-frame-rate interactions across tens of thousands of static data items (emojis, symbols, fancy text styles, and cards) on desktop and low-end mobile devices. Performance is enforced through strict memory caps, sub-linear lookup indexes, virtualized DOM rendering, and off-main-thread processing.

---

## 2. System Performance Invariants

| Performance Mechanism | Module Location | Enforcing Code / Invariant | Impact / Target |
| :--- | :--- | :--- | :--- |
| **LRU Search Result Cache** | Search Engine | `RESULT_CACHE_CAP = 50` (`assets/js/search-system/search-modules/engine.js:122`) | Evicts oldest query results when cache reaches 50 entries to prevent memory leaks |
| **Short Query Fast Path** | Search Engine | `nq.length <= 3` uses `_bucketIndex` (`engine.js:616`) | Fast-paths candidate filtering via character-indexed bucket Map for short searches |
| **Data Service TTL Cache** | ConData Service | `_CACHE_TTL = 2 * 60 * 60 * 1000` (`assets/js/con-data-service/con-data-service.js`) | Caches JSON HTTP fetch results in memory for 2 hours |
| **Virtual DOM Recycling** | URE Engine | Viewport-bounded DOM pool (`assets/js/ure/`) | Limits DOM elements to viewport count + buffer, recycling nodes during scroll |
| **Layout Thrashing Guard** | Popup / Loader | Double-rAF animation scheduling (`animator.js`) | Batches DOM style reads and write mutations across separate animation frames |

---

## 3. Search Engine Performance Subsystems

### 3.1 LRU Cache & Bucket Index Engine
The search engine maintains a two-tier memory optimization strategy:
1. **Query Cache Eviction**: `_resultCache` maps normalized query strings to result arrays. When `_resultCache.size >= RESULT_CACHE_CAP` (50), the oldest entry is deleted via Map key iterator.
2. **Bucket Index Acceleration**: Upon dataset initialization, `_bucketIndex` builds a Map indexing documents by their initial character. Queries with length `<= 3` skip full array iterations and evaluate candidates directly from `_bucketIndex.get(firstChar)`.

```
  [Query Request: "smi"]
            │
            ▼
  ┌───────────────────┐      Cache Hit (< 50 capped entries)   ┌───────────────────┐
  │ Check LRU Cache   │───────────────────────────────────────►│ Return Cached     │
  └─────────┬─────────┘                                        │ Result Array      │
            │ Cache Miss                                       └───────────────────┘
            ▼
  ┌───────────────────┐      Query Length <= 3                ┌───────────────────┐
  │ Query Length Check│──────────────────────────────────────►│ Fetch Candidates  │
  └─────────┬─────────┘                                       │ via _bucketIndex  │
            │ Query Length > 3                                └─────────┬─────────┘
            ▼                                                           │
  ┌───────────────────┐                                                 │
  │ Full Array Scan   │◄────────────────────────────────────────────────┘
  └─────────┬─────────┘
            │
            ▼
  ┌───────────────────┐
  │ Evict Oldest if   │──► Delete first Map key if size >= 50
  │ Cache Full (>=50) │──► Store in _resultCache
  └───────────────────┘
```

### 3.2 Off-Main-Thread Worker Processing
Heavy text fuzzy matching and Fuse.js computations offload to Web Workers via `worker-bridge.js`. The main thread remains dedicated to 60fps UI updates, receiving structured search results over non-blocking postMessage channels.

---

## 4. Virtual Scrolling & DOM Recycling (URE)

The Universal Render Engine (URE) manages large list rendering:
- **Viewport Bounding**: Calculates item offsets using TypedArrays (`Float32Array`) and renders only visible items plus a small top/bottom buffer (e.g. 5 items).
- **Node Pooling**: Recycles unmounted DOM nodes during scroll events rather than constructing new elements via `document.createElement()`, reducing Garbage Collection (GC) thrash.

---

## 5. Implementation Code Examples

### 5.1 LRU Result Cache Eviction & Bucket Fast Path (`assets/js/search-system/search-modules/engine.js`)

```javascript
/** PF-02: Query result cache (Map, capped at 50 entries). */
const RESULT_CACHE_CAP = 50;

/** PF-04: Candidate bucket index Map: char -> SearchDoc[] */
let _bucketIndex = new Map();

// Fast-path candidate retrieval for short queries
if (nq.length <= 3 && _bucketIndex) {
  const firstChar = nq[0];
  if (_bucketIndex.has(firstChar)) {
    candidates = _bucketIndex.get(firstChar);
  }
}

// Enforce LRU Cache Cap of 50 entries
if (_resultCache.size >= RESULT_CACHE_CAP) {
  const firstKey = _resultCache.keys().next().value;
  if (firstKey !== undefined) {
    _resultCache.delete(firstKey);
  }
}
_resultCache.set(cacheKey, res);
```

### 5.2 ConData Service TTL Caching (`assets/js/con-data-service/con-data-service.js`)

```javascript
const _fetcher = {
  _cache: new Map(),
  _CACHE_TTL: 2 * 60 * 60 * 1000, // 2 hours

  _isCacheValid(entry) {
    return entry && (Date.now() - entry.ts) < this._CACHE_TTL;
  },

  async fetch(url) {
    const cached = this._cache.get(url);
    if (this._isCacheValid(cached)) return cached.data;
    // ...
  }
};
```

---

## 6. Verification

Run search engine unit tests to verify LRU cache capping and bucket index bounds:

```bash
npm run test
```
