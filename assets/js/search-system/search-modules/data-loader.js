// @ts-check
/**
 * @file data-loader.js
 * Data fetching, retry strategy, and late-data watcher for Search system.
 *
 * @module data-loader
 * @depends {config.js, state.js, engine.js}
 */
(function (M) {
  'use strict';

  /**
   * Check whether dataset contains non-empty type array.
   * @param {Object} data
   * @returns {boolean}
   */
  function _dataHasTypes(data) {
    return !!(data && Array.isArray(data.type) && data.type.length);
  }

  /**
   * Poll for ConDataService availability up to `ms` milliseconds.
   * @param {number} ms
   * @returns {Promise<Object|null>}
   */
  function waitForConDataService(ms) {
    const CONFIG = M.CONFIG || window.SearchModules?.CONFIG || {};
    const pollMs = (CONFIG.TIMING && CONFIG.TIMING.conDataServicePollMs) || 20;
    return new Promise(function (resolve) {
      if (window.ConDataService?.getAssembled) return resolve(window.ConDataService);
      const start = Date.now();
      const id = setInterval(function () {
        if (window.ConDataService?.getAssembled) {
          clearInterval(id);
          resolve(window.ConDataService);
        } else if (Date.now() - start >= ms) {
          clearInterval(id);
          resolve(null);
        }
      }, pollMs);
    });
  }

  function _normalLoadData() {
    const CONFIG = M.CONFIG || window.SearchModules?.CONFIG || {};
    const waitMs = (CONFIG.TIMING && CONFIG.TIMING.conDataServiceWaitMs) || 800;
    const dbPath = (CONFIG.DB && CONFIG.DB.path) || '/assets/db/db.min.json';

    return waitForConDataService(waitMs).then(function (svc) {
      if (svc) {
        return svc.getAssembled().catch(function (err) {
          console.warn('[Search] ConDataService failed, using fallback:', err);
          return fetch(dbPath).then(r => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          }).catch(() => ({}));
        });
      }
      console.warn('[Search] ConDataService not ready — using fallback db');
      return fetch(dbPath).then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).catch(() => ({}));
    });
  }

  /**
   * Load data via early-prefetch promise, or fall back to direct fetch.
   * @param {Promise<Object>|null} [earlyDataPromise]
   * @returns {Promise<Object>}
   */
  function loadData(earlyDataPromise) {
    if (earlyDataPromise) {
      return earlyDataPromise.then(function (data) {
        if (data) return data;
        return _normalLoadData();
      });
    }
    return _normalLoadData();
  }

  /**
   * Retry data loading with exponential backoff on empty dataset.
   * @param {number} maxAttempts
   * @param {number} backoffMs
   * @param {Promise<Object>|null} [earlyDataPromise]
   * @returns {Promise<Object>}
   */
  function loadDataWithRetry(maxAttempts, backoffMs, earlyDataPromise) {
    maxAttempts = maxAttempts || 4;
    backoffMs = backoffMs || 2000;
    let attempt = 0;
    let pEarly = earlyDataPromise || null;

    function run() {
      attempt++;
      const p = pEarly;
      pEarly = null;
      return loadData(p).then(function (data) {
        if (_dataHasTypes(data) || attempt >= maxAttempts) return data;
        console.warn('[Search] Data empty after fetch (attempt ' + attempt + '/' + maxAttempts + ') — invalidating cache and retrying in ' + backoffMs + 'ms');
        try {
          var _cds = window.ConDataService;
          if (_cds && typeof _cds.invalidateCache === 'function') _cds.invalidateCache();
          else if (_cds && typeof _cds.invalidate === 'function') _cds.invalidate();
        } catch (_) {}
        return new Promise(function (r) { setTimeout(r, backoffMs); }).then(run);
      });
    }
    return run();
  }

  /**
   * Last-resort watcher: if boot finished with empty data, poll until real
   * data shows up, then re-init the engine and run the URL search again.
   */
  function watchForLateData() {
    const intervalMs = 4000;
    const maxChecks  = 22; // ~88s
    let checks = 0;
    const id = setInterval(function () {
      checks++;
      const SearchEngine = (M.SearchEngine || window.SearchModules?.SearchEngine || window.SearchEngine);
      const docs = (() => {
        try { return (SearchEngine?._internals && SearchEngine._internals.getDocs && SearchEngine._internals.getDocs()) || []; }
        catch (_) { return []; }
      })();
      if (docs.length || checks >= maxChecks) { clearInterval(id); return; }

      try {
        var _cds2 = window.ConDataService;
        if (_cds2 && typeof _cds2.invalidateCache === 'function') _cds2.invalidateCache();
        else if (_cds2 && typeof _cds2.invalidate === 'function') _cds2.invalidate();
      } catch (_) {}

      loadData(null).then(function (data) {
        if (!_dataHasTypes(data)) return;
        clearInterval(id);
        const State = M.State || window.SearchModules?.State;
        const SE = M.SearchEngine || window.SearchModules?.SearchEngine || window.SearchEngine;
        const URLService = M.URLService || window.SearchModules?.URLService;
        const SearchController = M.SearchController || window.SearchModules?.SearchController;

        if (State) State.apiData = data;
        if (SE) {
          SE.init(State ? State.apiData : data, {}).catch(function (e) {
            console.error('[Search] Late re-init failed', e);
          }).then(function () {
            try { if (State) State.allKeywordsCache = SE.generateAllKeywords ? SE.generateAllKeywords() : []; }
            catch (_) { if (State) State.allKeywordsCache = []; }
            const urlState = URLService ? URLService.readStateFromURL() : null;
            if (urlState && urlState.q && SearchController) {
              SearchController.doSearchFromURL(urlState.q, urlState.type || 'all', urlState.category || 'all');
            }
          });
        }
      }).catch(function () {});
    }, intervalMs);
  }

  const DataLoader = {
    loadData,
    loadDataWithRetry,
    watchForLateData,
    _dataHasTypes,
  };

  M.DataLoader = DataLoader;

})(window.SearchModules = window.SearchModules || {});
