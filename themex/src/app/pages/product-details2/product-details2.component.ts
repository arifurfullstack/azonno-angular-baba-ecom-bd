import {Component, inject, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {Product} from "../../interfaces/common/product.interface";
import {Category} from "../../interfaces/common/category.interface";
import {Banner} from "../../interfaces/common/banner.interface";
import {ShopInformation} from "../../interfaces/common/shop-information.interface";
import {AppConfigService} from "../../services/core/app-config.service";
import {CategoryService} from "../../services/common/category.service";
import {BannerService} from "../../services/common/banner.service";
import {ActivatedRoute, Router} from "@angular/router";
import {UserService} from "../../services/common/user.service";
import {UtilsService} from "../../services/core/utils.service";
import {GtmService} from "../../services/core/gtm.service";
import {Meta, Title} from "@angular/platform-browser";
import {CanonicalService} from "../../services/core/canonical.service";
import {ProductService} from "../../services/common/product.service";
import {ShopInformationService} from "../../services/common/shop-information.service";
import {SettingService} from "../../services/common/setting.service";
import {Subscription} from "rxjs";
import {isPlatformBrowser} from "@angular/common";
import {ThemeViewSetting} from "../../interfaces/common/setting.interface";
import {Pagination} from "../../interfaces/core/pagination";
import {FilterData} from "../../interfaces/core/filter-data";
import {ProductsCardBannerComponent} from "../../shared/components/products-card-banner/products-card-banner.component";
import {
  ProductsFilterCategoryComponent
} from "../../shared/components/products-filter-category/products-filter-category.component";
import {
  ProductDetailsLoaderComponent
} from "../../shared/loader/product-details-loader/product-details-loader.component";
import {ProductDetailsBannerComponent} from "./product-details-banner/product-details-banner.component";
import {
  ProductDetailsDescriptionComponent
} from "../../shared/components/product-details-description/product-details-description.component";
import {
  ProductDetailsAdditionalInfoComponent
} from "../../shared/components/product-details-additional-info/product-details-additional-info.component";
import {ProductDetailsReviewsComponent} from "./product-details-reviews/product-details-reviews.component";
import {ProductCard4Component} from "../../shared/components/product-cards/product-card-4/product-card-4.component";
import {ProductCard3Component} from "../../shared/components/product-cards/product-card-3/product-card-3.component";
import {ProductCard1Component} from "../../shared/components/product-cards/product-card-1/product-card-1.component";
import {ProductCard2Component} from "../../shared/components/product-cards/product-card-2/product-card-2.component";
import {ProductCard5Component} from "../../shared/components/product-cards/product-card-5/product-card-5.component";

@Component({
  selector: 'app-product-details2',
  templateUrl: './product-details2.component.html',
  styleUrl: './product-details2.component.scss',
  standalone: true,
  imports: [
    ProductsCardBannerComponent,
    ProductsFilterCategoryComponent,
    ProductDetailsLoaderComponent,
    ProductDetailsBannerComponent,
    ProductDetailsDescriptionComponent,
    ProductDetailsAdditionalInfoComponent,
    ProductDetailsReviewsComponent,
    ProductCard4Component,
    ProductCard3Component,
    ProductCard1Component,
    ProductCard2Component,
    ProductCard5Component
  ]
})
export class ProductDetails2Component implements OnInit, OnDestroy {

  // Theme Settings
  themeColors: any;

  // Store Data
  slug?: string;
  product: Product;
  categories: Category [] = [];
  relatedProducts: Product[] = [];
  banners: Banner[] = [];
  currentTab: string = 'description';
  shopInfo: ShopInformation;
  chatLink: any;
  private eventId: string;
  // Theme Views
  productCardViews: string;

  // Loading
  isLoading: boolean = true;
  isBannerLoading: boolean = false;
  isLoadingRelatedProducts: boolean = false;


  // Inject
  private readonly appConfigService = inject(AppConfigService);
  private readonly categoryService = inject(CategoryService);
  private readonly bannerService = inject(BannerService);
  private readonly activateRoute = inject(ActivatedRoute);
  private readonly userService = inject(UserService);
  private readonly utilsService = inject(UtilsService);
  private readonly gtmService = inject(GtmService);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly canonicalService = inject(CanonicalService);
  private readonly productService = inject(ProductService);
  private readonly shopInfoService = inject(ShopInformationService);
  private readonly settingService = inject(SettingService);
  private readonly platformId = inject(PLATFORM_ID);

  // Subscriptions
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    // Theme Settings
    this.getSettingData();

    // Param Map
    const subscription = this.activateRoute.paramMap.subscribe((param) => {
      this.slug = param.get('slug');
      if (this.slug) {
        this.getProductBySlug();
      }
    });
    this.subscriptions?.push(subscription);

    // // Query Param Map
    // const subscription2 = this.activateRoute.queryParamMap.subscribe(qParam => {
    //   if (qParam.get('tab')) {
    //     this.currentTab = qParam.get('tab');
    //   }
    // });
    // this.subscriptions?.push(subscription2);

    // Query Param Map
    const subscription2 = this.activateRoute.queryParamMap.subscribe(qParam => {
      const tab = qParam.get('tab');

      // ✅ Modern way to detect reload
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const isReload = navEntries.length > 0 && navEntries[0].type === 'reload';

      if (tab === 'reviews' && isReload) {
        this.currentTab = 'description'; // Force to default tab
      } else {
        this.currentTab = tab || 'description';
      }
    });
    this.subscriptions?.push(subscription2);


    // Base Data
    if (isPlatformBrowser(this.platformId)) {
      this.getShopInfo();
      this.getChatLink();
    }
    this.getAllCategory();
    this.getAllBanners();
  }

  /**
   * Initial Landing Page Setting
   * getSettingData()
   */

  private getSettingData() {
    this.themeColors = this.appConfigService.getSettingData('themeColors');
    const themeViewSettings: ThemeViewSetting[] = this.appConfigService.getSettingData('themeViewSettings') || [];
    this.productCardViews = themeViewSettings.find(f => f.type == 'productCardViews')?.value?.join() || 'Product Card 1';
  }

  /**
   * HTTP Request Handle
   * getProductBySlug()
   * getRelatedProducts()
   * getAllCategory()
   * getAllBanners()
   */
  private getProductBySlug() {
    const subscription = this.productService
      .getProductBySlug(this.slug)
      .subscribe({
        next: res => {
          this.product = res.data;
          if (this.product) {
            this.getRelatedProducts();
            // View Content Event
            if (isPlatformBrowser(this.platformId)) {
              this.viewContentEvent();
              this.updateMetaData();
            }

          }
          this.isLoading = false;
        },
        error: err => {
          console.log(err);
          this.isLoading = false;
        },
      });
    this.subscriptions?.push(subscription);
  }

  private getRelatedProducts() {
    this.isLoadingRelatedProducts = true;
    const pagination: Pagination = {
      pageSize: 5,
      currentPage: 0
    };
    const mSelect = {
      _id: 1,
      name: 1,
      isVariation: 1,
      images: 1,
      prices: 1,
      tags: 1,
      slug: 1,
      salePrice: 1,
      totalSold: 1,
      discountType: 1,
      variationList: 1,
      discountAmount: 1,
      minimumWholesaleQuantity: 1,
      wholesalePrice: 1,
    }
    const filterData: FilterData = {
      pagination: pagination,
      filter: {
        'category._id': this.product?.category?._id,
        status: 'publish'
      },
      select: mSelect,
      sort: {createdAt: 1}
    }
    const subscription = this.productService.getAllProducts(filterData, null)
      .subscribe({
        next: res => {
          if (res.data && res.data.length) {
            this.relatedProducts = res.data.filter(f => f._id !== this.product?._id);
          }
          this.isLoadingRelatedProducts = false;
        },
        error: error => {
          this.isLoadingRelatedProducts = false;
          console.log(error);
        }
      });
    this.subscriptions?.push(subscription);
  }

  private getAllCategory() {
    const subscription = this.categoryService.getAllCategory().subscribe({
      next: res => {
        this.categories = res.data;
        this.isLoading = false;
      },
      error: err => {
        console.log(err);
        this.isLoading = false;
      },
    });
    this.subscriptions?.push(subscription);
  }

  private getAllBanners() {
    let mSelect = {
      name: 1,
      slug: 1,
      images: 1,
      mobileImage: 1,
      type: 1,
      url: 1,
    }
    const filterData: FilterData = {
      filter: {type: 'product-details-banner'},
      select: mSelect,
      sort: null,
      pagination: {
        pageSize: 2,
        currentPage: 0
      }
    }
    this.isBannerLoading = true;
    const subscription = this.bannerService.getAllBanner(filterData, null)
      .subscribe({
        next: res => {
          this.banners = res.data;
          this.isBannerLoading = false;
        },
        error: err => {
          this.isBannerLoading = false;
        }
      });
    this.subscriptions?.push(subscription);
  }

  private getShopInfo() {
    const subscription = this.shopInfoService.getShopInformation().subscribe({
      next: res => {
        this.shopInfo = res.data;
        this.setFavicon(this.shopInfo?.fabIcon)
        // console.log(this.shopInfo)
      },
      error: err => {
        console.error(err);
      }
    });
    this.subscriptions?.push(subscription);
  }

  private getChatLink() {
    const subscription = this.settingService.getChatLink()
      .subscribe({
        next: (res) => {
          this.chatLink = res.data;
        },
        error: (error) => {
          console.log(error);
        },
      });
    this.subscriptions?.push(subscription);
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


  /**
   * Utils
   * generateEventId()
   */
  private generateEventId() {
    this.eventId = this.utilsService.generateEventId();
  }

  private viewContentEvent(): void {
    // 1️⃣ Generate Event ID
    this.generateEventId();

    // 2️⃣ Hashed user_data
    const user_data = this.utilsService.getUserData({
      email: this.userService.getUserLocalDataByField('email'),
      phoneNo: this.userService.getUserLocalDataByField('phoneNo'),
      external_id: this.userService.getUserLocalDataByField('userId'),
      lastName: this.userService.getUserLocalDataByField('name'),
      city: this.userService.getUserLocalDataByField('division'),
    });

    // 3️⃣ Prepare custom_data
    const custom_data = {
      content_ids: [this.product?._id],
      content_type: 'product',
      content_name: this.product?.name,
      content_category: this.product?.category?.name,
      content_subcategory: this.product?.subCategory?.name,
      value: this.product?.salePrice ?? 0,
      currency: 'BDT',
      quantity: 1,
    };

    // 4️⃣ Prepare server-side payload
    const viewContentData: any = {
      event_name: 'ViewContent',
      event_time: Math.floor(Date.now() / 1000),
      event_id: this.eventId,
      action_source: 'website',
      event_source_url: location.href,
      custom_data,
      ...(Object.keys(user_data).length > 0 && { user_data }),
    };

    // 5️⃣ Browser: Facebook Pixel (manual)
    if (this.gtmService.facebookPixelId && !this.gtmService.isManageFbPixelByTagManager) {
      this.gtmService.trackByFacebookPixel('ViewContent', custom_data, this.eventId);
    }

    // 6️⃣ Browser: GTM (if Pixel is managed by GTM)
    if (this.gtmService.tagManagerId && this.gtmService.isManageFbPixelByTagManager) {
      this.gtmService.pushToDataLayer({
        event: 'ViewContent',
        event_id: this.eventId,
        page_url: window.location.href,
        ecommerce: {
          detail: {
            products: [
              {
                id: this.product?._id,
                name: this.product?.name,
                category: this.product?.category?.name,
                subcategory: this.product?.subCategory?.name,
                price: this.product?.regularPrice,
                currency: 'BDT',
                quantity: 1,
              }
            ]
          }
        }
      });
    }

    // 7️⃣ Server: Send to Facebook Conversions API
    if (this.gtmService.facebookPixelId) {
      const subscription = this.gtmService.trackViewContent(viewContentData).subscribe({
        next: () => {},
        error: () => {},
      });
      this.subscriptions.push(subscription);
    }
  }


  /**
   * updateMetaData()
   */

  private updateMetaData() {
    const seoTitle = this.product?.seoTitle || this.product?.name;
    const seoDescription = this.product?.seoDescription || this.product?.name;
    const seoKeywords = this.product?.seoKeyword || ''; // Example: "organic honey, pure honey, raw honey"
    const imageUrl = this.product?.images?.[0] || '';
    const url = window.location.href;

    // Title
    this.title.setTitle(seoTitle);

    // Meta Tags
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });
    this.meta.updateTag({ name: 'theme-color', content: this.themeColors?.primary });
    this.meta.updateTag({ name: 'description', content: seoDescription });
    this.meta.updateTag({ name: 'keywords', content: seoKeywords }); // ✅ Keywords added

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: seoTitle });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ property: 'og:image:type', content: 'image/jpeg' });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ property: 'og:description', content: seoDescription });
    this.meta.updateTag({ property: 'og:locale', content: 'en_US' });

    // Twitter Tags
    this.meta.updateTag({ name: 'twitter:title', content: seoTitle });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:description', content: seoDescription });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });

    // Microsoft
    this.meta.updateTag({ name: 'msapplication-TileImage', content: imageUrl });

    // Canonical
    this.canonicalService.setCanonicalURL();
  }


  /**
   * UI Logic
   * toggleTab()
   */
  toggleTab(name: string) {
    this.currentTab = name;

    if (name === 'reviews') {
      // ✅ Step 1: set tab param in URL
      this.router.navigate([], {
        queryParams: { tab: 'reviews' },
        queryParamsHandling: 'merge',
      });

      // ✅ Step 2: scroll to review section
      setTimeout(() => {
        const reviewEl = document.getElementById('reviewSection');
        if (reviewEl) {
          reviewEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    } else {
      this.router.navigate([], {queryParams: {tab: name}, queryParamsHandling: ''}).then();
    }
  }

  /**
   * ON Destroy
   */
  ngOnDestroy(): void {
    this.subscriptions?.forEach(sub => sub?.unsubscribe());
  }
}
