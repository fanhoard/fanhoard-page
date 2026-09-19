export interface SearchState {
  query: string;
  category: string | null;
  type: string;
  scrollIndex: number;
  resultsCount: number;
  isSearching: boolean;
}

export type SearchListener = (state: SearchState) => void;

export class SearchStore {
  private static instance: SearchStore;
  private state: SearchState = {
    query: '',
    category: null,
    type: 'all',
    scrollIndex: 0,
    resultsCount: 0,
    isSearching: false
  };
  private listeners: Set<SearchListener> = new Set();

  public static getInstance(): SearchStore {
    if (!SearchStore.instance) {
      SearchStore.instance = new SearchStore();
    }
    return SearchStore.instance;
  }

  public getState(): SearchState {
    return { ...this.state };
  }

  public setQuery(query: string): void {
    const trimmed = query.trim();
    if (this.state.query === trimmed) return;

    this.state = {
      ...this.state,
      query: trimmed,
      scrollIndex: 0,
      isSearching: trimmed.length > 0
    };
    this.notifySubscribers();
  }

  public setCategory(category: string | null): void {
    if (this.state.category === category) return;

    this.state = {
      ...this.state,
      category,
      scrollIndex: 0
    };
    this.notifySubscribers();
  }

  public setType(type: string): void {
    if (this.state.type === type) return;

    this.state = {
      ...this.state,
      type,
      scrollIndex: 0
    };
    this.notifySubscribers();
  }

  public setScrollIndex(scrollIndex: number): void {
    if (this.state.scrollIndex === scrollIndex) return;

    this.state = {
      ...this.state,
      scrollIndex: Math.max(0, scrollIndex)
    };
    this.notifySubscribers();
  }

  public setResultsCount(count: number): void {
    if (this.state.resultsCount === count) return;

    this.state = {
      ...this.state,
      resultsCount: Math.max(0, count)
    };
    this.notifySubscribers();
  }

  public reset(): void {
    this.state = {
      query: '',
      category: null,
      type: 'all',
      scrollIndex: 0,
      resultsCount: 0,
      isSearching: false
    };
    this.notifySubscribers();
  }

  public subscribe(listener: SearchListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifySubscribers(): void {
    const copy = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(copy);
      } catch (err) {
        console.error('[SearchStore] Subscriber error:', err);
      }
    });
  }

  public static resetInstance(): void {
    if (SearchStore.instance) {
      SearchStore.instance.listeners.clear();
      SearchStore.instance.state = {
        query: '',
        category: null,
        type: 'all',
        scrollIndex: 0,
        resultsCount: 0,
        isSearching: false
      };
    }
    SearchStore.instance = new SearchStore();
  }
}

export const searchStore = SearchStore.getInstance();
