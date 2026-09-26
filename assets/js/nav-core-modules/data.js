// Path:    assets/js/nav-core-modules/data.js
// Purpose: DataService — fetch, cache, and index all con-data; bridges NavCore to ConDataService
// Used by: content.js (_resolveSource, fetchCategoryGroup), copy.js (apiMap lookup), router.js (fetchWithRetry), init.js (_warmup)

// @ts-check
/**
 * @file data.js
 * DataService — data fetching, caching, and shared index management.
 *
 * v2.1 — เพิ่ม getTypeCategories(typeId)
 *   Public method สำหรับ ContentService._resolveSource() —
 *   ดึงรายการ [{id, name}] ของ categories ทั้งหมดใน type นั้น
 *   โดยใช้ cache จาก _loadCategoryIndex ที่มีอยู่แล้ว (ไม่ fetch ซ้ำ)
 *
 * (patched: _performFetch has real retry, _buildSharedIndex clears rejected promise)
 *
 * @module data
 * @depends {config.js, state.js, utils.js}
 * @used-by content.js, copy.js, router.js
 */
(function (M) {
  'use strict';

  const { CONFIG, Utils } = M;

  function _getConDataService() {
    return window.ConDataService || null;
  }

  function _requireConDataService(timeoutMs = 10000) {
    const svc = window.ConDataService;
    if (svc) return Promise.resolve(svc);

    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeoutMs;
      const poll = () => {
        if (window.ConDataService) return resolve(window.ConDataService);
        if (Date.now() > deadline)
          return reject(new Error(
            '[NavCore/Data] ConDataService not available after ' + timeoutMs + 'ms.'
          ));
        setTimeout(poll, 100);
      };
      setTimeout(poll, 50);
    });
  }

  const DataService = {

    cache: new Map(),
    apiCache: null,
    apiCacheTimestamp: 0,
    _categoryIndexes:  new Map(),
    _subcategoryCache: new Map(),
    _topLevelIndex:    null,
    _topLevelIndexPromise: null,
    _sharedIndex:        null,
    _sharedIndexPromise: null,
    _fetchQueue:      [],
    _fetchInProgress: new Map(),
    _queueProcessing: false,
    _queueDirty:      false,

    // ── Fetch queue ─────────────────────────────────────────────────────────────

    async _enqueueFetch(url, options = {}, priority = 5) {
      return new Promise((resolve, reject) => {
        this._fetchQueue.push({
          url, options,
          priority: typeof priority === 'number' ? priority : 5,
          resolve, reject,
          timestamp: Date.now(),
        });
        this._queueDirty = true;
        this._processFetchQueue();
      });
    },

    async _processFetchQueue() {
      if (this._queueProcessing || !this._fetchQueue.length) return;
      this._queueProcessing = true;

      while (this._fetchQueue.length) {
        if (this._fetchInProgress.size >= CONFIG.FETCH.MAX_CONCURRENT) {
          await new Promise(r => setTimeout(r, 50));
          continue;
        }
        if (this._queueDirty) {
          this._fetchQueue.sort((a, b) => a.priority - b.priority || a.timestamp - b.timestamp);
          this._queueDirty = false;
        }
        const task   = this._fetchQueue.shift();
        const taskId = `${task.url}-${task.priority}`;
        this._fetchInProgress.set(taskId, true);
        this._performFetch(task.url, task.options)
          .then(result => { task.resolve(result); this._fetchInProgress.delete(taskId); })
          .catch(err   => { task.reject(err);     this._fetchInProgress.delete(taskId); });
      }

      this._queueProcessing = false;
    },

    // ── Cache helpers ───────────────────────────────────────────────────────────

    getCached(key) {
      const cached = this.cache.get(key);
      if (cached && Date.now() <= cached.expiry) return cached.data;
      if (typeof window !== 'undefined' && window.PLSys && window.PLSys.SWRCache && key) {
        const swrData = window.PLSys.SWRCache.get(key);
        if (swrData) return swrData;
      }
      return null;
    },

    setCache(key, data, ttl = CONFIG.FETCH.CACHE_DURATION) {
      this.cache.set(key, { data, expiry: Date.now() + ttl });
      if (typeof window !== 'undefined' && window.PLSys && window.PLSys.SWRCache && key) {
        try { window.PLSys.SWRCache.set(key, data); } catch (_) {}
      }
    },

    clearCache() {
      this.cache.clear();
      this.apiCache          = null;
      this.apiCacheTimestamp = 0;
      this._categoryIndexes.clear();
      this._subcategoryCache.clear();
      this._topLevelIndex        = null;
      this._topLevelIndexPromise = null;
      this._sharedIndex          = null;
      this._sharedIndexPromise   = null;
      try { _getConDataService()?.invalidateCache?.(); } catch (_) {}
    },

    // ── _performFetch: ใส่ retry จริง 3 ครั้ง ────────────────────────────────────
    // BUG FIX: เดิมลองแค่ครั้งเดียว — network blip ครั้งเดียวทำระบบพัง
    // FIXED:   retry 3 ครั้ง ด้วย delay 400ms → 1200ms → 2400ms

    async _performFetch(url, options = {}) {
      const cached = this.getCached(url);
      if (cached) return cached;

      const DELAYS = [400, 1200, 2400];
      let lastErr;

      for (let attempt = 0; attempt <= DELAYS.length; attempt++) {
        try {
          if (!Utils.isOnline()) throw new Error('Offline');

          const controller = new AbortController();
          const timeoutId  = setTimeout(() => controller.abort(), CONFIG.FETCH.TIMEOUT);

          const response = await fetch(url, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers },
            signal:  controller.signal,
            cache:   options.cache === 'reload' ? 'reload' : 'no-store',
          });
          clearTimeout(timeoutId);

          const respText = await response.text().catch(() => null);
          if (!response.ok) throw new Error(`Fetch error: ${response.status} ${response.statusText}`);

          let data;
          try { data = respText ? JSON.parse(respText) : null; }
          catch (_) { throw new Error(`Invalid JSON response from ${url}`); }

          if (options.cache !== false) this.setCache(url, data);
          return data;

        } catch (err) {
          lastErr = err;
          if (attempt < DELAYS.length) {
            await new Promise(r => setTimeout(r, DELAYS[attempt]));
          }
        }
      }

      // ทุก retry ล้มเหลว — แสดง fullscreen error detail แล้ว throw
      try {
        Utils.showErrorFullscreen(lastErr, { label: 'Data Fetch: ' + url });
      } catch (_) {}
      throw lastErr;
    },

    // ── fetchWithRetry ──────────────────────────────────────────────────────────

    async fetchWithRetry(url, options = {}, priority = 5) {
      if (url && url.includes('/con-data/'))
        return this._fetchViaService(url);
      return this._enqueueFetch(url, options, priority);
    },

    // ── ConDataService bridge ───────────────────────────────────────────────────

    async _fetchViaService(url) {
      const svc = await _requireConDataService();

      const twoSeg = url.match(/\/con-data\/([^/?#]+)\/([^/?#]+?)(?:\.min)?\.json(?:[?#].*)?$/);
      if (twoSeg) {
        const [, typeId, catId] = twoSeg;
        const items = await svc.getItems(typeId, catId).catch(() => null);
        if (items != null) return items;
      }

      const oneSeg = url.match(/\/con-data\/([^/?#/]+?)(?:\.min)?\.json(?:[?#].*)?$/);
      if (oneSeg && oneSeg[1] !== 'index') {
        const typeId  = oneSeg[1];
        const typeObj = await svc.getTypeById(typeId).catch(() => null);
        if (typeObj) return typeObj;
      }

      return svc.getAssembled();
    },

    // ── Warmup ──────────────────────────────────────────────────────────────────

    _warmupPromise: null,

    async _warmup() {
      if (this._warmupPromise) return this._warmupPromise;
      this._warmupPromise = new Promise(resolve => {
        const doWarmup = async () => {
          try {
            if (!Utils.isOnline()) return resolve();
            await this._enqueueFetch(CONFIG.PATHS.BUTTONS_CONFIG, { cache: 'force-cache' }, 9).catch(() => {});
            _getConDataService()?.preload?.().catch(() => {});
          } finally { resolve(); }
        };
        if ('requestIdleCallback' in window)
          requestIdleCallback(doWarmup, { timeout: CONFIG.FETCH.WARMUP_TIMEOUT });
        else
          setTimeout(doWarmup, CONFIG.FETCH.WARMUP_DELAY);
      });
      return this._warmupPromise;
    },

    // ── loadApiDatabase ─────────────────────────────────────────────────────────

    async loadApiDatabase() {
      this._warmup();

      if (this.apiCache && Date.now() - this.apiCacheTimestamp < CONFIG.FETCH.CACHE_DURATION) {
        if (!this._sharedIndex) {
          if (this._sharedIndexPromise) await this._sharedIndexPromise;
          else await this._buildSharedIndex(this.apiCache);
        }
        return this.apiCache;
      }

      try {
        const svc = await _requireConDataService();
        const db  = await svc.getAssembled();
        this.apiCache          = db;
        this.apiCacheTimestamp = Date.now();
        await this._buildSharedIndex(db);
        return db;
      } catch (e) {
        if (this.apiCache) return this.apiCache;
        throw e;
      }
    },

    // ── _buildSharedIndex: clear rejected promise เพื่อให้ retry ได้ ────────────
    // BUG FIX: เดิม promise ค้างอยู่สถานะ rejected ตลอดไป — ทุก call ถัดไปได้ reject เดิม
    // FIXED:   clear _sharedIndexPromise ทั้งใน success และ failure

    async _buildSharedIndex(db) {
      if (this._sharedIndex) return this._sharedIndex;

      if (this._sharedIndexPromise) {
        try {
          return await this._sharedIndexPromise;
        } catch (_) {
          this._sharedIndexPromise = null;
        }
      }

      const buildPromise = (async () => {
        const apiMap       = new Map();
        const idMap        = new Map();
        const textMap      = new Map();
        const catToTypeMap = new Map();

        let count = 0;

        for (const typeObj of (db?.type || [])) {
          if (!typeObj || typeof typeObj !== 'object') continue;
          if (typeObj.id) idMap.set(typeObj.id, typeObj);

          if (typeObj.as === 'cards' || typeObj.as === 'card') continue;

          for (const catObj of (typeObj.category || [])) {
            if (!catObj || typeof catObj !== 'object') continue;
            if (catObj.id && typeObj.id) catToTypeMap.set(catObj.id, typeObj.id);

            for (const item of (catObj.items || [])) {
              if (!item || typeof item !== 'object') continue;
              if (item.api)  apiMap.set(item.api, item);
              if (item.id)   idMap.set(item.id, item);
              if (item.text) textMap.set(item.text, item);
              count++;
            }
          }
        }

        const indexObj = { apiMap, idMap, textMap, catToTypeMap, count };
        this._sharedIndex = indexObj;
        return indexObj;
      })();

      this._sharedIndexPromise = buildPromise;

      try {
        return await buildPromise;
      } catch (err) {
        this._sharedIndexPromise = null;
        throw err;
      }
    },

    async lookupByApi(api) {
      const idx = await this._getOrBuildIndex();
      return idx.apiMap.get(api) || null;
    },

    async lookupById(id) {
      const idx = await this._getOrBuildIndex();
      return idx.idMap.get(id) || null;
    },

    async lookupByText(text) {
      const idx = await this._getOrBuildIndex();
      return idx.textMap.get(text) || null;
    },

    async getTypeForCategory(catId) {
      const idx = await this._getOrBuildIndex();
      return idx.catToTypeMap.get(catId) || null;
    },

    async _getOrBuildIndex() {
      if (this._sharedIndex) return this._sharedIndex;
      const db = await this.loadApiDatabase();
      return this._buildSharedIndex(db);
    },

    // ── Category index loading (con-data index.json) ─────────────────────────

    async _loadCategoryIndex(typeId) {
      if (this._categoryIndexes.has(typeId))
        return this._categoryIndexes.get(typeId);

      try {
        const raw = await this._performFetch('/assets/db/con-data/index.json', { cache: 'force-cache' });
        if (!raw || !Array.isArray(raw.types)) return null;

        const typeMap = new Map();
        for (const t of raw.types) {
          if (t && t.id && Array.isArray(t.categories)) {
            typeMap.set(t.id, t.categories);
          }
        }

        for (const [id, cats] of typeMap.entries()) {
          this._categoryIndexes.set(id, cats);
        }

        return this._categoryIndexes.get(typeId) || null;
      } catch (e) {
        console.warn('[NavCore/Data] _loadCategoryIndex failed:', e);
        return null;
      }
    },

    async getTypeCategories(typeId) {
      const cats = await this._loadCategoryIndex(typeId);
      if (!cats || !cats.length) return [];

      return cats.map(c => ({
        id:          c.id || '',
        name:        c.name || { en: c.id || '', th: c.id || '' },
        description: c.description || null,
        itemCount:   c.itemCount || 0,
      }));
    },

    async _loadSubcategoryData(typeId, catId) {
      const cacheKey = `${typeId}/${catId}`;
      if (this._subcategoryCache.has(cacheKey)) return this._subcategoryCache.get(cacheKey);

      const url = `/assets/db/con-data/${typeId}/${catId}.json`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        this._subcategoryCache.set(cacheKey, cached);
        return cached;
      }

      try {
        const data = await this._performFetch(url);
        const result = (data && Array.isArray(data.items)) ? data.items : [];
        this.setCache(cacheKey, result);
        this._subcategoryCache.set(cacheKey, result);
        return result;
      } catch (e) {
        console.warn(`[NavCore/Data] Failed to load subcategory data for ${cacheKey}:`, e);
        return [];
      }
    },
  };

  M.DataService = DataService;

})(window.NavCoreModules = window.NavCoreModules || {});
