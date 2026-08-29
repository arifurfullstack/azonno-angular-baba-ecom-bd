import {AfterViewInit, Component, inject, OnDestroy, ViewChild} from '@angular/core';
import {Shop} from "../../../interfaces/common/shop.interface";
import {DataTableSelectionBase} from "../../../mixin/data-table-select-base.mixin";
import {adminBaseMixin} from "../../../mixin/admin-base.mixin";
import {NgForm} from "@angular/forms";
import {AffiliateProduct} from "../../../interfaces/common/affiliate-product.interface";
import {Select} from "../../../interfaces/core/select";
import {DATA_STATUS, TABLE_TAB_DATA} from "../../../core/utils/app-data";
import {debounceTime, distinctUntilChanged, filter, map, Subscription} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {UiService} from "../../../services/core/ui.service";
import {ReloadService} from "../../../services/core/reload.service";
import {AffiliateProductService} from "../../../services/common/affiliate-product.service";
import {PageDataService} from "../../../services/core/page-data.service";
import {Title} from "@angular/platform-browser";
import {AffiliateService} from "../../../services/common/affiliate.service";
import {AdminService} from "../../../services/common/admin.service";
import {VendorService} from "../../../services/vendor/vendor.service";

@Component({
  selector: 'app-affiliate-request',
  templateUrl: './affiliate-request.component.html',
  styleUrl: './affiliate-request.component.scss',

})
export class AffiliateRequestComponent  implements AfterViewInit, OnDestroy {


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

  copied: boolean = false;

  // Loading
  isLoading: boolean = true;

  // Active Data Store
  activeSort: number = null;
  activeFilter1: number = null;

  // Existing...
  selectedAffiliate: any = null;
  showAffiliateModal = false;

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
  private readonly adminService = inject(AdminService);
  private readonly vendorService = inject(VendorService);

  ngOnInit() {
    // Reload Data
    const subReload = this.reloadService.refreshData$.subscribe(() => {
      this.getPendingAffiliates();
    });
    this.subscriptions.push(subReload);

    // Get Data from Query Params and Load Data
    const subActivateRoute = this.activatedRoute.queryParamMap.subscribe(qParam => {
      this.currentPage = Number(qParam.get('page')) || 1;
      this.searchQuery = qParam.get('search') || '';
      this.getPendingAffiliates();
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
    this.title.setTitle('Requested Affiliate');
    this.pageDataService.setPageData({
      title: 'Requested Affiliate',
      navArray: [
        {name: 'Dashboard', url: `/dashboard`},
        {name: 'Requested Affiliate', url: null},
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
   * getPendingAffiliates()
   */

  private getPendingAffiliates() {
    const subscription = this.affiliateService.getPendingAffiliates('shop', this.vendorService.getShopId(), this.searchQuery)
      .subscribe({
        next: res => {

          this.pendingList = res.data
      console.log("pppp", res.data);
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
      this.getPendingAffiliates();
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

  openAffiliateModal(shop) {
    this.selectedAffiliate = shop.affiliate;
    this.showAffiliateModal = true;
  }

  closeAffiliateModal() {
    this.showAffiliateModal = false;
    this.selectedAffiliate = null;
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

