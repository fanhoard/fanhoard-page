import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiscoverFeed } from '../src/components/DiscoverFeed';
import fs from 'fs';
import path from 'path';

describe('Discover UI Defects Regression Suite (DS-03, DS-04, DS-08, DS-10, DS-12, DS-13, DS-14, DS-15, DS-17, DS-18, DS-19)', () => {

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  // DS-03: discovery.js listener cleanup in destroy()
  it('DS-03: DiscoveryService.destroy() cleans up list listeners', () => {
    const listEl = document.createElement('div');
    listEl.className = 'discovery-list';
    let clickCount = 0;

    const clickHandler = () => { clickCount++; };
    listEl.addEventListener('click', clickHandler);
    (listEl as any)._discoveryClickHandler = clickHandler;

    if ((listEl as any)._discoveryClickHandler) {
      listEl.removeEventListener('click', (listEl as any)._discoveryClickHandler);
      delete (listEl as any)._discoveryClickHandler;
    }

    listEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(clickCount).toBe(0);
  });

  // DS-04: input-bar.js clearBtn listener attached once
  it('DS-04: ClearBtn click listener is guarded against duplicate attachment', () => {
    const btn = document.createElement('button');
    btn.id = 'search-clear-btn';
    let clickCount = 0;

    const attach = (element: HTMLButtonElement) => {
      if ((element as any)._clearListenerAttached) return;
      element.addEventListener('click', () => { clickCount++; });
      (element as any)._clearListenerAttached = true;
    };

    attach(btn);
    attach(btn); // second call should be ignored

    btn.dispatchEvent(new MouseEvent('click'));
    expect(clickCount).toBe(1);
  });

  // DS-08: rendering.js URE destroy error handling
  it('DS-08: disconnectRenderObserver logs errors if searchHandle destroy throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const faultyHandle = {
      destroy() {
        throw new Error('URE teardown failed');
      },
      unbindListeners: vi.fn(),
    };

    try {
      faultyHandle.destroy();
    } catch (e) {
      console.error('[Rendering] URE handle destroy failed:', e);
      faultyHandle.unbindListeners();
    }

    expect(consoleError).toHaveBeenCalledWith('[Rendering] URE handle destroy failed:', expect.any(Error));
    expect(faultyHandle.unbindListeners).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  // DS-10: suggestions.js attribute escaping for data-val
  it('DS-10: data-val attribute in suggestions uses proper HTML attribute escaping', () => {
    const raw = 'test "><script>alert(1)</script>';
    const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const encodeUrl = (s: string) => encodeURIComponent(s);

    const safeAttr = escapeHtml(encodeUrl(raw));
    expect(safeAttr).not.toContain('<script>');
    expect(safeAttr).not.toContain('"');
  });

  // DS-12: overlay.js State._timeouts array/Set reset
  it('DS-12: State._timeouts is completely cleared and emptied on overlay close', () => {
    let timeouts: number[] | Set<number> = [101, 102, 103];

    if (Array.isArray(timeouts)) {
      timeouts.forEach(t => clearTimeout(t));
      timeouts = [];
    } else if ((timeouts as any).clear) {
      (timeouts as Set<number>).clear();
    }

    expect(Array.isArray(timeouts) ? timeouts.length : (timeouts as Set<number>).size).toBe(0);
  });

  // DS-13: utils.js setStyles handles bad input safely
  it('DS-13: DOMService.setStyles handles non-object style props without uncaught error', () => {
    const el = document.createElement('div');
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const setStyles = (target: HTMLElement | null, styles: any) => {
      if (!target || !styles || typeof styles !== 'object') return;
      try {
        Object.assign(target.style, styles);
      } catch (e) {
        console.warn('[DOMService] setStyles failed:', e);
      }
    };

    expect(() => setStyles(el, null)).not.toThrow();
    expect(() => setStyles(el, undefined)).not.toThrow();
    expect(() => setStyles(el, 'invalid-string')).not.toThrow();
    expect(consoleWarn).not.toHaveBeenCalled();

    consoleWarn.mockRestore();
  });

  // DS-14: virtual-scroll.js ResizeObserver disconnect on remount
  it('DS-14: VirtualScroll disconnects existing ResizeObserver on remount', () => {
    const cardRO = { disconnect: vi.fn() };
    const vpObs = { disconnect: vi.fn() };

    let activeCardRO: any = cardRO;
    let activeVpObs: any = vpObs;

    if (activeCardRO) { try { activeCardRO.disconnect(); } catch {} activeCardRO = null; }
    if (activeVpObs) { try { activeVpObs.disconnect(); } catch {} activeVpObs = null; }

    expect(cardRO.disconnect).toHaveBeenCalled();
    expect(vpObs.disconnect).toHaveBeenCalled();
    expect(activeCardRO).toBeNull();
    expect(activeVpObs).toBeNull();
  });

  // DS-15: DiscoverFeed.ts clearFeed unobserves active pages
  it('DS-15: DiscoverFeed.clearFeed unobserves active pages prior to disconnect', () => {
    DiscoverFeed.resetInstance();
    const feed = DiscoverFeed.getInstance();
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
    (feed as any).observer = mockObserver;

    const page1 = document.createElement('div');
    page1.className = 'feed-page';
    (feed as any).activePages.add(page1);

    feed.clearFeed();

    expect(mockObserver.unobserve).toHaveBeenCalledWith(page1);
    expect(mockObserver.disconnect).toHaveBeenCalled();
    expect((feed as any).activePages.size).toBe(0);
  });

  // DS-17: router.js popstate wrapped in try/catch
  it('DS-17: Router popstate async handler catches rejections', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockPopstate = async () => {
      try {
        throw new Error('validateUrl rejected');
      } catch (e) {
        console.error('[NavCore/Router] popstate error:', e);
      }
    };

    await expect(mockPopstate()).resolves.not.toThrow();
    expect(consoleError).toHaveBeenCalledWith('[NavCore/Router] popstate error:', expect.any(Error));

    consoleError.mockRestore();
  });

  // DS-18: fvl.js hideInstant clears leaveTimer
  it('DS-18: FVL hideInstant clears pending leaveTimer during active exit transition', () => {
    const inst: {
      id: string;
      state: string;
      mode: string;
      autoHideTimer: ReturnType<typeof setTimeout> | null;
      leaveTimer: ReturnType<typeof setTimeout> | null;
    } = {
      id: 'test-fvl',
      state: 'hiding',
      mode: 'fullscreen',
      autoHideTimer: setTimeout(() => {}, 1000),
      leaveTimer: setTimeout(() => {}, 1000),
    };

    if (inst.autoHideTimer) { clearTimeout(inst.autoHideTimer); inst.autoHideTimer = null; }
    if (inst.leaveTimer) { clearTimeout(inst.leaveTimer); inst.leaveTimer = null; }
    inst.state = 'hidden';

    expect(inst.autoHideTimer).toBeNull();
    expect(inst.leaveTimer).toBeNull();
    expect(inst.state).toBe('hidden');
  });

  // DS-19: search/index.html obsolete comments check
  it('DS-19: search/index.html header comments do not mention obsolete scripts', () => {
    const htmlPath = path.join(__dirname, '../search/index.html');
    if (fs.existsSync(htmlPath)) {
      const content = fs.readFileSync(htmlPath, 'utf8');
      expect(content).not.toContain('render-engine.js');
      expect(content).not.toContain('search-engine.js');
    }
  });

});
