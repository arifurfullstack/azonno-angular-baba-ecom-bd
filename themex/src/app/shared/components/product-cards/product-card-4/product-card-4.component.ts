import {
  Component,
  computed,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit, PLATFORM_ID,
  Signal,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import {ProductPricePipe} from "../../../pipes/product-price.pipe";
import { ArrayToSingleImagePipe } from '../../../pipes/array-to-single-image.pipe';
import {ImgCtrlPipe} from "../../../pipes/img-ctrl.pipe";
import {isPlatformBrowser, NgOptimizedImage} from "@angular/common";
import {Router, RouterLink} from "@angular/router";
import {CurrencyCtrPipe} from "../../../pipes/currency.pipe";
import { TranslatePipe } from '../../../pipes/translate.pipe';
import {Cart} from "../../../../interfaces/common/cart.interface";
import {Product, VariationList} from "../../../../interfaces/common/product.interface";
import {CartService} from "../../../../services/common/cart.service";
import {NewWishlistService} from "../../../../services/common/new-wishlist.service";
import {UserService} from "../../../../services/common/user.service";
import {UiService} from "../../../../services/core/ui.service";
import {ReloadService} from "../../../../services/core/reload.service";
import {Wishlist} from "../../../../interfaces/common/wishlist.interface";
import {Subscription} from "rxjs";
import {UtilsService} from "../../../../services/core/utils.service";
import {PricePipe} from "../../../pipes/price.pipe";
import {GtmService} from "../../../../services/core/gtm.service";

@Component({
  selector: 'app-product-card-4',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ProductPricePipe,
    ArrayToSingleImagePipe,
    ImgCtrlPipe,
    NgOptimizedImage,
    RouterLink,
    CurrencyCtrPipe,
    TranslatePipe
  ],
  templateUrl: './product-card-4.component.html',
  styleUrl: './product-card-4.component.scss',
  providers: [PricePipe],
})
export class ProductCard4Component implements OnInit, OnDestroy {

  // Decorator
  @Input() product: Product = null;
  image: any;
  zoomImage: any;
  prevImage: any;
  /**
   * Usage Guide
   * sizes="(max-width: 599px) 16px, (min-width: 600px) 48px"
   * If with 16px then take the next src near 16w
   */
  protected readonly rawSrcset: string = '640w, 750w';

  // Store Data
  cart: any = null;
  carts: Cart[] = [];
  isModalVisible = false;
  actionType: any;

  // Variation Manage
  selectedVariation: string = null;
  selectedVariation2: string = null;
  selectedVariationList: VariationList = null;
  // Quantity Control
  qty: number = 1;

  private eventId: string;
  // Inject
  private readonly cartService = inject(CartService);
  private readonly newWishlistService = inject(NewWishlistService);
  private readonly userService = inject(UserService);
  private readonly uiService = inject(UiService);
  private readonly reloadService = inject(ReloadService);
  private readonly router = inject(Router);
  private readonly utilsService = inject(UtilsService);
  private readonly pricePipe = inject(PricePipe);
  private readonly gtmService = inject(GtmService);
  private readonly platformId = inject(PLATFORM_ID);
  // Wishlist Signal
  wishlists: Signal<Wishlist[]> = this.newWishlistService.newWishlistItems;

  // Computed Wishlist Item (Find if product exists in wishlist)
  wishlist = computed(() => {
    return this.wishlists().find(f => {
      const productId = typeof f.product === 'string' ? f.product : f.product?._id;
      return productId === this.product?._id;
    });
  });

  // Subscriptions
  private subscriptions: Subscription[] = [];

  ngOnInit() {

    // Cart Base
    const subscription = this.cartService.refreshStoredCart$.subscribe(() => {
      this.carts = this.cartService.cartItems;
      this.checkCartList();
    });
    this.subscriptions?.push(subscription);
    this.carts = this.cartService.cartItems;

    if (this.userService.isUser) {
      // Fetch Wishlist from API
      this.newWishlistService.newGetWishlistByUser();
    }

    // Set Default Variation
    if (this.product?.isVariation) {
      this.setDefaultVariation();
      this.setDefaultImage();
    }
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (this.product?.isVariation) {
      this.setDefaultVariation();
      this.setDefaultImage();
    }
  }

  /**
   * Cart Manage
   * onAddToCart()
   * checkCartList()
   */

