/**
 * ReleaseCacheService.ts
 * Client-side Markdown and JSON cache service for What's New release notes.
 * Caches documents in memory and sessionStorage to prevent redundant network fetches
 * when toggling release notes or switching languages.
 */

export interface CacheOptions {
  ttlMs?: number; // Optional TTL in milliseconds (default: 30 minutes)
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class ReleaseCacheService {
  private static instance: ReleaseCacheService | null = null;
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private prefix = 'fv_release_cache_';
  private ttlMs: number;

  constructor(options: CacheOptions = {}) {
    this.ttlMs = options.ttlMs || 30 * 60 * 1000; // 30 mins
  }

  public static getInstance(options?: CacheOptions): ReleaseCacheService {
    if (!ReleaseCacheService.instance) {
      ReleaseCacheService.instance = new ReleaseCacheService(options);
    }
    return ReleaseCacheService.instance;
  }

  /**
   * Get cached entry by key (URL or identifier).
   * Checks memory cache first, then sessionStorage.
   */
  public get<T = unknown>(key: string): T | null {
    const now = Date.now();

    // 1. Check memory cache
    if (this.memoryCache.has(key)) {
      const entry = this.memoryCache.get(key) as CacheEntry<T>;
      if (now - entry.timestamp < this.ttlMs) {
        return entry.value;
      }
      this.memoryCache.delete(key);
    }

    // 2. Check sessionStorage
    try {
      const storageKey = this.prefix + key;
      const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(storageKey) : null;
      if (raw) {
        const parsed: CacheEntry<T> = JSON.parse(raw);
        if (now - parsed.timestamp < this.ttlMs) {
          // Re-populate memory cache
          this.memoryCache.set(key, parsed as CacheEntry<unknown>);
          return parsed.value;
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(storageKey);
        }
      }
    } catch (_) {
      // sessionStorage unavailable or access denied
    }

    return null;
  }

  /**
   * Set cached entry by key.
   * Stores in memory cache and sessionStorage.
   */
  public set<T>(key: string, value: T): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
    };

    this.memoryCache.set(key, entry as CacheEntry<unknown>);

    try {
      if (typeof sessionStorage !== 'undefined') {
        const storageKey = this.prefix + key;
        sessionStorage.setItem(storageKey, JSON.stringify(entry));
      }
    } catch (_) {
      // Handle storage quota exceeded or disabled
    }
  }

  /**
   * Check if a valid non-expired key exists in cache.
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove specific entry from cache.
   */
  public delete(key: string): void {
    this.memoryCache.delete(key);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(this.prefix + key);
      }
    } catch (_) {}
  }

  /**
   * Clear all release cache entries from memory and sessionStorage.
   */
  public clear(): void {
    this.memoryCache.clear();
    try {
      if (typeof sessionStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith(this.prefix)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      }
    } catch (_) {}
  }

  public static resetInstance(): void {
    if (ReleaseCacheService.instance) {
      ReleaseCacheService.instance.clear();
    }
    ReleaseCacheService.instance = null;
  }
}

export const releaseCacheService = ReleaseCacheService.getInstance();

// Expose on window for legacy non-module scripts
if (typeof window !== 'undefined') {
  (window as unknown as { ReleaseCacheService: ReleaseCacheService }).ReleaseCacheService = releaseCacheService;
}
