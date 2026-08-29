import {ChangeDetectorRef, Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DataTableSelectionBase} from "../../../mixin/data-table-select-base.mixin";
import {FormBuilder, FormGroup, NgForm, Validators} from "@angular/forms";
import {Order} from "../../../interfaces/common/order.interface";
import {Category} from "../../../interfaces/common/category.interface";
import {
  DATA_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_TYPES,
  THEME_CATEGORIES,
  THEME_SUB_CATEGORIES
} from "../../../core/utils/app-data";
import {Select} from "../../../interfaces/core/select";
import {Product, VariationList} from "../../../interfaces/common/product.interface";
import {Division} from "../../../interfaces/common/division.interface";
import {Area} from "../../../interfaces/common/area.interface";
import {Zone} from "../../../interfaces/common/zone.interface";
import {Subscription} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {UiService} from "../../../services/core/ui.service";
import {MatDialog} from "@angular/material/dialog";
import {CategoryService} from "../../../services/common/category.service";
import {OrderService} from "../../../services/common/order.service";
import {ReloadService} from "../../../services/core/reload.service";
import {UserService} from "../../../services/common/user.service";
import {DivisionService} from "../../../services/common/division.service";
import {AreaService} from "../../../services/common/area.service";
import {ZoneService} from "../../../services/common/zone.service";
import {PageDataService} from "../../../services/core/page-data.service";
import {Title} from "@angular/platform-browser";
import {ConfirmDialogComponent} from "../../../shared/components/ui/confirm-dialog/confirm-dialog.component";
import {FilterData} from "../../../interfaces/core/filter-data";
import {MatSelectChange} from "@angular/material/select";
import {ProductPricePipe} from "../../../shared/pipes/product-price.pipe";

@Component({
  selector: 'app-add-order',
  templateUrl: './add-order.component.html',
  styleUrl: './add-order.component.scss',
  providers: [ProductPricePipe]
})
export class AddOrderComponent  extends DataTableSelectionBase(Component) implements OnInit, OnDestroy {
  // Data Form
  @ViewChild('formElement') formElement: NgForm;
  dataForm?: FormGroup;
  autoSlug: boolean = true;
  isLoaded: boolean = false;

  // Loading Control
  isLoading: boolean = false;
  isLoadingPhoneNo: boolean = false;

  // Store Data
  id?: string;
  incompleteOrderId?: string;
  orderData?: any;
  order?: Order;
  incompleteOrder?: Order;
  category?: Category;
  categories: any[] = THEME_CATEGORIES;
  subCategories: any[] = [];
  dataStatus: Select[] = DATA_STATUS;
  paymentStatus: Select[] = PAYMENT_STATUS;
  paymentTypes: any[] = PAYMENT_TYPES;
  orderStatus: Select[] = ORDER_STATUS;
  override allTableData: Product[] = [];
  selectedVariation: any
  providerName: any
  orderType: string = 'regular';
  additionalDiscount: number = 0;

  isGalleryOpen: boolean = false;
  galleryImages: string[] = [];
  selectedImageIndex: number = 0;

  divisions?: Division[] = [];
  area?: Area[] = [];
  zone?: Zone[] = [];

  subTotal: number = 0; // Set this based on your calculations
  deliveryChargeAmount: number = 0; // Default value
  couponDiscount: number = 0; // Default value
  advancePayment: number = 0;
  discount: number = 0;
  // grandTotal: number = 0;


  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Inject
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly uiService = inject(UiService);
  private readonly dialog = inject(MatDialog);
  private readonly categoryService = inject(CategoryService);

