import { Component, inject, OnInit } from '@angular/core';
import { PageDataService } from "../../../services/core/page-data.service";
import { Title } from "@angular/platform-browser";

@Component({
  selector: 'app-page-list',
  templateUrl: './page-list.component.html',
  styleUrls: ['./page-list.component.scss']
})
export class PageListComponent implements OnInit {
  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);

  allPages: any[] = [
    { _id: 1, name: 'Why Shop Online with Us', slug: 'why-shop-online-with-us' },
    { _id: 3, name: 'Online Payment Methods', slug: 'online-payment-methods' },
    { _id: 12, name: 'After Sales Support', slug: 'after-sales-support' },
    { _id: 22, name: 'FAQ', slug: 'faq' },
    { _id: 14, name: 'Return & Refund Policy', slug: 'return-and-refund-policy' },
    { _id: 15, name: 'Privacy Policy', slug: 'privacy-policy' },
    { _id: 16, name: 'Terms and Conditions', slug: 'terms-and-conditions' },
    { _id: 10, name: 'About Us', slug: 'about-us' },
    // {_id: 2, name: 'Online Purchase Procedure', slug: 'online-purchase-procedure'},
    // {_id: 4, name: 'Online Payment Security', slug: 'online-payment-security'},
    // {_id: 12, name: 'Warranty Policy', slug: 'warranty-policy'},
    // {_id: 16, name: 'Work With Us', slug: 'work-with-us'},
  ];

  constructor() {
  }

  ngOnInit(): void {
    this.setPageData();
  }

  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Additional Pages');
    this.pageDataService.setPageData({
      title: 'Additional Pages',
      navArray: [
        { name: 'Dashboard', url: `/dashboard` },
        { name: 'Additional Pages', url: 'https://youtu.be/sHDmxMrCfCw?si=nZ-fw6a3BO486c8s' },
      ]
    })
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
