import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { SettingService } from '../../../services/common/setting.service';
import { UiService } from '../../../services/core/ui.service';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../../services/common/theme.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import {
  WebsiteUpdateDialogComponent
} from '../../../shared/dialog-view/website-update-dialog/website-update-dialog.component';
import { PageDataService } from "../../../services/core/page-data.service";
import { Title } from "@angular/platform-browser";

@Component({
  selector: 'app-page-view',
  templateUrl: './page-view.component.html',
  styleUrl: './page-view.component.scss'
})
export class PageViewComponent implements OnInit, OnDestroy {


  // Store Data
  protected pageCustomOptions: any[] = [];
  isLoading: boolean = false;
  storedSettings: any;
  settings: any;
  protected adminRole: any;

  // Inject
  private readonly settingService = inject(SettingService);
  private readonly themeService = inject(ThemeService);
  private readonly uiService = inject(UiService);
  private readonly dialog = inject(MatDialog);
  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);

  // Subscriptions
  private subscriptions: Subscription[] = [];

  async ngOnInit() {
    await this.getShopTheme();
    this.getSetting();
    this.setPageData();
  }

  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Page View');
    this.pageDataService.setPageData({
      title: 'Page View',
      navArray: [
        { name: 'Dashboard', url: `/dashboard` },
        { name: 'Page View', url: 'https://youtu.be/sHDmxMrCfCw?si=nZ-fw6a3BO486c8s' },
      ]
    })
  }
  /**
   * Ui Logics
   * addSelectedProperty()
   * initializeSelections()
   * toggleCheckbox()
   * updateSettings()
   */
  private addSelectedProperty(): void {
    this.pageCustomOptions.forEach((section) => {
      section.value.forEach((item: any) => {
        if (item.selected === undefined) {
          item.selected = false; // Add `selected` with a default value of `false`
        }
      });
    });
  }

  private initializeSelections(): void {
    this.settings.pageViewSettings.forEach((setting: any) => {
      const section = this.pageCustomOptions.find((opt) => opt.type === setting.type);
      if (section) {
        section.value.forEach((item: any) => (item.selected = false));
        const match = section.value.find((item: any) => item.name === setting.name);
        if (match) {
          match.selected = true;
        }
      }
    });
  }

  toggleCheckbox(sectionType: string, index: number): void {
    const section = this.pageCustomOptions.find((opt) => opt.type === sectionType);

    if (!section) {
      this.uiService.message(`Section of type "${sectionType}" not found.`, 'warn');
      return;
    }

    const item = section.value[index];
    if (!item) {
      this.uiService.message(`Item at index ${index} not found in section "${sectionType}".`, 'warn');
      return;
    }

    section.value.forEach((item: any) => (item.selected = false));
    item.selected = true;

    // Sync settings
    this.updateSettings();
  }

  private updateSettings(): void {
    this.settings.pageCustomOptions = this.pageCustomOptions.map((section) => ({
      name: section.name,
      type: section.type,
      value: section.value.filter((item: any) => item.selected),
    }));
  }

  /**
   * HTTP Req Handle
   * getShopTheme()
   * getSetting()
   * addSetting()
   */

  private async getShopTheme() {
    return new Promise((resolve, reject) => {
      const subscription = this.themeService.getShopTheme('pageCustomOptions').subscribe({
        next: res => {
          console.log(res.data);
          if (res.success) {
            this.pageCustomOptions = res.data?.pageCustomOptions;
          }
          resolve(res);
        },
        error: err => {
          console.log(err);
          reject(err);
        }
      });
      this.subscriptions.push(subscription);
    })

  }

  private getSetting() {
    const subscription = this.settingService.getSetting('pageViewSettings themeColors searchHints').subscribe({
      next: res => {
        this.isLoading = false;
        this.settings = res.data;
        this.storedSettings = { ...this.settings };

        // Update With Settings
        this.addSelectedProperty();
        this.initializeSelections();
        this.updateSettings();
      },
      error: err => {
        this.isLoading = false;
        console.log(err);
      }
    });
    this.subscriptions.push(subscription);
  }

  private addSetting() {
    this.isLoading = true;

    const result = this.settings.pageCustomOptions.flatMap(option =>
      option.value
        .filter((item: any) => item.selected) // Filter items with selected = true
        .map((item: any) => ({
          name: item.name,
          type: option.type,
          isLoginRequire: item.isLoginRequire,
        }))
    );

    const mData = {
      pageViewSettings: result,
      needRebuild: true,
    }

    const subscription = this.settingService.addSetting(mData).subscribe({
      next: res => {
        this.isLoading = false;
        if (res.success) {
          this.uiService.message(res.message, 'success');
          this.openWebsiteUpdateDialog();
        } else {
          this.uiService.message(res.message, 'wrong');
        }
      },
      error: err => {
        this.isLoading = false;
        console.log(err);
      }
    });
    this.subscriptions.push(subscription);
  }

  /**
   * COMPONENT DIALOG VIEW
   * openConfirmDialog()
   * openWebsiteUpdateDialog()
   */
  public openConfirmDialog() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '400px',
      data: {
        title: 'Confirm Update?',
        message: 'This setting require to rebuild website and it take upto 60 seconds.'
      }
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.addSetting();
      }
    });
  }

  private openWebsiteUpdateDialog(): void {
    const dialogRef = this.dialog.open(WebsiteUpdateDialogComponent, {
      maxWidth: '600px',
      width: '95%',
      data: {
        title: 'Website Updating',
        desc: 'Please wait until it completely updating your website properly.',
        timeInSec: 60,
        showCloseBtn: true,
      },
      disableClose: true,
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      // this.formElement.resetForm();
    });
  }



  /**
   * ON Destroy
   */
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub?.unsubscribe());
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
