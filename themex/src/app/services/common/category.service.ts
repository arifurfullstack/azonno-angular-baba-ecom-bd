import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, tap, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../../interfaces/common/category.interface';
import { FilterData } from '../../interfaces/core/filter-data';

const API_URL = environment.apiBaseLink + '/api/category/';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  // Store Data
  private readonly cacheKey: string = 'category_cache';
  private carouselCache: Map<
    string,
    { data: Category[]; message: string; success: boolean }
  > = new Map();
  
  private allCategoriesCache$: Observable<{ data: Category[]; count: number; success: boolean }> | null = null;
  private currentCategoriesSearchQuery: string | undefined = undefined;

  // Inject
  private readonly httpClient = inject(HttpClient);

  /**
   * getAllCategorys
   */

  getAllCategory(): Observable<{
    data: Category[];
    success: boolean;
    message: string;
  }> {
    if (this.carouselCache.has(this.cacheKey)) {
      return of(
        this.carouselCache.get(this.cacheKey) as {
          data: Category[];
          success: boolean;
          message: string;
        }
      );
    }

    return this.httpClient
      .get<{
        data: Category[];
        success: boolean;
        message: string;
      }>(API_URL + 'get-all-data')
      .pipe(
        tap((response) => {
          // Cache the response
          this.carouselCache.set(this.cacheKey, response);
        })
      );
  }

  getAllCategories(filterData: FilterData, searchQuery?: string) {
    if (!this.allCategoriesCache$ || this.currentCategoriesSearchQuery !== searchQuery) {
      let params = new HttpParams();
      if (searchQuery) {
        params = params.append('q', searchQuery);
      }
      this.currentCategoriesSearchQuery = searchQuery;
      this.allCategoriesCache$ = this.httpClient.post<{
        data: Category[];
        count: number;
        success: boolean;
      }>(API_URL + 'get-all-by-shop', filterData, { params }).pipe(
        shareReplay(1)
      );
    }
    return this.allCategoriesCache$;
  }
}
