// @ts-check
/**
 * @file engine.js
 * SearchEngine — aerospace-grade two-tier search engine module.
 *
 * @module engine
 */

import { CONFIG } from './config.js';

// ── Constants ──────────────────────────────────────────────────────────────
const FUSE_THRESHOLDS = Object.freeze({
  veryShort: 0.55,
  short: 0.45,
  medium: 0.38,
  long: 0.30,
});

const ASSIST_SOURCE = Object.freeze({
  KEYWORD_EXACT: 1,
  TYPE_NAME: 2,
  CATEGORY_NAME: 3,
  KEYWORD_CONTAINS: 4,
  FUSE: 5,
  IMMEDIATE: 6,
});
const SUGGESTION_SOURCE = ASSIST_SOURCE;

// ── Module-private state ───────────────────────────────────────────────────
/** @type {any} */
let _data = null;
/** @type {any[]} */
let _docs = [];
/** @type {any[]} */
let _keywords = [];
/** @type {any[]} */
let _typeIndex = [];
/** @type {any[]} */
let _categoryIndex = [];
/** @type {any} */
let _fuse = null;
let _normalize = defaultNormalizeText;
let _options = {
  useWorker: false,
  fuseOptions: {},
  fastImmediateLimit: 200,
  idleTimeout: 4000,
};
let _fuseBuilding = false;
let _fuseBuildRetries = 0;
const MAX_FUSE_RETRIES = 3;
let _langs = ['en'];

const _resultCache = new Map();
const RESULT_CACHE_CAP = 50;

let _bucketIndex = new Map();

/**
 * @param {any[]} docs
 */
function buildBucketIndex(docs) {
  const buckets = new Map();
  for (let i = 0; i < docs.length; i++) {
    const d = docs[i];
    const hay = d.combinedLower || ((d.name || '') + ' ' + (d.api || '') + ' ' + (d.combined || '')).toLowerCase();
    const seen = new Set();
    for (let j = 0; j < hay.length; j++) {
      const ch = hay[j];
      if (ch <= ' ' || seen.has(ch)) continue;
      seen.add(ch);
      let list = buckets.get(ch);
      if (!list) {
        list = [];
        buckets.set(ch, list);
      }
      list.push(d);
    }
  }
  return buckets;
}

function _clearResultCache() {
  _resultCache.clear();
}

/**
 * @param {any} v
 */
function isEmpty(v) {
  return v === null || v === undefined || v === '';
}

/**
 * @param {any} s
 */
function defaultNormalizeText(s) {
  if (!s && s !== 0) return '';
  s = String(s).toLowerCase().trim();
  try {
    s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  } catch (e) {}
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');
  s = s
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');
  s = s.replace(/[\uFF01-\uFF5E]/g, (/** @type {any} */ ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
  s = s.replace(/[^\p{L}\p{N}\s]+/gu, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * @param {any} obj
 * @param {any} langs
 */
function pickLang(obj, langs) {
  if (!obj || typeof obj !== 'object') return obj || '';
  for (let i = 0; i < langs.length; i++) if (obj[langs[i]]) return obj[langs[i]];
  for (const k in obj) return obj[k];
  return '';
}

/**
 * @param {any} data
 */
function detectLangs(data) {
  const set = Object.create(null);
  if (!data || !Array.isArray(data.type)) return ['en'];
  for (let i = 0; i < data.type.length; i++) {
    const t = data.type[i];
    if (typeof t.name === 'object') for (const k in t.name) set[k] = 1;
    const cats = t.category || [];
    for (let j = 0; j < cats.length; j++) {
      const c = cats[j];
      if (typeof c.name === 'object') for (const k in c.name) set[k] = 1;
      const items = c.data || [];
      for (let x = 0; x < items.length; x++) {
        const it = items[x];
        if (typeof it.name === 'object') for (const k in it.name) set[k] = 1;
        for (const k in it) {
          if (/_name$/.test(k) && typeof it[k] === 'object') {
            for (const l in it[k]) set[l] = 1;
          }
        }
      }
    }
  }
  const langs = Object.keys(set);
  return langs.length ? langs : ['en'];
}

function ensureFuseLoaded() {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    if (globalThis.Fuse) return resolve(globalThis.Fuse);
    const src = 'https://unpkg.com/fuse.js@6.6.2/dist/fuse.min.js';
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => {
      // @ts-ignore
      if (globalThis.Fuse) resolve(globalThis.Fuse);
      else reject(new Error('Fuse loaded but globalThis.Fuse not available'));
    };
    s.onerror = () => reject(new Error('Failed to load Fuse.js'));
    document.head.appendChild(s);
  });
}

/**
 * @param {any} s
 */
function escapeHtml(s) {
  // @ts-ignore
  if (window.NavCoreModules?.escapeHtml) {
    // @ts-ignore
    return window.NavCoreModules.escapeHtml(s);
  }
  // @ts-ignore
  if (window.SearchModules?.StringService?.escapeHtml) {
    // @ts-ignore
    return window.SearchModules.StringService.escapeHtml(s);
  }
  const str = String(s);
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c === 38) out += '&amp;';
    else if (c === 60) out += '&lt;';
    else if (c === 62) out += '&gt;';
    else if (c === 34) out += '&quot;';
    else if (c === 39) out += '&#39;';
    else out += str[i];
  }
  return out;
}

