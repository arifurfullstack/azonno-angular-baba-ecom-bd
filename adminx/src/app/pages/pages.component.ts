import { isPlatformBrowser } from "@angular/common";
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnChanges, OnDestroy, OnInit,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ChildrenOutletContexts } from '@angular/router';
import { Subscription } from "rxjs";
import { slideInAnimation } from '../animations';
import { ADMIN_MENU, EDITOR_MENU, MANAGER_MENU, SUPER_ADMIN_MENU } from '../core/db/menu-data';
import { DATABASE_KEY } from "../core/utils/global-variable";
import { ShopInformation } from "../interfaces/common/shop-information.interface";
import { AdminMenu } from '../interfaces/core/admin-menu.interface';
import { AdminService } from '../services/common/admin.service';
import { SettingService } from "../services/common/setting.service";
import { ShopInformationService } from "../services/common/shop-information.service";
import { ReloadService } from "../services/core/reload.service";
import { ShopPackageService } from "../services/core/shop-package.service";
import { StorageService } from "../services/core/storage.service";
import { VendorService } from "../services/vendor/vendor.service";

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrl: './pages.component.scss',
  animations: [
    slideInAnimation
  ]
})
export class PagesComponent implements OnInit , OnDestroy , OnChanges {

  // Store Data
  allMenus: AdminMenu[] = [];
  shopInfo: ShopInformation;
  currency: any;
  allShopID= ['67de7097554f668b2dc66444'];
  incompleteOrder: any;
  affiliateSetting: any;
  blogSetting: any;
  websiteInfo: any;
  selectedValue: string;
  sideNav = true;
  sideRes = false;
  subId = 0;
  step = 0;
  windowWidth: any;
  USER_ROLE: any;
  shopPackageInfo: any;

  @ViewChild('dashboard') dashboard: ElementRef;
  private readonly platformId = inject(PLATFORM_ID);
  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Inject
  private readonly shopPackageService = inject(ShopPackageService);


  constructor(
    private contexts: ChildrenOutletContexts,
    private adminService: AdminService,
    private shopInfoService: ShopInformationService,
    private vendorService: VendorService,
    private settingService: SettingService,
    private storageService: StorageService,
    private reloadService: ReloadService,
  ) {
  }

  ngOnInit(): void {

    this.windowWidth = window.innerWidth;
    this.subId = JSON.parse(sessionStorage.getItem('sub-id'));

    const role = this.vendorService.getUserRole();
    this.USER_ROLE = role;
    this.setMenuByRole(role);

    // If role is null (e.g., session decrypt failed), fetch from API once
    if (!role) {
      console.warn('[PagesComponent] Role not found in local session. Fetching from API...');
      this.vendorService.refreshUserRole().then(freshRole => {
        this.USER_ROLE = freshRole;
        this.setMenuByRole(freshRole);
      });
    }

    // Refresh Incomplete Order
    this.reloadService.refreshIncompleteOrder$.subscribe(()=>{
      this.getSetting();
    })

    // Subscribe to shop package info changes
    this.shopPackageService.shopPackageInfo$.subscribe(info => {
      if (info) {
        this.getShopInfo();
      }else {
        this.getShopInfo();
      }
   });

    // this.allMenus = SUPER_ADMIN_MENU;
    this.getSetting();
    this.catalogForMenu();

  }

  ngOnChanges(changes: SimpleChanges): void {
    // Subscribe to shop package info changes
    this.shopPackageService.shopPackageInfo$.subscribe(info => {
      if (info) {
        this.getShopInfo();
      }else {
        this.getShopInfo();
      }
    });
  }

  /**
   * ALL SIDE BAR CONTROL METHOD
   * onMenuToggle()
   * sideNavToggle()
   * sideMenuHide()
   */

  onMenuToggle(event: boolean) {
    this.sideNav = !this.sideNav;
    this.sideRes = !this.sideNav;
  }

  sideNavToggle() {
    this.sideNav = !this.sideNav;
    this.sideRes = !this.sideNav;
  }

  subMenuToggle(num: any, subMenu?: boolean) {
    this.windowWidth = window.innerWidth;
    sessionStorage.setItem('sub-id', num);
    if (this.subId && this.subId === num) {
      this.subId = 0;
      this.dashboard.nativeElement.classList.add('link-active');
    } else {
      this.subId = JSON.parse(sessionStorage.getItem('sub-id'));
      this.dashboard.nativeElement.classList.remove('link-active');
    }
    if (num === 0) {
      this.dashboard.nativeElement.classList.add('link-active');
    }
  }

  @HostListener('window:resize')
  onInnerWidthChange() {
    this.windowWidth = window.innerWidth;
  }

