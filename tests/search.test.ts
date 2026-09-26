import { describe, it, expect, beforeEach } from 'vitest';
import { SearchStore } from '../src/stores/SearchStore';
import fs from 'fs';
import path from 'path';

describe('SearchStore state & query handling', () => {
  let store: SearchStore;

  beforeEach(() => {
    SearchStore.resetInstance();
    store = SearchStore.getInstance();
  });

  it('initializes with default empty search state', () => {
    const state = store.getState();
    expect(state.query).toBe('');
    expect(state.category).toBeNull();
    expect(state.isSearching).toBe(false);
  });

  it('updates query and sets isSearching flag', () => {
    store.setQuery('rocket');
    const state = store.getState();
    expect(state.query).toBe('rocket');
    expect(state.isSearching).toBe(true);
  });

  it('updates category filter and scroll index', () => {
    store.setCategory('emojis');
    store.setScrollIndex(5);
    let state = store.getState();
    expect(state.category).toBe('emojis');
    expect(state.scrollIndex).toBe(5);

    store.setCategory('math');
    state = store.getState();
    expect(state.category).toBe('math');
    expect(state.scrollIndex).toBe(0); // reset on category change
  });

  it('subscribes to state changes', () => {
    let lastQuery = '';
    const unsub = store.subscribe((state) => {
      lastQuery = state.query;
    });

    store.setQuery('star');
    expect(lastQuery).toBe('star');
    unsub();
  });

  it('resets search state', () => {
    store.setQuery('term');
    store.setCategory('emojis');
    store.reset();

    const state = store.getState();
    expect(state.query).toBe('');
    expect(state.category).toBeNull();
    expect(state.isSearching).toBe(false);
  });
});

describe('Search Page PLSys Progressive Loading Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    const plsysCode = fs.readFileSync(path.resolve(__dirname, '../assets/js/loading-system/plsys.js'), 'utf-8');
    eval(plsysCode);
  });

  it('integrates PLSys.load for search results container with skeleton swap and aria-busy contract', async () => {
    document.body.innerHTML = `
      <div id="search-sticky">
        <input type="search" id="searchInput" value="star" />
      </div>
      <div id="searchResults" role="region" aria-live="polite"></div>
    `;

    const container = document.getElementById('searchResults') as HTMLElement;
    const input = document.getElementById('searchInput') as HTMLInputElement;
    input.focus();

    let fetchResolved = false;
    const fetcher = () => new Promise<{ results: any[] }>((resolve) => {
      setTimeout(() => {
        fetchResolved = true;
        resolve({ results: [{ id: 1, title: 'Star Emoji' }] });
      }, 50);
    });

    const loadPromise = (window as any).PLSys.load(
      container,
      fetcher,
      (data: any) => {
        container.innerHTML = `<div class="search-card">${data.results[0].title}</div>`;
      },
      { key: 'test:search' }
    );

    // Assert skeleton mounted and aria-busy set while loading
    expect(container.getAttribute('aria-busy')).toBe('true');
    expect(container.querySelector('.pl-card-skeleton')).not.toBeNull();
    expect(document.activeElement).toBe(input); // Input focus preserved

    const result = await loadPromise;
    expect(fetchResolved).toBe(true);
    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('.pl-card-skeleton')).toBeNull();
    expect(container.innerHTML).toContain('Star Emoji');
  });

  it('displays error boundary with retry UI on search fetch failure', async () => {
    document.body.innerHTML = `<div id="searchResults"></div>`;
    const container = document.getElementById('searchResults') as HTMLElement;

    let attempts = 0;
    const fetcher = () => new Promise((resolve, reject) => {
      attempts++;
      if (attempts === 1) reject(new Error('Network error loading search database'));
      else resolve({ results: [] });
    });

    try {
      await (window as any).PLSys.load(container, fetcher, () => {}, { key: 'test:search:fail' });
    } catch (_) {}

    expect(container.getAttribute('aria-busy')).toBe('false');
    const errBoundary = container.querySelector('.pl-error-boundary');
    expect(errBoundary).not.toBeNull();
    expect(errBoundary?.textContent).toContain('Network error loading search database');

    const retryBtn = errBoundary?.querySelector('.pl-retry-btn') as HTMLButtonElement;
    expect(retryBtn).not.toBeNull();
  });
});
