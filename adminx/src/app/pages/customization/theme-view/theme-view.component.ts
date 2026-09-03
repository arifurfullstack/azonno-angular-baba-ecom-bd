import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {SettingService} from '../../../services/common/setting.service';
import {UiService} from '../../../services/core/ui.service';
import {Subscription} from 'rxjs';
import {ThemeService} from '../../../services/common/theme.service';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../../../shared/components/ui/confirm-dialog/confirm-dialog.component';
import {
  WebsiteUpdateDialogComponent
} from '../../../shared/dialog-view/website-update-dialog/website-update-dialog.component';
import {PageDataService} from "../../../services/core/page-data.service";
import {Title} from "@angular/platform-browser";
import {Router} from "@angular/router";

@Component({
  selector: 'app-theme-view',
  templateUrl: './theme-view.component.html',
  styleUrl: './theme-view.component.scss'
})
export class ThemeViewComponent implements OnInit, OnDestroy {

  // Store Data
  // Loaded from apix's theme catalog (GET /api/setting/theme-catalog, with a
  // bundled assets/theme-catalog.json fallback) — no longer hardcoded here.
  // Empty until loadCatalog() resolves; Save stays disabled while empty so a
  // catalog failure can never POST themeViewSettings: [] and wipe saved views.
  protected themeCustomOptions: any[] = [];
  private catalogLoaded = false;
  private settingsLoaded = false;
  protected themeLanguageOptions: any[] = [
    {
      "name": "English",
      "value": "en",
      "selected": true
    },
    {
      "name": "Bangla",
      "value": "bn",
      "selected": false
    }
  ];
  orderLanguage = 'en';

  protected themeColors: any = {
    primary: '#5d36ff',
    secondary: '#B529FF',
    tertiary: '#f85606',
  };
  searchHints: string;
  // Starts true: the Save button must stay in its loader state until the
  // stored settings arrive — clicking Save before that would hit
  // `this.settings.themeCustomOptions.map(...)` on undefined.
  isLoading: boolean = true;
  storedSettings: any;
  settings: any;

  // Gallery View
  protected isGalleryOpen: boolean = false;
  protected galleryImages: string[] = [];
  protected selectedImageIndex: number = 0;

  // Inject
  private readonly settingService = inject(SettingService);
  private readonly uiService = inject(UiService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);

  // Subscriptions
  private subscriptions: Subscription[] = [];

  async ngOnInit() {
    this.loadCatalog();
    this.getSetting();
    this.setPageData();
  }

  /**
   * Theme Catalog
   * loadCatalog() + tryFinish()
   */
  private loadCatalog(): void {
    const subscription = this.settingService.getThemeCatalog().subscribe({
      next: (sections: any[]) => {
        this.themeCustomOptions = Array.isArray(sections) ? sections : [];
        this.catalogLoaded = true;
        this.tryFinish();
      },
      error: err => {
        // Both the API and the bundled JSON fallback failed — leave the
        // catalog empty; the Save button stays disabled and addSetting()
        // guards against wiping stored views.
        this.catalogLoaded = true;
        this.tryFinish();
        console.log(err);
      }
    });
    this.subscriptions.push(subscription);
  }

