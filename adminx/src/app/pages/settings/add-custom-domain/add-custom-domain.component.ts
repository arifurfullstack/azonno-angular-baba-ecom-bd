import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import { PageDataService } from '../../../services/core/page-data.service';
import { Title } from '@angular/platform-browser';
import { SettingService } from "../../../services/common/setting.service";
import { Subscription } from "rxjs";
import { ALL_LOCAL_DOMAIN } from "../../../core/utils/app-data";

@Component({
  selector: 'app-add-custom-domain',
  templateUrl: './add-custom-domain.component.html',
  styleUrl: './add-custom-domain.component.scss'
})
export class AddCustomDomainComponent implements OnInit, OnDestroy {
  country: any;
  localDomains: any[] = [];
  allLocalDomains: any = ALL_LOCAL_DOMAIN;

  private subscriptions: Subscription[] = [];

  private readonly pageDataService = inject(PageDataService);
  private readonly settingService = inject(SettingService);
  private readonly title = inject(Title);

  ngOnInit() {
    this.setPageData();
    this.getSetting();
  }

  private getSetting() {
    const subscription = this.settingService.getSetting('country').subscribe({
      next: res => {
        this.country = res.data?.country?.name;
        this.setLocalDomains(); // ✅ Call here — only when country is ready
      },
      error: err => {
        console.log(err);
      }
    });
    this.subscriptions.push(subscription);
  }

  private setLocalDomains() {
    this.localDomains = this.allLocalDomains[this.country] || [];
  }

  private setPageData(): void {
    this.title.setTitle('Custom Domain');
    this.pageDataService.setPageData({
      title: 'Custom Domain',
      navArray: [
        { name: 'Dashboard', url: `/dashboard` },
        { name: 'Custom Domain', url: 'https://www.youtube.com/embed/u4Q94MnHDCA' },
      ]
    });
  }

  /**
   * On Destroy
   */
  ngOnDestroy() {
    this.subscriptions?.forEach(sub => sub?.unsubscribe());
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
