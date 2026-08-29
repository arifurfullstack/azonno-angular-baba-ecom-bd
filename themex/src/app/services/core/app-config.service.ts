import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, firstValueFrom, timeout } from 'rxjs';
import { SettingService } from '../common/setting.service';
import { setSsrApiBase } from './ssr-api-base';
import { GtmService } from './gtm.service';
import { PixelService } from './pixel.service';
import { ScriptLoaderService } from './script-loader.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private config: any;
  private readonly CONFIG_KEY = 'themeConfig'; // LocalStorage key
  private _currency: any;

  private configSubject = new BehaviorSubject<any>(null);
  config$ = this.configSubject.asObservable(); // Expose as Observable

  constructor(
    private http: HttpClient,
    private pixel: PixelService,
    private gtmService: GtmService,
    private scriptLoaderService: ScriptLoaderService,
    private settingService: SettingService,
    @Inject(PLATFORM_ID) private platformId: any,
    @Optional() @Inject('REQUEST_DOMAIN') private requestDomain?: string
  ) { }

  get currency(): any {
    return this._currency;
  }

  set currency(currency: any) {
    this._currency = currency;
  }

  /**
   * loadConfig()
   * checkForUpdates()
   * getSettingData()
   */
  async loadConfig(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      // ✅ Check if it's running in a browser
      const storedConfig = localStorage.getItem(this.CONFIG_KEY);
      if (storedConfig) {
        try {
          const parsed = JSON.parse(storedConfig);
          if (parsed && parsed.shop && typeof parsed.shop === 'string' && parsed.shop.trim() !== '' && parsed.shop !== 'undefined') {
            this.config = parsed;
            this.configSubject.next(this.config);
            // Run background update check to avoid blocking instant application boot
            this.checkForUpdates().catch((err) =>
              console.warn('Background config update check failed:', err)
            );
            return;
          }
        } catch (e) {
          localStorage.removeItem(this.CONFIG_KEY);
        }
      }
    }

    // Await fresh config before application components start initialization
    await this.checkForUpdates();
  }

  private async checkForUpdates(): Promise<void> {
    try {
      let newConfig: any;
      if (isPlatformBrowser(this.platformId)) {
        const cleanHost = window.location.hostname.replace('www.', '').split(':')[0];
        const apiBase = environment.apiBaseLink;
        try {
          const apiResponse = await firstValueFrom(
            this.http.get<any>(`${apiBase}/api/shop/get-setting-by-domain?domain=${cleanHost}`)
          );
          if (apiResponse && apiResponse.success && apiResponse.data) {
            newConfig = apiResponse.data;
          } else {
            throw new Error('API returned success: false');
          }
        } catch (apiErr: any) {
          console.warn('Failed to load settings directly from API, trying local route:', apiErr.message);
          const url = `/shop-settings.json?v=${new Date().getTime()}`;
          newConfig = await firstValueFrom(this.http.get(url));
        }
      } else {
        // SSR: probe candidate API bases with a short timeout. When the
        // internal API is unreachable (split-domain deployments), a naive
        // single attempt hangs for seconds and the render ships empty.
        const domain = this.requestDomain || 'theeroticsocial.com';
        const internalPort = process.env['INTERNAL_API_PORT'] || process.env['PORT_API'] || '3000';
        const envBase = process.env['INTERNAL_API_URL'] || process.env['API_BASE_LINK'];
        // [base, timeoutMs] — internal transport should answer instantly;
        // the public api.<domain> hop may need a few seconds (TLS + DNS).
        const candidates: Array<{ base: string; timeoutMs: number }> = envBase
          ? [{ base: envBase, timeoutMs: 4000 }]
          : [
              { base: `http://127.0.0.1:${internalPort}`, timeoutMs: 1500 },
              { base: `https://api.${domain}`, timeoutMs: 4000 },
            ];

        let resolved = false;
        for (const candidate of candidates) {
          try {
            const apiResponse = await firstValueFrom(
              this.http
                .get<{ success: boolean; data: any }>(
                  `${candidate.base}/api/shop/get-setting-by-domain?domain=${domain}`
                )
                .pipe(timeout(candidate.timeoutMs))
            );
            if (apiResponse && apiResponse.success && apiResponse.data) {
              newConfig = apiResponse.data;
              setSsrApiBase(candidate.base);
              resolved = true;
              break;
            }
          } catch (err: any) {
            console.warn(`SSR: API base ${candidate.base} failed:`, err.message);
          }
        }

        if (!resolved) {
          console.warn('SSR: all API bases failed, trying local settings file');
          const port = process.env['PORT'] || '4220';
          const url = `http://localhost:${port}/shop-settings.json?v=${new Date().getTime()}`;
          newConfig = await firstValueFrom(this.http.get(url));
          // Point component-level API calls at the public API rather than an
          // internal address that just failed — routing them back into this
          // gateway's own proxy would loop with a localhost Host header.
          setSsrApiBase(`https://api.${domain}`);
        }
      }

      if (
        !this.config ||
        JSON.stringify(this.config) !== JSON.stringify(newConfig)
      ) {
        // console.log("🔄 New data found! Updating LocalStorage...");
        this.config = newConfig;
        this.configSubject.next(newConfig); // 🔥 Emit new config data

        if (isPlatformBrowser(this.platformId)) {
          // ✅ Only update LocalStorage if in browser
          localStorage.setItem(this.CONFIG_KEY, JSON.stringify(newConfig));
          // location.reload(); // নতুন থিম লোড হবে
        }
      } else {
      }

      // Merge remote settings (adds `blog` etc.) in the background — the base
      // config from get-setting-by-domain already carries every field needed
      // to boot the app, so blocking first paint (and SSR render) on this
      // second round trip only added ~1s to every cold load.
      const shopId = (this.config as any)?.shop;
      if (shopId) {
        this.mergeRemoteSettings(shopId).catch((e) =>
          console.warn('Failed to merge remote settings', e)
        );
      }

      // Setup Pixel & Tag Manager
      const analytics = this.getSettingData('analytics');
      const currency = this.getSettingData('currency');

      if (analytics?.facebookPixelId) {
        this.gtmService.facebookPixelId = analytics?.facebookPixelId;
        this.pixel.init(analytics?.facebookPixelId);
      }

      if (analytics?.tagManagerId) {
        this.gtmService.tagManagerId = analytics?.tagManagerId;
        this.scriptLoaderService.loadGtmScript(analytics?.tagManagerId);
        this.scriptLoaderService.loadGtmNoScript(analytics?.tagManagerId);
      }

      if (analytics?.tagManagerId && analytics?.IsManageFbPixelByTagManager) {
        this.gtmService.isManageFbPixelByTagManager =
          analytics?.IsManageFbPixelByTagManager;
      }

      // Currency
      if (currency) {
        this.currency = this.currency;
      }
    } catch (error) {
      console.error('⚠️ Error fetching config:', error);
    }
  }

  /**
   * Background merge of extended settings (blog, productSetting, theme
   * customization). Never awaited by the boot path — see checkForUpdates().
   */
  private async mergeRemoteSettings(shopId: string): Promise<void> {
    const remote = await firstValueFrom(
      this.settingService.getSetting(
        'blog productSetting themeColors themeViewSettings searchHints orderLanguage pageViewSettings',
        shopId
      )
    );
    if (!remote?.success || !remote?.data) {
      return;
    }
    const remoteData = remote.data as any;

    // Merge remote data into existing config
    this.config = {
      ...(this.config || {}),
      productSetting: {
        ...((this.config as any)?.productSetting || {}),
        ...(remoteData.productSetting || {}),
      },
      blog: remoteData.blog ?? (this.config as any)?.blog,
      themeColors: remoteData.themeColors ?? (this.config as any)?.themeColors,
      themeViewSettings: remoteData.themeViewSettings ?? (this.config as any)?.themeViewSettings,
      pageViewSettings: remoteData.pageViewSettings ?? (this.config as any)?.pageViewSettings,
      searchHints: remoteData.searchHints ?? (this.config as any)?.searchHints,
      orderLanguage: remoteData.orderLanguage ?? (this.config as any)?.orderLanguage,
    };

    this.configSubject.next(this.config);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
    }
  }

  getSettingData(field: string): any {
    const data = field ? this.config?.[field] : this.config;
    if (data !== undefined && data !== null) {
      return data;
    }

    // Fallback/Default mock data to prevent runtime crashes if config fails to load
    switch (field) {
      case 'themeViewSettings':
        return [
          { type: 'headerViews', value: ['Header 1'] },
          { type: 'brandViews', value: ['None'] },
          { type: 'productViews', value: ['Tag'] },
          { type: 'productCardViews', value: ['Product Card 1'] },
          { type: 'bottomNavViews', value: ['Bottom Nav 1'] },
          { type: 'footerViews', value: ['Footer 1'] },
          { type: 'categoryViews', value: ['Category 1'] }
        ];
      case 'pageViewSettings':
        return [];
      case 'searchHints':
        return 'laptop, mobile';
      case 'themeColors':
        return {
          primary: '#00a0db',
          secondary: '#333333',
          tertiary: '#f5f5f5'
        };
      case 'productSetting':
      case 'analytics':
      case 'currency':
        return {};
      case 'orderLanguage':
        return 'en';
      default:
        return undefined;
    }
  }
}