  /**
   * Set the sidebar menu based on the user role.
   * Falls back to SUPER_ADMIN_MENU if role is null/unknown
   * (e.g., when localStorage decryption fails in production).
   */
  setMenuByRole(role: string | null): void {
    switch (role) {
      case 'owner':
        this.allMenus = SUPER_ADMIN_MENU;
        break;
      case 'admin':
        this.allMenus = ADMIN_MENU;
        break;
      case 'manager':
        this.allMenus = MANAGER_MENU;
        break;
      case 'editor':
        this.allMenus = EDITOR_MENU;
        break;
      default:
        // Fallback: show full menu so user is not left with empty sidebar
        this.allMenus = SUPER_ADMIN_MENU;
        break;
    }
  }

  adminLogOut() {
    this.vendorService.userLogOut(true);
  }

  /**
   * HTTP REQUEST CONTROL
   * getShopInfo()
   * getSetting()
   */

  private getShopInfo() {
    const subscription = this.shopInfoService.getShopInformation().subscribe({
      next: res => {
        this.shopInfo = res.data;

        this.websiteInfo = res.fShopDomain;
        this.shopPackageInfo = {
          currentBalance: res.currentBalance ?? 0,
          expireDay: res.expireDay ?? 0,
          isTrailPrice: res.fShopDomain?.isTrailPrice ?? false,
          trialPeriod: res.fShopDomain?.trialPeriod ?? 0,
          shopType: res.shopType ?? 'free',
        };

        this.setFavicon(this.shopInfo?.fabIcon);
      },
      error: err => {
        console.error(err);
      }
    });
    this.subscriptions.push(subscription);
  }


  private getSetting() {
    const subscription = this.settingService.getSetting('currency incompleteOrder affiliate blog')
      .subscribe({
        next: res => {
          if (res.data ) {
            this.currency = res.data.currency;
            this.incompleteOrder = res.data.incompleteOrder;
            this.affiliateSetting = res.data.affiliate;
            this.blogSetting = res.data.blog;
            if (this.currency) {
              // Currency Symbol Save LocalStorage
              this.currencySymbolSaveLocalStorage()
            }
            if (this.incompleteOrder) {
              // Incomplete Order For Menu
              this.incompleteOrderForMenu()
            }
            if (this.affiliateSetting) {
              // Incomplete Order For Menu
              // this.affiliateSettingForMenu()
            }
            if (this.blogSetting) {
              this.blogForMenu();
            }
          }
        },
        error: err => {
          console.log(err)
        }
      });

    this.subscriptions.push(subscription);
  }

  // Save Currency Symbol LocalStorage
  private currencySymbolSaveLocalStorage() {
    const getCurrencyToLocalStorage = this.storageService.getDataFromLocalStorage(DATABASE_KEY.currency);
    if (getCurrencyToLocalStorage?.code !== this.currency.code) {
      this.storageService.storeDataToLocalStorage(this.currency, DATABASE_KEY.currency)
    }
  }


  // Save Incomplete Order
  private incompleteOrderForMenu() {
   // Replace Orders menu if incomplete orders are enabled
    if (this.incompleteOrder?.isEnableIncompleteOrder) {
      const updatedOrdersMenu: any = {
        id: 1,
        name: 'Orders',
        hasSubMenu: true,
        routerLink: null,
        icon: 'reorder',
        subMenus: [
          {
            id: 1,
            name: 'Orders',
            hasSubMenu: false,
            routerLink: 'order/all-order',
            icon: 'arrow_right',
          },
          {
            id: 2,
            name: 'Incomplete Orders',
            hasSubMenu: false,
            routerLink: 'order/all-incomplete-order',
            icon: 'arrow_right',
          }
        ],
      };
      // Replace the menu at index 1 (original Orders)
      this.allMenus[1] = updatedOrdersMenu;
    }
    else {
      const updatedOrdersMenu: any = {
        id: 1,
        name: 'Orders',
        hasSubMenu: false,
        routerLink: 'order/all-order',
        icon: 'reorder',
        subMenus: [],
      }
      // Replace the menu at index 1 (original Orders)
      this.allMenus[1] = updatedOrdersMenu;
    }
  }


  // Save Incomplete Order
  private blogForMenu() {
    // Replace Orders menu if incomplete orders are enabled
    if (this.blogSetting?.isEnableBlog) {
      const updatedOrdersMenu: any = {
        id: 666,
        name: 'Blogs',
        hasSubMenu: true,
        routerLink: null,
        icon: 'reorder',
        subMenus: [
          {
            id: 1,
            name: 'All Blogs',
            hasSubMenu: false,
            routerLink: 'blog/all-blog',
            icon: 'arrow_right',
          },
          {
            id: 2,
            name: 'Blog Comments',
            hasSubMenu: false,
            routerLink: 'blog-comment/all-blog-comments',
            icon: 'arrow_right',
          }
        ],
      };
      // Replace the menu at index 1 (original Orders)
      this.allMenus[12] = updatedOrdersMenu;
    }
  }