/**
 * @param {any} q
 */
function pickFuseThreshold(q) {
  const len = q.length;
  if (len <= 2) return FUSE_THRESHOLDS.veryShort;
  if (len <= 4) return FUSE_THRESHOLDS.short;
  if (len <= 8) return FUSE_THRESHOLDS.medium;
  return FUSE_THRESHOLDS.long;
}

/**
 * @param {any} data
 */
function buildImmediateDocs(data) {
  /** @type {any[]} */
  const docs = [];
  /** @type {any[]} */
  const keywords = [];
  /** @type {any[]} */
  const typeIndex = [];
  /** @type {any[]} */
  const categoryIndex = [];
  if (!data || !Array.isArray(data.type)) {
    return { docs, keywords, typeIndex, categoryIndex };
  }

  const langs = _langs;
  let idCounter = 1;

  const seenTypeNames = new Set();
  const seenCatNames = new Set();

  for (let i = 0; i < data.type.length; i++) {
    const typeObj = data.type[i];
    const typeNames = typeof typeObj.name === 'object' ? typeObj.name : { en: String(typeObj.name || '') };
    const typeDisplay = pickLang(typeNames, langs) || '';

    for (const lg of langs) {
      const tn = typeNames[lg];
      if (tn && !seenTypeNames.has(tn)) {
        seenTypeNames.add(tn);
        typeIndex.push({
          raw: tn,
          normalized: String(tn).toLowerCase(),
          typeObj,
          source: 'type',
        });
      }
    }

    const cats = typeObj.category || [];
    for (let j = 0; j < cats.length; j++) {
      const cat = cats[j];
      const catNames = typeof cat.name === 'object' ? cat.name : { en: String(cat.name || '') };
      const catDisplay = pickLang(catNames, langs) || '';

      for (const lg of langs) {
        const cn = catNames[lg];
        if (cn && !seenCatNames.has(cn)) {
          seenCatNames.add(cn);
          categoryIndex.push({
            raw: cn,
            normalized: String(cn).toLowerCase(),
            typeObj,
            category: cat,
            source: 'category',
          });
        }
      }

      const items = cat.data || [];
      for (let x = 0; x < items.length; x++) {
        const item = items[x];

        const parts = [];
        if (item.name && typeof item.name === 'object') {
          for (const lg of langs) if (item.name[lg]) parts.push(String(item.name[lg]));
        } else if (item.name) parts.push(String(item.name));

        for (const k in item) {
          if (/_name$/.test(k) && typeof item[k] === 'object') {
            for (const lg of langs) if (item[k][lg]) parts.push(String(item[k][lg]));
          }
        }

        if (item.description && typeof item.description === 'object') {
          for (const lg of langs) if (item.description[lg]) parts.push(String(item.description[lg]));
        } else if (typeof item.description === 'string' && item.description) {
          parts.push(item.description);
        }

        if (item.api) parts.push(String(item.api));
        if (item.text) parts.push(String(item.text));

        for (const lg of langs) {
          if (typeNames[lg]) parts.push(String(typeNames[lg]));
          if (catNames[lg]) parts.push(String(catNames[lg]));
        }

        const combined = parts.filter(Boolean).join(' • ');
        const combinedLower = combined.toLowerCase();

        const name = pickLang(item.name || {}, langs) || item.api || '';

        const doc = {
          id: String(idCounter++),
          typeKey: typeDisplay,
          categoryKey: catDisplay,
          name: name,
          api: item.api || '',
          text: item.text || '',
          combined: combined,
          combinedLower: combinedLower,
          rawItem: item,
          typeObj,
          category: cat,
        };
        docs.push(doc);

        const kw = name || item.api || '';
        if (kw) {
          keywords.push({
            raw: kw,
            normalized: String(kw).toLowerCase(),
            docId: doc.id,
            item: item,
            itemName: name,
            typeObj: typeObj,
            typeName: typeDisplay,
            catName: catDisplay,
            source: 'item',
          });
        }
      }
    }
  }

  return { docs, keywords, typeIndex, categoryIndex };
}

