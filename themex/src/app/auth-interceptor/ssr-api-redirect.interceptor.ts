import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { getSsrApiBase } from '../services/core/ssr-api-base';

export const ssrApiRedirectInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    // Running on Node.js server during SSR.
    // AppConfigService (APP_INITIALIZER) probes the candidate API bases once
    // and stores the first one that responds. Rewrite absolute API requests
    // to that base: internal transport when it is reachable, the public
    // api.<domain> host otherwise. Without this, split-domain deployments
    // hang every server-side request on an unreachable internal address.
    const target = getSsrApiBase();
    if (process.env['SSR_DEBUG']) {
      console.log('[ssr-redirect] target:', target, '| url:', req.url);
    }
    if (target && (req.url.startsWith('http://') || req.url.startsWith('https://'))) {
      try {
        const urlObj = new URL(req.url);
        const targetUrlObj = new URL(target);
        if (urlObj.origin !== targetUrlObj.origin) {
          urlObj.protocol = targetUrlObj.protocol;
          urlObj.hostname = targetUrlObj.hostname;
          urlObj.port = targetUrlObj.port;
          const clonedReq = req.clone({ url: urlObj.toString() });
          return next(clonedReq);
        }
      } catch (e) {
        // Fallback if URL parsing fails
      }
    }
  }

  return next(req);
};
