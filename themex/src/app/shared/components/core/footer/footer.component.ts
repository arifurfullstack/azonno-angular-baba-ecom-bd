import {Component, inject, Input, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {BottomNavbarComponent} from './bottom-navbar/bottom-navbar.component';
import {SocialChatComponent} from "./social-chat/social-chat.component";
import {isPlatformBrowser} from "@angular/common";
import {ShopInformationService} from "../../../../services/common/shop-information.service";
import {ShopInformation} from "../../../../interfaces/common/shop-information.interface";
import {Subscription} from "rxjs";
import {SettingService} from "../../../../services/common/setting.service";
import {ThemeViewSetting} from "../../../../interfaces/common/setting.interface";
import {AppConfigService} from "../../../../services/core/app-config.service";
import {FooterXl1Component} from "./footer-xl/footer-xl-1/footer-xl-1.component";
import {FooterXl2Component} from "./footer-xl/footer-xl-2/footer-xl-2.component";
import {FooterXl3Component} from "./footer-xl/footer-xl-3/footer-xl-3.component";
import {FooterXl4Component} from "./footer-xl/footer-xl-4/footer-xl-4.component";
import {BottomNavbar2Component} from "./bottom-navbar-2/bottom-navbar-2.component";
import {BottomNavbar3Component} from "./bottom-navbar-3/bottom-navbar-3.component";
import {TagService} from "../../../../services/common/tag.service";

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    BottomNavbarComponent,
    SocialChatComponent,
    FooterXl1Component,
    FooterXl2Component,
    FooterXl3Component,
    FooterXl4Component,
    BottomNavbar2Component,
    BottomNavbar3Component,
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit, OnDestroy {
  // Decorator
@Input() currentUrl: string;
@Input() showFooter: boolean;

  // Theme Views
  bottomNavViews: string;
  footerViews: string;

  // Store Data
  shopInfo: ShopInformation;
  chatLink: any;
  tags: any[] = [];

  // Subscriptions
private subscriptions: Subscription[] = [];

  // Inject
private readonly settingService = inject(SettingService);
private readonly shopInfoService = inject(ShopInformationService);
private readonly platformId = inject(PLATFORM_ID);
private readonly appConfigService = inject(AppConfigService);
private readonly tagService = inject(TagService);

  ngOnInit() {
    // Base Data
    if (isPlatformBrowser(this.platformId)) {
      this.getShopInfo(); // Fetch shopInfo from API (see header-1 for reference)
      this.getChatLink();
    }
    // Theme Base
    this.getSettingData();
    this.getTags(); // Fetch all tags for bottom nav (dynamic menu)
  }

  /**
   * HTTP REQUEST
   * getShopInfo()
   * getPaymentMethod()
   */

  // Reference: header-1.component.ts for similar shopInfo fetching and passing
private getShopInfo() {
    setTimeout(() => {
      const subscription = this.shopInfoService.getShopInformation().subscribe({
        next: (res) => {
          this.shopInfo = res.data;
          console.log('shopInfo', this.shopInfo);
        },
        error: (err) => {
          console.error(err);
        },
      });
      this.subscriptions?.push(subscription);
    }, 500); // 0.5 seconds delay
  }

private getChatLink() {
    const subscription = this.settingService.getChatLink().subscribe({
      next: (res) => {
        this.chatLink = res.data;
      },
      error: (error) => {
        console.log(error);
      },
    });
    this.subscriptions?.push(subscription);
  }

private getSettingData() {
    const themeViewSettings: ThemeViewSetting[] =
      this.appConfigService.getSettingData('themeViewSettings');
    this.bottomNavViews = themeViewSettings
      .find((f) => f.type == 'bottomNavViews')
      ?.value?.join();
    this.footerViews =
      themeViewSettings.find((f) => f.type === 'footerViews')?.value?.join() ||
      '';
  }

  /**
   * Fetch all tags for dynamic bottom nav menu
   * Reference: app-home and tag-products for tag fetching
   */
private getTags() {
    const subscription = this.tagService.getAllTags().subscribe({
      next: (res) => {
        this.tags = res.data;
      },
      error: (err) => {
        console.error(err);
      },
    });
    this.subscriptions?.push(subscription);
  }

  get isVisible() {
    if (this.currentUrl === '/offer') {
      return false;
    } else if (this.currentUrl.includes('/landing-page/')) {
      return false;
    } else if (this.currentUrl.includes('/offer/')) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * NG DESTROY
   */
  ngOnDestroy(): void {
    this.subscriptions?.forEach((subscription) => subscription?.unsubscribe());
  }
}