/**
 * @param {any} data
 * @param {any} [normalizeFn]
 */
function flattenDataToDocs(data, normalizeFn) {
  /** @type {any[]} */
  const docs = [];
  /** @type {any[]} */
  const keywords = [];
  /** @type {any[]} */
  const typeIndex = [];
  /** @type {any[]} */
  const categoryIndex = [];
  if (!data || !Array.isArray(data.type)) {
    return { docs, keywords, typeIndex, categoryIndex };
  }

  const langs = _langs;
  let idCounter = 1;
  const seenTypeNames = new Set();
  const seenCatNames = new Set();

  for (let i = 0; i < data.type.length; i++) {
    const typeObj = data.type[i];
    const typeNames = typeof typeObj.name === 'object' ? typeObj.name : { en: String(typeObj.name || '') };
    const typeDisplay = pickLang(typeNames, langs) || '';

    for (const lg of langs) {
      const tn = typeNames[lg];
      if (tn && !seenTypeNames.has(tn)) {
        seenTypeNames.add(tn);
        typeIndex.push({
          raw: tn,
          normalized: normalizeFn ? normalizeFn(tn) : String(tn).toLowerCase(),
          typeObj,
          source: 'type',
        });
      }
    }

    const cats = typeObj.category || [];
    for (let j = 0; j < cats.length; j++) {
      const cat = cats[j];
      const catNames = typeof cat.name === 'object' ? cat.name : { en: String(cat.name || '') };
      const catDisplay = pickLang(catNames, langs) || '';

      for (const lg of langs) {
        const cn = catNames[lg];
        if (cn && !seenCatNames.has(cn)) {
          seenCatNames.add(cn);
          categoryIndex.push({
            raw: cn,
            normalized: normalizeFn ? normalizeFn(cn) : String(cn).toLowerCase(),
            typeObj,
            category: cat,
            source: 'category',
          });
        }
      }

      const items = cat.data || [];
      for (let x = 0; x < items.length; x++) {
        const item = items[x];

        const combinedParts = [];
        if (item.name && typeof item.name === 'object') {
          for (const lg of langs) if (item.name[lg]) combinedParts.push(String(item.name[lg]));
        } else if (item.name) combinedParts.push(String(item.name));

        for (const k in item) {
          if (/_name$/.test(k) && typeof item[k] === 'object') {
            for (const lg of langs) if (item[k][lg]) combinedParts.push(String(item[k][lg]));
          }
        }

        if (item.description && typeof item.description === 'object') {
          for (const lg of langs) if (item.description[lg]) combinedParts.push(String(item.description[lg]));
        } else if (typeof item.description === 'string' && item.description) {
          combinedParts.push(item.description);
        }

        if (item.api) combinedParts.push(String(item.api));
        if (item.text) combinedParts.push(String(item.text));

        for (const lg of langs) {
          if (typeNames[lg]) combinedParts.push(String(typeNames[lg]));
          if (catNames[lg]) combinedParts.push(String(catNames[lg]));
        }

        const combined = combinedParts.filter(Boolean).join(' • ');
        const name = pickLang(item.name || {}, langs) || item.api || '';

        const doc = {
          id: String(idCounter++),
          typeKey: typeDisplay,
          categoryKey: catDisplay,
          name: name,
          api: item.api || '',
          text: item.text || '',
          combined: normalizeFn ? normalizeFn(combined) : combined,
          combinedLower: (normalizeFn ? normalizeFn(combined) : combined).toLowerCase(),
          rawItem: item,
          typeObj,
          category: cat,
        };
        docs.push(doc);

        const kw = name || item.api || '';
        if (kw) {
          keywords.push({
            raw: kw,
            normalized: normalizeFn ? normalizeFn(kw) : String(kw).toLowerCase(),
            docId: doc.id,
            item: item,
            itemName: name,
            typeObj: typeObj,
            typeName: typeDisplay,
            catName: catDisplay,
            source: 'item',
          });
        }
      }
    }
  }

  return { docs, keywords, typeIndex, categoryIndex };
}

