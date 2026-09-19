import { describe, it, expect, beforeEach } from 'vitest';
import { ReleaseCacheService } from '../../src/services/ReleaseCacheService';

describe('ReleaseCacheService', () => {
  let cache: ReleaseCacheService;

  beforeEach(() => {
    ReleaseCacheService.resetInstance();
    cache = ReleaseCacheService.getInstance({ ttlMs: 1000 }); // 1 sec TTL for testing
  });

  it('stores and retrieves string values in memory', () => {
    cache.set('test-key', '# Version 1.0.0\nChangelog details');
    expect(cache.has('test-key')).toBe(true);
    expect(cache.get('test-key')).toBe('# Version 1.0.0\nChangelog details');
  });

  it('stores and retrieves JSON objects in memory', () => {
    const data = { version: '1.0.0', title: { en: 'Title' } };
    cache.set('json-key', data);
    expect(cache.has('json-key')).toBe(true);
    expect(cache.get('json-key')).toEqual(data);
  });

  it('returns null for missing keys', () => {
    expect(cache.has('missing')).toBe(false);
    expect(cache.get('missing')).toBeNull();
  });

  it('expires entries after TTL', async () => {
    cache.set('ttl-key', 'value');
    expect(cache.get('ttl-key')).toBe('value');

    // Wait past TTL
    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(cache.has('ttl-key')).toBe(false);
    expect(cache.get('ttl-key')).toBeNull();
  });

  it('deletes specific keys', () => {
    cache.set('del-key', 'data');
    expect(cache.has('del-key')).toBe(true);
    cache.delete('del-key');
    expect(cache.has('del-key')).toBe(false);
  });

  it('clears all entries', () => {
    cache.set('k1', 'v1');
    cache.set('k2', 'v2');
    cache.clear();
    expect(cache.has('k1')).toBe(false);
    expect(cache.has('k2')).toBe(false);
  });
});
