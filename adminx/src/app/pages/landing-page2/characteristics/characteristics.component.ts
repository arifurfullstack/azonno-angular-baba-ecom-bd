import { NgFor, NgIf } from '@angular/common';
import {Component, inject, Input} from '@angular/core';
import {ReloadService} from "../../../services/core/reload.service";

@Component({
  selector: 'app-characteristics',
  templateUrl: './characteristics.component.html',
  styleUrl: './characteristics.component.scss',
  standalone:true,
  imports: [
    NgFor,
    NgIf
  ]
})
export class CharacteristicsComponent {
  @Input() singleLandingPage: any;
  selectedMenu = 0;

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

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
