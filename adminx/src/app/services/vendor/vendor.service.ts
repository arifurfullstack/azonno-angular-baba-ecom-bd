import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of, Subject, tap } from 'rxjs';
import { catchError } from "rxjs/operators";
import { environment } from '../../../environments/environment';
import { DATABASE_KEY } from '../../core/utils/global-variable';
import { UserAuthResponse } from '../../interfaces/common/user.interface';
import { AdminMenu } from "../../interfaces/core/admin-menu.interface";
import { ShopSelectDialogComponent } from '../../shared/dialog-view/shop-select-dialog/shop-select-dialog.component';
import { StorageService } from '../core/storage.service';
import { UiService } from '../core/ui.service';
import { UtilsService } from '../core/utils.service';

const API_URL = environment.apiBaseLink + '/api/vendor/';

@Injectable({
  providedIn: 'root'
})
export class VendorService {
  private lastSessionCheckTime: number | null = null;
  private sessionValid: boolean = false;


  private token: string;
  private _isUser = false;
  private userId: string = null;
  private role: string = null;
  private shopId: string = null;
  private themeId: string = null;
  userStatusListener = new Subject<boolean>();
  // Hold The Count Time
  private tokenTimer: any;

  // Inject
  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storageService = inject(StorageService);
  private readonly uiService = inject(UiService);
  private readonly utilsService = inject(UtilsService);
  private readonly dialog = inject(MatDialog);


  /**
   * MAIN METHODS
   * adminLoginAsVendor()
   * userLogin()
   * onSuccessAuthToken()
   * onFailedAuthToken()
   */
  async loginWithToken(token: string,secret:any): Promise<boolean> {
    try {
      console.log('token')
      const res = await firstValueFrom(
        // this.httpClient.post<UserAuthResponse>(API_URL + 'authenticate', { token })
      this.httpClient.post<UserAuthResponse>(
        `${API_URL}authenticate?secret=${secret}`,
        { token }
      )
      );

      if (res.success) {
        if (res?.shops?.length) {
          this.shopId = res?.shops[0]?._id;
          this.themeId = res?.shops[0]?.theme?._id;
          this.saveCurrentShopData(res?.shops[0]?._id);
          this.saveCurrentThemeData(res?.shops[0]?.theme?._id)
          this.onSuccessAuthToken2(res)
          return true;
          // this.onSuccessAuthToken(res, navigateTo, navigateFrom);
        } else {
          return false;
        }
      }
      return false;
    } catch (err) {
      console.error('Token login failed', err);
      return false;
    }
  }

  private onSuccessAuthToken2(res: UserAuthResponse) {
    this.token = res.token;
    // When Role & Permissions
    if (res.data) {
      this.userId = res.data._id;
      this.role = res.data.role;
    }

    // When Token
    if (res.token) {
      this._isUser = true;
      this.userStatusListener.next(true);
      // For Token Expired Time..
      const expiredInDays = Number(res.tokenExpiredInDays.replace('d', ''));
      this.setSessionTimer(expiredInDays * 86400000);
      const now = new Date();
      const expirationDate = this.utilsService.getNextDateString(new Date(now.getTime() - 3600 * 1000), expiredInDays);

      // Store to Local
      this.saveUserData(res.token, expirationDate, this.userId,this.role);

      // Snack bar
      this.uiService.message(res.message, 'success')
    }
  }


  userLogin(
    data: { username: string; password: string },
    navigateTo?: string,
    navigateFrom?: string
  ) {
    return new Promise((resolve, reject) => {
      this.httpClient
        .post<UserAuthResponse>(API_URL + `login`, data)
        .subscribe({
          next: res => {
            console.log('res', res)
            if (res.success) {

              // if (res.shops.length) {
              //   this.openDetailsDialog(res, navigateTo, navigateFrom);
              // }

              if (res.shops.length > 1) {
                this.openDetailsDialog(res, navigateTo, navigateFrom);
              } else if (res.shops.length === 1) {
                this.shopId = res?.shops[0]?._id;
                this.themeId = res?.shops[0]?.theme?._id;
                this.saveCurrentShopData(res?.shops[0]?._id)
                this.saveCurrentThemeData(res?.shops[0]?.theme?._id)
                this.onSuccessAuthToken(res, navigateTo, navigateFrom);
              } else {
                this.uiService.message('Sorry! you have no shop here', 'wrong');
              }


              // this.onSuccessAuthToken(res, navigateTo, navigateFrom);
              resolve(res);
            } else {
              this.onFailedAuthToken(res, true);
              reject(res);
            }
          },
          error: error => {
            this.onFailedAuthToken(null, true);
            reject(error);
          }
        })

    });
  }

