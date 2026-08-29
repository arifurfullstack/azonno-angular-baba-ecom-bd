import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import {FilterData} from '../../interfaces/core/filter-data';
import {Brand} from '../../interfaces/common/brand.interface';
const API_URL = environment.apiBaseLink + '/api/brand/';


@Injectable({
  providedIn: 'root'
})
export class BrandService {

  private allBrandsCache$: Observable<{ data: Brand[], count: number, success: boolean }> | null = null;
  private currentBrandsSearchQuery: string | undefined = undefined;

  constructor(
    private httpClient: HttpClient
  ) {
  }

  /**
   * getAllBrands()
   */


  getAllBrands(filterData: FilterData, searchQuery?: string) {
    if (!this.allBrandsCache$ || this.currentBrandsSearchQuery !== searchQuery) {
      let params = new HttpParams();
      if (searchQuery) {
        params = params.append('q', searchQuery);
      }
      this.currentBrandsSearchQuery = searchQuery;
      this.allBrandsCache$ = this.httpClient.post<{ data: Brand[], count: number, success: boolean }>(API_URL + 'get-all-by-shop', filterData, {params}).pipe(
        shareReplay(1)
      );
    }
    return this.allBrandsCache$;
  }
}
