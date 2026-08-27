import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {Setting} from '../../interfaces/common/setting.interface';
import {ResponsePayload} from "../../interfaces/core/response-payload.interface";

const API_SETTING_INFO = environment.apiBaseLink + '/api/setting/';


@Injectable({
  providedIn: 'root'
})
export class SettingService {

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
    let params = new HttpParams();
    if (select) {
      params = params.append('select', select);
    }
    return this.httpClient.get<{
      data: Setting,
      message: string,
      success: boolean
    }>(API_SETTING_INFO + 'get', {params});
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
