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
  protected themeCustomOptions: any[] = [
    {
      "name": "Header Section",
      "type": "headerViews",
      "selectType": "single",
      "value": [
        {
          "name": "Header 1",
          "image": "https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-ba10e.webp?resolution=2876_272",
          "note": "",
          "isDefault": true
        },
        {
          "name": "Header 2",
          "image": "https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-b5810.webp?resolution=2880_288",
          "note": "",
          "isDefault": false
        }
      ]
    },
    {
      "name": "Showcase Section",
      "type": "showcaseViews",
      "selectType": "single",
      "value": [
        {
          "name": "Showcase 2",
          "image": "https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-b5c10.webp?resolution=2844_718",
          "note": "",
          "isDefault": true
        },
        {
          "name": "Showcase 3",
          "image": "https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-8b79.webp?resolution=2770_856",
          "note": "",
          "isDefault": false
        }
      ]
    },
    {
      "name": "Category Section",
      "type": "categoryViews",
      "selectType": "single",
      "value": [
        {
          "name": "Category 1",
          "image": "https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-9f0c.webp?resolution=2764_418",
          "note": "",
          "isDefault": true
        },
        {
          "name": "Category 2",
          "image": "https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-9837.webp?resolution=2232_968",
          "note": "",
          "isDefault": false
        },
        {
          "name": "Category 3",
          "image": "https://cdn.saleecom.com/upload/images/screenshot-2025-03-20-at-8-c60c.webp?resolution=1389_214",
          "note": "",
          "isDefault": false
        },
        {
          "name": "None",
          "image": "https://cdn.saleecom.com/upload/images/no-category-757d.webp?resolution=500_500",
          "note": "",
          "isDefault": false
        }
      ]
    },
    {
      "name": "Brand Section",
      "type": "brandViews",
      "selectType": "single",
      "value": [
        {
          "name": "None",
          "image": "https://cdn.saleecom.com/upload/images/no-brand-8272.webp?resolution=522_469",
          "note": "",
          "isDefault": true
        },
        {
          "name": "Brand 1",
          "image": "https://cdn.saleecom.com/upload/images/no-brand-8272.webp?resolution=522_469",
          "note": "",
          "isDefault": false
        }
      ]
    },
    {
      "name": "Product Section",
      "type": "productViews",
      "selectType": "multiple",
      "value": [
        {
          "name": "Tag",
          "image": "https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-afd4.webp?resolution=2212_744",
          "note": "",
          "isDefault": true
        }
      ]
    },
    {
      "name": "Product Card",
      "type": "productCardViews",
      "selectType": "single",
      "value": [
        {
          "name": "Product Card 1",
          "image": "https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-d99f.webp?resolution=2734_736",
          "note": "",
          "isDefault": false
        },
        {
          "name": "Product Card 2",
          "image": "https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-10070.webp?resolution=2728_788",
          "note": "",
          "isDefault": false
        },
        {
          "name": "Product Card 3",
          "image": "https://cdn.saleecom.com/upload/images/screenshot-2025-03-15-at-3-4780.webp?resolution=2738_726",
          "note": "",
          "isDefault": true
        },
        {
          "name": "Product Card 4",
          "image": "https://cdn.saleecom.com/upload/images/screenshot-2025-03-20-at-8-89b2.webp?resolution=1376_388",
          "note": "",
          "isDefault": false
        }
      ]
    },
    {
      "name": "Bottom Nav",
      "type": "bottomNavViews",
      "selectType": "single",
      "value": [
        {
          "name": "Bottom Nav 1",
          "image": "https://cdn.saleecom.com/upload/images/b-1-36f7.webp?resolution=402_60",
          "note": "",
          "isDefault": true
        },
        {
          "name": "Bottom Nav 2",
          "image": "https://cdn.saleecom.com/upload/images/b-2-19c5.webp?resolution=407_98",
          "note": "",
          "isDefault": false
        },
        {
          "name": "Bottom Nav 3",
          "image": "https://cdn.saleecom.com/upload/images/b-3-f458.webp?resolution=403_63",
          "note": "",
          "isDefault": false
        }
      ]
    },
    {
      "name": "Footer Section",
      "type": "footerViews",
      "selectType": "single",
      "value": [
        {
          "name": "Footer 1",
          "image": "https://cdn.saleecom.com/upload/images/footer-1-3692.webp?resolution=1475_322",
          "note": "",
          "isDefault": true
        },
        {
          "name": "Footer 2",
          "image": "https://cdn.saleecom.com/upload/images/footer-2-f55d.webp?resolution=1540_340",
          "note": "",
          "isDefault": false
        },
        {
          "name": "Footer 3",
          "image": "https://cdn.saleecom.com/upload/images/footer-3-f863.webp?resolution=1634_359",
          "note": "",
          "isDefault": false
        },
        {
          "name": "Footer 4",
          "image": "https://cdn.saleecom.com/upload/images/screenshot-2025-07-19-110709-3f8a.webp?resolution=1904_274",
          "note": "",
          "isDefault": false
        }
      ]
    }
  ];
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
    this.getSetting();
    this.setPageData();
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