/**
 * @param {any} qRaw
 * @param {any} [typeFilter]
 * @param {any} [limit]
 */
function immediateSearch(qRaw, typeFilter, limit) {
  const q = String(qRaw || '').trim();
  if (!q) return { results: [], keywords: generateAllKeywords() };
  const nq = q.toLowerCase();
  const results = [];
  limit = limit || _options.fastImmediateLimit || 200;
  const typeFilterLower = typeFilter && typeFilter !== 'all' ? String(typeFilter).toLowerCase() : null;

  let candidates = _docs;
  if (nq.length <= 3 && _bucketIndex) {
    const firstChar = nq[0];
    if (_bucketIndex.has(firstChar)) {
      candidates = _bucketIndex.get(firstChar);
    }
  }

  const maxResults = Math.max(limit, 500);

  for (let i = 0; i < candidates.length && results.length < maxResults; i++) {
    const d = candidates[i];
    if (typeFilterLower && (d.typeKey || '').toLowerCase() !== typeFilterLower) continue;
    const hay = d.combinedLower || ((d.name || '') + ' ' + (d.api || '') + ' ' + (d.combined || '')).toLowerCase();
    if (hay.indexOf(nq) >= 0) {
      results.push({
        typeObj: d.typeObj,
        category: d.category,
        item: d.rawItem,
        typeName: d.typeKey,
        catName: d.categoryKey,
        itemName: d.name || '',
        lang: 'auto',
        fuzzy: false,
        fuzzyScore: null,
        matchExact: hay === nq,
      });
    }
  }
  if (results.length > limit) {
    results.length = limit;
  }
  return { results, keywords: generateAllKeywords() };
}

function generateAllKeywords() {
  return _keywords.map((k) => Object.assign({}, k));
}

/**
 * @param {any} rawQuery
 * @param {any} [maxCount]
 */