  private catalogForMenu() {
    const shopID = this.vendorService.getShopId();
    const isSpecialShop = this.allShopID.includes(shopID);

    // Step 1: base subMenus
    const subMenus: any[] = [
      {
        id: 1,
        name: 'Categories',
        hasSubMenu: true,
        routerLink: 'catalog/all-category',
        icon: 'arrow_right',
      },
      {
        id: 2,
        name: 'Sub Categories',
        hasSubMenu: true,
        routerLink: 'catalog/all-sub-category',
        icon: 'arrow_right',
      },
      {
        id: 3,
        name: 'Child Categories',
        hasSubMenu: true,
        routerLink: 'catalog/all-child-category',
        icon: 'arrow_right',
      },
      {
        id: 4,
        name: 'Brand',
        hasSubMenu: true,
        routerLink: 'catalog/all-brand',
        icon: 'arrow_right',
      },
      {
        id: 6,
        name: 'Tags',
        hasSubMenu: true,
        routerLink: 'catalog/all-tag',
        icon: 'arrow_right',
      },
    ];

    // Step 2: Add conditional menus if shop is special
    if (isSpecialShop) {
      subMenus.push(
        {
          id: 7,
          name: 'Skin Type',
          hasSubMenu: true,
          routerLink: 'catalog/all-skin-type',
          icon: 'arrow_right',
        },
        {
          id: 8,
          name: 'Skin Concern',
          hasSubMenu: true,
          routerLink: 'catalog/all-skin-concern',
          icon: 'arrow_right',
        }
      );
    }

    // Step 3: Prepare updated menu object
    const updatedCatalogMenu: any = {
      id: 5,
      name: 'Catalog',
      hasSubMenu: true,
      routerLink: null,
      icon: 'category',
      subMenus: subMenus,
    };

    // Step 4: Replace the original menu from SUPER_ADMIN_MENU
    const catalogMenuIndex = this.allMenus.findIndex(
      (menu: any) => menu.name === 'Catalog'
    );

    if (catalogMenuIndex !== -1) {
      this.allMenus[catalogMenuIndex] = updatedCatalogMenu;
    }
  }


  // Save Affiliate Setting
  private affiliateSettingForMenu() {
    // Update the Orders menu
    if (this.affiliateSetting?.isAffiliate) {
      // Add Affiliate Menus if not already present
      const hasAffiliateUser = this.allMenus.some(menu => menu.id === 1200);
      const hasAffiliateProduct = this.allMenus.some(menu => menu.id === 1120);

      if (!hasAffiliateUser) {
        this.allMenus.push( {
            id: 1200,
            name: 'Affiliate User',
            hasSubMenu: true,
            routerLink: null,
            icon: 'supervisor_account',
            subMenus: [
              {
                id: 1,
                name: 'All Affiliate',
                hasSubMenu: true,
                routerLink: 'affiliate/all-affiliate',
                icon: 'arrow_right',
              },

              {
                id: 3,
                name: 'Affiliate Payment Request',
                hasSubMenu: true,
                routerLink: 'affiliate/affiliate-payment-request',
                icon: 'arrow_right',
              },
              {
                id: 4,
                name: 'Affiliate Request',
                hasSubMenu: true,
                routerLink: 'affiliate/affiliate-request',
                icon: 'arrow_right',
              },
              {
                id: 5,
                name: 'Affiliate Approved',
                hasSubMenu: true,
                routerLink: 'affiliate/all-approved-affiliate',
                icon: 'arrow_right',
              },
            ],
          });
      }

      if (!hasAffiliateProduct) {
        this.allMenus.push( {
          id: 1120,
          name: 'Affiliate Product',
          hasSubMenu: true,
          routerLink: null,
          icon: 'conveyor_belt',
          subMenus: [
            {
              id: 1,
              name: 'All Affiliate Product',
              hasSubMenu: true,
              routerLink: 'affiliate-product/all-affiliate-product',
              icon: 'arrow_right',
            },
          ],
        });
      }

    } else {

      // Remove Affiliate Menus if exist
      this.allMenus = this.allMenus.filter(menu =>
        menu.id !== 1200 && menu.id !== 1120
      );
    }
  }

  /**
   * x-icon
   * logo reload
   */
  setFavicon(iconPath: string) {
    if (isPlatformBrowser(this.platformId)) {
      const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = iconPath;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }


  /**
   * On Destroy
   */
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub?.unsubscribe());
  }


}
