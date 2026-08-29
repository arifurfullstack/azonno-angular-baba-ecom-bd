import { inject, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom, of } from 'rxjs';
import { ProductService } from '../../services/common/product.service';
import { FilterData, FilterGroup } from '../../interfaces/core/filter-data';
import { Pagination } from '../../interfaces/core/pagination';

/**
 * Home page products are fetched through a resolver because Zone.js does not
 * track `fetch()` during SSR — component-level HttpClient calls never block
 * the server render, so the pre-rendered HTML shipped with skeletons and
 * every visitor re-downloaded the products in the browser.
 *
 * - Server: fetch before navigation completes → products land in the SSR
 *   HTML, and the response is stored in TransferState.
 * - Browser: replay the stored response instantly (no refetch, no flash);
 *   when there is nothing stored (client-side navigation) the component
 *   loads on its own exactly as before.
 */
export const HOME_PRODUCTS_KEY = makeStateKey<any>('home-products-v1');

export function buildHomeProductsFilter(): FilterData {
  const pagination: Pagination = {
    pageSize: 20,
    currentPage: 0,
  };
  const mSelect = {
    name: 1,
    isVariation: 1,
    images: 1,
    prices: 1,
    tags: 1,
    slug: 1,
    category: 1,
    subCategory: 1,
    brand: 1,
    costPrice: 1,
    salePrice: 1,
    totalSold: 1,
    variation: 1,
    variation2: 1,
    discountType: 1,
    variationOptions: 1,
    variation2Options: 1,
    variationList: 1,
    discountAmount: 1,
    minimumWholesaleQuantity: 1,
    wholesalePrice: 1,
  };
  const mGroup: FilterGroup = {
    isGroup: true,
    category: true,
    subCategory: true,
    brand: true,
  };
  return {
    pagination: pagination,
    filter: { status: 'publish' },
    filterGroup: mGroup,
    select: mSelect,
  };
}

export const homeProductsResolver: ResolveFn<any> = () => {
  const platformId = inject(PLATFORM_ID);
  const transferState = inject(TransferState);
  const productService = inject(ProductService);

  if (isPlatformBrowser(platformId)) {
    const cached = transferState.get(HOME_PRODUCTS_KEY, null as any);
    if (cached) {
      transferState.remove(HOME_PRODUCTS_KEY);
      return of(cached);
    }
    return of(null);
  }

  return firstValueFrom(
    productService.getAllProducts(buildHomeProductsFilter(), null)
  )
    .then((res) => {
      transferState.set(HOME_PRODUCTS_KEY, res);
      return res;
    })
    .catch(() => null);
};