function queryAssist(rawQuery, maxCount) {
  maxCount = maxCount || 8;
  const q = String(rawQuery || '').trim();
  if (!q) return [];

  const nq = _normalize ? _normalize(q) : q.toLowerCase();
  const nqSimple = String(q).toLowerCase();
  const out = [];
  const seen = new Set();

  for (let i = 0; i < _keywords.length && out.length < maxCount; i++) {
    const k = _keywords[i];
    if (!k || !k.normalized) continue;
    if (String(k.normalized).indexOf(nq) === 0) {
      const display = k.raw || k.itemName || '';
      const key = 'item:' + (k.normalized || display.toLowerCase());
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        display,
        raw: display,
        highlightedHtml: escapeHtml(display),
        source: 'keyword',
        sourcePriority: SUGGESTION_SOURCE.KEYWORD_EXACT,
        typeObj: k.typeObj,
        typeName: k.typeName,
        catName: k.catName,
      });
    }
  }

  if (out.length < maxCount) {
    for (let i = 0; i < _typeIndex.length && out.length < maxCount; i++) {
      const t = _typeIndex[i];
      if (!t || !t.normalized) continue;
      if (String(t.normalized).indexOf(nq) >= 0 || String(t.normalized).indexOf(nqSimple) >= 0) {
        const display = t.raw;
        const key = 'type:' + (t.normalized || display.toLowerCase());
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          display,
          raw: display,
          highlightedHtml: escapeHtml(display),
          source: 'type',
          sourcePriority: SUGGESTION_SOURCE.TYPE_NAME,
          typeObj: t.typeObj,
          typeName: display,
          catName: '',
        });
      }
    }
  }

  if (out.length < maxCount) {
    for (let i = 0; i < _categoryIndex.length && out.length < maxCount; i++) {
      const c = _categoryIndex[i];
      if (!c || !c.normalized) continue;
      if (String(c.normalized).indexOf(nq) >= 0 || String(c.normalized).indexOf(nqSimple) >= 0) {
        const display = c.raw;
        const key = 'cat:' + (c.normalized || display.toLowerCase());
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          display,
          raw: display,
          highlightedHtml: escapeHtml(display),
          source: 'category',
          sourcePriority: SUGGESTION_SOURCE.CATEGORY_NAME,
          typeObj: c.typeObj,
          typeName: c.typeObj
            ? typeof c.typeObj.name === 'object'
              ? pickLang(c.typeObj.name, _langs)
              : String(c.typeObj.name || '')
            : '',
          catName: display,
        });
      }
    }
  }

  if (out.length < maxCount) {
    for (let i = 0; i < _keywords.length && out.length < maxCount; i++) {
      const k = _keywords[i];
      if (!k || !k.normalized) continue;
      if (String(k.normalized).indexOf(nq) === 0) continue;
      if (String(k.normalized).indexOf(nq) >= 0) {
        const display = k.raw || k.itemName || '';
        const key = 'item-c:' + (k.normalized || display.toLowerCase());
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          display,
          raw: display,
          highlightedHtml: escapeHtml(display),
          source: 'keyword-contains',
          sourcePriority: SUGGESTION_SOURCE.KEYWORD_CONTAINS,
          typeObj: k.typeObj,
          typeName: k.typeName,
          catName: k.catName,
        });
      }
    }
  }

  if (out.length >= maxCount) return out.slice(0, maxCount);

  if (_fuse && q.length >= 1) {
    try {
      const fuseRes = _fuse.search(q, { limit: Math.max(12, maxCount * 2) });
      for (let i = 0; i < fuseRes.length && out.length < maxCount; i++) {
        const r = fuseRes[i];
        const doc = r.item || r;
        const display = doc.name || doc.api || '';
        if (!display) continue;
        const norm = _normalize ? _normalize(display) : String(display).toLowerCase();
        if (!norm || seen.has('fuse:' + norm)) continue;
        seen.add('fuse:' + norm);
        out.push({
          display,
          raw: display,
          highlightedHtml: escapeHtml(display),
          source: 'fuse',
          sourcePriority: SUGGESTION_SOURCE.FUSE,
          score: r.score !== undefined ? r.score : null,
          typeObj: doc.typeObj,
          typeName: doc.typeKey,
          catName: doc.categoryKey,
        });
      }
    } catch (e) {
      console.error('[SearchEngine] Fuse suggestion query failed:', e);
    }
  } else if (out.length < maxCount) {
    for (let i = 0; i < _docs.length && out.length < maxCount; i++) {
      const d = _docs[i];
      const display = d.name || d.api || '';
      if (!display) continue;
      const norm = String(display).toLowerCase();
      if (norm.indexOf(nqSimple) >= 0 && !seen.has('imm:' + norm)) {
        seen.add('imm:' + norm);
        out.push({
          display,
          raw: display,
          highlightedHtml: escapeHtml(display),
          source: 'immediate',
          sourcePriority: SUGGESTION_SOURCE.IMMEDIATE,
          typeObj: d.typeObj,
          typeName: d.typeKey,
          catName: d.categoryKey,
        });
      }
    }
  }

  return out.slice(0, maxCount);
}