  onAddToCart(event: MouseEvent, type: 'addToCart' | 'buyNow') {
    event.stopPropagation();
    event.preventDefault();
    this.actionType = type;
    if (this.product?.isVariation && !this.isModalVisible) {
      this.isModalVisible = true;
      return;
    }

    const getVariationOption = () => {
      if (this.product?.variation && this.product.variation2) {
        return `${this.product?.variation}, ${this.product.variation2}`
      } else {
        return `${this.product?.variation}`
      }
    }

    const data: Cart = {
      product: this.product?._id,
      selectedQty: 1,
      isSelected: true,
      variation: this.selectedVariationList ? {
        _id: this.selectedVariationList?._id,
        name: this.selectedVariationList?.name,
        image: this.selectedVariationList?.image,
        option: getVariationOption(),
        sku: this.selectedVariationList?.sku,
      } : null
    };
    if (this.userService.isUser) {
      this.addToCartDB(data, type);
      if (isPlatformBrowser(this.platformId)) {
        this.addToCartEvent();
      }
    } else {
      this.cartService.addCartItemToLocalStorage(data);
      this.reloadService.needRefreshCart$(true);
      this.uiService.actionMessage('Success!', "success", '/cart', '/checkout', 'local_mall', 'View Cart', 'Buy Now');
      this.isModalVisible = false;
      if (isPlatformBrowser(this.platformId)) {
        this.addToCartEvent();
      }
      if (type == 'buyNow') {
        this.router.navigate(['/checkout']).then();
      }
    }
    this.router.navigate(['/checkout']);
  }

  checkCartList() {
    this.cart = this.carts.find(f => (f?.product as Product)?._id === this.product?._id);
  }


  /**
   * Wishlist Manage
   * onAddToWishlist()
   * checkWishlist()
   */
  onAddToWishlist(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    if (this.wishlist()) {
      this.newWishlistService.newDeleteWishlistById(this.wishlist()?._id);
    } else {
      const data: Wishlist | any = {
        product: this.product?._id,
        selectedQty: 1,
      };
      if (this.userService.isUser) {
        this.newWishlistService.newAddToWishlist(data);
      } else {
        this.router.navigate(['/login']).then();
      }
    }
  }


