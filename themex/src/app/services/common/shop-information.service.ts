import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ShopInformation } from '../../interfaces/common/shop-information.interface';
import { Observable, shareReplay } from 'rxjs';

const API_URL = environment.apiBaseLink + '/api/shop-information/';

type ShopInformationResponse = {
  data: ShopInformation;
  success: boolean;
  fShopDomain: any;
  message: string;
};


@Injectable({
  providedIn: 'root'
})
export class ShopInformationService {

  // A single shared request: every subscriber (header, home, footer…) joins
  // the same in-flight HTTP call. The previous Map cache only filled AFTER
  // the response landed, so components subscribing together on boot each
  // fired their own request (2-3 duplicate calls per page load).
  private request$?: Observable<ShopInformationResponse>;

  // Inject
  private readonly httpClient = inject(HttpClient);

  /**
   * getShopInformation()
   */

  getShopInformation(): Observable<ShopInformationResponse> {
    if (!this.request$) {
      let params = new HttpParams();
      params = params.append('select', 'websiteName isShow poweredby shortDescription addresses emails phones socialLinks fabIcon logoPrimary whatsappNumber brandingText showBranding');

      this.request$ = this.httpClient
        .get<ShopInformationResponse>(API_URL + 'get', { params })
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }
    return this.request$;
  }


}
