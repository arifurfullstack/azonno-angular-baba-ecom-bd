import {Component, EventEmitter, inject, OnDestroy, Output, ViewChild} from '@angular/core';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {OutSideClickModule} from '../../directives/out-side-click/out-side-click.module';
import {FormsModule, NgForm, ReactiveFormsModule} from '@angular/forms';
import {Product} from '../../../interfaces/common/product.interface';
import {debounceTime, distinctUntilChanged, EMPTY, filter, map, Subscription, switchMap} from 'rxjs';
import {Pagination} from '../../../interfaces/core/pagination';
import {FilterData} from '../../../interfaces/gallery/filter-data';
import {ProductService} from '../../../services/common/product.service';

@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    NgClass,
    OutSideClickModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './product-search.component.html',
  styleUrl: './product-search.component.scss'
})
export class ProductSearchComponent implements OnDestroy {

  @Output() onSelect = new EventEmitter();

  // Store Data
  searchProducts: Product[] = [];
  searchQuery: string = null;
  productCount: number = 0;
  isLoading: boolean = false;

  dataPerPage: number = 1;
  currentPage: number = 1;

  private readonly select: any = {
    name: 1,
    images: 1,
    createdAt: 1,
    brand: 1,
    costPrice: 1,
    salePrice: 1,
    regularPrice: 1,
    discountType: 1,
    discountAmount: 1,
    quantity: 1,
    category: 1,
    subCategory: 1,
    status: 1,
    isVariation: 1,
    variation: 1,
    variationOptions: 1,
    variation2: 1,
    variation2Options: 1,
    variationList: 1,
  }

  // Inject
  private readonly productService = inject(ProductService)

  // Search
  @ViewChild('searchForm') private searchForm: NgForm;

  // Subscriptions
  private subSearch: Subscription;

  /**
   * MAIN SEARCH
   */
  ngAfterViewInit(): void {
    const formValue = this.searchForm.valueChanges;

    this.subSearch = formValue.pipe(
      map((t: any) => t['searchTerm']),
      filter(() => this.searchForm.valid),
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(data => {
        this.searchQuery = data;
        // Reset Pagination
        this.currentPage = 1;
        if (this.searchQuery === '' || this.searchQuery === null) {
          this.searchProducts = [];
          this.searchQuery = null;
          return EMPTY;
        }
        this.isLoading = true;
        const pagination: Pagination = {
          pageSize: Number(this.dataPerPage),
          currentPage: Number(this.currentPage) - 1
        };

        const filterData: FilterData = {
          pagination: pagination,
          filter: {status: 'publish'},
          select: this.select,
          sort: {name: 1}
        }
        return this.productService.getAllProducts(filterData, this.searchQuery);
      })
    ).subscribe({
      next: res => {
        this.searchProducts = res.data;
        this.productCount = res.count;
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        console.log(err)
      }
    })
  }


  handleOutsideClick() {
    this.onClear();
  }

  onClear() {
    this.searchForm.reset();
    this.searchProducts = [];
  }

  onSelectItem(item: Product) {
    this.onSelect.emit(item);
    this.searchForm.reset();
    this.searchProducts = [];
  }

  /**
   * ON DESTROY
   */
  ngOnDestroy() {
    this.subSearch?.unsubscribe();
  }



  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
