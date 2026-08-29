import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-our-product',
  templateUrl: './our-product.component.html',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./our-product.component.scss']
})
export class OurProductComponent {
  @Input() cartSaleSubTotal!: number;
  @Input() singleLandingPage!: any;

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
