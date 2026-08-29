import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {Title} from '@angular/platform-browser';
import {PageDataService} from '../../../services/core/page-data.service';
import {OrderService} from '../../../services/common/order.service';
import {SettingService} from "../../../services/common/setting.service";

@Component({
  selector: 'app-invoice',
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.scss'
})
export class InvoiceComponent implements OnInit, OnDestroy {

  // Store Data
  id: string;
  invoice: any;
  private intervalId: any;
  orderSetting: any;
  isEnableInvoiceSetting: boolean;

  // Loading Control
  isLoading: boolean = true;

  // Inject
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly title = inject(Title);
  private readonly pageDataService = inject(PageDataService);
  private readonly settingService = inject(SettingService);


  // Subscriptions
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    const subscription = this.activatedRoute.paramMap.subscribe((param) => {
      this.id = param.get('id');
      if (this.id) {
        this.generateInvoiceById();
      }
    });
    this.subscriptions.push(subscription);

    this.setPageData();
    this.getSetting();

    // Listen for when the print dialog is closed or printing is done
    // window.onafterprint = () => {
    //   this.router.navigate(['/bill/all-bill']).then();
    // };

  }

  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Invoice');
    this.pageDataService.setPageData({
      title: 'Invoice',
      navArray: [
        {name: 'Dashboard', url: `/dashboard`},
        {name: 'Invoice', url: null},
      ]
    })
  }

  /**
   * HTTP Req Handle
   * generateInvoiceById()
   */

  generateInvoiceById() {
    const subscription = this.orderService.generateInvoiceById(this.id)
      .subscribe({
        next: (res) => {
          this.invoice = res.data;
          this.isLoading = false;
          if (this.invoice) {
            this.title.setTitle(`Invoice #${this.invoice.orderId}`);
            // Automatically trigger the print dialog
            setTimeout(() => {
              this.printInvoice();
            }, 0)
          }
        },
        error: (err) => {
          console.log(err)
        }
      });
    this.subscriptions.push(subscription);
  }

  private getSetting() {
    const subscription = this.settingService.getSetting('orderSetting')
      .subscribe({
        next: res => {
          if (res.data && res.data.orderSetting) {
            this.orderSetting = res.data;
            this.isEnableInvoiceSetting = this.orderSetting?.orderSetting?.isEnableInvoiceSetting;
          }
        },
        error: err => {
          console.log(err)
        }
      });

    this.subscriptions.push(subscription);
  }

  getTotaQuantity(data:any){
    let qty = 0
    data.forEach(mm=> {
      qty +=   mm.quantity
    })
    return qty
  }
  /**
   * Print Method
   * printInvoice()
   * checkImagesLoadedPeriodically()
   */

  protected printInvoice(): void {
    // window.print();
   /** When Image Need Loaded **/
    this.checkImagesLoadedPeriodically()
  }

  private checkImagesLoadedPeriodically() {
    const images: NodeListOf<HTMLImageElement> = document.querySelectorAll('img');
    this.intervalId = setInterval(() => {
      const allImagesLoaded = Array.from(images).every((img) => img.complete && img.naturalHeight > 0);
      if (allImagesLoaded) {
        clearInterval(this.intervalId);
        window.print();
      }
    }, 500);
  }

  /**
   * ON Destroy
   */
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub?.unsubscribe());
    // Clean up the event listener
    window.onafterprint = null;

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }


  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
