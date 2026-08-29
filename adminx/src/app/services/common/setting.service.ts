import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Setting} from '../../interfaces/common/setting.interface';
import {ResponsePayload} from "../../interfaces/core/response-payload.interface";
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

const API_SETTING_INFO = environment.apiBaseLink + '/api/setting/';


@Injectable({
  providedIn: 'root'
})
export class SettingService {

  private settingCache = new Map<string, Observable<any>>();

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
