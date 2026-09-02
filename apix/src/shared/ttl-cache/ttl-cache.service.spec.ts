import { TtlCacheService } from './ttl-cache.service';

describe('TtlCacheService', () => {
  let cache: TtlCacheService;

  beforeEach(() => {
    jest.useFakeTimers();
    cache = new TtlCacheService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('get/set', () => {
    it('returns undefined for a missing key', () => {
      expect(cache.get('nope')).toBeUndefined();
    });

    it('stores and returns a value within the TTL', () => {
      cache.set('k', { a: 1 }, 60_000);
      expect(cache.get('k')).toEqual({ a: 1 });
    });

    it('expires the value after the TTL', () => {
      cache.set('k', 'v', 1_000);
      jest.advanceTimersByTime(1_001);
      expect(cache.get('k')).toBeUndefined();
    });
  });

  describe('wrap single-flight', () => {
    it('caches the loader result', async () => {
      let calls = 0;
      const loader = async () => {
        calls++;
        return 42;
      };

      await expect(cache.wrap('k', 60_000, loader)).resolves.toBe(42);
      await expect(cache.wrap('k', 60_000, loader)).resolves.toBe(42);
      expect(calls).toBe(1);
    });

    it('shares one in-flight load between concurrent callers', async () => {
      let calls = 0;
      let resolveLoader: (v: number) => void;
      const loader = () => {
        calls++;
        return new Promise<number>((resolve) => {
          resolveLoader = resolve;
        });
      };

      const first = cache.wrap('k', 60_000, loader);
      const second = cache.wrap('k', 60_000, loader);
      resolveLoader!(7);

      await expect(first).resolves.toBe(7);
      await expect(second).resolves.toBe(7);
      expect(calls).toBe(1);
    });

    it('does not cache a rejected loader and retries on next call', async () => {
      let calls = 0;
      const loader = async () => {
        calls++;
        if (calls === 1) {
          throw new Error('db down');
        }
        return 'ok';
      };

      await expect(cache.wrap('k', 60_000, loader)).rejects.toThrow('db down');
      await expect(cache.wrap('k', 60_000, loader)).resolves.toBe('ok');
      expect(calls).toBe(2);
    });

    it('re-load after TTL expiry', async () => {
      let calls = 0;
      const loader = async () => ++calls;

      await cache.wrap('k', 1_000, loader);
      jest.advanceTimersByTime(1_001);
      await cache.wrap('k', 1_000, loader);
      expect(calls).toBe(2);
    });
  });

  describe('delete / invalidatePrefix', () => {
    it('deletes a single key', () => {
      cache.set('a', 1, 60_000);
      cache.delete('a');
      expect(cache.get('a')).toBeUndefined();
    });

    it('removes only keys matching the prefix', () => {
      cache.set('ui:tag:shop1', 1, 60_000);
      cache.set('ui:carousel:shop1', 2, 60_000);
      cache.set('ui:tag:shop2', 3, 60_000);
      cache.set('setting:ui:shop1', 4, 60_000);

      const removed = cache.invalidatePrefix('ui:tag:');

      expect(removed).toBe(2);
      expect(cache.get('ui:tag:shop1')).toBeUndefined();
      expect(cache.get('ui:tag:shop2')).toBeUndefined();
      expect(cache.get('ui:carousel:shop1')).toBe(2);
      expect(cache.get('setting:ui:shop1')).toBe(4);
    });
  });

  describe('eviction', () => {
    it('evicts the oldest entry beyond MAX_ENTRIES', () => {
      const many = 1001;
      for (let i = 0; i < many; i++) {
        cache.set(`k${i}`, i, 60_000);
      }

      // k0 was inserted first and must have been evicted; k1000 present.
      expect(cache.get('k0')).toBeUndefined();
      expect(cache.get('k1000')).toBe(1000);
      expect(cache.size).toBe(1000);
    });
  });

  describe('sweep', () => {
    it('purges expired entries even when their keys are never read', () => {
      cache.set('old', 'x', 1_000);
      jest.advanceTimersByTime(60_000); // sweep interval elapsed
      expect(cache.size).toBe(0);
    });
  });
});
