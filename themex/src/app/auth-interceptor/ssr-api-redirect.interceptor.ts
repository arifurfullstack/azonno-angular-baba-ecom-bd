import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const ssrApiRedirectInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    // Running on Node.js server during SSR.
    // Rewrite external API requests to local backend (http://localhost:3000) for fast local transport,
    // while preserving the original public URL in TransferState for browser hydration match.
    const localTarget = process.env['INTERNAL_API_URL'] || process.env['API_BASE_LINK'] || 'http://localhost:3000';
    
    if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
      try {
        const urlObj = new URL(req.url);
        // Rewrite only if targeting api subdomain or external host
        const targetUrlObj = new URL(localTarget);
        urlObj.protocol = targetUrlObj.protocol;
        urlObj.hostname = targetUrlObj.hostname;
        urlObj.port = targetUrlObj.port;

        const clonedReq = req.clone({ url: urlObj.toString() });
        return next(clonedReq);
      } catch (e) {
        // Fallback if URL parsing fails
      }
    }
  }

  return next(req);
};
