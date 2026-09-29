import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { SearchEngine } from '../assets/js/search-system/search-modules/engine.js';
import { UIService } from '../assets/js/search-system/search-modules/ui.js';

describe('PF-05: Dead Asset References & Boot 404 Elimination', () => {
  it('does not contain references to dead legacy JSON or wave-setting assets in version-core.js and modern-navigation.js', () => {
    const versionCorePath = path.join(__dirname, '../assets/js/version-core.js');
    const modernNavPath = path.join(__dirname, '../assets/js/modern-navigation.js');

    const versionCore = fs.readFileSync(versionCorePath, 'utf8');
    const modernNav = fs.readFileSync(modernNavPath, 'utf8');

    expect(versionCore).not.toContain('/assets/json/whats-new.json');
    expect(versionCore).not.toContain('/assets/md/current.md');
    expect(modernNav).not.toContain('wave-effect.js');
  });

  it('uses absolute leading slash for lang-proxy script in home/index.html', () => {
    const homeHtmlPath = path.join(__dirname, '../home/index.html');
    const homeHtml = fs.readFileSync(homeHtmlPath, 'utf8');

    expect(homeHtml).toContain('src="/assets/js/lang-proxy.js');
    expect(homeHtml).not.toContain('src="assets/js/lang-proxy.js');
  });
});

describe('PF-03: Unified Debounce Timers & Cancellation on Enter', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="search-pill">
        <input id="searchInput" type="text" />
      </div>
      <div id="searchSuggestions"></div>
    `;
  });

  it('cancels pending suggestion debounce timer on Enter keydown', () => {
    const onInput = vi.fn();
    const onEnter = vi.fn();

    UIService.setupAutoSearchInput(onInput, onEnter);

    const input = document.getElementById('searchInput') as HTMLInputElement;
    input.value = 'smile';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    input.dispatchEvent(enterEvent);

    expect(onEnter).toHaveBeenCalledWith('smile');
  });
});

describe('PF-06: Virtual Scroll Buffer Reduction', () => {
  it('uses ~300px buffer in ui.js, suggestions.js, utils.js, and ure config', () => {
    const uiCode = fs.readFileSync(path.join(__dirname, '../assets/js/search-system/search-modules/ui.js'), 'utf8');
    const suggestionsCode = fs.readFileSync(
      path.join(__dirname, '../assets/js/search-system/search-modules/suggestions.js'),
      'utf8'
    );
    const utilsCode = fs.readFileSync(
      path.join(__dirname, '../assets/js/search-system/search-modules/utils.js'),
      'utf8'
    );
    const ureConfigCode = fs.readFileSync(path.join(__dirname, '../assets/js/ure/ure-modules/config.js'), 'utf8');

    expect(uiCode).toContain('buffer: 300');
    expect(suggestionsCode).toContain('buffer: 300');
    expect(utilsCode).toContain('OVERSCAN: 300');
    expect(ureConfigCode).toContain('DEFAULT_BUFFER_PX          : 300');
    expect(ureConfigCode).toContain("SENTINEL_MARGIN            : '300px'");
  });
});

describe('PF-02: SearchEngine Query Result Cache', () => {
  const mockData = {
    type: [
      {
        id: 'emojis',
        name: { en: 'Emojis', th: 'อีโมจิ' },
        category: [
          {
            id: 'smileys',
            name: { en: 'Smileys', th: 'หน้ายิ้ม' },
            data: [
              { name: { en: 'Smiling Face', th: 'หน้ายิ้ม' }, api: 'smile' },
              { name: { en: 'Grinning Face', th: 'ยิ้มแย้ม' }, api: 'grin' },
              { name: { en: 'Red Heart', th: 'หัวใจแดง' }, api: 'heart' },
            ],
          },
        ],
      },
    ],
  };

  it('cache hit avoids recompute on repeat queries', async () => {
    await SearchEngine.init(mockData);

    expect(SearchEngine._internals.getResultCacheSize()).toBe(0);

    const res1 = SearchEngine.search('smile', 'all');
    expect(res1.results.length).toBeGreaterThan(0);
    expect(SearchEngine._internals.getResultCacheSize()).toBe(1);

    const res2 = SearchEngine.search('smile', 'all');
    expect(res2).toBe(res1);
  });

  it('cache invalidates on dataset rebuild (init)', async () => {
    await SearchEngine.init(mockData);

    SearchEngine.search('smile', 'all');
    expect(SearchEngine._internals.getResultCacheSize()).toBe(1);

    await SearchEngine.init(mockData);
    expect(SearchEngine._internals.getResultCacheSize()).toBe(0);
  });

  it('bounds cache size to 50 entries with LRU eviction', async () => {
    await SearchEngine.init(mockData);

    for (let i = 0; i < 60; i++) {
      SearchEngine.search('query_' + i, 'all');
    }
    expect(SearchEngine._internals.getResultCacheSize()).toBe(50);
  });
});

describe('PF-04: First-Character Bucket Index', () => {
  const mockData = {
    type: [
      {
        id: 'emojis',
        name: { en: 'Emojis', th: 'อีโมจิ' },
        category: [
          {
            id: 'smileys',
            name: { en: 'Smileys', th: 'หน้ายิ้ม' },
            data: [
              { name: { en: 'Smiling Face', th: 'หน้ายิ้ม' }, api: 'smile' },
              { name: { en: 'Grinning Face', th: 'ยิ้มแย้ม' }, api: 'grin' },
              { name: { en: 'Red Heart', th: 'หัวใจแดง' }, api: 'heart' },
            ],
          },
        ],
      },
    ],
  };

  it('builds bucket index on init and filters candidates for short queries', async () => {
    await SearchEngine.init(mockData);

    expect(SearchEngine._internals.getBucketIndexSize()).toBeGreaterThan(0);

    const resShort = SearchEngine.search('sm', 'all');
    expect(resShort.results.length).toBeGreaterThan(0);
    expect(resShort.results[0].itemName).toBe('Smiling Face');
  });
});
