import { describe, it, expect, beforeEach } from 'vitest';
import { SearchStore } from '../src/stores/SearchStore';

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
