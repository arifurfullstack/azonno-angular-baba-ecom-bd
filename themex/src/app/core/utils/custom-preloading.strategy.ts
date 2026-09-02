import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { PreloadingStrategy, Route, Router } from '@angular/router';
import { from, Observable, of, switchMap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

/**
 * Preloads a route only when BOTH conditions hold:
 *  1. the route opted in via `data.preloadAfter` and the visitor is on one of
 *     those paths (unchanged behaviour), and
 *  2. the browser has finished the initial load and gone idle.
 *
 * Without the idle gate the router started pulling every preloadable route's
 * chunk tree right after the first navigation — ~80 chunks / 1.7MB competing
 * with the page's own JS, fonts and product images for bandwidth, which
 * pushed first-screen images to ~14s on high-RTT links.
 */
@Injectable({
  providedIn: 'root'
})
export class CustomPreloadingStrategy implements PreloadingStrategy {
  private currentPath: string;
  private idleGate: Promise<boolean> | null = null;
  private readonly platformId = inject(PLATFORM_ID);

  constructor(private router: Router) {
    // Subscribe to router events to get the current URL path
    this.router.events.subscribe(() => {
      this.currentPath = this.router.url;
    });
  }

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Check if the route has the 'preloadAfter' data property
    const preloadAfter = route.data?.['preloadAfter'];
    const wanted =
      Array.isArray(preloadAfter)
        ? preloadAfter.includes(this.currentPath)
        : preloadAfter === this.currentPath;

    // If the condition isn't met, do not preload the route
    if (!wanted) {
      return of(null);
    }

    return from(this.resolveIdleGate()).pipe(
      switchMap((shouldPreload) => (shouldPreload ? load() : of(null)))
    );
  }

  /**
   * Resolves true once preloading may start. Created lazily on the first
   * eligible preload() call (= right after the initial navigation).
   */
  private resolveIdleGate(): Promise<boolean> {
    if (this.idleGate) {
      return this.idleGate;
    }

    // Server rendering: never preload — the server render must not spend
    // time importing route module trees the visitor may never open.
    if (!isPlatformBrowser(this.platformId)) {
      this.idleGate = Promise.resolve(false);
      return this.idleGate;
    }

    // Respect data-saver / expensive connections.
    const connection = (navigator as any)?.connection;
    if (connection?.saveData) {
      this.idleGate = Promise.resolve(false);
      return this.idleGate;
    }

    this.idleGate = new Promise<boolean>((resolve) => {
      const waitForIdle = () => {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => resolve(true), {
            timeout: 4000,
          });
        } else {
          setTimeout(() => resolve(true), 3000);
        }
      };

      if (document.readyState === 'complete') {
        waitForIdle();
      } else {
        window.addEventListener('load', waitForIdle, { once: true });
      }
    });
    return this.idleGate;
  }
}
