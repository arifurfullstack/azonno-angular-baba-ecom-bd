import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-payment-area',
  templateUrl: './payment-area.component.html',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  styleUrls: ['./payment-area.component.scss']
})
export class PaymentAreaComponent {
  @Input() singleLandingPage!: any;
  @Input() cartSaleSubTotal!: number;

  isDivisionDropdownOpen = false;
  selectedDivision = 'ঢাকা';
  divisions = ['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'];

  toggleDivisionDropdown() {
    this.isDivisionDropdownOpen = !this.isDivisionDropdownOpen;
  }

  selectDivision(division: string) {
    this.selectedDivision = division;
    this.isDivisionDropdownOpen = false;
  }
  

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
