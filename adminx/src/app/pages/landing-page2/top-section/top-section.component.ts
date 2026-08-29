import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-top-section',
  templateUrl: './top-section.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./top-section.component.scss']
})
export class TopSectionComponent implements OnInit {
  @Input() singleLandingPage!: any;
  @Input() shopInfo!: any;
  @Input() cartSaleSubTotal!: number;

  ngOnInit() {
    console.log('TopSection Data:', {
      singleLandingPage: this.singleLandingPage,
      images: this.singleLandingPage?.images,
      productImages: this.singleLandingPage?.product?.images
    });
  }

  scrollToPayment() {
    const paymentElement = document.querySelector('.payment');
    if (paymentElement) {
      paymentElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
