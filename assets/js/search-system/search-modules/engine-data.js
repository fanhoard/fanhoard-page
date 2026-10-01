// @ts-check
/**
 * @file engine-data.js
 * Data flattening, language detection, and document indexing helpers for SearchEngine.
 *
 * @module engine-data
 * @depends {types.js}
 */
(function (M) {
  'use strict';

  /**
   * Pick a localized display string from an object by preferred languages.
   * @param {Object|string} obj
   * @param {string[]} langs
   * @returns {string}
   */
  function pickLang(obj, langs) {
    if (!obj || typeof obj !== 'object') return obj || '';
    if (Array.isArray(langs)) {
      for (let i = 0; i < langs.length; i++) if (obj[langs[i]]) return obj[langs[i]];
    }
    for (const k in obj) return obj[k];
    return '';
  }

  /**
   * Detect all languages present in the dataset by scanning name objects.
   * @param {Object} data
   * @returns {string[]}
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

  /**
   * Build immediate docs for instant substring search.
   * @param {Object} data
   * @param {string[]} [langs]
   * @returns {{ docs: SearchDoc[], keywords: KeywordEntry[], typeIndex: NameEntry[], categoryIndex: NameEntry[] }}
   */
  function buildImmediateDocs(data, langs) {
    const docs = [];
    const keywords = [];
    const typeIndex = [];
    const categoryIndex = [];
    if (!data || !Array.isArray(data.type)) {
      return { docs, keywords, typeIndex, categoryIndex };
    }

    const activeLangs = langs || detectLangs(data);
    let idCounter = 1;

    const seenTypeNames = new Set();
    const seenCatNames  = new Set();

    for (let i = 0; i < data.type.length; i++) {
      const typeObj  = data.type[i];
      const typeNames = typeof typeObj.name === 'object'
        ? typeObj.name
        : { en: String(typeObj.name || '') };
      const typeDisplay = pickLang(typeNames, activeLangs) || '';

      for (const lg of activeLangs) {
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
        const cat      = cats[j];
        const catNames = typeof cat.name === 'object'
          ? cat.name
          : { en: String(cat.name || '') };
        const catDisplay = pickLang(catNames, activeLangs) || '';

        for (const lg of activeLangs) {
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

          const combinedParts = [];
          if (item.name && typeof item.name === 'object') {
            for (const lg of activeLangs) if (item.name[lg]) combinedParts.push(String(item.name[lg]));
          } else if (item.name) combinedParts.push(String(item.name));

          for (const k in item) {
            if (/_name$/.test(k) && typeof item[k] === 'object') {
              for (const lg of activeLangs) if (item[k][lg]) combinedParts.push(String(item[k][lg]));
            }
          }

          if (item.description && typeof item.description === 'object') {
            for (const lg of activeLangs) if (item.description[lg]) combinedParts.push(String(item.description[lg]));
          } else if (typeof item.description === 'string' && item.description) {
            combinedParts.push(item.description);
          }

          if (item.api)  combinedParts.push(String(item.api));
          if (item.text) combinedParts.push(String(item.text));

          for (const lg of activeLangs) {
            if (typeNames[lg]) combinedParts.push(String(typeNames[lg]));
            if (catNames[lg])  combinedParts.push(String(catNames[lg]));
          }

          const combined      = combinedParts.filter(Boolean).join(' • ');
          const name          = pickLang(item.name || {}, activeLangs) || (item.api || '');

          /** @type {SearchDoc} */
          const doc = {
            id: String(idCounter++),
            typeKey: typeDisplay,
            categoryKey: catDisplay,
            name: name,
            api: item.api || '',
            text: item.text || '',
            combined: combined,
            combinedLower: combined.toLowerCase(),
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
   * Full data flattening for Fuse.js index.
   * @param {Object} data
   * @param {Function} normalizeFn
   * @param {string[]} [langs]
   * @returns {{ docs: SearchDoc[], keywords: KeywordEntry[], typeIndex: NameEntry[], categoryIndex: NameEntry[] }}
   */
  function flattenDataToDocs(data, normalizeFn, langs) {
    const docs = [];
    const keywords = [];
    const typeIndex = [];
    const categoryIndex = [];
    if (!data || !Array.isArray(data.type)) {
      return { docs, keywords, typeIndex, categoryIndex };
    }

    const activeLangs = langs || detectLangs(data);
    let idCounter = 1;
    const seenTypeNames = new Set();
    const seenCatNames  = new Set();

    for (let i = 0; i < data.type.length; i++) {
      const typeObj  = data.type[i];
      const typeNames = typeof typeObj.name === 'object'
        ? typeObj.name
        : { en: String(typeObj.name || '') };
      const typeDisplay = pickLang(typeNames, activeLangs) || '';

      for (const lg of activeLangs) {
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
        const cat      = cats[j];
        const catNames = typeof cat.name === 'object'
          ? cat.name
          : { en: String(cat.name || '') };
        const catDisplay = pickLang(catNames, activeLangs) || '';

        for (const lg of activeLangs) {
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
            for (const lg of activeLangs) if (item.name[lg]) combinedParts.push(String(item.name[lg]));
          } else if (item.name) combinedParts.push(String(item.name));

          for (const k in item) {
            if (/_name$/.test(k) && typeof item[k] === 'object') {
              for (const lg of activeLangs) if (item[k][lg]) combinedParts.push(String(item[k][lg]));
            }
          }

          if (item.description && typeof item.description === 'object') {
            for (const lg of activeLangs) if (item.description[lg]) combinedParts.push(String(item.description[lg]));
          } else if (typeof item.description === 'string' && item.description) {
            combinedParts.push(item.description);
          }

          if (item.api)  combinedParts.push(String(item.api));
          if (item.text) combinedParts.push(String(item.text));

          for (const lg of activeLangs) {
            if (typeNames[lg]) combinedParts.push(String(typeNames[lg]));
            if (catNames[lg])  combinedParts.push(String(catNames[lg]));
          }

          const combined = combinedParts.filter(Boolean).join(' • ');
          const name = pickLang(item.name || {}, activeLangs) || (item.api || '');

          /** @type {SearchDoc} */
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

  const EngineData = {
    pickLang,
    detectLangs,
    buildImmediateDocs,
    flattenDataToDocs,
  };

  M.EngineData = EngineData;

})(window.SearchModules = window.SearchModules || {});
