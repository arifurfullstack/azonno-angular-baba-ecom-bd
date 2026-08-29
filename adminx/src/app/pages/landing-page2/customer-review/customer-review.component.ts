import {Component, inject, Input, SimpleChanges} from '@angular/core';
import {NgFor, NgIf, NgStyle} from "@angular/common";
import {ReloadService} from "../../../services/core/reload.service";

@Component({
  selector: 'app-customer-review',
  templateUrl: './customer-review.component.html',
  styleUrl: './customer-review.component.scss',
  standalone:true,
  imports: [
    NgFor,
    NgStyle,
    NgIf
  ]
})
export class CustomerReviewComponent {
  @Input() singleLandingPage: any;
  @Input() cartSaleSubTotal: any;
  reveData: any;

  selectedMenu = 0;

  ngOnChanges(changes: SimpleChanges) {
    this.reveData = this.singleLandingPage;
  }

  private readonly reloadService = inject(ReloadService);
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
  reviews = [
    {
      image: 'https://storage.googleapis.com/a1aa/image/VZVYNAhU9slF-Rop0jKeCshF8qh3QPj__X5w6gTnltk.jpg',
      stars: 4,
      message: 'Sed facilisis tortor mauris in vestibulum turpis ac...',
      name: 'Metlinda Parker'
    },
    {
      image: 'https://storage.googleapis.com/a1aa/image/VZVYNAhU9slF-Rop0jKeCshF8qh3QPj__X5w6gTnltk.jpg',
      stars: 5,
      message: 'Mattis turpis sed nisi ullamcorper pretium...',
      name: 'Matthew Bennett'
    },
    {
      image: 'https://storage.googleapis.com/a1aa/image/VZVYNAhU9slF-Rop0jKeCshF8qh3QPj__X5w6gTnltk.jpg',
      stars: 4,
      message: 'Nisi purus diam morbi rhoncus pellentesque...',
      name: 'Sophia Rodriguez'
    },
    {
      image: 'https://storage.googleapis.com/a1aa/image/VZVYNAhU9slF-Rop0jKeCshF8qh3QPj__X5w6gTnltk.jpg',
      stars: 5,
      message: 'Convallis viverra viverra quisque ornare...',
      name: 'Ava Mitchell'
    }
  ];


  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
