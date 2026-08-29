import {AfterViewInit, Component, Inject, inject, Input, OnDestroy, OnInit, Optional, ViewChild} from '@angular/core';
import {NgForm} from "@angular/forms";
import {NavBreadcrumb} from "../../interfaces/core/nav-breadcrumb.interface";
import {Theme} from "../../interfaces/common/theme.interface";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {UiService} from "../../services/core/ui.service";
import {Router} from "@angular/router";
import {PageDataService} from "../../services/core/page-data.service";
import {Title} from "@angular/platform-browser";
import {ThemeService} from "../../services/common/theme.service";
import {debounceTime, distinctUntilChanged, EMPTY, filter, map, Subscription, switchMap} from "rxjs";
import {Pagination} from "../../interfaces/core/pagination";
import {FilterData} from "../../interfaces/gallery/filter-data";
import {YoutubeVideoShowComponent} from "../../shared/dialog-view/youtube-video-show/youtube-video-show.component";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {VendorService} from "../../services/vendor/vendor.service";


@Component({
  selector: 'app-new-release-report',
  templateUrl: './new-release-report.component.html',
  styleUrl: './new-release-report.component.scss',
  animations: [
    trigger('fadeIn', [
      state('hidden', style({
        opacity: 0,
        transform: 'translateY(20px)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('hidden => visible', [
        animate('300ms ease-out')
      ])
    ])
  ]
})
export class NewReleaseReportComponent implements OnInit, AfterViewInit, OnDestroy {
  // Decorator
  @ViewChild('searchForm', {static: true}) private searchForm: NgForm;


  @Input() navArray: NavBreadcrumb[] = [];
  searchQuery = null;
  // Store Data
  protected holdPrevData: Theme[] = [];
  protected isLoadingData: boolean = false;
  protected isLoading: boolean = false;
  protected totalData = 0;
  // Store Data

  private holdPrevTheme: Theme[] = [];
  allTableData: Theme[] = [];

  // Pagination
  dataPerPage = 20;
  totalDataStore = 0;
  currentPage = 1;

  // Select
  private readonly select: any = {
    name: 1,
    url: 1,
    note: 1,
    version: 1,
    createdAt: 1,
  }

  // Inject
  private readonly dialog = inject(MatDialog);
  private readonly uiService = inject(UiService);
  private readonly router = inject(Router);
  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);
  private readonly themeService = inject(ThemeService);
  private readonly vendorService = inject(VendorService);

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(

    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: { type: string, count?: number }
  ) {
  }

  ngOnInit() {
    // Base Data
    this.getAllNewReleaseReport();
    this.setPageData();
  }


  ngAfterViewInit(): void {
    const formValue = this.searchForm.valueChanges;

    const subSearch = formValue.pipe(
      map((t: any) => t['searchTerm']),
      filter(() => this.searchForm.valid),
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(data => {
        this.searchQuery = data;
        // Reset Pagination
        this.currentPage = 1;
        if (this.searchQuery === '' || this.searchQuery === null) {

          this.allTableData = this.holdPrevTheme;
          this.totalData = this.totalDataStore;
          this.searchQuery = null;
          return EMPTY;
        }
        const pagination: Pagination = {
          pageSize: Number(this.dataPerPage),
          currentPage: Number(this.currentPage) - 1
        };

        const filterData: FilterData = {
          pagination: pagination,
          filter: {theme:this.vendorService.getThemeId()},
          select: this.select,
          sort: {createdAt: -1}
        }
        return this.themeService.getAllNewReleaseReport(filterData, this.searchQuery);
      })
    ).subscribe({
      next: res => {

        this.allTableData = res.data;

        this.totalData = res.count;
      },
      error: err => {
        console.log(err)
      }
    });
    this.subscriptions.push(subSearch);
  }


  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('New Release');
    this.pageDataService.setPageData({
      title: 'New Release',
      navArray: [
        {name: 'Dashboard', url: `/dashboard`},
        {name: 'New Release', url: ''},
      ]
    })
  }


  /**
   * HTTP REQ HANDLE
   * getAllGalleries()
   */

  private getAllNewReleaseReport(loadMore?: boolean) {
    this.isLoadingData = true;
    const pagination: any = {
      pageSize: Number(this.dataPerPage),
      currentPage: Number(this.currentPage) - 1
    };


    const filterData: FilterData = {
      pagination: pagination,
      filter: {theme:this.vendorService.getThemeId()},
      select: this.select,
      sort: {createdAt: -1}
    }


    const subscription = this.themeService.getAllNewReleaseReport(filterData, this.searchQuery)
      .subscribe({
        next: res => {
          if (loadMore) {
            // Same API loading logic as above...
            const newGalleries = res.data.map(gallery => ({
              ...gallery,
              state: 'hidden' // Initially hidden for animation
            }));
            this.totalData = res?.count;
            this.allTableData = [...this.allTableData, ...newGalleries];


            // this.galleries = [...this.galleries, ...res.data];
            this.isLoading = false;
          } else {
            this.allTableData = res.data;

            this.holdPrevTheme = this.allTableData;
          }

          this.totalData = res.count;
          if (!this.searchQuery) {
            this.holdPrevData = this.allTableData;
            this.totalDataStore = res.count;
          }
          this.isLoadingData = false;
        }, error: err => {
          // this.isLoadingData = false;
          console.log(err)
        }
      });
    this.subscriptions.push(subscription);
  }


  /**
   * LOAD MORE
   * loadMoreGalleries()
   */
  loadMoreData() {
    if (this.isLoading || this.allTableData.length >= this.totalData) return;
    this.isLoading = true;
    this.currentPage += 1;
    this.getAllNewReleaseReport(true);
  }



  onClearSearch() {
    this.searchForm.reset();
    this.searchQuery = null;
    this.router.navigate([], {queryParams: {search: null}}).then();
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

