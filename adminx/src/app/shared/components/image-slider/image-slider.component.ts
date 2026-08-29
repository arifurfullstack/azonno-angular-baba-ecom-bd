import {
  Component,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { isPlatformBrowser, isPlatformServer, NgForOf, NgIf, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-slider',
  standalone: true,
  imports: [
    NgStyle,
    NgForOf,
    FormsModule,
    NgIf
  ],
  templateUrl: './image-slider.component.html',
  styleUrls: ['./image-slider.component.scss']
})
export class ImageSliderComponent implements OnInit, OnDestroy {
  // Stored Data
  isBrowser: boolean;
  isServer: boolean;
  @Input() slides: any;
  @Input() showIndicators: boolean = true;
  @Input() autoPlay: boolean = true;
  @Input() autoPlayTime: number = 3000;
  @Input() showControls: boolean = true;
  @Input() pauseOnHoverOrTouch: boolean = true;
  @ViewChild('carouselWrapper') carouselWrapper: ElementRef;

  currentSlideIndex = 0;
  autoSlideInterval: any;
  isDragging: boolean = false;
  startX: number = 0;
  isMobile: number;

  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isServer = isPlatformServer(this.platformId);
    this.isMobile = this.isBrowser ? window.innerWidth : 1920;
  }

  // Init
  ngOnInit(): void {
    if (this.autoPlay) {
      this.startAutoSlide();
    }

    if (this.isBrowser) {
      this.addTouchEventListeners();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      this.removeTouchEventListeners();
    }
  }

  // Auto Slide Methods
  startAutoSlide(): void {
    if (this.isBrowser) {
      this.pauseSlide();  // Clear existing interval before starting a new one
      this.autoSlideInterval = setInterval(() => this.nextSlide(), this.autoPlayTime);
    }
  }

  pauseSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;  // Ensure interval is completely cleared
    }
  }

  resumeSlide(): void {
    if (this.autoPlay) {
      this.startAutoSlide();
    }
  }

  // Slide Navigation Methods
  nextSlide(): void {
    this.pauseSlide();
    if (this.currentSlideIndex === this.slides.length - 1) {
      this.currentSlideIndex++;
      setTimeout(() => this.jumpToSlide(0), 500);
    } else {
      this.currentSlideIndex++;
      this.resumeSlide();
    }
  }

  prevSlide(): void {
    this.pauseSlide();
    if (this.currentSlideIndex === 0) {
      this.currentSlideIndex--;
      setTimeout(() => this.jumpToSlide(this.slides.length - 1), 500);
    } else {
      this.currentSlideIndex--;
      this.resumeSlide();
    }
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
    this.pauseSlide();
    this.resumeSlide();
  }

  jumpToSlide(index: number): void {
    this.carouselWrapper.nativeElement.classList.add('no-transition');
    this.currentSlideIndex = index;
    setTimeout(() => {
      this.carouselWrapper.nativeElement.classList.remove('no-transition');
      this.resumeSlide();
    }, 50);
  }

  // Drag Event Handlers
  onDragStart(startX: number): void {
    this.pauseSlide();
    this.startX = startX;
    this.isDragging = true;
  }

  onDragMove(currentX: number): void {
    const diffX = currentX - this.startX;
    if (Math.abs(diffX) > 5) {
      // Optional: prevent default to stop scrolling
    }
  }

  onDragEnd(endX: number): void {
    this.isDragging = false;
    const diffX = endX - this.startX;
    if (Math.abs(diffX) > 50) {
      diffX > 0 ? this.prevSlide() : this.nextSlide();
    }
    this.resumeSlide();
  }

  // Touch Event Listeners
  addTouchEventListeners(): void {
    document.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: true });
    document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: true });
    document.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: true });
  }

  removeTouchEventListeners(): void {
    document.removeEventListener('touchstart', this.onTouchStart.bind(this));
    document.removeEventListener('touchmove', this.onTouchMove.bind(this));
    document.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }

  // Touch Event Handlers
  onTouchStart(event: TouchEvent): void {
    this.onDragStart(event.touches[0].clientX);
  }

  onTouchMove(event: TouchEvent): void {
    this.onDragMove(event.touches[0].clientX);
  }

  onTouchEnd(event: TouchEvent): void {
    this.onDragEnd(event.changedTouches[0].clientX);
  }

  // Mouse Event Handlers
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    this.onDragStart(event.clientX);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      this.onDragMove(event.clientX);
    }
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    this.onDragEnd(event.clientX);
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.pauseOnHoverOrTouch) {
      this.pauseSlide();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.pauseOnHoverOrTouch) {
      this.resumeSlide();
    }
  }

  // Window Resize Event Handler
  @HostListener('window:resize')
  onGetInnerWidth(): void {
    this.isMobile = window.innerWidth;
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
