import {Component, OnInit} from '@angular/core';
import {Select} from "../../../interfaces/core/select";
import {ORDER_STATUS, PAYMENT_STATUS} from "../../../core/utils/app-data";
import {Order} from "../../../interfaces/common/order.interface";
import {User} from "../../../interfaces/common/user.interface";
import {Subscription} from "rxjs";
import {ActivatedRoute} from "@angular/router";
import {UiService} from "../../../services/core/ui.service";
import {OrderService} from "../../../services/common/order.service";
import {ReloadService} from "../../../services/core/reload.service";
import {MatDialog} from "@angular/material/dialog";
import {FraudCheckerComponent} from "../../order/order-details/fraud-checker/fraud-checker.component";
import {ProductPricePipe} from "../../../shared/pipes/product-price.pipe";
import {DatePipe} from "@angular/common";

@Component({
  selector: 'app-incomplete-order-details',
  templateUrl: './incomplete-order-details.component.html',
  styleUrl: './incomplete-order-details.component.scss',
  providers: [ProductPricePipe, DatePipe],
})
export class IncompleteOrderDetailsComponent implements OnInit {
  // Static Data
  paymentStatus: Select[] = PAYMENT_STATUS;
  orderStatus: Select[] = ORDER_STATUS;


  // Store Data
  id?: string;
  order?: Order;
  user?: User;
  courierData?: any;
  isLoading: boolean = false;

  isModalVisible: boolean = true;
  // Subscriptions
  private subscriptions: Subscription[] = [];


  constructor(
    private activatedRoute: ActivatedRoute,
    private uiService: UiService,
    private orderService: OrderService,
    private reloadService: ReloadService,
    private dialog: MatDialog // ✅ correct way

  ) {}

  ngOnInit(): void {

    // GET ID FORM PARAM
    const subRoute = this.activatedRoute.paramMap.subscribe((param) => {
      this.id = param.get('id');
      if (this.id) {
        this.getIncompleteOrderById();
      }
    });

    this.subscriptions.push(subRoute);

    const subReload = this.reloadService.refreshData$.subscribe(() => {
      this.getIncompleteOrderById();
    });
    this.subscriptions.push(subReload);
  }


  /**
   * HTTP REQ HANDLE
   *  getIncompleteOrderById()
   *  getUserById()
   * addOrder()
   * updateOrderById()
   * resetValue()
   */
  private getIncompleteOrderById() {

    // const select = ''
    const subscription = this.orderService.getIncompleteOrderById(this.id).subscribe(
      (res) => {

        if (res.success) {
          this.order = res.data;
          console.log("order details::", this.order);
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