/**
 * @param {any} qRaw
 * @param {any} [typeFilter]
 */
function search(qRaw, typeFilter) {
  const q = String(qRaw || '').trim();
  if (!q) return { results: [], keywords: generateAllKeywords() };

  const langKey = Array.isArray(_langs) ? _langs.join(',') : 'en';
  const filterKey = typeFilter && typeFilter !== 'all' ? String(typeFilter).toLowerCase() : 'all';
  const cacheKey = q.toLowerCase() + '|' + filterKey + '|' + langKey;

  if (_resultCache.has(cacheKey)) {
    const cached = _resultCache.get(cacheKey);
    _resultCache.delete(cacheKey);
    _resultCache.set(cacheKey, cached);
    return cached;
  }

  let res;
  if (_fuse) {
    try {
      const fuseResults = _fuse.search(q, { limit: 200 }) || [];
      const results = [];
      const typeFilterLower = typeFilter && typeFilter !== 'all' ? String(typeFilter).toLowerCase() : null;
      for (let i = 0; i < fuseResults.length; i++) {
        const r = fuseResults[i];
        const doc = r.item || r;
        if (typeFilterLower && (doc.typeKey || '').toLowerCase() !== typeFilterLower) continue;
        results.push({
          typeObj: doc.typeObj,
          category: doc.category,
          item: doc.rawItem,
          typeName: doc.typeKey,
          catName: doc.categoryKey,
          itemName: doc.name || '',
          lang: 'auto',
          fuzzy: r.score !== undefined && r.score > 0,
          fuzzyScore: r.score !== undefined ? r.score : null,
          matchExact: r.score !== undefined ? r.score === 0 : false,
        });
      }
      res = { results, keywords: generateAllKeywords() };
    } catch (e) {
      console.error('[SearchEngine] Fuse search failed, falling back to immediate:', e);
      res = immediateSearch(qRaw, typeFilter);
    }
  } else {
    res = immediateSearch(qRaw, typeFilter);
  }

  if (_resultCache.size >= RESULT_CACHE_CAP) {
    const firstKey = _resultCache.keys().next().value;
    if (firstKey !== undefined) {
      _resultCache.delete(firstKey);
    }
  }
  _resultCache.set(cacheKey, res);

  return res;
}

/**
 * @param {any} q
 */
function _tokenizeQuery(q) {
  const out = new Set();
  const str = String(q || '').toLowerCase();
  let cur = '';
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    const isWord = (c >= 0x61 && c <= 0x7a) || (c >= 0x30 && c <= 0x39) || (c >= 0x0e00 && c <= 0x0e7f);
    if (isWord) {
      cur += str[i];
    } else if (cur) {
      if (out.size < 8) out.add(cur);
      cur = '';
    }
  }
  if (cur && out.size < 8) out.add(cur);
  return out;
}

/**
 * @param {any} q
 * @param {any} primaryResults
 * @param {any} [maxCount]
 */