  /**
   * The catalog and the stored settings arrive from independent requests
   * (either may complete first — getSetting is shareReplay-memoized and can
   * emit synchronously). Selections can only be initialized once both are in.
   */
  private tryFinish(): void {
    if (!this.catalogLoaded || !this.settingsLoaded || !this.settings) {
      return;
    }
    this.addSelectedProperty();
    this.initializeSelections();
    this.updateSettings();
  }


  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Theme View');
    this.pageDataService.setPageData({
      title: 'Theme View',
      navArray: [
        {name: 'Dashboard', url: `/dashboard`},
        {name: 'Theme View', url: 'https://www.youtube.com/embed/mpz7QOfPIWw'},
      ]
    })
  }
  /**
   * Color Control
   * onColorChange()
   * validateColorCode()
   */
  onColorChange(colorType: string): void {
    switch (colorType) {
      case 'primaryColor':
        this.themeColors.primary = this.themeColors.primary.toUpperCase();
        break;
      case 'secondaryColor':
        this.themeColors.secondary = this.themeColors.secondary.toUpperCase();
        break;
      case 'tertiaryColor':
        this.themeColors.tertiary = this.themeColors.tertiary.toUpperCase();
        break;
    }
  }

  // Validate color code input
  // NOTE: this used to read/write `this[colorType]` ("this.primaryColor"),
  // a property that does not exist on the component — the check never saw
  // the real value and garbage like "ZZZ" was saved straight to the DB,
  // silently breaking the storefront CSS variables. Map to themeColors key.
  validateColorCode(colorType: 'primaryColor' | 'secondaryColor' | 'tertiaryColor'): void {
    const key = colorType.replace('Color', '') as 'primary' | 'secondary' | 'tertiary';
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(this.themeColors[key])) {
      this.themeColors[key] = '#000000'; // Reset to black if invalid
    }
  }

  /**
   * Ui Logics
   * addSelectedProperty()
   * initializeSelections()
   * toggleCheckbox()
   * updateSettings()
   */
  private addSelectedProperty(): void {
    this.themeCustomOptions.forEach((section) => {
      section.value.forEach((item: any) => {
        if (item.selected === undefined) {
          item.selected = false; // Add `selected` with a default value of `false`
        }
      });
    });
  }

  private initializeSelections(): void {
    // themeViewSettings has no DB default — a shop that never saved theme
    // settings gets undefined here, which used to crash the whole page.
    (this.settings.themeViewSettings ?? []).forEach((setting: any) => {
      const section = this.themeCustomOptions.find((opt) => opt.type === setting.type);
      if (section) {
        section.value.forEach((item: any) => (item.selected = false));
        (setting.value ?? []).forEach((settingItem: string) => {
          const match = section.value.find((item: any) => item.name === settingItem);
          if (match) {
            match.selected = true;
          }
        });
      }
    });
  }

  toggleCheckbox(sectionType: string, index: number): void {
    const section = this.themeCustomOptions.find((opt) => opt.type === sectionType);

    if (!section) {
      this.uiService.message(`Section of type "${sectionType}" not found.`, 'warn');
      return;
    }

    const item = section.value[index];
    if (!item) {
      this.uiService.message(`Item at index ${index} not found in section "${sectionType}".`, 'warn');
      return;
    }

    if (section.selectType === 'single') {
      section.value.forEach((item: any) => (item.selected = false));
      item.selected = true;
    } else if (section.selectType === 'multiple') {
      item.selected = !item.selected;
    } else {
      this.uiService.message(`Unknown selectType "${section.selectType}" in section "${sectionType}".`, 'warn');
    }

    // Sync settings
    this.updateSettings();
  }


  onChangeOrderLanguage(value: string, index: number): void {
    this.themeLanguageOptions.forEach((item, i) => {
      item.selected = (i === index);
    });
    this.orderLanguage = value;
  }


  private updateSettings(): void {
    this.settings.themeCustomOptions = this.themeCustomOptions.map((section) => ({
      name: section.name,
      type: section.type,
      selectType: section.selectType,
      value: section.value.filter((item: any) => item.selected),
    }));
  }

  /**
   * HTTP Req Handle
   * getShopTheme()
   * getSetting()
   * addSetting()
   */

  private getSetting() {
    const subscription = this.settingService.getSetting('themeViewSettings themeColors searchHints orderLanguage').subscribe({
      next: res => {
        this.isLoading = false;
        this.settings = res.data;
        this.storedSettings = {...this.settings};
        if (this.settings.themeColors) {
          this.themeColors = this.settings.themeColors;
        }
        if (this.settings.searchHints) {
          this.searchHints = this.settings.searchHints;
        }
        if (this.settings.orderLanguage) {
          this.orderLanguage = this.settings.orderLanguage;
        }
        this.themeLanguageOptions.forEach(item => {
          item.selected = item.value === this.orderLanguage;
        });

        // Update With Settings (once the catalog is in too — see tryFinish)
        this.settingsLoaded = true;
        this.tryFinish();
      },
      error: err => {
        this.isLoading = false;
        console.log(err);
      }
    });
    this.subscriptions.push(subscription);
  }

  private addSetting() {
    // Catalog never loaded (API + bundled fallback both failed) — saving now
    // would POST themeViewSettings: [] and wipe the shop's stored views.
    if (!this.themeCustomOptions.length || !this.settings?.themeCustomOptions) {
      this.uiService.message('Theme catalog unavailable — cannot save theme views right now.', 'warn');
      return;
    }
    this.isLoading = true;

    const result = this.settings.themeCustomOptions.map((section: any) => ({
      type: section.type,
      value: section.value
        .filter((item: any) => item.selected) // Include only selected items
        .map((item: any) => item.name) // Extract the name of selected items
    }));

    const mData = {
      themeViewSettings: result,
      needRebuild: true,
      themeColors: this.themeColors,
      searchHints: this.searchHints,
      orderLanguage: this.orderLanguage
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
        timeInSec: 5,
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
   * Gallery Image View
   * openGallery()
   * closeGallery()
   * copyToClipboard()
   */
  openGallery(event: any, images: any, index?: number): void {
    event.stopPropagation();
    if (index) {
      this.selectedImageIndex = index;
    }
    this.galleryImages = [images];
    this.isGalleryOpen = true;
    this.router.navigate([], {queryParams: {'gallery-image-view': true}, queryParamsHandling: 'merge'}).then();
  }

  closeGallery(): void {
    this.isGalleryOpen = false;
    this.router.navigate([], {queryParams: {'gallery-image-view': null}, queryParamsHandling: 'merge'}).then();
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
