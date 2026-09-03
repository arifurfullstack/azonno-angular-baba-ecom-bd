import {Component, Input} from '@angular/core';
import {RouterLink, RouterLinkActive} from "@angular/router";
import {ShopInformation} from "../../../../../interfaces/common/shop-information.interface";

@Component({
  selector: 'app-bottom-navbar-3',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-navbar-3.component.html',
  styleUrl: './bottom-navbar-3.component.scss'
})
export class BottomNavbar3Component {
  // Decorator
  @Input() currentUrl: string;
  @Input() shopInfo: ShopInformation;
  @Input() chatLink: any;

  /**
   * Other Methods
   * isVisible
   * getChatLink()
   * getSocialLink()
   **/
  get isVisible() {
    return (
      !['/cart', '/checkout', '/easy-checkout'].includes(this.currentUrl) &&
      !this.currentUrl.startsWith('/product-details/')
    );
  }

  // First chat link of the given type (messenger / phone / telegram...)
  getChatLink(chatType: string): string {
    return this.chatLink?.find(f => f.chatType === chatType)?.url ?? null;
  }

  getSocialLink(type: string): string {
    switch (type) {
      case 'facebook':
        return this.shopInfo?.socialLinks?.find(f => f.type === 0)?.value ?? null;
      default:
        return null;
    }
  }
}
