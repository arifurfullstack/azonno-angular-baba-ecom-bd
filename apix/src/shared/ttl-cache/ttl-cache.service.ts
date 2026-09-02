import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry {
  value: any;
  expiresAt: number;
}

/**
 * Process-wide in-memory TTL cache for read-heavy, shop-scoped data
 * (settings, storefront catalog lists, filter groups).
 *
 * Follows the house pattern of upload.service's driverCache, generalized:
 * Map + expiresAt + explicit invalidation.
 *
 * Rules for callers:
 *  - Cache keys MUST include the shop id (multi-tenant safety), e.g.
 *    `setting:ui:${shopId}`, `fg:${shopId}`, `ui:tag:${shopId}`.
 *  - Cached values are shared by reference — never mutate a value you
 *    received from get()/wrap(). Loaders must build fresh objects.
 *  - Choose TTLs per data volatility: 30-60s for storefront reads,
 *    longer only for near-static flags.
 */
@Injectable()
export class TtlCacheService {
  private readonly logger = new Logger(TtlCacheService.name);
  private readonly store = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<any>>();
  private readonly sweepTimer: NodeJS.Timeout;

  /** Hard cap so a hostile/varied key space cannot grow memory unbounded. */
  private static readonly MAX_ENTRIES = 1000;
  private static readonly SWEEP_INTERVAL_MS = 60_000;

  constructor() {
    // Periodic sweep so expired entries never hold memory even if their
    // keys are never read again. unref(): must not keep the process alive
    // (unified server fork / jest teardown).
    this.sweepTimer = setInterval(() => this.sweep(), TtlCacheService.SWEEP_INTERVAL_MS);
    this.sweepTimer.unref();
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= TtlCacheService.MAX_ENTRIES && !this.store.has(key)) {
      // Map preserves insertion order — evict the oldest entry (FIFO).
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  /** Remove every key starting with the prefix. Returns the number removed. */
  invalidatePrefix(prefix: string): number {
    let removed = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Cache-aside helper with single-flight: concurrent calls for the same
   * key share one loader invocation, so a burst of requests after expiry
   * (e.g. the storefront's parallel boot requests) hits the database once.
   *
   * A rejected loader is never cached — the error propagates to every
   * caller and the next wrap() retries.
   */
  async wrap<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const pending = this.inFlight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const load = loader()
      .then((value) => {
        this.set(key, value, ttlMs);
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, load);
    return load;
  }

  /** Test/maintenance hook. */
  clear(): void {
    this.store.clear();
    this.inFlight.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private sweep(): void {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
        removed++;
      }
    }
    if (removed > 0) {
      this.logger.debug(`Swept ${removed} expired cache entries`);
    }
  }
}
