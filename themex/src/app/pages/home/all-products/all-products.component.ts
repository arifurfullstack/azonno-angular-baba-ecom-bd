import {Component, ElementRef, inject, Input, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AppConfigService} from "../../../services/core/app-config.service";
import {ProductService} from "../../../services/common/product.service";
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";
import {Subscription, timer} from "rxjs";
import {isPlatformBrowser} from "@angular/common";
import {ThemeViewSetting} from "../../../interfaces/common/setting.interface";
import {EmptyDataComponent} from "../../../shared/components/ui/empty-data/empty-data.component";
import {ProductCard1Component} from "../../../shared/components/product-cards/product-card-1/product-card-1.component";
import {ProductCard2Component} from "../../../shared/components/product-cards/product-card-2/product-card-2.component";
import {ProductCard3Component} from "../../../shared/components/product-cards/product-card-3/product-card-3.component";
import {ProductCard4Component} from "../../../shared/components/product-cards/product-card-4/product-card-4.component";
import {ProductCard5Component} from "../../../shared/components/product-cards/product-card-5/product-card-5.component";
import {ProductCardLoaderComponent} from "../../../shared/loader/product-card-loader/product-card-loader.component";
import {TranslatePipe} from "../../../shared/pipes/translate.pipe";
import {Pagination} from "../../../interfaces/core/pagination";
import {FilterData, FilterGroup} from "../../../interfaces/core/filter-data";

@Component({
  selector: 'app-all-products',
  templateUrl: './all-products.component.html',
  styleUrl: './all-products.component.scss',
  standalone: true,
  imports: [
    EmptyDataComponent,
    ProductCard1Component,
    ProductCard2Component,
    ProductCard3Component,
    ProductCard4Component,
    ProductCard5Component,
    ProductCardLoaderComponent,
    TranslatePipe
  ]
})
export class AllProductsComponent implements OnInit, OnDestroy {

  // Decorator
  @Input() tag: any;
  @Input() index: number = 0;

  // Store Data
  products: any[] = [];
  visibleProducts = 5;
  private observer!: IntersectionObserver;

  // Theme Views
  productCardViews: string;

  // Loading
  isLoading: boolean = true;
  isLoadMore = false;

  // Pagination
  currentPage = 1;
  totalProducts = 0;
  productsPerPage = 20;

  // Shop ID
  shopId: string;

  // Inject
  private readonly appConfigService = inject(AppConfigService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly el = inject(ElementRef);
  private readonly breakpointObserver = inject(BreakpointObserver);

  // Subscription
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    // Theme Base
    this.getSettingData();
    this.shopId = this.appConfigService.getSettingData('shop');

    // Products prefetched by the home resolver (SSR render or TransferState
    // replay) — paint them immediately and skip the initial request.
    const resolved: any = this.route.snapshot.data['homeProducts'];
    if (resolved && resolved.data) {
      this.products = resolved.data;
      this.totalProducts = resolved.count;
      this.isLoading = false;
    } else if (isPlatformBrowser(this.platformId)) {
      this.setupIntersectionObserver();
    } else {
      // Fallback for SSR - Load without intersection
      this.loadProducts();
    }

    this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      if (result.matches) {
        this.visibleProducts = 6; // Show 6 items on mobile
      } else {
        this.visibleProducts = 5; // Show 5 items on desktop
      }
    });
  }


  /**
   * Initial Landing Page Setting
   * getSettingData()
   * setupIntersectionObserver()
   * loadProducts()
   */

  private getSettingData() {
    const themeViewSettings: ThemeViewSetting[] = this.appConfigService.getSettingData('themeViewSettings');
    this.productCardViews = themeViewSettings?.find(f => f.type === 'productCardViews')?.value?.join() || 'Product Card 1';
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.loadProducts();
          this.observer.disconnect();
        }
      });
    });
    this.observer.observe(this.el.nativeElement);
  }

  /**
   * LOAD MORE
   */
  onLoadMore() {
    if (this.totalProducts > this.products.length) {
      this.isLoadMore = true;
      this.currentPage += 1;
      this.getAllProducts(true);
    }
  }

  loadProducts() {
    // SSR: start the HTTP request immediately — wrapping it in timer()
    // pushed the request past the server render, so the pre-rendered HTML
    // shipped with skeletons and every visitor re-fetched on the client.
    if (!isPlatformBrowser(this.platformId)) {
      this.getAllProducts();
      return;
    }
    const delayTime = this.index * 200; // 200ms stagger per tag index
    timer(delayTime).subscribe(() => { // Adds a 200ms delay before loading products
      this.getAllProducts();
    });
  }

  /**
   * HTTP REQUEST HANDLE
   * getAllProducts()
   */

  private getAllProducts(loadMore?: boolean) {
    const pagination: Pagination = {
      pageSize: Number(this.productsPerPage),
      currentPage: Number(this.currentPage) - 1
    };
    // Select
    const mSelect = {
      name: 1,
      isVariation: 1,
      images: 1,
      prices: 1,
      tags: 1,
      slug: 1,
      category: 1,
      subCategory: 1,
      brand: 1,
      costPrice: 1,
      salePrice: 1,
      totalSold: 1,
      variation: 1,
      variation2: 1,
      discountType: 1,
      variationOptions: 1,
      variation2Options: 1,
      variationList: 1,
      discountAmount: 1,
      minimumWholesaleQuantity: 1,
      wholesalePrice: 1,
    }
    const mGroup: FilterGroup = {
      isGroup: true,
      category: true,
      subCategory: true,
      brand: true,
    }

    const filterData: FilterData = {
      pagination: pagination,
      filter: { status: 'publish'},
      filterGroup: loadMore ? null: mGroup,
      select: mSelect,
    }

    const subscription = this.productService.getAllProducts(filterData, null).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isLoadMore = false;
        if (loadMore) {
          this.products = [...this.products, ...res.data];
        } else {
          this.products = res.data;
        }
        this.totalProducts = res.count;

      },
      error: (err) => {
        this.isLoading = false;
        console.log(err);
      },
    });
    this.subscriptions?.push(subscription);
  }

  /**
   * ON Destroy
   */
  ngOnDestroy() {
    this.subscriptions?.forEach(sub => sub?.unsubscribe());
  }

}
