import {Component, inject, OnDestroy, OnInit} from '@angular/core';

import { Clipboard } from "@angular/cdk/clipboard";
import { DatePipe } from "@angular/common";
import { MatDialog } from "@angular/material/dialog";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { ORDER_STATUS, PAYMENT_STATUS } from "../../../core/utils/app-data";
import { Order } from "../../../interfaces/common/order.interface";
import { User } from "../../../interfaces/common/user.interface";
import { Select } from "../../../interfaces/core/select";
import { OrderService } from "../../../services/common/order.service";
import { CountryService } from "../../../services/core/country.service";
import { ReloadService } from "../../../services/core/reload.service";
import { UiService } from "../../../services/core/ui.service";
import {
  CourierSelectionDialogComponent
} from "../../../shared/dialog-view/courier-selection-dialog/courier-selection-dialog.component";
import { ProductPricePipe } from "../../../shared/pipes/product-price.pipe";
import { FraudCheckerComponent } from "./fraud-checker/fraud-checker.component";
import {SettingService} from "../../../services/common/setting.service";


@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.scss',
  providers: [ProductPricePipe, DatePipe],
})
export class OrderDetailsComponent implements OnInit, OnDestroy {
  // Static Data
  paymentStatus: Select[] = PAYMENT_STATUS;
  orderStatus: Select[] = ORDER_STATUS;


  // Store Data
  id?: string;
  order?: Order;
  user?: User;
  courierData?: any;
  isLoading: boolean = false;
  isCountryBD: boolean = false;
  country: any;
  orderSetting: any;
  public invoiceSetting:any;

  isModalVisible: boolean = true;
  // Subscriptions
  private subscriptions: Subscription[] = [];
  private readonly countryService = inject(CountryService);
  private readonly settingService = inject(SettingService);



  constructor(
    private activatedRoute: ActivatedRoute,
    private uiService: UiService,
    private orderService: OrderService,
    private reloadService: ReloadService,
    private dialog: MatDialog,
    private  clipboard : Clipboard

  ) {}

  ngOnInit(): void {

    this.countryService.getShopCountryInfo().subscribe(setting => {

      // console.log("setting",setting)
      // if (setting?.country) {
      this.orderSetting = setting?.orderSetting;
      this.country = setting?.country?.name || 'Bangladesh';
      if(this.country){
        this.updateMenu();
      }
      // }
    });

    // GET ID FORM PARAM
    const subRoute = this.activatedRoute.paramMap.subscribe((param) => {
      this.id = param.get('id');
      if (this.id) {
        this.getOrderById();
      }
    });

    this.subscriptions.push(subRoute);

    const subReload = this.reloadService.refreshData$.subscribe(() => {
      this.getOrderById();
    });
    this.subscriptions.push(subReload);
    this.getSetting();
  }


  /**
   * HTTP REQ HANDLE
   *  getOrderById()
   *  getUserById()
   * addOrder()
   * updateOrderById()
   * resetValue()
   */
  private getOrderById() {

    // const select = ''
    const subscription = this.orderService.getOrderById(this.id).subscribe(
      (res) => {

        if (res.success) {
          this.order = res.data;
        }
      },
      (error) => {

        console.log(error);
      }
    );
    this.subscriptions.push(subscription);
  }

  public updateOrderById(data: any) {
    const subscription = this.orderService
      .updateOrderById(this.order._id, data)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.uiService.message(res.message, 'success');
            this.reloadService.needRefreshData$();
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


  openAdvancePaymentDialog() {
    this.isLoading = true;
    const subscription = this.orderService
      .checkedFraudOrder(this.order?.phoneNo )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.courierData  = res.data?.courierData;
            this.isLoading = false;

            this.uiService.message(res.message, 'success');
            this.reloadService.needRefreshData$();
            const dialogRef = this.dialog.open(FraudCheckerComponent, {
              maxWidth: "900px",
              width: "100%",
              height: "auto",
              panelClass: 'custom-dialog-container',
              data: { mobile: this.order?.phoneNo,
                courierData: this.courierData,
              }
            });

            dialogRef.afterClosed().subscribe(result => {
              if (result) {
              }
            });
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

  copyToClipboard($event: Event, text: string): void {
    $event.stopPropagation();

    const fullUrl = `${text}`;
    this.clipboard.copy(fullUrl);
    this.uiService.message('Consignment Id copied successfully.', 'success');
  }

  getProductImage(item: any): string {
    return item?.variation?.image || item?.image || 'https://cdn.saleecom.com/upload/images/placeholder.png';
  }

  openCourierDialog(data:any) {
    const dialogRef = this.dialog.open(CourierSelectionDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Selected Courier:', result);
        // এখানে API Call করো বা Order Create করো:
        this.updateOrderById(data);
      } else {
        console.log('Dialog closed without selection');
      }
    });
  }

  private updateMenu() {

    if (this.country !== 'Bangladesh') {
      this.isCountryBD= true;
    }
  }

  private getSetting() {
    const subscription = this.settingService.getSetting('invoiceSetting orderSetting')
      .subscribe({
        next: res => {
          if (res.data) {
            this.invoiceSetting = res.data?.invoiceSetting;
            this.orderSetting = res.data?.orderSetting;
          }
        },
        error: err => {
          console.log(err)
        }
      });

    this.subscriptions.push(subscription);
  }

  /**
   * ON Destroy
   */
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub?.unsubscribe());
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
