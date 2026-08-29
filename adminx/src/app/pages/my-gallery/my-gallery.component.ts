import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  inject,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild
} from '@angular/core';
import { GalleryService } from '../../services/gallery/gallery.service';
import { FilterData } from '../../interfaces/gallery/filter-data';
import { EMPTY, Subscription } from 'rxjs';
import { Gallery } from '../../interfaces/gallery/gallery.interface';
import { debounceTime, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { NgForm } from '@angular/forms';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UploadDialogComponent } from './upload-dialog/upload-dialog.component';
import { UiService } from '../../services/core/ui.service';
import { FileUploadService } from '../../services/gallery/file-upload.service';
import { ConfirmDialogComponent } from '../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import { FileFolder } from '../../interfaces/gallery/file-folder.interface';
import { FileFolderService } from '../../services/gallery/file-folder.service';
import { Router } from '@angular/router';
import { PageDataService } from "../../services/core/page-data.service";
import { Title } from "@angular/platform-browser";
import { MAX_UPLOAD } from "../../core/utils/app-data";

@Component({
  selector: 'app-my-gallery',
  templateUrl: './my-gallery.component.html',
  styleUrl: './my-gallery.component.scss',
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
export class MyGalleryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('inputImagePicker') inputImagePicker!: ElementRef;
  @ViewChild('galleryView', { static: true }) galleryView: ElementRef;

  // Store Data
  protected galleries: Gallery[] = [];
  protected holdPrevData: Gallery[] = [];
  protected selectedGalleries: Gallery[] = [];
  fileFolders: FileFolder[] = [];
  protected isLoadingData: boolean = false;
  protected isLoading: boolean = false;
  protected totalData = 0;
  protected maxUpload: number = MAX_UPLOAD;


  isDragging = false; // To toggle the drag-and-drop visual feedback
  isUploading = false; // To manage the upload state

  // SEARCH AREA
  searchGalleries: Gallery[] = [];
  searchQuery = null;
  @ViewChild('searchForm') searchForm: NgForm;
  @ViewChild('searchInput') searchInput: ElementRef;

  // FilterData
  filter: any = null;
  activeFilter1: number;


  // Pagination
  currentPage = 1;
  totalGalleries = 0;
  galleriesMaxLimit = 0;
  // galleriesPerPage = 10;
  totalGalleriesStore = 0;

  columnWidth = 240; // The minimum width of each image card in pixels
  minItemsPerPage = 12; // Minimum items per page
  galleriesPerPage: number;

  // Select
  private readonly select: any = {
    name: 1,
    url: 1,
    folder: 1,
    type: 1,
    size: 1,
    width: 1,
    height: 1,
    createdAt: 1,
    vendor: 1,
  }


  // Inject
  private readonly galleryService = inject(GalleryService);
  private readonly dialog = inject(MatDialog);
  private readonly uiService = inject(UiService);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly fileFolderService = inject(FileFolderService);
  private readonly router = inject(Router);
  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);
  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    @Optional() public dialogRef: MatDialogRef<MyGalleryComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public dialogData: { type: string, count?: number }
  ) {
  }

  ngOnInit() {
    // Base Data
    this.calculateGridCount();
    this.getAllGalleries();
    this.getAllFileFolders();

    if (this.dialogData) {
      console.log(this.dialogData)
    }
    this.setPageData();
  }

  ngAfterViewInit() {

    const formValue = this.searchForm.valueChanges;

    const subscription = formValue.pipe(
      map(t => t.searchTerm),
      filter(() => this.searchForm.valid),
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(data => {
        this.searchQuery = data;
        if (this.searchQuery === '' || this.searchQuery === null) {
          this.searchGalleries = [];
          this.galleries = this.holdPrevData;
          this.totalGalleries = this.totalGalleriesStore;
          this.searchQuery = null;
          return EMPTY;
        }
        const pagination: any = {
          pageSize: Number(this.galleriesPerPage),
          currentPage: Number(this.currentPage) - 1
        };

        const filterData: FilterData = {
          pagination: pagination,
          filter: this.filter,
          select: this.select,
          sort: { createdAt: -1 }
        }
        return this.galleryService.getAllGalleries(filterData, this.searchQuery);
      })
    )
      .subscribe({
        next: res => {
          this.searchGalleries = res.data;
          this.galleries = this.searchGalleries;
          this.totalGalleries = res.count;
          this.galleriesMaxLimit = res.maxLimit;
          this.currentPage = 1;
        }, error: err => {
          console.log(err)
        }
      });
    this.subscriptions.push(subscription);
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
        { name: 'Gallery', url: 'https://youtu.be/sHDmxMrCfCw?si=nZ-fw6a3BO486c8s' },
      ]
    })
  }
  /**
   * Calculate Grid Screen wise
   * onResize()
   * calculateGridCount()
   **/
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.calculateGridCount(); // Recalculate on window resize
  }

  calculateGridCount() {
    // Calculate the width of the .gallery container
    const galleryWidth = this.galleryView.nativeElement.offsetWidth;

    // Calculate how many columns can fit into the gallery width
    const columns = Math.floor(galleryWidth / this.columnWidth);

    // Ensure at least 1 column fits (safety check)
    const actualColumns = Math.max(columns, 1);

    // Calculate the number of items per page (multiply by 5 rows)
    this.galleriesPerPage = actualColumns * 5;

    // Ensure the number of items per page is at least the minimum required
    if (this.galleriesPerPage < this.minItemsPerPage) {
      this.galleriesPerPage = this.minItemsPerPage;
    }
  }

  /**
   * HTTP REQ HANDLE
   * getAllGalleries()
   */

  private getAllGalleries(loadMore?: boolean) {
    this.isLoadingData = true;
    const pagination: any = {
      pageSize: Number(this.galleriesPerPage),
      currentPage: Number(this.currentPage) - 1
    };


    const filterData: FilterData = {
      pagination: pagination,
      filter: this.filter,
      select: this.select,
      sort: { createdAt: -1 }
    }


    const subscription = this.galleryService.getAllGalleries(filterData, this.searchQuery)
      .subscribe({
        next: res => {
          if (loadMore) {
            // Same API loading logic as above...
            const newGalleries = res.data.map(gallery => ({
              ...gallery,
              state: 'hidden' // Initially hidden for animation
            }));
            this.totalData = res?.count;
            this.galleries = [...this.galleries, ...newGalleries];

            // Trigger animation by setting the state to 'visible' after the data loads
            setTimeout(() => {
              this.galleries.forEach(gallery => gallery.state = 'visible');
            }, 50);

            // this.galleries = [...this.galleries, ...res.data];
            this.isLoading = false;
          } else {
            this.galleries = res.data;
          }

          this.totalGalleries = res.count;
          this.galleriesMaxLimit = res.maxLimit;
          if (!this.searchQuery) {
            this.holdPrevData = this.galleries;
            this.totalGalleriesStore = res.count;
            this.galleriesMaxLimit = res.maxLimit;
          }
          this.isLoadingData = false;
        }, error: err => {
          // this.isLoadingData = false;
          console.log(err)
        }
      });
    this.subscriptions.push(subscription);
  }

  private getAllFileFolders() {
    // Select
    const mSelect = {
      name: 1,
    }

    const filterData: FilterData = {
      pagination: null,
      filter: null,
      select: mSelect,
      sort: { name: 1 }
    }

    const subscription = this.fileFolderService.getAllFileFolders(filterData, null)
      .subscribe({
        next: res => {
          const defaultData = { _id: null, name: 'Default' };
          this.fileFolders = res.data;
          this.fileFolders.unshift(defaultData);
          // this.selectItem = defaultData;
        },
        error: err => {
          console.log(err)
        }
      });
    this.subscriptions.push(subscription);

  }

  private deleteMultipleGalleryById() {

    const selectedIds = this.selectedGalleries.map(m => m._id);
    const subscription = this.galleryService.deleteMultipleGalleryById(selectedIds)
      .subscribe({
        next: res => {
          console.log(res)
          if (res.success) {
            // Get Image Urls
            const urls = this.galleries.filter((item) => {
              return selectedIds.indexOf(item._id) != -1;
            }).map(m => m.url);
            this.uiService.message(res.message, "success");

            this.galleries = this.galleries.filter(gallery => !selectedIds.includes(gallery._id));
            this.selectedGalleries = [];
            // Delete Files
            this.deleteMultipleFile(urls);
          } else {
            this.uiService.message(res.message, "warn")
          }
        },
        error: err => {
          console.log(err)
        }
      });
    this.subscriptions.push(subscription);
  }

  private deleteMultipleFile(data: string[]) {
    const subscription = this.fileUploadService.deleteMultipleFile(data)
      .subscribe({
        next: res => {
          // TODO IF NEED HANDLE DELETE
        },
        error: err => {
          console.log(err)
        }
      });
    this.subscriptions.push(subscription);
  }

  toggleSelection(_id: string) {
    const fIndex = this.selectedGalleries.findIndex(f => f._id === _id);
    if (fIndex !== -1) {
      this.selectedGalleries.splice(fIndex, 1);
    } else {
      const fData = this.galleries.find(f => f._id === _id);
      this.selectedGalleries.push(fData);
    }

    // When It is a Dialog
    if (this.dialogRef) {
      this.checkDialogSelectCount();
    }

  }

  checkGallerySelected(galleryId: string): boolean {
    return this.selectedGalleries.some(selectedGallery => selectedGallery._id === galleryId);
  }



  /**
   * LOAD MORE
   * loadMoreGalleries()
   */
  loadMoreGalleries() {
    if (this.isLoading || this.galleries.length >= this.totalGalleries) return;
    this.isLoading = true;
    this.currentPage += 1;
    this.getAllGalleries(true);
  }

  /**
   * UPLOAD
   * loadMoreGalleries()
   */
  // When the user drags files over the gallery
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true; // Apply the visual feedback
  }

  // When the user leaves the drag area
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false; // Remove the visual feedback
  }

  // When the user drops files into the gallery
  // onDrop(event: DragEvent) {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   this.isDragging = false; // Remove the visual feedback
  //
  //   // Process the dropped files
  //   if (event.dataTransfer?.files) {
  //     this.handleFiles(event.dataTransfer.files);
  //   }
  // }


  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.isDragging = false; // Remove the visual feedback

    // Process the dropped files
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  // Handle the dropped files
  handleFiles(files: FileList) {
    console.log("gggggggggg")
    const pickedImages: any[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Only process image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          pickedImages.push(e.target.result)
        };

        reader.readAsDataURL(file); // Read the file as a data URL for preview
      }
    }
    // console.log('pickedImages',pickedImages)

    if (this.totalGalleries > this.galleriesMaxLimit) {
      this.uiService.message('Sorry! exists your image upload limit with this shop.', "wrong");
    } else {
      this.openUploadDialog(files, pickedImages);
    }


  }

  openFilePicker(): void {
    this.inputImagePicker.nativeElement.click();
    // if (this.totalData<this.maxUpload) {
    //   this.inputImagePicker.nativeElement.click();
    // } else {
    //   this.uiService.message(`Your can upload maximum ${this.maxUpload} data at same time.`, 'warn');
    // }
  }

  openUploadDialog(files: FileList, pickedImages: any[]) {
    const dialogRef = this.dialog.open(UploadDialogComponent, {
      width: '100%',
      maxWidth: '460px',
      height: 'auto',
      maxHeight: '480px',
      autoFocus: false,
      disableClose: true,
      data: { files: files, pickedImages: pickedImages }
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult && dialogResult.data && dialogResult.data.length) {
        this.galleries = [...dialogResult.data, ...this.galleries.filter(item => !dialogResult.data.some(newItem => newItem._id === item._id))];


        // console.log(" this.galleries", this.galleries)
        // Auto Select
        // if (this.dialogRef) {
        //   if (this.selectedGalleries.length < (this.dialogData?.count ?? 1)) {
        //     // Find items in allGalleries that are not in selectedGalleries
        //     const missingGalleries = this.galleries.filter(
        //       gallery => !this.selectedGalleries.some(selected => selected._id === gallery._id)
        //     );
        //
        //     // Add missing items to selectedGalleries until it reaches the desired count
        //     this.selectedGalleries = [
        //       ...this.selectedGalleries,
        //       ...missingGalleries.slice(0, (this.dialogData?.count ?? 1) - this.selectedGalleries.length)
        //     ];
        //     this.checkDialogSelectCount();
        //   }
        // }

      }
    });
  }

  public openConfirmDialog(type: 'delete', data?: any) {
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
          this.deleteMultipleGalleryById();
        }
      });
    }

  }

  /**
   * Filter Data
   * filterData()
   */
  filterData(value: any, index: number, type: string) {
    switch (type) {
      case 'folder': {
        this.filter = { ...this.filter, ...{ folder: value } };
        this.activeFilter1 = index;
        break;
      }
      default: {
        break;
      }
    }
    // Re fetch Data
    this.getAllGalleries();
  }


  onClearFilter(event: MouseEvent) {
    event.stopPropagation();
    this.filter = null;
    this.activeFilter1 = null;
    this.getAllGalleries();
  }

  /**
   * Dialog Method
   * onSelectedBtnClick()
   * onCancelDialog()
   * onCloseDialog()
   * checkDialogSelectCount()
   */
  onSelectedBtnClick() {
    if (this.dialogRef) {
      this.onCloseDialog();
    }
  }

  onCancelDialog() {
    this.dialogRef.close();
    this.router.navigate([], { queryParams: null, queryParamsHandling: '' }).then();
  }

  onCloseDialog() {
    this.dialogRef.close({ data: this.selectedGalleries });
    this.router.navigate([], { queryParams: null, queryParamsHandling: '' }).then();
  }

  private checkDialogSelectCount() {
    if (this.dialogData?.count === this.selectedGalleries.length) {
      this.onCloseDialog();
    }
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