  private onSuccessAuthToken(res: UserAuthResponse, navigateTo: string, navigateFrom?: string) {
    this.token = res.token;
    // When Role & Permissions
    if (res.data) {
      this.userId = res.data._id;
      this.role = res.data.role;
    }

    // When Token
    if (res.token) {
      this._isUser = true;
      this.userStatusListener.next(true);
      // For Token Expired Time..
      const expiredInDays = Number(res.tokenExpiredInDays.replace('d', ''));
      this.setSessionTimer(expiredInDays * 86400000);
      const now = new Date();
      const expirationDate = this.utilsService.getNextDateString(new Date(now.getTime() - 3600 * 1000), expiredInDays);

      // Store to Local
      this.saveUserData(res.token, expirationDate, this.userId,this.role);

      // Snack bar
      this.uiService.message(res.message, 'success')

      // Navigate
      if (navigateTo) {
        if (navigateFrom) {
          this.router.navigate([navigateFrom]).then();
        } else {
          this.router.navigate([navigateTo]).then();
        }
      } else {
        this.router.navigate([environment.userBaseUrl]).then();
      }
    }
  }

  private onFailedAuthToken(res?: UserAuthResponse, showSnackbar?: boolean) {
    if (showSnackbar) {
      this.uiService.message(res?.message || 'An error occurred. Please try again.', 'wrong')
    }
    this.userStatusListener.next(false);
  }


  /**
   * USER AFTER LOGGED IN METHODS
   * autoUserLoggedIn()
   * userLogOut()
   */
  autoUserLoggedIn() {
    const authInformation = this.getUserData();
    if (!authInformation) {
      this.storageService.removeDataFromEncryptLocal(
        DATABASE_KEY.encryptUserLogin
      );
      return;
    }
    const now = new Date();
    const expDate = new Date(authInformation.expiredDate);
    const expiresIn = expDate.getTime() - now.getTime();
    if (expiresIn > 0) {
      this.token = authInformation.token;
      this.userStatusListener.next(true);
      this._isUser = true;
      this.userId = authInformation.userId;
      this.role = authInformation.role;
      this.setSessionTimer(expiresIn);
    }
    this.shopId = this.getCurrentShop()?.shop;
    this.themeId = this.getCurrentTheme()?.theme;

    // console.log(" this.themeId--",this.getCurrentTheme())
  }

  userLogOut(needNavigate: boolean) {
    this.token = null;
    this._isUser = false;
    this.userStatusListener.next(false);
    // Clear Token from Storage
    this.clearUserData();
    // Clear The Token Time
    clearTimeout(this.tokenTimer);
    // Navigate
    if (needNavigate) {
      this.router.navigate([environment.userLoginUrl]).then();
    }
  }

  /**
   * GET LOGGED IN BASE DATA
   * isUser()
   * getUserToken()
   * getUserId()
   * getShopId()
   * getUserStatusListener()
   */

  get isUser(): boolean {
    return this._isUser;
  }

  getUserToken() {
    return this.token;
  }

  getUserId() {
    return this.userId;
  }

  getShopId() {
    return this.shopId;
  }

  getThemeId() {
    return this.themeId;
  }
  getUserRole() {
    return this.role;
  }

  getUserStatusListener() {
    return this.userStatusListener.asObservable();
  }

