// Path:    assets/js/nav-core-modules/content.js
// Purpose: ContentService — renders content items (buttons, cards, source groups) via URE
//          + renderFeed() สำหรับ All button: infinite scroll, delegated click, memory-safe
// Used by: router.js (renderContent, renderFeed), init.js (updateCardsLanguage)

// @ts-check
/**
 * @file content.js
 * ContentService — URE-powered rendering + native infinite-scroll feed
 *                        + lazy paginated rendering สำหรับ source-based routes.
 *
 * Feed render path (renderFeed):
 *   - native DOM append แทน URE → รองรับ infinite scroll ได้โดยไม่ re-mount
 *   - IntersectionObserver (rootMargin 600px) preload ก่อนถึง bottom
 *   - content-visibility:auto บน .feed-page → browser discard off-screen rendering
 *   - delegated click บน #content-loading → copy + card open ทำงานเหมือนกัน
 *   - clearContent() disconnect observer → ไม่มี memory leak
 *   - state preservation: snapshot/restore ผ่าน RouteCache (X-style)
 *
 * Lazy render path (renderContentLazy):
 *   - ใช้สำหรับ route ที่ระบุ source (Symbols/Emojis/Fancy ฯลฯ)
 *   - ทยอย fetch categories ทีละหน้าผ่าน SourcePaginator
 *   - ใช้ IntersectionObserver เหมือน feed → scroll กดเพิ่ม category ถัดไป
 *   - แทนที่ renderContent() แบบเดิมที่ Promise.all fetch ทุก category ทีเดียว
 *   - state preservation: เก็บ DOM + paginator state + scroll ผ่าน RouteCache
 *
 * Feed page sizes:
 *   FEED_FIRST_PAGE_SIZE = 10 segments × 20 items = 200 items on first paint
 *   FEED_PAGE_SIZE       = 12 segments × 20 items = 240 items per scroll load
 *
 * @module content
 * @depends {config.js, state.js, data.js, loading.js, feed.js, paginator.js, route-cache.js}
 */
