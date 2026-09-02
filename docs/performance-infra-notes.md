# Performance — Infrastructure Notes

Code-level optimizations are done (server-side caching, Cache-Control,
request dedupe, idle-gated preloading). The remaining latency lives in
infrastructure. Two levers, biggest impact first.

## 1. Bring the API server and MongoDB Atlas into the same region

**Symptom:** every uncached DB query costs ~200-260ms of server time on
the API host (measured: `product/get-all-data` warm ≈ 510ms total from
BD, of which ~250ms is network and ~260ms is server↔Atlas round trip).
The same query from a laptop 45ms away from Atlas runs in 44ms.

**Fix (pick one):**
- Move the Atlas cluster to the region where the API server
  (2.25.150.87) runs, **or**
- Move/host the API (+ storefront SSR) in the Atlas cluster's region.

Atlas region moves require a migration (live-migrate or dump/restore) —
schedule a maintenance window. Expected result: uncached queries drop
from ~260ms to single-digit ms; SSR render time drops with it.

## 2. Put Cloudflare (free tier is enough) in front of all three hosts

**Symptom:** first connection from Bangladesh pays ~250ms TCP RTT +
~265ms TLS ≈ 750ms before any byte. Static assets (84 JS chunks,
4 TTF fonts ~1.2s each on a cold load) re-download for every
first-time visitor.

**Fix:** proxy `theeroticsocial.com`, `admin.theeroticsocial.com` and
`api.theeroticsocial.com` through Cloudflare.
- TLS terminates at the edge (Dhaka has Cloudflare POPs) → handshake
  ~30-60ms instead of ~500ms.
- Static assets cache at the edge (set a long `Cache-Control` for
  hashed `chunk-*.js` / `main-*.js` / fonts — filenames are
  content-hashed, safe to cache 1 year).
- Keep API responses on short TTLs (already set: 30-60s).

## Already done (for reference)

| Item | Where |
|---|---|
| TtlCache 60s on storefront reads (product/tag/carousel/blog/category/seo-page/shop-info/popup/chat-link) | `apix/src/shared/ttl-cache/` |
| `Cache-Control` on public GETs | 10 controllers |
| categoryProducts recount → hourly cron | `category.service.ts` |
| Compound indexes for storefront queries | schema files |
| Duplicate shop-information call dedupe | `themex/.../shop-information.service.ts` |
| i18n cache-buster removed | `themex/.../language.service.ts` |
| Route preloading deferred to after load+idle | `themex/.../custom-preloading.strategy.ts` |
| Broken `api.playgroundx.live` image URLs removed from DB | products/categories/carousels (2026-09-02) |

## Deferred ideas (if more is ever needed)

- Font delivery: self-hosted TTFs → woff2 + `font-display: swap`
  (4 × ~250-350ms → 4 × ~30ms).
- Bundle diet: home page currently pulls ~80 chunks / ~1.7MB through
  preloading; trimming rarely-used routes from `preloadAfter` would cut
  background bandwidth further.
- `page=0` guard in paginated endpoints (`skip` goes negative → Mongo
  500) — pre-existing quirk, harmless to current clients.
