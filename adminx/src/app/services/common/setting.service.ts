import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Setting} from '../../interfaces/common/setting.interface';
import {ResponsePayload} from "../../interfaces/core/response-payload.interface";
import { Observable } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';

const API_SETTING_INFO = environment.apiBaseLink + '/api/setting/';


@Injectable({
  providedIn: 'root'
})
export class SettingService {

  private settingCache = new Map<string, Observable<any>>();

  // Single theme-catalog observable shared by every subscriber (memoized).
  private themeCatalog$: Observable<any[]> | null = null;

  constructor(
    private httpClient: HttpClient
  ) {
  }

  addSetting(data: any) {
    return this.httpClient.post<ResponsePayload>
    (API_SETTING_INFO + 'add', data);
  }


  /**
   * getSetting
   */

  getChatLink() {
    return this.httpClient.get<{
      data: any,
      message: string,
      success: boolean
    }>(API_SETTING_INFO + 'get-chat-link');
  }
  getSetting(select?: string) {
    const cacheKey = select || 'all';

    if (this.settingCache.has(cacheKey)) {
      return this.settingCache.get(cacheKey);
    }

    let params = new HttpParams();
    if (select) {
      params = params.append('select', select);
    }
    const req = this.httpClient.get<{
      data: Setting,
      message: string,
      success: boolean
    }>(API_SETTING_INFO + 'get', {params}).pipe(
      shareReplay(1)
    );

    this.settingCache.set(cacheKey, req);

    return req;
  }

  clearSettingCache() {
    this.settingCache.clear();
  }

  /**
   * Theme catalog (single source of truth lives in apix:
   * src/config/theme-catalog.ts — served by GET /api/setting/theme-catalog).
   * Falls back to the bundled assets/theme-catalog.json when the API is
   * unreachable, so the theme-view page still works during deploys.
   * catchError sits INSIDE the pipe so shareReplay can never replay an error.
   */
  getThemeCatalog(): Observable<any[]> {
    if (!this.themeCatalog$) {
      this.themeCatalog$ = this.httpClient.get<ResponsePayload>(API_SETTING_INFO + 'theme-catalog').pipe(
        map(res => (res as any)?.data ?? []),
        catchError(() => this.httpClient.get<any[]>('assets/theme-catalog.json')),
        shareReplay(1),
      );
    }
    return this.themeCatalog$;
  }

  testStorageConnection(provider: string, config: any) {
    return this.httpClient.post<{
      success: boolean;
      message: string;
    }>(environment.apiBaseLink + '/api/upload/test-storage-connection', {
      provider,
      config,
    });
  }
}
