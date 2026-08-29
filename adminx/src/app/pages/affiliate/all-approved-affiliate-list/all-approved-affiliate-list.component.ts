import {AfterViewInit, Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormGroup, NgForm} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {Title} from "@angular/platform-browser";
import {ActivatedRoute, Router} from "@angular/router";
import {debounceTime, distinctUntilChanged, filter, map, Subscription} from "rxjs";
import {environment} from "../../../../environments/environment";
import {DATA_STATUS, TABLE_TAB_DATA} from "../../../core/utils/app-data";
import {AffiliateProduct} from "../../../interfaces/common/affiliate-product.interface";
import {NavBreadcrumb} from "../../../interfaces/core/nav-breadcrumb.interface";
import {Select} from "../../../interfaces/core/select";

import {AffiliateProductService} from "../../../services/common/affiliate-product.service";
import {AffiliateService} from "../../../services/common/affiliate.service";
import {PageDataService} from "../../../services/core/page-data.service";
import {ReloadService} from "../../../services/core/reload.service";
import {UiService} from "../../../services/core/ui.service";
import {
  PaymentInstructionDialogComponent
} from "../../../shared/dialog-view/payment-instruction-dialog/payment-instruction-dialog.component";
import {VendorService} from "../../../services/vendor/vendor.service";
import {ShopService} from "../../../services/common/shop.service";

@Component({
  selector: 'app-all-approved-affiliate-list',
  templateUrl: './all-approved-affiliate-list.component.html',
  styleUrls: ['./all-approved-affiliate-list.component.scss']
})
export class AllApprovedAffiliateListComponent implements OnInit, AfterViewInit, OnDestroy {


  // Decorator
  @ViewChild('searchForm', {static: true}) private searchForm: NgForm;

  // Store Data

  protected categories: AffiliateProduct[] = [];
  protected dataStatus: Select[] = DATA_STATUS;
  protected tableTabData: Select[] = TABLE_TAB_DATA;
  protected selectedTab: string = this.tableTabData[0].value;


  // Gallery View
  protected isGalleryOpen: boolean = false;
  protected galleryImages: string[] = [];
  protected selectedImageIndex: number = 0;

  // Pagination
  protected currentPage = 1;
  protected totalData = 0;
  protected dataPerPage = 10;

  // Filter
  filter: any = null;
  defaultFilter: any = null;
  searchQuery = null;

  // Store data
  affiliate?: any;
  pendingList?: any;
  shopData: any = null;
  id: string = null;
  dataForm?: FormGroup;
  copied: boolean = false;
  private readonly shopDataBaseUrl: string = environment.vendorBaseUrl;

  // Nav Data
  navArray: NavBreadcrumb[] = [
    {name: 'Dashboard', url: `/${this.shopDataBaseUrl}/dashboard`},
    {name: 'Admin', url: `/${this.shopDataBaseUrl}/shopData`},
  ];

  // Loading
  isLoading: boolean = true;

  // Active Data Store
  activeSort: number = null;
  activeFilter1: number = null;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Inject
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly uiService = inject(UiService);
  private readonly reloadService = inject(ReloadService);