  /**
   * HTTP REQ Handle
   * addToCartDB()
   * addToWishlistDB()
   * deleteWishlistById()
   */
  private addToCartDB(data: Cart, type: 'addToCart' | 'buyNow') {
    const subscription = this.cartService.addToCart(data).subscribe({
      next: res => {
        this.uiService.actionMessage('Success!', "success", '/cart', '/checkout', 'local_mall', 'View Cart', 'Buy Now');
        this.reloadService.needRefreshCart$(true);
        this.isModalVisible = false;

        if (type == 'buyNow') {
          this.router.navigate(['/checkout']).then();
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
    this.subscriptions?.push(subscription);
  }

  /**
   * Variation Control
   * setDefaultVariation()
   * setSelectedVariationList()
   * onSelectVariation()
   * onSelectVariation2()
   * isStockAvailable()
   */
  private setDefaultVariation() {
    if (this.product?.variation) {
      this.selectedVariation = this.product?.variationOptions[0];
    }
    if (this.product?.variation2) {
      this.selectedVariation2 = this.product?.variation2Options[0];
    }
    // Selected Variation List
    this.setSelectedVariationList();

  }

  private setSelectedVariationList() {
    if (this.selectedVariation && this.selectedVariation2) {
      this.selectedVariationList = this.product?.variationList.find(
        f => f.name === `${this.selectedVariation}, ${this.selectedVariation2}`
      );
    } else {
      this.selectedVariationList = this.product?.variationList.find(f => f.name === `${this.selectedVariation}`)
    }
  }

  onSelectVariation(name: string) {
    if (this.selectedVariation !== name) {
      this.selectedVariation = name;
      if (this.convertToLowercase(this.product?.variation) === "color" || this.convertToLowercase(this.product?.variation) === "colour") {
        this.prevImage = this.image;
        let image = this.product?.variationList.find((v) => v?.name.toLowerCase().indexOf(name.toLowerCase()) > -1).image;
        this.image = image && image.length > 0 ? image : this.prevImage;
      }
      this.setSelectedVariationList();
    }
  }

  onSelectVariation2(name: string) {
    if (this.selectedVariation2 !== name) {
      this.selectedVariation2 = name;
      if (this.convertToLowercase(this.product?.variation2) === "color" || this.convertToLowercase(this.product?.variation2) === "colour") {
        let image = this.product?.variationList.find((v) => v?.name.toLowerCase().indexOf(name.toLowerCase()) > -1 && v?.name.toLowerCase().indexOf(this.selectedVariation.toLowerCase()) > -1).image;
        this.image = image && image.length > 0 ? image : this.prevImage;
      }
      this.setSelectedVariationList();
    }
  }

  convertToLowercase(inputString: string): string {
    return inputString?.toLowerCase()?.trim();
  }

  closeModal() {
    this.isModalVisible = false;
  }

  getVariationImage(name: string): string | undefined {
    return this.product?.variationList.find(
      (v) => v?.name.toLowerCase().includes(name.toLowerCase())
    )?.image;
  }

  /**
   MODAL HANDLE METHOD
   * setDefaultImage()
   */

  private setDefaultImage() {
    this.image =
      this.product?.images && this.product?.images?.length > 0
        ? this.product?.images[0]
        : 'https://cdn.saleecom.com/upload/images/placeholder.png';
    this.zoomImage = this.image;
  }

  /**
   * Calculate
   * ratingCount()
   */
  get ratingCount(): number {
    if (this.product) {
      return Math.floor((this.product?.ratingTotal ?? 0) / (this.product?.ratingCount ?? 0));
    } else {
      return 0;
    }
  }
  // ===== Tracking =====
  private generateEventId() {
    this.eventId = this.utilsService.generateEventId();
  }

  private addToCartEvent(): void {

    if (!this.product) return;

    // quantity (UI থেকে যদি থাকে)
    const qty = Number(this.qty);
    const unitPrice =
      Number(this.pricePipe.transform(this.product, 'salePrice')) ||
      Number(this.product?.regularPrice) || 0;

    if (!unitPrice) return; // price না থাকলে ফায়ার নয়


    // 1️⃣ Generate Unique Event ID
    this.generateEventId();

    // 2️⃣ Hashed User Data
    const user_data = this.utilsService.getUserData({
      email: this.userService.getUserLocalDataByField('email'),
      phoneNo: this.userService.getUserLocalDataByField('phoneNo'),
      external_id: this.userService.getUserLocalDataByField('userId'),
      firstName: this.userService.getUserLocalDataByField('name'),
      city: this.userService.getUserLocalDataByField('division'),
    });

    const contents = [{
      id: String(this.product?._id),     // ক্যাটালগ SKU হলে SKU দিন
      quantity: qty,
      item_price: unitPrice,
    }];

    // 3️⃣ Prepare custom_data
    const custom_data = {
      contents,
      content_type: 'product',
      content_name: this.product?.name,
      content_category: this.product?.category?.name,
      content_subcategory: this.product?.subCategory?.name,
      value: Number(this.pricePipe.transform(this.product, 'salePrice')),
      currency: 'BDT',
      num_items: qty,
    };

    const eventTime  = Math.floor(Date.now() / 1000);
    const original_event_data = {
      event_name: 'AddToCart',
      event_time: eventTime,
    }

    // 4️⃣ Server-side Payload
    const trackData: any = {
      event_name: 'AddToCart',
      event_time: eventTime,
      event_id: this.eventId,
      action_source: 'website',
      event_source_url: location.href,
      custom_data,
      original_event_data,
      ...(Object.keys(user_data).length > 0 && { user_data }),
    };

    // 5️⃣ Browser: Facebook Pixel Tracking (manual)
    if (this.gtmService.facebookPixelId && !this.gtmService.isManageFbPixelByTagManager) {
      this.gtmService.trackByFacebookPixel('AddToCart', custom_data, this.eventId);

      this.gtmService.trackAddToCart(trackData).subscribe({
        next: () => {},
        error: () => {},
      });
    }

    // 6️⃣ Browser: GTM Push (if Pixel is managed via GTM)
    if (this.gtmService.tagManagerId) {
      this.gtmService.pushToDataLayer({
        event: 'AddToCart',
        event_id: this.eventId,
        page_url: window.location.href,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        ecommerce: {
          add: {
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
            ],
            custom_data,
            original_event_data,
            ...(Object.keys(user_data).length > 0 && { user_data }),
          }
        }
      });
    }

  }


  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const modalContent = document.querySelector('.product-modal') as HTMLElement;

    if (this.isModalVisible && modalContent && !modalContent.contains(event.target as Node)) {
      this.closeModal();
    }
  }


  /**
   * On Destroy
   */
  ngOnDestroy() {
    this.subscriptions?.forEach(sub => sub?.unsubscribe());
  }
}
