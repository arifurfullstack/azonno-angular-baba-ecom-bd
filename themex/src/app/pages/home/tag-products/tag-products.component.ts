import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";
import {isPlatformBrowser} from '@angular/common';
import {Component, ElementRef, inject, Input, OnDestroy, OnInit, PLATFORM_ID} from '@angular/core';
import {Subscription, timer} from 'rxjs';
import {ThemeViewSetting} from '../../../interfaces/common/setting.interface';
import {ProductService} from '../../../services/common/product.service';
import {AppConfigService} from '../../../services/core/app-config.service';
import {ProductCard1Component} from "../../../shared/components/product-cards/product-card-1/product-card-1.component";
import {ProductCard2Component} from "../../../shared/components/product-cards/product-card-2/product-card-2.component";
import {ProductCard3Component} from "../../../shared/components/product-cards/product-card-3/product-card-3.component";
import {ProductCard4Component} from "../../../shared/components/product-cards/product-card-4/product-card-4.component";
import {ProductCard5Component} from "../../../shared/components/product-cards/product-card-5/product-card-5.component";
import {TimeCounterModule} from "../../../shared/components/time-counter/time-counter.module";
import {ProductCardLoaderComponent} from "../../../shared/loader/product-card-loader/product-card-loader.component";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-tag-products',
  templateUrl: './tag-products.component.html',
  styleUrl: './tag-products.component.scss',
  standalone: true,
  imports: [
    TimeCounterModule,
    ProductCard1Component,
    ProductCard2Component,
    ProductCardLoaderComponent,
    ProductCard3Component,
    ProductCard4Component,
    ProductCard5Component,
    RouterLink
  ]
})
export class TagProductsComponent implements OnInit, OnDestroy {

  // Decorator
  @Input() tag: any;
  @Input() index: number = 0;
  @Input() isEnableHomeRecentOrder!: any;
  // Store Data
  products: any[] = [];
  visibleProducts = 5;
  private observer!: IntersectionObserver;

  // Theme Views
  productCardViews: string;

  // Loading
  isLoading: boolean = true;

  // Pagination
  currentPage = 1;
  totalProducts = 0;
  productsPerPage = 10;

  // Inject
  private readonly appConfigService = inject(AppConfigService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly productService = inject(ProductService);
  private readonly el = inject(ElementRef);
  private readonly breakpointObserver = inject(BreakpointObserver);

  // Subscription
  private subscriptions: Subscription[] = [];


  ngOnInit() {
    // Theme Base
    this.getSettingData();

    if (isPlatformBrowser(this.platformId)) {
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
    // Stored settings may lack this entry — fall back to the catalog default.
    this.productCardViews = themeViewSettings.find(f => f.type == 'productCardViews')?.value?.join() || 'Product Card 1';
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

  loadProducts() {
    const delayTime = this.index * 200; // 200ms delay per tag index
    timer(delayTime).subscribe(() => { // Adds a 200ms delay before loading products
      this.getAllProducts();
    });
  }

  /**
   * HTTP REQUEST HANDLE
   * getAllProducts()
   */

  private getAllProducts() {
    const subscription = this.productService.getAllProductsByUi({ status: 'publish', 'tags.name': this.tag?.name }, 1, 6).subscribe({
      next: (res) => {
        this.products = res.data;
        // console.log(this.products);
        this.isLoading = false;
      },
      error: (err) => {
        console.log(err);
        this.isLoading = false;
      },
    });
    this.subscriptions.push(subscription);
  }



  /**
   * ON Destroy
   */
  ngOnDestroy() {
    this.subscriptions?.forEach(sub => sub?.unsubscribe());
  }

}
