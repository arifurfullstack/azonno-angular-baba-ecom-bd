/**
 * Server-side API base resolution.
 *
 * During SSR the app may run in a container where the internal API address
 * (127.0.0.1:INTERNAL_API_PORT) is unreachable — in that setup every
 * server-side HttpClient call hangs until timeout and the pre-rendered HTML
 * ships without data. AppConfigService probes candidate bases once per
 * server process and stores the first one that responds here, so the
 * ssrApiRedirectInterceptor can synchronously rewrite absolute API URLs to
 * a base that is known to work (internal transport when available, the
 * public api.<domain> host otherwise).
 */
let resolvedSsrApiBase: string | null = null;

export function setSsrApiBase(base: string): void {
  resolvedSsrApiBase = base;
  if (typeof process !== 'undefined' && process.env['SSR_DEBUG']) {
    console.log('[ssr-base] set:', base);
  }
}

export function getSsrApiBase(): string | null {
  if (typeof process !== 'undefined' && process.env['SSR_DEBUG']) {
    console.log('[ssr-base] get:', resolvedSsrApiBase);
  }
  return resolvedSsrApiBase;
}
