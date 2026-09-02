import {HttpInterceptorFn} from '@angular/common/http';

import {environment} from '../../environments/environment';
import {UserService} from '../services/common/user.service';
import {inject} from '@angular/core';
import {AppConfigService} from '../services/core/app-config.service';

export const authUserInterceptor: HttpInterceptorFn = (req, next) => {

  const userService = inject(UserService);
  const appConfigService = inject(AppConfigService);
  const authToken = userService.getUserToken();
  const shopId = appConfigService.getSettingData('shop');

  // Parse the current query parameters
  let queryParams = req.params;

  if (
    shopId &&
    typeof shopId === 'string' &&
    shopId.trim() !== '' &&
    shopId !== 'undefined' &&
    shopId !== 'null' &&
    !queryParams.has('shop') &&
    // get-setting-by-domain resolves the shop from the domain itself.
    // Appending the shop id makes the warm-visit background check use a
    // different URL than the cold-boot call (shop unknown yet), so the
    // browser can never reuse its 60s cache — skip it for this endpoint.
    !req.url.includes('/get-setting-by-domain')
  ) {
    queryParams = queryParams.append('shop', shopId.trim());
  }

  // Clone the request with the updated query parameters
  const authRequest = req.clone({
    params: queryParams,
    setHeaders: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
  });

  return next(authRequest);
};
