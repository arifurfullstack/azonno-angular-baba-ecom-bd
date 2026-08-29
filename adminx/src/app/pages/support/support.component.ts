import { Component, Inject, inject, Input, OnDestroy, OnInit, Optional, TemplateRef, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { PageDataService } from "../../services/core/page-data.service";
import { Title } from "@angular/platform-browser";
import { FilterData } from "../../interfaces/gallery/filter-data";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { NavBreadcrumb } from "../../interfaces/core/nav-breadcrumb.interface";
import { Support } from "../../interfaces/common/support.interface";
import { Subscription } from "rxjs";
import { SupportService } from '../../services/common/support.service';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { UiService } from '../../services/core/ui.service';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  styleUrl: './support.component.scss',
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
export class SupportComponent implements OnInit, OnDestroy {
  // Decorator
  @Input() navArray: NavBreadcrumb[] = [];
  @ViewChild('supportDialog') supportDialogTemplate!: TemplateRef<any>;


  // Store Data
  selectedSupportData: Support;
  filterTabs: any[] = [
    { key: 'all', label: 'All' },
    { key: 'issue', label: 'Issue' },
    { key: 'feedback', label: 'Feedback' },
    { key: 'feature', label: 'Feature' },
  ];

  activeTab: string = 'all';
  searchQuery = null;
  protected allTableData: Support[] = [];
  protected holdPrevData: Support[] = [];

  protected isLoadingData: boolean = false;
  protected isLoading: boolean = false;

  // FilterData
  filter: any = null;
  activeFilter1: number = null;

  // Pagination
  totalDataStore = 0;

  currentPage = 1;
  totalData = 0;
  // galleriesMaxLimit = 0;

  dataPerPage = 12;

  // Select
  private readonly select: any = {
    type: 1,
    description: 1,
    status: 1,
    assignUser: 1,
    images: 1,
    resolveDate: 1,
    createdAt: 1,
  }

  // Inject
  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);
  private readonly supportService = inject(SupportService);
  private readonly dialog = inject(MatDialog);
  private readonly uiService = inject(UiService);

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    @Optional() public dialogRef: MatDialogRef<SupportComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: { type: string, count?: number }
  ) {
  }

  ngOnInit() {
    // Base Data
    this.getAllSupports();
    this.setPageData();
  }


  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Support');
    this.pageDataService.setPageData({
      title: 'Support',
      navArray: [
        { name: 'Dashboard', url: `/dashboard` },
        { name: 'Support', url: 'https://youtu.be/sHDmxMrCfCw?si=nZ-fw6a3BO486c8s' },
      ]
    })
  }


  /**
   * HTTP REQ HANDLE
   * getAllSupports()
   */

  private getAllSupports(loadMore?: boolean) {
    this.isLoadingData = true;
    const pagination: any = {
      pageSize: Number(this.dataPerPage),
      currentPage: Number(this.currentPage) - 1
    };


    const filterData: FilterData = {
      pagination: pagination,
      filter: this.filter,
      select: this.select,
      sort: { createdAt: -1 }
    }


    const subscription = this.supportService.getAllSupports(filterData, this.searchQuery)
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
            this.allTableData.forEach(item => item.descriptionShort = this.truncateHtmlToPlainText(item.description));

            // Trigger animation by setting the state to 'visible' after the data loads
            setTimeout(() => {
              this.allTableData.forEach(gallery => gallery.state = 'visible');
            }, 50);

            // this.galleries = [...this.galleries, ...res.data];
            this.isLoading = false;
          } else {
            this.allTableData = res.data;
            this.allTableData.forEach(item => item.descriptionShort = this.truncateHtmlToPlainText(item.description));
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
  loadMoreGalleries() {
    if (this.isLoading || this.allTableData.length >= this.totalData) return;
    this.isLoading = true;
    this.currentPage += 1;
    this.getAllSupports(true);
  }


  truncateHtmlToPlainText(html: string, maxLength: number = 200): string {
    if (!html) return '';

    const div = document.createElement('div');
    div.innerHTML = html;

    // Add spaces between block-level elements and inline content
    const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT, null);
    let text = '';
    while (walker.nextNode()) {
      text += walker.currentNode.textContent + ' ';
    }

    // Normalize spacing
    const normalized = text.replace(/\s+/g, ' ').trim();

    // Trim to max length
    return normalized.length > maxLength
      ? normalized.slice(0, maxLength).trim() + '...'
      : normalized;
  }


  openFullView(data: Support): void {
    this.selectedSupportData = data;

    this.dialog.open(this.supportDialogTemplate, {
      data,
      maxWidth: '95vw',
      width: '700px',
      maxHeight: '90vh',
      panelClass: 'support-dialog-full',
      autoFocus: false,
    });
  }

  /**
   * COMPONENT DIALOG VIEW
   * openConfirmDialog()
   * openDetailsDialog()
   */
  public openConfirmDialog(type: string, data?: any) {
    if (type === 'delete') {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        maxWidth: '400px',
        data: {
          title: 'Confirm Delete',
          message: 'Are you sure you want delete this data?'
        }
      });
      dialogRef.afterClosed().subscribe(dialogResult => {
        if (dialogResult) {

          this.deleteMultipleSupportById([data]);
        }
      });

    }
  }

  private deleteMultipleSupportById(ids: string[]) {
    const subscription = this.supportService.deleteMultipleSupportById(ids)
      .subscribe({
        next: res => {
          if (res.success) {
            this.uiService.message(res.message, 'success');
            this.getAllSupports();
          } else {
            this.uiService.message(res.message, 'warn')
          }
        },
        error: err => {
          console.log(err)
        }
      });
    this.subscriptions.push(subscription);
  }


  /**
   * Filter Data
   * onFilterChange()
   */
  onFilterChange(type: string): void {
    this.activeTab = type;
    this.filter = type === 'all' ? null : { type: type };
    this.getAllSupports();
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
