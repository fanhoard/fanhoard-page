import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchStore } from '../../src/stores/SearchStore';

describe('SearchStore', () => {
  beforeEach(() => {
    SearchStore.resetInstance();
  });

  it('initializes with default empty search state', () => {
    const store = SearchStore.getInstance();
    expect(store.getState()).toEqual({
      query: '',
      category: null,
      type: 'all',
      scrollIndex: 0,
      resultsCount: 0,
      isSearching: false
    });
  });

  it('updates search query and marks isSearching', () => {
    const store = SearchStore.getInstance();
    store.setQuery('arrow');

    const state = store.getState();
    expect(state.query).toBe('arrow');
    expect(state.isSearching).toBe(true);
  });

  it('updates category, type, and resets scrollIndex', () => {
    const store = SearchStore.getInstance();
    store.setScrollIndex(100);
    store.setCategory('symbol');

    let state = store.getState();
    expect(state.category).toBe('symbol');
    expect(state.scrollIndex).toBe(0);

    store.setType('emoji');
    state = store.getState();
    expect(state.type).toBe('emoji');
  });

  it('resets state correctly', () => {
    const store = SearchStore.getInstance();
    store.setQuery('smile');
    store.setCategory('emoji');
    store.setScrollIndex(50);

    store.reset();
    expect(store.getState()).toEqual({
      query: '',
      category: null,
      type: 'all',
      scrollIndex: 0,
      resultsCount: 0,
      isSearching: false
    });
  });

  it('notifies subscribers on change', () => {
    const store = SearchStore.getInstance();
    const listener = vi.fn();

    const unsubscribe = store.subscribe(listener);
    expect(listener).toHaveBeenCalledWith(store.getState());

    store.setQuery('star');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });
});