  /**
   * Save & GET User Info Encrypt to Local
   * saveUserData()
   * saveCurrentShopData()
   * clearUserData()
   * getUserData()
   * getCurrentShop()
   * setSessionTimer()
   */
  protected saveUserData(token: string, expiredDate: Date, userId: string,role:string) {
    const data = {
      token,
      expiredDate,
      userId,
      role,
    };
    this.storageService.addDataToEncryptLocal(
      data,
      DATABASE_KEY.encryptUserLogin
    );
  }

  private saveCurrentShopData(shop: string) {
    this.storageService.addDataToEncryptLocal(
      {shop},
      DATABASE_KEY.encryptShop
    );
  }

  private saveCurrentThemeData(theme: string) {
    this.storageService.addDataToEncryptLocal(
      {theme},
      DATABASE_KEY.encryptTheme
    );
  }

  clearUserData() {
    this.storageService.removeDataFromEncryptLocal(
      DATABASE_KEY.encryptUserLogin
    );
    this.storageService.removeDataFromEncryptLocal(
      DATABASE_KEY.encryptShop
    );
    localStorage.removeItem('vendor_token')
    // Also clear sessionStorage here for extra safety
    sessionStorage.clear();
  }

  protected getUserData() {
    return this.storageService.getDataFromEncryptLocal(
      DATABASE_KEY.encryptUserLogin
    );
  }

  protected getCurrentShop() {
    return this.storageService.getDataFromEncryptLocal(
      DATABASE_KEY.encryptShop
    );
  }

  protected getCurrentTheme() {
    return this.storageService.getDataFromEncryptLocal(
      DATABASE_KEY.encryptTheme
    );
  }

  private setSessionTimer(durationInMs: number) {
    this.tokenTimer = setTimeout(() => {
      this.userLogOut(true);
    }, durationInMs); // 1s = 1000ms
  }

  /**
   * DIALOG VIEW
   * openDetailsDialog()
   */

  openDetailsDialog(res: any, navigateTo: string, navigateFrom: string): void {
    const dialogRef = this.dialog.open(ShopSelectDialogComponent, {
      data: {data: res.shops, nestedFieldName: 'name'},
      maxWidth: '800px',
      height: 'auto',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult && dialogResult._id) {
        this.shopId = dialogResult._id;
        this.saveCurrentShopData(dialogResult._id)
        this.onSuccessAuthToken(res, navigateTo, navigateFrom);
      }
    });
  }
  get userMenu(): AdminMenu[] {
    return this.storageService.getDataFromEncryptLocal(DATABASE_KEY.encryptVendorMenu)
  }

  // checkMySession() {
  //   const deviceId = this.storageService.getDeviceId();
  //   return this.httpClient.post<{ valid: boolean }>(API_URL+'vendor-session-check', { deviceId });
  // }

  logout() {
    this.userLogOut(true)
  }

  checkMySession(): Observable<{ valid: boolean }> {
    const now = Date.now();
    const deviceId = this.storageService.getDeviceId();

    // ✅ যদি সর্বশেষ চেক 60 সেকেন্ডের মধ্যে হয়ে থাকে
    if (this.lastSessionCheckTime && now - this.lastSessionCheckTime < 10000) {
      return of({ valid: this.sessionValid });
    }

    // ✅ নতুন করে API call
    return this.httpClient.post<{ valid: boolean }>(
      API_URL+'vendor-session-check',
      { deviceId }
    ).pipe(
      tap((res) => {
        this.lastSessionCheckTime = now;
        this.sessionValid = res.valid;
      }),
      catchError(() => {
        this.sessionValid = false;
        return of({ valid: false });
      })
    );
  }

  /**
   * Refresh user role from API when localStorage decryption fails.
   * Called by PagesComponent when getUserRole() returns null.
   */
  async refreshUserRole(): Promise<string | null> {
    try {
      const res = await firstValueFrom(
        this.httpClient.get<{ data: { role: string } }>(API_URL + 'check-user-and-get-profile').pipe(
          catchError(() => of(null))
        )
      );
      if (res?.data?.role) {
        this.role = res.data.role;
        return res.data.role;
      }
    } catch (e) {
      console.error('[VendorService] refreshUserRole failed', e);
    }
    // Last resort fallback
    return 'owner';
  }

}
