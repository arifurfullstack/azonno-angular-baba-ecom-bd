import { DatePipe } from "@angular/common";
import { Component, inject, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup } from "@angular/forms";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";
import { Subscription } from "rxjs";
import { environment } from "../../../../environments/environment";
import { OVERVIEW_FILTER } from "../../../core/utils/app-data";
import { ShopInformation } from "../../../interfaces/common/shop-information.interface";
import { Select } from "../../../interfaces/core/select";
import { FilterData } from "../../../interfaces/gallery/filter-data";
import { DashboardService } from "../../../services/common/dashboard.service";
import { ShopPackageInfo, ShopPackageService } from '../../../services/core/shop-package.service';
import { UtilsService } from "../../../services/core/utils.service";
import { VendorService } from "../../../services/vendor/vendor.service";

@Component({
  selector: 'app-dashboard-card',
  templateUrl: './dashboard-card.component.html',
  styleUrl: './dashboard-card.component.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardCardComponent implements OnInit, OnDestroy {

  // Store Data

  private readonly NOTICE_HIDDEN_KEY = 'expire_notice_hidden';
  dashboardData: any;
  courierData: any;
  totalProducts: any;
  defaultFilter: any;
  filter: any;
  isExpire: boolean = false;
  showExpireNotice: boolean = false;
  shopInfo: ShopInformation;
  shopPackageInfo: ShopPackageInfo | null = null;
  paymentBaseLink = environment.paymentBaseLink;
  protected readonly overviewFilters: Select[] = OVERVIEW_FILTER;
  isDataLoaded: boolean = false;

  // Active Filter Data
  selectedOverviewFilter: Select = null;


  // Date Filter
  today = new Date();
  dataFormDateRange = new FormGroup({
    start: new FormControl(),
    end: new FormControl(),
  });

  // Inject
  private readonly dashboardService = inject(DashboardService);
  private readonly utilsService = inject(UtilsService);
  private readonly datePipe = inject(DatePipe);
  private readonly vendorService = inject(VendorService);
  private readonly shopPackageService = inject(ShopPackageService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Subscriptions
  private subscriptions: Subscription[] = [];
  private timeoutId: any;

  ngOnInit() {
    this.setDefaultFilter();
    this.getVendorDashboard();
    this.getDashboardProductCountByVendor();

    const sub = this.shopPackageService.shopPackageInfo$.subscribe(info => {
      this.shopPackageInfo = info;

      const isNoticeHidden = sessionStorage.getItem(this.NOTICE_HIDDEN_KEY) === 'true';

      // Detect the default value emitted by the BehaviorSubject
      const isDefault = info && info.currentBalance === 0 && info.expireDay === 0 && info.trialPeriod === 0 && info.shopType === 'free';

      this.isExpire = Boolean(
        !isDefault &&
        this.shopPackageInfo &&
        this.shopPackageInfo.expireDay >= 0 &&
        this.shopPackageInfo.expireDay <= 3
      );

      this.showExpireNotice = !isNoticeHidden && this.isExpire;

      this.isDataLoaded = true;
      this.cdr.markForCheck();
    });

    this.subscriptions.push(sub);
  }



  /**
   * HTTP Req Handle
   * getVendorDashboard()
   */

  private getVendorDashboard() {
    const filterData: FilterData = {
      pagination: null,
      filter: this.filter,
    }

    const sub = this.dashboardService.getAllDashboardOrders(filterData, null)
      .subscribe({
        next: res => {
          this.dashboardData = res.data;
          this.courierData = res.courier;
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('Error fetching dashboard orders:', err);
        }
      });

    this.subscriptions.push(sub);
  }


  private getDashboardProductCountByVendor() {
    const sub = this.dashboardService.getDashboardProductCountByVendor()
      .subscribe({
        next: res => {
          // this.dashboardCategoryData = res.data;
          // this.chartFunctionality();
          this.totalProducts = res.data.totalProducts;
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('Error fetching product count:', err);
        }
      });

    this.subscriptions.push(sub);
  }

  /**
   * Filter
   * setDefaultFilter()
   * endChangeRegDateRange()
   * onFilterChange()
   * isFilterChange()
   * dateFilterTitle()
   * onClearFilter()
   */
  private setDefaultFilter() {
    this.selectedOverviewFilter = this.overviewFilters[0];

    const startDate = this.utilsService.getDateString(new Date());
    const endDate = this.utilsService.getDateString(new Date());

    this.defaultFilter = {checkoutDate: {$gte: startDate, $lte: endDate}};
    this.filter = this.defaultFilter;
  }

  endChangeRegDateRange(event: MatDatepickerInputEvent<any>) {
    if (event.value) {
      const startDate = this.utilsService.getDateString(
        this.dataFormDateRange.value.start
      );
      const endDate = this.utilsService.getDateString(
        this.dataFormDateRange.value.end
      );
      this.filter = {checkoutDate: {$gte: startDate, $lte: endDate}};
      // Re fetch Data
      this.getVendorDashboard();
    }
  }

  onFilterChange(type: 'overviewFilter', value: string) {
    if (type === 'overviewFilter') {
      this.selectedOverviewFilter = this.overviewFilters.find(f => f.value === value);
      let startDate: string, endDate: string;
      const today = new Date();
      switch (value) {
        case 'today':
          startDate = this.utilsService.getDateString(new Date());
          endDate = this.utilsService.getDateString(new Date());
          this.filter = {checkoutDate: {$gte: startDate, $lte: endDate}};
          break;
        case 'lastDays':
          const yesterday = new Date(today.setDate(today.getDate() - 1));
          startDate = this.utilsService.getDateString(yesterday);
          endDate = this.utilsService.getDateString(yesterday);
          this.filter = {checkoutDate: {$gte: startDate, $lte: endDate}};
          break;
        case 'thisWeek':
          const currentWeekDay = today.getDay(); // Sunday is 0, Monday is 1, and so on.
          const startOfWeek = new Date(today.setDate(today.getDate() - currentWeekDay));
          startDate = this.utilsService.getDateString(startOfWeek);
          endDate = this.utilsService.getDateString(new Date());
          this.filter = {checkoutDate: {$gte: startDate, $lte: endDate}};
          break;

        case 'lastWeek':
          const lastWeekEnd = new Date(today.setDate(today.getDate() - today.getDay() - 1));
          const lastWeekStart = new Date(today.setDate(today.getDate() - 6)); // 6 days before the end of last week.
          startDate = this.utilsService.getDateString(lastWeekStart);
          endDate = this.utilsService.getDateString(lastWeekEnd);
          this.filter = {checkoutDate: {$gte: startDate, $lte: endDate}};
          break;

        case 'last7Days':
          startDate = this.utilsService.getDateString(new Date(today.setDate(today.getDate() - 7)));
          endDate = this.utilsService.getDateString(new Date());
          this.filter = {checkoutDate: {$gte: startDate, $lte: endDate}};
          break;

        case 'last15Days':
          startDate = this.utilsService.getDateString(new Date(today.setDate(today.getDate() - 15)));
          endDate = this.utilsService.getDateString(new Date());
          this.filter = {checkoutDate: {$gte: startDate, $lte: endDate}};
          break;

        case 'last30Days':
          startDate = this.utilsService.getDateString(new Date(today.setDate(today.getDate() - 30)));
          endDate = this.utilsService.getDateString(new Date());
          this.filter = {checkoutDate: {$gte: startDate, $lte: endDate}};
          break;

        case 'thisMonth':
          startDate = this.utilsService.getDateString(new Date(today.getFullYear(), today.getMonth(), 1));
          endDate = this.utilsService.getDateString(today);
          this.filter = {checkoutDate: {$gte: startDate, $lte: endDate}};
          break;

        case 'lastMonth':
          const lastMonth = new Date(today.setMonth(today.getMonth() - 1));
          startDate = this.utilsService.getDateString(new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1));
          endDate = this.utilsService.getDateString(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0));
          this.filter = {checkoutDate: {$gte: startDate, $lte: endDate}};
          break;
        default:
          startDate = this.utilsService.getDateString(new Date());
          endDate = this.utilsService.getDateString(new Date());
          this.filter = {checkoutDate: {$gte: startDate, $lte: endDate}};
          break;
      }
    }

    // Fetch Data
    this.getVendorDashboard();

  }

  get isFilterChange(): boolean {
    if (!this.filter) {
      return false;
    } else {
      return !this.utilsService.checkObjectDeepEqual(this.defaultFilter, this.filter);
    }
  }

  get dateFilterTitle() {
    if (this.dataFormDateRange.get('start').value && this.dataFormDateRange.get('end').value) {
      const startDate = this.datePipe.transform(this.dataFormDateRange.get('start').value, 'mediumDate');
      const endDate = this.datePipe.transform(this.dataFormDateRange.get('end').value, 'mediumDate');
      if (startDate === endDate) {
        return endDate;
      } else {
        return startDate + '-' + endDate;
      }
    } else {
      return 'Filter in Date'
    }
  }

  onClearFilter() {
    this.dataFormDateRange.reset();
    this.setDefaultFilter();
    this.getVendorDashboard();
  }

  /**
   * Access Control
   * isAccess()
   */
  isAccess(type: string): boolean {
    const isExist = this.vendorService.userMenu.find(f => f.routerLink === type);
    return !!isExist;
  }

  closeExpireNotice() {
    this.isExpire = false;
    this.showExpireNotice = false; // <-- Add this line
    sessionStorage.setItem(this.NOTICE_HIDDEN_KEY, 'true');
    this.cdr.markForCheck();
  }

  payNow() {
    const url = `${this.paymentBaseLink}/shop-payment/${this.vendorService.getShopId()}`;
    window.open(url, '_blank');
  }

  /**
   * ON Destroy
   */

  ngOnDestroy() {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub?.unsubscribe());

    // Clear Timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }


}
