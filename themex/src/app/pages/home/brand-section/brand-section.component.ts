import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {Subscription} from 'rxjs';
import {Brand} from '../../../interfaces/common/brand.interface';
import {BrandService} from '../../../services/common/brand.service';
import {AppConfigService} from '../../../services/core/app-config.service';
import {ThemeViewSetting} from '../../../interfaces/common/setting.interface';
import {NgxSkeletonLoaderModule} from 'ngx-skeleton-loader';

@Component({
  selector: 'app-brand-section',
  standalone: true,
  imports: [
    RouterLink,
    NgxSkeletonLoaderModule
  ],
  templateUrl: './brand-section.component.html',
  styleUrl: './brand-section.component.scss'
})
export class BrandSectionComponent implements OnInit, OnDestroy {

  // Store Data
  brands: Brand[] = [];
  isLoading: boolean = true;

  // Inject
  private readonly brandService = inject(BrandService);
  private readonly appConfigService = inject(AppConfigService);

  // Subscription
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Theme Settings Handle — the section default is "None": render (and
    // request) nothing unless the shop selected "Brand 1".
    const themeViewSettings: ThemeViewSetting[] = this.appConfigService.getSettingData('themeViewSettings');
    const brandViews = themeViewSettings.find(f => f.type == 'brandViews')?.value?.join();
    if (brandViews !== 'Brand 1') {
      this.isLoading = false;
      return;
    }
    this.getAllBrands();
  }

  /**
   * HTTP Request Handle
   * getAllBrands()
   **/
  private getAllBrands() {
    const subscription = this.brandService.getAllBrandForUi().subscribe({
      next: (res) => {
        this.brands = res.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
    this.subscriptions?.push(subscription);
  }

  /**
   * On Destroy
   */
  ngOnDestroy() {
    this.subscriptions?.forEach(sub => sub?.unsubscribe());
  }
}