(function (M) {
  'use strict';

  const { CONFIG } = M;

  const _esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const _txt = (v, l) => !v ? '' : typeof v === 'object' ? (v[l] || v.en || '') : String(v);

  const LAYOUT = Object.freeze({ BUTTON: 'button', CARD: 'card' });

  function _toLayout(val) {
    if (val === 'cards' || val === 'card') return LAYOUT.CARD;
    return LAYOUT.BUTTON;
  }

  function _applyViewTransition(updateFn) {
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion && typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
      return document.startViewTransition(updateFn);
    }
    updateFn();
  }

  // ── Feed constants ─────────────────────────────────────────────────────────────
  const FEED_SENTINEL_ID     = 'nc-feed-sentinel';
  const FEED_FIRST_PAGE_SIZE = 10;
  const FEED_PAGE_SIZE       = 12;

  // ── CSS ────────────────────────────────────────────────────────────────────────

  const _CSS_ID = '_nc_content_css';
  function _ensureCss() {
    if (document.getElementById(_CSS_ID)) return;
    const s = document.createElement('style');
    s.id = _CSS_ID;
    s.textContent = `
.cm-group{contain:layout style;isolation:isolate;margin-bottom:var(--space-8, 32px);}

.ure-btn-row{
  display:grid!important;grid-template-columns:repeat(auto-fill, minmax(min(100%, 64px), 1fr))!important;
  align-items:stretch!important;
  background:transparent!important;
  gap:var(--space-2, 8px)!important;
  contain:layout style;
}
@media (min-width: 600px) {
  .ure-btn-row { grid-template-columns: repeat(auto-fill, minmax(min(100%, 88px), 1fr)) !important; }
}
@media (min-width: 1024px) {
  .ure-btn-row { grid-template-columns: repeat(auto-fill, minmax(min(100%, 100px), 1fr)) !important; }
}
.ure-btn-row--only,
.ure-btn-row--first,
.ure-btn-row--mid,
.ure-btn-row--last {border-radius:0!important;padding:0!important;margin:0!important;}

.card-content-container--h{
  flex-wrap:nowrap!important;
  overflow-x:auto;
  justify-content:flex-start!important;
  padding:1rem 10px!important;
  -webkit-overflow-scrolling:touch;
  scrollbar-width:none;
  overscroll-behavior-x:contain;
  touch-action:pan-x;
}
.card-content-container--h::-webkit-scrollbar{display:none;}
.card-content-container--h .card{flex-shrink:0;width:160px;}`;
    document.head.appendChild(s);
  }

  const _FEED_CSS_ID = '_nc_feed_css';
  function _ensureFeedCss() {
    if (document.getElementById(_FEED_CSS_ID)) return;
    const s = document.createElement('style');
    s.id = _FEED_CSS_ID;
    s.textContent = `
.feed-page{
  content-visibility: auto;
  contain-intrinsic-block-size: auto 300px;
  overflow-anchor: auto;
}
#${FEED_SENTINEL_ID}{
  height: 1px;
  width: 100%;
  pointer-events: none;
}`;
    document.head.appendChild(s);
  }

  // ── URE dependency guard ───────────────────────────────────────────────────────

  function _ensureURE() {
    if (window.URE) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error(
          '[NavCore/Content] URE required. ' +
          'Add <script defer src="/assets/js/ure/ure.js"> before nav-core.js.'
        )), 4000);
      window.addEventListener('ure:ready', () => { clearTimeout(t); resolve(); }, { once: true });
    });
  }

  // ── Module state ───────────────────────────────────────────────────────────────

  let _ureHandle    = null;
  let _feedObserver = null;
  let _sess         = 0;

  let _activeRouteKey   = null;
  let _activeRouteKind  = null; // 'feed' | 'lazy' | 'ure'

  // ── ContentService ─────────────────────────────────────────────────────────────

  const ContentService = {

    LOADING_CONTAINER_ID: CONFIG.DOM.CONTENT_LOADING_ID,

    // ── clearContent ────────────────────────────────────────────────────────────

    async clearContent(options = {}) {
      _sess++;

      if (!options?.skipScroll && !options?.isNormalPage && typeof window !== 'undefined' && (window.pageYOffset || window.scrollY)) {
        window.scrollTo(0, 0);
      }

      if (typeof window !== 'undefined' && window.DiscoverFeed && typeof window.DiscoverFeed.clearFeed === 'function') {
        try { window.DiscoverFeed.clearFeed(); } catch (_) {}
      }

      if (_feedObserver) {
        _feedObserver.disconnect();
        _feedObserver = null;
      }

      if (_ureHandle) {
        try { _ureHandle.destroy(); } catch (err) { console.warn('[Content] URE destroy failed:', err); }
        _ureHandle = null;
      }

      const ctr = document.getElementById(CONFIG.DOM.CONTENT_LOADING_ID);
      if (ctr) ctr.innerHTML = '';
    },

    // ── renderContent (URE path — ใช้กับ route ทั่วไป) ──────────────────────────

    async renderContent(data) {
      if (!Array.isArray(data)) throw new Error('[Content] data must be array');
      _ensureCss();
      const ctr = document.getElementById(CONFIG.DOM.CONTENT_LOADING_ID);
      if (!ctr) return;

      await this.clearContent();
      const sess = _sess;

      try {
        await _ensureURE();
        if (sess !== _sess) return;

        const lang = localStorage.getItem('selectedLang') || 'en';
        await M.DataService.loadApiDatabase().catch(err => {
          console.warn('[Content] loadApiDatabase failed, continuing:', err);
        });
        if (sess !== _sess) return;

        const items = await this._resolveAll(data, lang);
        if (sess !== _sess) return;

        _applyViewTransition(() => {
          _ureHandle = window.URE.mount({
            container          : ctr,
            data               : items,
            keyField           : '_ureKey',
            estimatedItemHeight: 130,
            buffer             : 700,
            recycling          : true,
            template           : (item, l) => this._tpl(item, l),
            onItemClick        : (e)        => this._onClick(e),
          });
        });

      } catch (e) {
        console.error('[NavCore/Content] renderContent error:', e, e && e.stack);
        try { M.LoadingService?.hide(); } catch (err) { console.warn('[Content] LoadingService.hide failed in catch:', err); }
      } finally {
        try { M.LoadingService?.hideInstant(); } catch (_) {}
      }
    },

    // ── renderFeed (All button — infinite scroll, native DOM) ────────────────────

    async renderFeed(lang, routeKey = '_all') {
      _ensureCss();
      _ensureFeedCss();

      const ctr = document.getElementById(CONFIG.DOM.CONTENT_LOADING_ID);
      if (!ctr) return;

      _activeRouteKey  = routeKey;
      _activeRouteKind = 'feed';

      const cached = M.RouteCache ? M.RouteCache.get(routeKey) : null;

      if (cached && cached.scrollPosition > 0) {
        await this.clearContent({ skipScroll: true });
        const sess = _sess;

        try {
          await M.DataService.loadApiDatabase().catch(err => {
            console.warn('[Content] renderFeed restore: loadApiDatabase failed:', err);
          });
          if (sess !== _sess) return;

          this._ensureFeedClickDelegate(ctr);

          if (cached.feedState && M.FeedService) {
            M.FeedService.restore(cached.feedState);
          }

          let hasMore = true;
          if (cached.domSnapshot) {
            M.RouteCache.restoreDom(ctr, cached.domSnapshot);
          } else {
            const targetChunks = cached.chunkCount || 1;
            for (let i = 0; i < targetChunks; i++) {
              const size = i === 0 ? FEED_FIRST_PAGE_SIZE : FEED_PAGE_SIZE;
              const res = await M.FeedService.loadNextPage(lang, size);
              if (sess !== _sess) return;
              if (res.groups.length) {
                await this._appendFeedGroups(ctr, res.groups, lang, null);
              }
              hasMore = res.hasMore;
              if (!hasMore) break;
            }
          }

          try { M.LoadingService?.hideInstant(); } catch (_) {}
          if (sess !== _sess) return;

          await this._restoreScrollPosition(ctr, cached.scrollPosition, cached.chunkCount || 1, async () => {
            return await M.FeedService.loadNextPage(lang, FEED_PAGE_SIZE);
          }, lang, sess);

          if (hasMore !== false && sess === _sess) {
            this._attachFeedSentinel(ctr, lang, sess);
          }

          return;
        } catch (e) {
          console.error('[NavCore/Content] renderFeed restore error:', e);
        }
      }

      if (M.RouteCache) M.RouteCache.invalidate(routeKey);
      if (M.FeedCache) M.FeedCache.clearFeedState();
      M.FeedService.reset();

      await this.clearContent();
      const sess = _sess;

      try {
        await M.DataService.loadApiDatabase().catch(err => {
          console.warn('[Content] renderFeed: loadApiDatabase failed:', err);
        });
        if (sess !== _sess) return;

        this._ensureFeedClickDelegate(ctr);

        const { groups: firstGroups, hasMore } =
          await M.FeedService.loadNextPage(lang, FEED_FIRST_PAGE_SIZE);
        if (sess !== _sess) return;

        if (firstGroups.length) {
          await this._appendFeedGroups(ctr, firstGroups, lang, null);
        }

        try { M.FeedService?.saveToCache?.(); } catch (_) {}
        try { M.LoadingService?.hideInstant(); } catch (_) {}

        if (sess !== _sess) return;

        try {
          const navType = (typeof performance !== 'undefined' && performance.getEntriesByType)
            ? performance.getEntriesByType('navigation')[0]?.type
            : null;
          if (navType === 'back_forward' && sess === _sess) {
            const saved = this._readPersistedScroll(10 * 60 * 1000);
            if (saved && saved.scrollPosition > 0) {
              const chunkTarget = Math.max(1, Math.min(10, Math.ceil(saved.scrollPosition / 800)));
              await this._restoreScrollPosition(ctr, saved.scrollPosition, chunkTarget, async () => {
                return await M.FeedService.loadNextPage(lang, FEED_PAGE_SIZE);
              }, lang, sess);
            }
          }
        } catch (_) {}

        if (hasMore && sess === _sess) {
          this._attachFeedSentinel(ctr, lang, sess);
        }

      } catch (e) {
        console.error('[NavCore/Content] renderFeed error:', e);
        try { M.LoadingService?.hide(); } catch (_) {}
      } finally {
        try { M.LoadingService?.hideInstant(); } catch (_) {}
      }
    },

    // ── renderContentLazy (source-based routes — lazy paginated) ───────────────

    async renderContentLazy(data, lang, routeKey) {
      _ensureCss();
      _ensureFeedCss();

      const ctr = document.getElementById(CONFIG.DOM.CONTENT_LOADING_ID);
      if (!ctr) return;

      _activeRouteKey  = routeKey;
      _activeRouteKind = 'lazy';

      const cached = M.RouteCache ? M.RouteCache.get(routeKey) : null;

      if (cached && cached.scrollPosition > 0) {
        await this.clearContent({ skipScroll: true });
        const sess = _sess;

        try {
          await M.DataService.loadApiDatabase().catch(err => {
            console.warn('[Content] renderContentLazy restore: loadApiDatabase failed:', err);
          });
          if (sess !== _sess) return;

          this._ensureFeedClickDelegate(ctr);

          if (cached.paginatorState && M.SourcePaginator) {
            M.SourcePaginator.restore(cached.paginatorState);
          }

          let hasMore = true;
          if (cached.domSnapshot) {
            M.RouteCache.restoreDom(ctr, cached.domSnapshot);
          } else {
            const sourceDesc = data.find(d => d && d.source);
            if (sourceDesc && M.SourcePaginator) {
              const layout = sourceDesc.as === 'cards' || sourceDesc.as === 'card' ? 'card' : 'button';
              const filter = Array.isArray(sourceDesc.only) ? sourceDesc.only : null;
              await M.SourcePaginator.init(sourceDesc.source, layout, filter);
              const targetChunks = cached.chunkCount || 1;
              for (let i = 0; i < targetChunks; i++) {
                const size = i === 0 ? M.SourcePaginator.FIRST_PAGE_SIZE : M.SourcePaginator.PAGE_SIZE;
                const res = await M.SourcePaginator.loadNextPage(lang, size);
                if (sess !== _sess) return;
                if (res.groups.length) {
                  await this._appendFeedGroups(ctr, res.groups, lang, null);
                }
                hasMore = res.hasMore;
                if (!hasMore) break;
              }
            }
          }

          try { M.LoadingService?.hideInstant(); } catch (_) {}
          if (sess !== _sess) return;

          await this._restoreScrollPosition(ctr, cached.scrollPosition, cached.chunkCount || 1, async () => {
            return await M.SourcePaginator.loadNextPage(lang, M.SourcePaginator.PAGE_SIZE);
          }, lang, sess);

          if (hasMore !== false && sess === _sess) {
            this._attachLazySentinel(ctr, data, lang, sess);
          }

          return;
        } catch (e) {
          console.error('[NavCore/Content] renderContentLazy restore error:', e);
        }
      }

      if (M.RouteCache) M.RouteCache.invalidate(routeKey);
      if (M.SourcePaginator) M.SourcePaginator.reset();

      await this.clearContent();
      const sess = _sess;

      try {
        await M.DataService.loadApiDatabase().catch(err => {
          console.warn('[Content] renderContentLazy: loadApiDatabase failed:', err);
        });
        if (sess !== _sess) return;

        this._ensureFeedClickDelegate(ctr);

        const sourceDesc = data.find(d => d && d.source);
        if (!sourceDesc) return;

        const layout = sourceDesc.as === 'cards' || sourceDesc.as === 'card' ? 'card' : 'button';
        const filter = Array.isArray(sourceDesc.only) ? sourceDesc.only : null;

        await M.SourcePaginator.init(sourceDesc.source, layout, filter);
        if (sess !== _sess) return;

        const { groups: firstGroups, hasMore } =
          await M.SourcePaginator.loadNextPage(lang, M.SourcePaginator.FIRST_PAGE_SIZE);
        if (sess !== _sess) return;

        if (firstGroups.length) {
          _applyViewTransition(() => {
            this._appendFeedGroups(ctr, firstGroups, lang, null);
          });
        }

        try { M.LoadingService?.hideInstant(); } catch (_) {}

        if (sess !== _sess) return;

        if (hasMore && sess === _sess) {
          this._attachLazySentinel(ctr, data, lang, sess);
        }

      } catch (e) {
        console.error('[NavCore/Content] renderContentLazy error:', e);
        try { M.LoadingService?.hide(); } catch (_) {}
      } finally {
        try { M.LoadingService?.hideInstant(); } catch (_) {}
      }
    },

    // ── Helper methods ─────────────────────────────────────────────────────────

    _ensureFeedClickDelegate(ctr) {
      if (!ctr || ctr.dataset.feedClickBound === 'true') return;
      ctr.dataset.feedClickBound = 'true';

      ctr.addEventListener('click', async (ev) => {
        const target = /** @type {HTMLElement|null} */ (ev.target);
        if (!target) return;

        const btn = target.closest('button.button-content');
        if (btn) {
          ev.preventDefault();
          const api  = btn.getAttribute('data-api')  || '';
          const text = btn.getAttribute('data-text') || btn.textContent || '';
          if (M.CopyService) {
            try { await M.CopyService.copyCharacter(api, text, btn); } catch (e) {
              console.warn('[Content] Feed copy failed:', e);
            }
          }
          return;
        }

        const card = target.closest('.card');
        if (card) {
          const link = card.getAttribute('data-link');
          if (link && M.RouterService) {
            ev.preventDefault();
            M.RouterService.navigateTo(link);
          }
        }
      });
    },

    async _appendFeedGroups(ctr, groups, lang, sentinel) {
      if (!groups.length) return;

      const resolvedItems = await this._resolveAll(groups, lang);
      if (!resolvedItems.length) return;

      if (window.DiscoverFeed && typeof window.DiscoverFeed.renderFeedGroups === "function") {
        window.DiscoverFeed.renderFeedGroups(ctr, resolvedItems, lang, sentinel);
        return;
      }

      const page     = document.createElement('div');
      page.className = 'feed-page';

      let html = '';
      for (const item of resolvedItems) html += this._tpl(item, lang);
      page.innerHTML = html;

      if (sentinel && sentinel.parentNode === ctr) {
        ctr.insertBefore(page, sentinel);
      } else {
        ctr.appendChild(page);
      }
    },

    _attachFeedSentinel(ctr, lang, sess) {
      this._removeSentinel();

      const sentinel           = document.createElement('div');
      sentinel.id              = FEED_SENTINEL_ID;
      sentinel.style.height    = '1px';
      sentinel.style.width     = '100%';
      sentinel.style.marginTop = '40px';
      ctr.appendChild(sentinel);

      let isLoading = false;

      _feedObserver = new IntersectionObserver(async (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (isLoading || sess !== _sess) return;

          isLoading = true;
          try {
            const { groups, hasMore } =
              await M.FeedService.loadNextPage(lang, FEED_PAGE_SIZE);

            if (sess !== _sess) return;

            if (groups.length) {
              await this._appendFeedGroups(ctr, groups, lang, sentinel);
              try { M.FeedService?.saveToCache?.(); } catch (_) {}
            }

            if (!hasMore) {
              this._removeSentinel();
            }
          } catch (e) {
            console.warn('[NavCore/Content] Feed pagination error:', e);
          } finally {
            isLoading = false;
          }
        }
      }, { rootMargin: '600px 0px' });

      _feedObserver.observe(sentinel);
    },

    _attachLazySentinel(ctr, data, lang, sess) {
      this._removeSentinel();

      const sentinel           = document.createElement('div');
      sentinel.id              = FEED_SENTINEL_ID;
      sentinel.style.height    = '1px';
      sentinel.style.width     = '100%';
      sentinel.style.marginTop = '40px';
      ctr.appendChild(sentinel);

      let isLoading = false;

      _feedObserver = new IntersectionObserver(async (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (isLoading || sess !== _sess) return;

          isLoading = true;
          try {
            const { groups, hasMore } =
              await M.SourcePaginator.loadNextPage(lang, M.SourcePaginator.PAGE_SIZE);

            if (sess !== _sess) return;

            if (groups.length) {
              await this._appendFeedGroups(ctr, groups, lang, sentinel);
            }

            if (!hasMore) {
              this._removeSentinel();
            }
          } catch (e) {
            console.warn('[NavCore/Content] Lazy pagination error:', e);
          } finally {
            isLoading = false;
          }
        }
      }, { rootMargin: '600px 0px' });

      _feedObserver.observe(sentinel);
    },

    _removeSentinel() {
      if (_feedObserver) {
        _feedObserver.disconnect();
        _feedObserver = null;
      }
      const el = document.getElementById(FEED_SENTINEL_ID);
      if (el) try { el.parentNode?.removeChild(el); } catch (_) {}
    },

    saveActiveRoute() {
      if (!_activeRouteKey || !M.RouteCache) return;

      const ctr = document.getElementById(CONFIG.DOM.CONTENT_LOADING_ID);
      if (!ctr) return;

      const pages = ctr.querySelectorAll('.feed-page');
      const count = pages.length || 1;

      let feedState = null;
      if (_activeRouteKind === 'feed' && M.FeedService) {
        feedState = M.FeedService.snapshot();
      }

      M.RouteCache.save(_activeRouteKey, {
        scrollPosition: window.pageYOffset || 0,
        domContainer  : ctr,
        chunkCount    : count,
        feedState     : feedState,
        paginatorState: _activeRouteKind === 'lazy' && M.SourcePaginator ? M.SourcePaginator.snapshot() : null,
      });

      this._persistScroll(_activeRouteKey, window.pageYOffset || 0);
    },

    clearActiveRoute() {
      _activeRouteKey  = null;
      _activeRouteKind = null;
    },

    invalidateRouteCache(routeKey) {
      if (M.RouteCache) {
        if (routeKey) M.RouteCache.invalidate(routeKey);
        else          M.RouteCache.clear();
      }
    },

    _persistScroll(key, y) {
      try {
        sessionStorage.setItem(`nc_scroll_${key}`, JSON.stringify({
          y         : Math.max(0, y),
          timestamp : Date.now(),
        }));
      } catch (_) {}
    },

    _readPersistedScroll(ttl = 600000) {
      if (!_activeRouteKey) return null;
      try {
        const raw = sessionStorage.getItem(`nc_scroll_${_activeRouteKey}`);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (Date.now() - obj.timestamp > ttl) return null;
        return { scrollPosition: obj.y || 0 };
      } catch (_) { return null; }
    },

    async _restoreScrollPosition(ctr, targetY, targetChunks, loadMoreFn, lang, sess) {
      if (!targetY || targetY <= 0) return;

      const currentH = document.documentElement.scrollHeight;
      const viewH    = window.innerHeight;

      if (currentH >= targetY + viewH / 2) {
        window.scrollTo(0, targetY);
        return;
      }

      const sentinel = document.getElementById(FEED_SENTINEL_ID);
      let chunksLoaded = 1;

      while (chunksLoaded < targetChunks) {
        if (sess !== _sess) return;
        const res = await loadMoreFn();
        if (!res.groups?.length) break;

        await this._appendFeedGroups(ctr, res.groups, lang, sentinel);
        chunksLoaded++;

        const newH = document.documentElement.scrollHeight;
        if (newH >= targetY + viewH / 2) break;
      }

      if (sess === _sess) {
        window.scrollTo(0, targetY);
      }
    },

    async updateCardsLanguage(lang) {
      const ctr = document.getElementById(CONFIG.DOM.CONTENT_LOADING_ID);
      if (!ctr) return;

      const titles = ctr.querySelectorAll('.card-title');
      for (const t of titles) {
        const api = t.closest('.card')?.getAttribute('data-api');
        if (!api) continue;
        const item = await M.DataService.lookupByApi(api);
        if (item?.title) t.textContent = _txt(item.title, lang);
      }
    },

    async _resolveAll(descriptors, lang) {
      const results = [];

      for (let desc of descriptors) {
        if (!desc || typeof desc !== 'object') continue;
        if (desc.group) desc = desc.group;
        if (!desc || typeof desc !== 'object') continue;

        if (desc._ureType) {
          results.push(desc);
          continue;
        }

        if (desc.type === 'card-group' || desc.type === 'button-row' || desc.items) {
          results.push(this._formatGroupDescriptor(desc, lang));
          continue;
        }

        if (desc.source) {
          const resolved = await this._resolveSource(desc, lang);
          results.push(...resolved);
          continue;
        }

        if (desc.jsonFile) {
          try {
            const raw = await M.DataService.fetchWithRetry(desc.jsonFile, {}, 3);
            const arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
            for (const item of arr) {
              if (item.source) {
                const resolved = await this._resolveSource(item, lang);
                results.push(...resolved);
              } else if (item.type === 'card-group' || item.type === 'button-row' || item.items) {
                results.push(this._formatGroupDescriptor(item, lang));
              } else {
                results.push(item);
              }
            }
          } catch (e) {
            console.warn('[Content] Failed to fetch jsonFile descriptor:', desc.jsonFile, e);
          }
          continue;
        }
      }

      return results;
    },

    _formatGroupDescriptor(desc, lang) {
      const layout = _toLayout(desc.as || desc.layout || (desc.type === 'card-group' ? 'card' : 'button'));
      const isCard = layout === LAYOUT.CARD;

      const header = desc.header
        ? (typeof desc.header === 'string'
            ? desc.header
            : { title: _txt(desc.header.title || desc.header.name, lang), description: _txt(desc.header.description, lang) })
        : null;

      const items = (desc.items || []).map(it => {
        if (isCard) {
          return {
            title:       _txt(it.title || it.name, lang),
            description: _txt(it.description, lang),
            link:        it.link || it.url || null,
            image:       it.image || null,
            imageAlt:    _txt(it.imageAlt || it.title || it.name, lang),
          };
        } else {
          return {
            text: it.text || it.content || it.api || it.name || '…',
            api:  it.api  || it.id      || null,
          };
        }
      });

      return {
        _ureType: isCard ? 'card-group' : 'button-row',
        _rowPos:  desc._rowPos || 'only',
        header,
        items,
      };
    },

    async _resolveSource(desc, lang) {
      const sourceId = desc.source;
      const layout   = _toLayout(desc.as);
      const isCard   = layout === LAYOUT.CARD;
      const filter   = Array.isArray(desc.only) ? desc.only : null;

      const categories = await M.DataService.getTypeCategories(sourceId);
      if (!categories.length) return [];

      const targetCats = filter
        ? categories.filter(c => filter.includes(c.id))
        : categories;

      const groupJobs = targetCats.map(async (cat) => {
        const catData = await M.DataService._loadSubcategoryData(sourceId, cat.id);
        if (!catData?.length) return null;

        const header = {
          title:       _txt(cat.name, lang),
          description: _txt(cat.description, lang),
        };

        const items = catData.map(it => {
          if (isCard) {
            return {
              title:       _txt(it.title || it.name, lang),
              description: _txt(it.description, lang),
              link:        it.link || it.url || null,
              image:       it.image || null,
              imageAlt:    _txt(it.imageAlt || it.title || it.name, lang),
            };
          } else {
            return {
              text: it.text || it.content || it.api || it.name || '…',
              api:  it.api  || it.id      || null,
            };
          }
        });

        return {
          _ureType: isCard ? 'card-group' : 'button-row',
          _rowPos:  'only',
          header,
          items,
        };
      });

      const resolvedGroups = await Promise.all(groupJobs);
      return resolvedGroups.filter(Boolean);
    },

    _tpl(item, lang) {
      if (!item) return '';

      if (item._ureType === 'card-group') {
        const hdr   = item.header ? `<div class="group-header"><h2 class="group-header-text">${_esc(typeof item.header === 'string' ? item.header : item.header.title)}</h2>${item.header.description ? `<p class="group-header-description">${_esc(item.header.description)}</p>` : ''}</div>` : '';
        let cards   = '';
        for (const c of item.items) {
          const img = c.image ? `<img class="card-image" src="${_esc(c.image)}" loading="lazy" decoding="async" fetchpriority="low" alt="${_esc(c.imageAlt)}">` : '';
          cards += `<div class="card"${c.link ? ` data-link="${_esc(c.link)}"` : ''}>${img}<div class="card-content"><div class="card-title">${_esc(c.title)}</div><div class="card-description">${_esc(c.description)}</div></div></div>`;
        }
        return `<div class="cm-group"><div class="card-content-container">${hdr}${cards}</div></div>`;
      }

      if (item._ureType === 'button-row') {
        const hdr  = item.header ? `<div class="group-header"><h2 class="group-header-text">${_esc(typeof item.header === 'string' ? item.header : item.header.title)}</h2>${item.header.description ? `<p class="group-header-description">${_esc(item.header.description)}</p>` : ''}</div>` : '';
        let btns   = '';
        for (const b of item.items) {
          btns += `<button class="button-content" data-text="${_esc(b.text)}"${b.api ? ` data-api="${_esc(b.api)}"` : ''}>${_esc(b.text)}</button>`;
        }
        return `<div class="cm-group"><div class="ure-btn-row ure-btn-row--${item._rowPos || 'only'}">${hdr}${btns}</div></div>`;
      }

      return '';
    },

    _onClick(e) {
      const target = e.target;
      if (!target) return;

      const btn = target.closest('button.button-content');
      if (btn) {
        const api  = btn.getAttribute('data-api')  || '';
        const text = btn.getAttribute('data-text') || btn.textContent || '';
        if (M.CopyService) {
          try { M.CopyService.copyCharacter(api, text, btn); } catch (err) {
            console.warn('[Content] Copy failed:', err);
          }
        }
        return;
      }

      const card = target.closest('.card');
      if (card) {
        const link = card.getAttribute('data-link');
        if (link && M.RouterService) {
          M.RouterService.navigateTo(link);
        }
      }
    },
  };

  M.ContentService = ContentService;

})(window.NavCoreModules = window.NavCoreModules || {});