  private readonly productPricePipe = inject(ProductPricePipe);
  private readonly orderService = inject(OrderService);
  private readonly reloadService = inject(ReloadService);
  private readonly userService = inject(UserService);
  private readonly divisionService = inject(DivisionService);
  private readonly areaService = inject(AreaService);
  private readonly zoneService = inject(ZoneService);
  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);
  private readonly cdr = inject(ChangeDetectorRef);


  ngOnInit(): void {
    // Init Form
    this.initDataForm();
    this.getAllDivision();
    // GET ID FORM PARAM
    const subRouteParam = this.activatedRoute.paramMap.subscribe((param) => {
      this.id = param.get('id');
      if (this.id) {
        this.getCategoryById();
        this.getOrderById();
      }
    });
    this.subscriptions.push(subRouteParam);
    // GET ID FORM PARAM
    const subRouteParam1 = this.activatedRoute.queryParamMap.subscribe((qParam) => {
      this.incompleteOrderId = qParam.get('incompleteOrder');
      if (this.incompleteOrderId) {
        this.getIncompleteOrderById();
      }
    });
    this.subscriptions.push(subRouteParam1);

    // Gallery Image View handle
    const subGalleryImageView = this.activatedRoute.queryParamMap.subscribe((qParam) => {
      if (!qParam.get('gallery-image-view')) {
        this.closeGallery();
      }
    });
    this.subscriptions.push(subGalleryImageView);

    this.setPageData();
  }


  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    if(this.id){
      this.title.setTitle('Update Order');
    }else {
      this.title.setTitle('Add Order');
    }
    this.pageDataService.setPageData({
      title: 'Add Order',
      navArray: [
        {name: 'Dashboard', url: `/dashboard`},
        {name: 'Add Order',  url: 'https://www.youtube.com/embed/kd2YjeLYohE'},
      ]
    })
  }


  /**
   * FORM METHODS
   * initDataForm()
   * setFormValue()
   * onSubmit()
   * onDiscard()
   */
  private initDataForm() {
    this.dataForm = this.fb.group({
      name: [null],
      phoneNo: [null],
      email: [null],
      division: [null],
      area: [null],
      zone: [null],
      deliveryNote: [null],
      paymentStatus: [this.paymentStatus[0].value, Validators.required],
      orderStatus: [this.orderStatus[0].value, Validators.required],
      shippingAddress: [null],
      paymentType: [this.paymentTypes[0].value, Validators.required],
    });
  }

  private setDataForm() {
    if (this.order) {
      this.dataForm.patchValue(this.order);
      this.deliveryChargeAmount = this.order.deliveryCharge;
      this.discount = this.order.discount;
      this.couponDiscount = this.order.couponDiscount;
      this.advancePayment = this.order.advancePayment;
      this.providerName = this.order.providerName;
      this.additionalDiscount = this.order.additionalDiscount;
      const matchedDivision = this.divisions.find(f => f.name === this.order.division);
      this.dataForm.patchValue({
        division: matchedDivision ? matchedDivision._id : null // Fallback to null if no match
      });


      this.allTableData = this.order.orderedItems.map((m) => {
        // const priceID =  ((m._id) as Product).prices.find(f => f.name === m.unit)?._id;
        return {
          _id: m.product,
          name: m.name,
          slug: m.slug,
          images: [m.image],
          discountType: m.discountType,
          discountAmount: m.discountAmount,
          category: m.category,
          subCategory: m.subCategory,
          brand: m.brand,
          quantity: m.quantity,
          salePrice: m.salePrice,
          regularPrice: m.regularPrice,
          costPrice: m.costPrice,
          unit: m.unit ? m.unit : null,
          variationData: m.variation,
          phoneModel: m.phoneModel ? m.phoneModel: null,
          // priceId: priceID,
        } as any;

      });

      // console.log('this.order.orderedItems',this.order.orderedItems)
    }
  }

  onSubmit() {
    if (this.dataForm.invalid) {
      this.uiService.message('Please complete all the required field', 'warn');
      this.dataForm.markAllAsTouched();
      return;
    }

    if (!this.allTableData.length) {
      this.uiService.message('Please select product on cart', 'warn');
      return;
    }
    // Product Info
    const products = this.allTableData.map((m) => {
      return {
        _id: m._id,
        product: m._id,
        name: m.name,
        slug: m.slug,
        image: m.images && m.images.length ? m.images[0] : null,
        category: {
          _id: m.category?._id,
          name: m.category?.name,
          slug: m.category?.slug,
        },
        subCategory: {
          _id: m.subCategory?._id,
          name: m.subCategory?.name,
          slug: m.subCategory?.slug,
        },
        brand: {
          _id: m.brand?._id,
          name: m.brand?.name,
          slug: m.brand?.slug,
        },
        costPrice: m.costPrice,
        regularPrice:  m.regularPrice,
        salePrice:  m.salePrice,
        selectedQuantity: m.quantity,
        quantity: m.quantity,
        unit: m.unit ? m.unit : null,
        discountType: m.discountType,
        discountAmount: m.discountAmount,
        variation: m.variationData,
        phoneModel: m.phoneModel ? m.phoneModel: null,
      } as any;
    });


    this.orderData = {
      name: this.dataForm.value.name,
      phoneNo: this.dataForm.value.phoneNo,
      email: this.dataForm.value.email,

      division: this.dataForm.value.division
        ? this.divisions.find(f => f._id === this.dataForm.value.division)?.name
        : null,

      area: this.dataForm.value.area ? this.area.find(f => f._id === this.dataForm.value.area)?.name
        : null,
      zone: this.dataForm.value.zone ? this.zone.find(f => f._id === this.dataForm.value.zone)?.name
        : null,
      shippingAddress: this.dataForm.value.shippingAddress,
      paymentType: this.dataForm.value.paymentType,
      providerName: this.providerName,
      incompleteOrderId:this.incompleteOrderId?? null,
      paymentStatus: this.dataForm.value.paymentStatus,
      orderStatus: this.dataForm.value.orderStatus,
      orderedItems: products,
      orderedFrom: 'Admin',
      subTotal: this.cartRegularSubTotal,
      deliveryCharge: this.deliveryChargeAmount,
      discount: this.cartDiscountAmount,
      // discount: this.discountTotal,
      additionalDiscount: this.additionalDiscountTotal,
      advancePayment: this.advancePayment,

      totalSave: this.discountTotal + this.additionalDiscountTotal,
      grandTotal: this.grandTotal,
      // discountTypes: this.discountTypes,
      checkoutDate: this.id ? this.order.checkoutDate : this.utilsService.getDateString(new Date()),

      // preferredTime: this.dataForm.value.preferredTime,
      // preferredDateString: this.utilsService.getDateString(
      //   this.dataForm.value.preferredDate
      // ),
      deliveryNote: this.dataForm.value.deliveryNote,
      user: this.order?.user ? this.order?.user : null,
      orderType: this.orderType,
      hasOrderTimeline: true,
      orderTimeline: this.id ? this.order.orderTimeline : {
        pending: {
          date: this.utilsService.getDateString(new Date()),
          time: this.utilsService.getCurrentTime(),
        },
        confirmed: {
          date: this.dataForm?.value?.orderStatus === 'Confirm' ? this.utilsService.getDateString(new Date()) : null,
          time: this.utilsService.getCurrentTime(),
        },
        processing: {
          date: this.utilsService.getDateString(new Date()),
          time: this.utilsService.getCurrentTime(),
        },
        shipped: {
          date: this.utilsService.getDateString(new Date()),
          time: this.utilsService.getCurrentTime(),
        },
        delivered: {
          date: this.utilsService.getDateString(new Date()),
          time: this.utilsService.getCurrentTime(),
        },
        cancelled: {
          date: this.utilsService.getDateString(new Date()),
          time: this.utilsService.getCurrentTime(),
        },
        returned: {
          date: this.utilsService.getDateString(new Date()),
          time: this.utilsService.getCurrentTime(),
        },
      },

    };

    // console.log(this.orderData)
    if (this.id) {
      this.updateOrderById(this.orderData);
    } else {
      this.addOrder(this.orderData);
    }


  }

  onDiscard() {
    if (this.dataForm.dirty) {
      this.openConfirmDialog();
    } else {
      this.router.navigate(['/', 'order', 'all-order']).then()
    }
  }


  /**
   * COMPONENT DIALOG VIEW
   * openConfirmDialog()
   */
  public openConfirmDialog() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '400px',
      data: {
        title: 'Confirm Discard',
        message: 'Are you sure you want discard?'
      }
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.router.navigate(['/order']).then();
      }
    });

  }

  /***
   * ON SELECT CHANGE
   * onChangeRegion()
   * onChangeArea()
   */
  onChangeRegion(event: any) {
    if (event) {
      this.getAllArea(this.dataForm.get('division')?.value);
    }
  }

  onChangeArea(event: any) {
    if (event) {
      this.getAllZone(this.dataForm.get('area')?.value);
    }
  }

  /**
   * HTTP REQ HANDLE
   * addOrder()
   * updateOrderById()
   * getAllDivision()
   * getAllArea()
   * getAllZone()
   * getOrderById()
   * getCategoryById()
   * addCategory()
   * updateCategoryById()
   * getUserDataByPhoneNo()
   */


  private addOrder(data: any) {
    this.isLoaded = true;
    this.reloadService.needRefreshData$();
    const subscription = this.orderService.addOrder(data).subscribe({
      next: (res) => {

        if (res.success) {
          this.uiService.message(res.message, 'success');
          this.dataForm.reset()
          this.allTableData = []
          if (this.incompleteOrderId){
            this.router.navigate(['/order/all-order']).then()
          }

        } else {
          this.uiService.message(res.message, 'warn');
        }
      },
      error: (error) => {
        console.log(error);
        this.isLoaded = false;
      },
    });
    this.subscriptions.push(subscription);
  }

  private updateOrderById(data: any) {
    const subscription = this.orderService
      .updateOrderById(this.order._id, data)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.uiService.message(res.message, 'success');
          } else {
            this.uiService.message(res.message, 'warn');
          }
        },
        error: (error) => {

          console.log(error);
          this.isLoaded = false;
        },
      });
    this.subscriptions.push(subscription);
  }

  private getAllDivision() {
    let mSelect = {
      name: 1,
    };
    const filter: FilterData = {
      filter: {status: 'publish'},
      select: mSelect,
      pagination: null,
      sort: {createdAt: -1},
    };

    const subscription = this.divisionService
      .getAllDivisions(filter)
      .subscribe(
        (res) => {
          if (res.success) {
            this.divisions = res.data;
          }
        },
        (err) => {
          if (err) {
            console.log(err);
          }
        }
      );
    this.subscriptions.push(subscription);
  }

  private getAllArea(id: string) {
    const select = 'name';
    const subscription = this.areaService.getAreaByParentId(id, select).subscribe(
      (res) => {
        if (res.success) {
          this.area = res.data;
        }
      },
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
    this.subscriptions.push(subscription);
  }

  private getAllZone(id: string) {
    const select = 'name';
    const subscription = this.zoneService.getZoneByParentId(id, select).subscribe(
      (res) => {
        if (res.success) {
          this.zone = res.data;
        }
      },
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
    this.subscriptions.push(subscription);
  }

  private getOrderById() {
    const subscription = this.orderService.getOrderById(this.id).subscribe(
      (res) => {
        if (res.success) {
          this.order = res.data;
          this.setDataForm();
        }
      },
      (error) => {
        console.log(error);
      }
    );
    this.subscriptions.push(subscription);
  }

  private getIncompleteOrderById() {

    // const select = ''
    const subscription = this.orderService.getIncompleteOrderById(this.incompleteOrderId).subscribe(
      (res) => {

        if (res.success) {
          this.order = res.data;
          // console.log("order details::", this.order);
          this.setDataForm();
        }
      },
      (error) => {

        console.log(error);
      }
    );
    this.subscriptions.push(subscription);
  }


  private getCategoryById() {
    const subscription = this.categoryService.getCategoryById(this.id).subscribe({
      next: (res) => {
        if (res.data) {
          this.category = res.data;
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
    this.subscriptions.push(subscription);
  }

  private addCategory() {
    const subscription = this.categoryService
      .addCategory(this.dataForm.value)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.uiService.message(res.message, 'success');
            this.formElement.resetForm();
          } else {
            this.uiService.message(res.message, 'warn');
          }
        },
        error: (error) => {
          console.log(error);
        },
      });
    this.subscriptions.push(subscription);
  }

  private updateCategoryById() {
    const subscription = this.categoryService
      .updateCategoryById(this.category._id, this.dataForm.value)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.uiService.message(res.message, 'success');
          } else {
            this.uiService.message(res.message, 'warn');
          }
        },
        error: (error) => {
          console.log(error);
        },
      });
    this.subscriptions.push(subscription);
  }

  getUserDataByPhoneNo(data: any) {
    const subscription = this.userService.getUserDataByPhoneNo(data)
      .subscribe({
        next: async res => {
          this.isLoadingPhoneNo = false;
          if (res.success) {
            this.dataForm.patchValue(res.data)
          } else {

            this.uiService.message(res.message, 'warn');
          }
        },
        error: err => {
          this.uiService.message(err?.error?.message[0], 'wrong');
          this.isLoadingPhoneNo = false;
          console.log(err)
        }
      })
    this.subscriptions.push(subscription);
  }


  /**
   * Selection Change
   * onChangeCategory()
   */
  onChangeCategory(event: MatSelectChange) {
    if (event.value) {
      const fCat = this.categories.find(f => f.name === event.value);
      this.subCategories = THEME_SUB_CATEGORIES.filter(f => f.category === fCat._id)
    }
  }


  /**
   * LOGICAL PART
   * onProductSelect()
   * deleteProducts()
   */

  onProductSelect(event: Product) {
    // console.log("event",event)

    event.quantity = 1;
    if (event?.isVariation) {
      const mData = {
        ...event,
        ...{
          variationData: event?.variationList[0],
          // variation: event?.variationList[0],
          salePrice: event?.variationList[0].salePrice,
          regularPrice: event?.variationList[0].regularPrice,
          discountAmount: event?.variationList[0].discountAmount,
          discountType: event?.variationList[0].discountType,
          costPrice: event?.variationList[0].costPrice,
        }
      }
      this.allTableData.push(mData);
      this.selectedVariation = event?.variationList[0].name
    } else {
      this.allTableData.push(event);
    }
  }

  deleteProducts() {
    this.selectedIds.forEach(m => {
      const i = this.allTableData.findIndex(f => f._id === m);
      const j = this.selectedIds.findIndex(f => f === m);
      this.allTableData.splice(i, 1)
      this.selectedIds.splice(j, 1)
    })
  }

  /**
   * Gallery Image View
   * openGallery()
   * closeGallery()
   */
  openGallery(event: any, images: string[], index?: number): void {
    event.stopPropagation();

    if (index) {
      this.selectedImageIndex = index;
    }
    this.galleryImages = images;
    this.isGalleryOpen = true;
    this.router.navigate([], {queryParams: {'gallery-image-view': true}, queryParamsHandling: 'merge'}).then();
  }

  closeGallery(): void {
    this.isGalleryOpen = false;
    this.router.navigate([], {queryParams: {'gallery-image-view': null}, queryParamsHandling: 'merge'}).then();
  }


  /**
   * CALCULATION FUNCTION
   * increment()
   * decrement()
   * variationData()
   * cartSaleSubTotal()
   * cartDiscountAmount()
   * grandTotal()
   * discountTotal()
   * onPhoneNumberInput()
   * handlePhoneNumberFilled()
   */
  increment($event: MouseEvent, index: number): void {
    $event.stopPropagation()
    this.allTableData[index].quantity += 1;
  }

  decrement($event: MouseEvent, index: number): void {
    $event.stopPropagation()
    if (this.allTableData[index].quantity > 1) {
      this.allTableData[index].quantity -= 1;
    }
  }

  variationData(item: VariationList, index: number) {

    event.stopPropagation()

    const {salePrice, discountAmount, discountType, costPrice} = item;

    // Update salePrice and variationData for the specific index
    this.allTableData[index] = {
      ...this.allTableData[index],
      salePrice,
      discountAmount,
      discountType,
      costPrice,
      variationData: item,  // Assuming you want to directly assign item here
    };
    this.selectedVariation = item.name
  }


  get cartRegularSubTotal(): number {
    return this.allTableData.map(item => {
      return this.productPricePipe.transform(
        item,
        'regularPrice',
        item.variationData?._id,
        item.quantity
      ) as number;
    }).reduce((acc, value) => acc + value, 0);
  }

  get cartSaleSubTotal(): number {
    return this.allTableData.map(item => {
      return this.productPricePipe.transform(
        item,
        'salePrice',
        item.variationData?._id,
        item.quantity
      ) as number;
    }).reduce((acc, value) => acc + value, 0);
  }

  get cartDiscountAmount(): number {
    return this.allTableData.map(item => {
      return this.productPricePipe.transform(
        item,
        'discountAmount',
        item.variationData?._id ,
        item.quantity
      ) as number;
    }).reduce((acc, value) => acc + value, 0);
  }

  get grandTotal(): number {
    return this.cartSaleSubTotal + (this.deliveryChargeAmount ?? 0) - ( this.advancePayment??0) - (this.additionalDiscountTotal ??0) - ( this.couponDiscount??0)
  }

  get discountTotal(): number {
    // return this.cartDiscountAmount + this.additionalDiscount+this.rewardPrice;
    return this.cartDiscountAmount;
  }
  get additionalDiscountTotal(): number {
    return this.additionalDiscount;
  }
  // User data get by phone number
  onPhoneNumberInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    if (input.length === 11) {
      this.isLoadingPhoneNo = true;
      this.handlePhoneNumberFilled({phoneNo: input});
    }
  }

  handlePhoneNumberFilled(data: any): void {
    // Call your function and stop the spinner after completion
    setTimeout(() => {
      this.getUserDataByPhoneNo(data)

    }, 1000); // Simulating API call or function processing delay
  }

  onAdditionalDiscountChange() {
    // Trigger change detection when additional discount changes
    this.cdr.detectChanges();
  }
  /**
   * ON Destroy
   */
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub?.unsubscribe());
  }


  orderProviderName(viewValue: any) {
    // console.log("viewvalue", viewValue);
    this.providerName = viewValue;

  }
}
