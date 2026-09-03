import {Component, inject, Input, OnInit, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from "@angular/common";
import {Router, RouterLink} from "@angular/router";
import {ShopInformation} from "../../../../../../interfaces/common/shop-information.interface";

@Component({
  selector: 'app-footer-xl-4',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './footer-xl-4.component.html',
  styleUrl: './footer-xl-4.component.scss'
})
export class FooterXl4Component implements OnInit {
  // Decorator
  @Input() shopInfo: ShopInformation;
  @Input() chatLink: any;

  domain: string = '';
  currentYear: number = new Date().getFullYear();

  // Payment marks bundled with the app (public/images/payment)
  protected readonly paymentMethods: string[] = [
    '/images/payment/bkash.svg',
    '/images/payment/nagad.svg',
    '/images/payment/binance.svg',
    '/images/payment/rocket.svg',
  ];

  // Inject
  private readonly platformId = inject(PLATFORM_ID);

  constructor(
    private router: Router,
  ) {
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.domain = window.location.host;
    }
  }

  /**
   * First chat link of the given type (telegram / messenger / whatsapp...)
   */
  getChatLink(chatType: string): string {
    return this.chatLink?.find(f => f.chatType === chatType)?.url ?? null;
  }
}
