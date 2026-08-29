import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  inject,
  Input, OnInit, PLATFORM_ID,
  ViewChild
} from '@angular/core';
import {isPlatformBrowser, NgClass, NgForOf, NgIf, NgStyle, ViewportScroller} from "@angular/common";
import {ReloadService} from "../../../services/core/reload.service";
import {
  GalleryImageViewerComponent
} from "../../../shared/components/gallery-image-viewer/gallery-image-viewer.component";
import {ImageGalleryComponent} from "../image-gallery/image-gallery.component";
import {CurrencyCtrPipe} from "../../../shared/pipes/currency.pipe2";


@Component({
  selector: 'app-helping',
  templateUrl: './helping.component.html',
  styleUrl: './helping.component.scss',
  standalone: true,

  imports: [
    NgClass,
    NgForOf,
    GalleryImageViewerComponent,
    ImageGalleryComponent,
    CurrencyCtrPipe,
    NgStyle,
    NgIf
  ]
})
export class HelpingComponent implements OnInit {
  @ViewChild('imageBox') imageBox!: ElementRef;
  @ViewChild('textBox') textBox!: ElementRef;
  @Input() singleLandingPage: any;
  @Input() cartSaleSubTotal: any;
  selectedMenu = 0;
  showModal = false;
  isMobile: number;
  productFixed = false;
  // Gallery
  isGalleryOpen: boolean = false;
  galleryImages: string[] = [];
  selectedImageIndex: number = 0;

  imageVisible = false;
  textVisible = false;

  private readonly reloadService = inject(ReloadService);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly platformId = inject(PLATFORM_ID);

  constructor(private cdr: ChangeDetectorRef) {}


  // ngAfterViewInit(): void {
  //   if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
  //     const observer = new IntersectionObserver(
  //       (entries) => {
  //         entries.forEach((entry) => {
  //           if (entry.isIntersecting) {
  //             if (entry.target === this.imageBox.nativeElement) {
  //               this.imageVisible = true;
  //             }
  //             if (entry.target === this.textBox.nativeElement) {
  //               this.textVisible = true;
  //             }
  //
  //             // ✅ Trigger manual change detection to avoid ExpressionChanged error
  //             this.cdr.detectChanges();
  //           }
  //         });
  //       },
  //       { threshold: 0.3 }
  //     );
  //
  //     observer.observe(this.imageBox?.nativeElement);
  //     observer.observe(this.textBox?.nativeElement);
  //   } else {
  //     this.imageVisible = true;
  //     this.textVisible = true;
  //     this.cdr.detectChanges(); // also for fallback
  //   }
  // }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth;
    }
  }

  /**
   * Gallery View
   * openGallery()
   * closeGallery()
   */
  openGallery(event: any, images: string[], index?: number): void {
    event.stopPropagation();

    if (index) {
      this.selectedImageIndex = index;
    }
    this.galleryImages = images;
    this.isGalleryOpen = true;
  }

  openGalleryMobile(event: any, images: string[], index?: number): void {
    event.stopPropagation();

    if (index) {
      this.selectedImageIndex = index;
    }
    this.galleryImages = images;
    this.showModal = true;
  }

  closeGallery(): void {
    this.isGalleryOpen = false;
  }

  closeModal1() {
    this.showModal = false;
  }
  /**
   * SCROLL WITH NAVIGATE
   * onScrollWithNavigate()
   */

  public onScrollWithNavigate(type: string) {
    switch (true) {
      case type === "payment":
        this.selectedMenu = 1;
        this.reloadService.needRefreshSticky$(true);
        break;
      default:
        this.selectedMenu = 0;
    }
  }


  @HostListener('window:scroll')
  scrollBody() {
    if (isPlatformBrowser(this.platformId)) {
      // Get the footer's Y offset position
      const [_, footerTop] = this.viewportScroller.getScrollPosition();
      const windowHeight = window.innerHeight;
      const footerOffsetTop = document.getElementById('benefit')?.offsetTop || 0;

      if (window.scrollY + windowHeight >= footerOffsetTop) {
        this.imageVisible = true;
        this.textVisible = true;
      } else {
        this.imageVisible = false;
        this.textVisible = false;
      }
    }
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