function queryRelated(q, primaryResults, maxCount) {
  try {
    const cfg = CONFIG.DISCOVERY || {
      maxRelatedItems: 60,
      sampleTopN: 8,
      minResultsForDiscovery: 1,
      emptyStateMaxItems: 12,
      weights: { sameType: 1.0, sameCategory: 1.5, tokenOverlap: 0.5 },
    };
    const limit = Math.min(maxCount || cfg.maxRelatedItems, cfg.maxRelatedItems);
    const sampleN = cfg.sampleTopN || 8;
    const weights = cfg.weights || { sameType: 1.0, sameCategory: 1.5, tokenOverlap: 0.5 };

    if (!_docs.length) return [];

    const primaryApis = new Set();
    const pr = Array.isArray(primaryResults) ? primaryResults : [];
    for (let i = 0; i < pr.length; i++) {
      const it = pr[i]?.item || pr[i];
      const api = it?.api || '';
      if (api) primaryApis.add(api);
    }

    const typeCount = Object.create(null);
    const catCount = Object.create(null);
    const sampleEnd = Math.min(pr.length, sampleN);
    for (let i = 0; i < sampleEnd; i++) {
      const r = pr[i];
      const t = r.typeName || '';
      const c = r.catName || '';
      if (t) typeCount[t] = (typeCount[t] || 0) + 1;
      if (c) catCount[c] = (catCount[c] || 0) + 1;
    }

    let dominantType = '';
    let maxTypeCount = 0;
    for (const k in typeCount) {
      if (typeCount[k] > maxTypeCount) {
        maxTypeCount = typeCount[k];
        dominantType = k;
      }
    }

    let dominantCat = '';
    let maxCatCount = 0;
    for (const k in catCount) {
      if (catCount[k] > maxCatCount) {
        maxCatCount = catCount[k];
        dominantCat = k;
      }
    }

    const qTokens = _tokenizeQuery(q);

    const candidates = [];
    for (let i = 0; i < _docs.length; i++) {
      const d = _docs[i];
      if (primaryApis.has(d.api)) continue;

      let score = 0;
      let reason = '';

      if (dominantCat && d.categoryKey === dominantCat) {
        score += weights.sameCategory;
        reason = 'same-category';
      }
      if (dominantType && d.typeKey === dominantType) {
        score += weights.sameType;
        if (!reason) reason = 'same-type';
      }

      if (qTokens.size > 0 && d.combinedLower) {
        for (const tok of qTokens) {
          if (d.combinedLower.includes(tok)) {
            score += weights.tokenOverlap;
            if (!reason) reason = 'token-overlap';
          }
        }
      }

      if (score > 0) {
        candidates.push({
          doc: d,
          score,
          reason,
          index: i,
          typeObj: d.typeObj,
          category: d.category,
          item: d.rawItem,
          typeName: d.typeKey,
          catName: d.categoryKey,
          itemName: d.name || '',
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score || a.index - b.index);

    const out = [];
    const maxOut = Math.min(candidates.length, limit);
    for (let i = 0; i < maxOut; i++) {
      const s = candidates[i];
      out.push({
        id: s.doc.id || String(i),
        doc: s.doc,
        typeObj: s.typeObj,
        category: s.category,
        item: s.item,
        typeName: s.typeName,
        catName: s.catName,
        itemName: s.itemName,
        score: s.score,
        reason: s.reason,
      });
    }
    return out;
  } catch (e) {
    console.error('[SearchEngine] queryRelated failed:', e);
    return [];
  }
}

function scheduleBuildFuse() {
  if (_fuseBuilding || !_data) return;
  if (_fuseBuildRetries >= MAX_FUSE_RETRIES) {
    console.warn('[SearchEngine] Max Fuse build retries reached, falling back to substring search');
    _fuse = null;
    _fuseBuilding = false;
    return;
  }
  _fuseBuilding = true;

  const build = async () => {
    try {
      const Fuse = await ensureFuseLoaded();
      const { docs, keywords, typeIndex, categoryIndex } = flattenDataToDocs(_data || {}, _normalize);

      const defaultFuseOpts = {
        includeScore: true,
        threshold: FUSE_THRESHOLDS.medium,
        ignoreLocation: true,
        minMatchCharLength: 1,
        useExtendedSearch: false,
        keys: [
          { name: 'name', weight: 0.6 },
          { name: 'api', weight: 0.9 },
          { name: 'combined', weight: 0.5 },
          { name: 'text', weight: 0.2 },
        ],
      };
      const fuseOpts = Object.assign({}, defaultFuseOpts, _options.fuseOptions || {});

      try {
        _fuse = new Fuse(docs, fuseOpts);
        _keywords = keywords;
        _typeIndex = typeIndex;
        _categoryIndex = categoryIndex;
        for (let i = 0; i < _docs.length && i < docs.length; i++) {
          _docs[i].combinedLower = docs[i].combined.toLowerCase();
        }
      } catch (e) {
        console.error('[SearchEngine] Failed to create Fuse index:', e);
        _fuse = null;
      }
    } catch (e) {
      _fuseBuildRetries++;
      console.warn(
        '[SearchEngine] Fuse unavailable, using immediate search only (retry ' +
          _fuseBuildRetries +
          '/' +
          MAX_FUSE_RETRIES +
          '):',
        e && (/** @type {any} */ (e)).message ? (/** @type {any} */ (e)).message : e
      );
      _fuse = null;
    } finally {
      _fuseBuilding = false;
    }
  };

  if (typeof requestIdleCallback === 'function') {
    try {
      requestIdleCallback(build, { timeout: _options.idleTimeout });
    } catch (e) {
      setTimeout(build, 100);
    }
  } else {
    const cores = navigator && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
    const delay = cores <= 2 ? Math.max(1000, _options.idleTimeout) : 100;
    setTimeout(build, delay);
  }
}

/**
 * @param {any} data
 * @param {any} [options]
 */
export async function init(data, options) {
  try {
    options = options || {};
    _options = Object.assign({}, _options, options);
    _data = data || null;
    _normalize = options.normalizeFn || defaultNormalizeText;

    _langs = detectLangs(_data || {});
    _clearResultCache();

    const immediate = buildImmediateDocs(_data || {});
    _docs = immediate.docs;
    _bucketIndex = buildBucketIndex(_docs);
    _keywords = immediate.keywords.map((k) => ({
      item: k.item || null,
      itemName: k.itemName || '',
      typeObj: k.typeObj || null,
      typeName: k.typeName || '',
      catName: k.catName || '',
      key: k.normalized || (k.raw || '').toLowerCase(),
      raw: k.raw || '',
      normalized: k.normalized || (k.raw || '').toLowerCase(),
      source: k.source || 'item',
    }));
    _typeIndex = immediate.typeIndex;
    _categoryIndex = immediate.categoryIndex;

    scheduleBuildFuse();

    return true;
  } catch (e) {
    console.error('[SearchEngine] init failed:', e);
    _docs = [];
    _keywords = [];
    _typeIndex = [];
    _categoryIndex = [];
    _fuse = null;
    return false;
  }
}

export const SearchEngine = {
  init,
  isReady: () => _docs.length > 0,
  generateAllKeywords,
  queryAssist,
  querySuggestions: queryAssist,
  search,
  queryRelated,
  _internals: {
    normalizeText: () => _normalize,
    flattenDataToDocs,
    buildImmediateDocs,
    getDocs: () => _docs.slice(),
    getKeywords: () => _keywords.slice(),
    getTypeIndex: () => _typeIndex.slice(),
    getCategoryIndex: () => _categoryIndex.slice(),
    getFuse: () => _fuse,
    isFuseReady: () => _fuse !== null && !_fuseBuilding,
    isFuseBuilding: () => _fuseBuilding,
    getLangs: () => _langs.slice(),
    options: () => Object.assign({}, _options),
    pickFuseThreshold,
    tokenizeQuery: _tokenizeQuery,
    clearResultCache: _clearResultCache,
    getResultCacheSize: () => _resultCache.size,
    getBucketIndexSize: () => (_bucketIndex ? _bucketIndex.size : 0),
  },
};

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.SearchEngine = SearchEngine;
  // @ts-ignore
  window.SearchModules = window.SearchModules || {};
  // @ts-ignore
  window.SearchModules.SearchEngine = SearchEngine;
}
