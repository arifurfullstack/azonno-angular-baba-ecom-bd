import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Category } from '../../../interfaces/common/category.interface';
import { Subscription } from 'rxjs';
import { CategoryService } from '../../../services/common/category.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ThemeViewSetting } from "../../../interfaces/common/setting.interface";
import { AppConfigService } from "../../../services/core/app-config.service";
import {RouterLink} from "@angular/router";
import {CategoriesCardComponent} from "../../../shared/components/categories-card/categories-card.component";
import {CategoryLoaderComponent} from "../../../shared/loader/category-loader/category-loader.component";
import {CategoryCard2Component} from "../../../shared/components/category-card-2/category-card-2.component";
import {CategoryLoader2Component} from "../../../shared/loader/category-loader-2/category-loader-2.component";
import {CategoryCard3Component} from "../../../shared/components/category-card-3/category-card-3.component";
import {CategoryLoader3Component} from "../../../shared/loader/category-loader-3/category-loader-3.component";
import {TranslatePipe} from "../../../shared/pipes/translate.pipe";

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
  standalone: true,
  imports: [
    RouterLink,
    CategoriesCardComponent,
    CategoryLoaderComponent,
    CategoryCard2Component,
    CategoryLoader2Component,
    CategoryCard3Component,
    CategoryLoader3Component,
    TranslatePipe
  ]
})
export class CategoriesComponent implements OnInit, OnDestroy {

  // Store Data
  categories: Category[] = [];

  isLoading: boolean = true;
  categoryViews: string;

  // Inject
  private readonly categoryService = inject(CategoryService);
  protected readonly breakpointObserver = inject(BreakpointObserver);
  private readonly appConfigService = inject(AppConfigService);

  // Subscription
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Theme Settings Handle
    this.getSettingData();

    // Base Data — "None" hides the section entirely, so skip the request too.
    if (this.categoryViews !== 'None') {
      this.getAllCategory();
    } else {
      this.isLoading = false;
    }
  }

  /**
   * HTTP Request Handle
   * getAllCategory()
   **/
  private getAllCategory() {
    const subscription = this.categoryService.getAllCategory().subscribe({
      next: (res) => {
        this.categories = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
    this.subscriptions?.push(subscription);
  }

  /**
   * FORM METHODS
   * getSettingData()
   **/
  private getSettingData() {
    const themeViewSettings: ThemeViewSetting[] = this.appConfigService.getSettingData('themeViewSettings');
    // Stored settings may lack this entry — fall back to the catalog default.
    this.categoryViews = themeViewSettings.find(f => f.type == 'categoryViews')?.value?.join() || 'Category 1';
  }

  /**
   * On Destroy
   */
  ngOnDestroy() {
    this.subscriptions?.forEach(sub => sub?.unsubscribe());
  }
}
