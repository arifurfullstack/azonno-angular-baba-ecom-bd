import { AfterViewInit, Component, Inject, inject, Input, OnDestroy, OnInit, Optional, ViewChild } from '@angular/core';
import { Gallery } from "../../interfaces/gallery/gallery.interface";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { UiService } from "../../services/core/ui.service";
import { Router } from "@angular/router";
import { PageDataService } from "../../services/core/page-data.service";
import { Title } from "@angular/platform-browser";
import { FilterData } from "../../interfaces/gallery/filter-data";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { YoutubeVideoShowComponent } from "../../shared/dialog-view/youtube-video-show/youtube-video-show.component";
import { NavBreadcrumb } from "../../interfaces/core/nav-breadcrumb.interface";
import { TutorialService } from "../../services/common/tutorial.service";
import { Pagination } from "../../interfaces/core/pagination";
import { Tutorial } from "../../interfaces/common/tutorial.interface";
import { NgForm } from "@angular/forms";
import { debounceTime, distinctUntilChanged, EMPTY, filter, map, Subscription, switchMap } from "rxjs";

@Component({
  selector: 'app-tutorial-page',
  templateUrl: './tutorial-page.component.html',
  styleUrl: './tutorial-page.component.scss',
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
export class TutorialPageComponent implements OnInit, AfterViewInit, OnDestroy {
  // Decorator
  @ViewChild('searchForm', { static: true }) private searchForm: NgForm;


  @Input() navArray: NavBreadcrumb[] = [];
  searchQuery = null;
  // Store Data
  protected holdPrevData: Tutorial[] = [];
  protected isLoadingData: boolean = false;
  protected isLoading: boolean = false;
  protected totalData = 0;
  // Store Data

  private holdPrevTutorial: Tutorial[] = [];
  allTableData: Tutorial[] = [];

  // Pagination
  dataPerPage = 20;
  totalDataStore = 0;
  currentPage = 1;

  // Select
  private readonly select: any = {
    name: 1,
    url: 1,
    keyword: 1,
    image: 1,
    createdAt: 1,
  }

  // Inject
  private readonly dialog = inject(MatDialog);
  private readonly uiService = inject(UiService);
  private readonly router = inject(Router);
  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);
  private readonly tutorialService = inject(TutorialService);

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    @Optional() public dialogRef: MatDialogRef<TutorialPageComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: { type: string, count?: number }
  ) {
  }

  ngOnInit() {
    // Base Data
    this.getAllTutorial();
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

          this.allTableData = this.holdPrevTutorial;
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
          filter: null,
          select: this.select,
          sort: { createdAt: -1 }
        }
        return this.tutorialService.getAllTutorial(filterData, this.searchQuery);
      })
    ).subscribe({
      next: res => {

        this.allTableData = res.data;
        if (this.allTableData && this.allTableData.length) {
          this.allTableData.forEach((m, i) => {
            this.allTableData[i].keywordArr = this.allTableData[i].keyword.split(',')
          });
        }
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
    this.title.setTitle('Gallery');
    this.pageDataService.setPageData({
      title: 'Gallery',
      navArray: [
        { name: 'Dashboard', url: `/dashboard` },
        { name: 'Gallery', url: 'https://youtu.be/sHDmxMrCfCw?si=RUUVFz-jfjHL4zW4' },
      ]
    })
  }


  /**
   * HTTP REQ HANDLE
   * getAllGalleries()
   */

  private getAllTutorial(loadMore?: boolean) {
    this.isLoadingData = true;
    const pagination: any = {
      pageSize: Number(this.dataPerPage),
      currentPage: Number(this.currentPage) - 1
    };


    const filterData: FilterData = {
      pagination: pagination,
      filter: null,
      select: this.select,
      sort: { createdAt: -1 }
    }


    const subscription = this.tutorialService.getAllTutorial(filterData, this.searchQuery)
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
            this.allTableData.forEach(item => item.keywordArr = item.keyword.split(','));

            // Trigger animation by setting the state to 'visible' after the data loads
            setTimeout(() => {
              this.allTableData.forEach(gallery => gallery.state = 'visible');
            }, 50);

            // this.galleries = [...this.galleries, ...res.data];
            this.isLoading = false;
          } else {
            this.allTableData = res.data;
            this.allTableData.forEach(item => item.keywordArr = item.keyword.split(','));
            this.holdPrevTutorial = this.allTableData;
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
    this.getAllTutorial(true);
  }


  /**
   * On Click
   * openYoutubeVideoDialog()
   */
  public openYoutubeVideoDialog(event: MouseEvent, url: string) {
    if (url == null) {
      this.uiService.message('There is no video', 'warn');
      return;
    }
    console.log("url", url)
    event.stopPropagation();
    const dialogRef = this.dialog.open(YoutubeVideoShowComponent, {
      data: { url: url },
      panelClass: ['theme-dialog', 'no-padding-dialog'],
      width: '98%',
      maxWidth: '700px',
      height: 'auto',
      maxHeight: '100vh',
      autoFocus: false,
      disableClose: false
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult && dialogResult.data) {
      }
    });
  }

  onClearSearch() {
    this.searchForm.reset();
    this.searchQuery = null;
    this.router.navigate([], { queryParams: { search: null } }).then();
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