  private readonly affiliateProductService = inject(AffiliateProductService);
  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);
  private readonly affiliateService = inject(AffiliateService);
  private readonly vendorService = inject(VendorService);
  private readonly shopService = inject(ShopService);


  ngOnInit() {
    // Reload Data
    const subReload = this.reloadService.refreshData$.subscribe(() => {
      this.getAllApprovedAffiliates();
    });
    this.subscriptions.push(subReload);

    // Get Data from Query Params and Load Data
    const subActivateRoute = this.activatedRoute.queryParamMap.subscribe(qParam => {
      this.currentPage = Number(qParam.get('page')) || 1;
      this.searchQuery = qParam.get('search') || '';
      this.getAllApprovedAffiliates();

    });
    this.subscriptions.push(subActivateRoute);

    // Base Data
    this.setPageData();
  }


  ngAfterViewInit(): void {

    const formValue = this.searchForm.valueChanges;
    const subSearch = formValue.pipe(
      map((t: any) => t['searchTerm']),
      filter(() => this.searchForm.valid),
      debounceTime(500),
      distinctUntilChanged(),
    ).subscribe((searchTerm: string) => {
      if (searchTerm) {
        // Update query params with the new search term
        this.router.navigate([], {
          queryParams: {search: searchTerm},
          queryParamsHandling: 'merge'
        }).then();
      } else {
        // Remove search query param when input is empty
        this.router.navigate([], {
          queryParams: {search: null},
          queryParamsHandling: 'merge'
        }).then();
      }
    });

    this.subscriptions.push(subSearch);
  }


  openPaymentInstructionDialog() {
    const shopId = this.vendorService.getShopId();
    if (!shopId) {
      this.uiService.message('Shop ID not found', 'warn');
      return;
    }

    this.shopService.getShopById(shopId)
      .subscribe({
        next: (res) => {
          if (res.data) {
            this.shopData = res.data;
            const dialogRef = this.dialog.open(PaymentInstructionDialogComponent, {
              data: {shopData: this.shopData}
            });

            dialogRef.afterClosed().subscribe(result => {
              if (result) {
                this.shopService.updateShopById(this.shopData._id, result)
                  .subscribe({
                    next: () => {
                      this.uiService.message('Payment instructions updated successfully', 'success');
                    },
                    error: (err) => {
                      console.error(err);
                      this.uiService.message('Failed to update payment instructions', 'warn');
                    }
                  });
              }
            });
          } else {
            // this.uiService.message('Admin data not found');
          }
        },
        error: (err) => {
          console.error(err);
          // this.uiService.message('Failed to load shopData data');
        }
      });
  }

  private setFormValue() {
    this.dataForm.patchValue({...this.shopData});
  }

  //Demo
  changeStatus(item: any, status: 'approved' | 'blocked' | 'pending') {
    this.affiliateService.updateAffiliateStatus('shop', this.vendorService.getShopId(), item.affiliate._id, status)
      .subscribe(res => {
        console.log(res.message);
        this.reloadService.needRefreshData$()

      });
  }

  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Approved Affiliate');
    this.pageDataService.setPageData({
      title: 'Approved Affiliate',
      navArray: [
        {name: 'Dashboard', url: `/dashboard`},
        {name: 'Approved Affiliate', url: null},
      ]
    })
  }


  /**
   * Handle Tab
   * onTabChange()
   */
  onTabChange(data: string) {
    this.selectedTab = data;
    if (data === 'all') {
      this.filter = null;
    } else {
      this.filter = {status: data}
    }

    this.onClearDataQuery(this.filter);
  }

  /**
   * HTTP REQ HANDLE
   * getAllApprovedAffiliates()
   */

  private getAllApprovedAffiliates() {
    const subscription = this.affiliateService.getAllApprovedAffiliates('shop', this.vendorService.getShopId(), this.searchQuery)
      .subscribe({
        next: res => {

          this.pendingList = res.data
        },
        error: err => {
          console.log(err)
        }
      })
    this.subscriptions.push(subscription);
  }


  /**
   * Filter & Sort Methods
   * reFetchData()
   * sortData()
   * filterData()
   * onClearDataQuery()
   * onClearSearch()
   * isFilterChange()
   */

  private reFetchData() {
    if (this.currentPage > 1) {
      this.router.navigate([], {queryParams: {page: 1}}).then();
    } else {
      this.getAllApprovedAffiliates();
    }
  }


  onClearDataQuery(filter?: any) {
    this.activeSort = null;
    this.activeFilter1 = null;

    this.filter = filter ?? null;
    // Re fetch Data
    this.reFetchData();
  }

  onClearSearch() {
    this.searchForm.reset();
    this.searchQuery = null;
    this.router.navigate([], {queryParams: {search: null}}).then();
  }

  /**
   * PAGINATION CHANGE
   * onPageChanged()
   */
  public onPageChanged(event: any) {
    this.router.navigate([], {queryParams: {page: event}}).then();
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


