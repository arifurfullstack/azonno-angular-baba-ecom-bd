import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-image-gallery',
  templateUrl: './image-gallery.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./image-gallery.component.scss']
})
export class ImageGalleryComponent implements OnInit, OnChanges {
  @Input() selectedIndex: number = 0;
  @Input() images: string[] = [];
  @Input() isVisible: boolean = false;
  
  @Output() close = new EventEmitter<void>();

  currentIndex: number = 0;

  ngOnInit() {
    this.currentIndex = this.selectedIndex;
  }

  ngOnChanges() {
    this.currentIndex = this.selectedIndex;
  }

  onClose() {
    this.close.emit();
  }

  nextImage() {
    if (this.images.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.images.length;
    }
  }

  prevImage() {
    if (this.images.length > 0) {
      this.currentIndex = this.currentIndex === 0 ? this.images.length - 1 : this.currentIndex - 1;
    }
  }

  selectImage(index: number) {
    this.currentIndex = index;
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
