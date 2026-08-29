import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, NgForm, Validators} from "@angular/forms";
import {SubCategory} from "../../../../interfaces/common/sub-category.interface";
import {Select} from "../../../../interfaces/core/select";
import {DATA_STATUS} from "../../../../core/utils/app-data";
import {Category} from "../../../../interfaces/common/category.interface";
import {Subscription} from "rxjs";
import {UiService} from "../../../../services/core/ui.service";
import {MatDialog} from "@angular/material/dialog";
import {SubCategoryService} from "../../../../services/common/sub-category.service";
import {CategoryService} from "../../../../services/common/category.service";
import {ActivatedRoute, Router} from "@angular/router";
import {PageDataService} from "../../../../services/core/page-data.service";
import {Title} from "@angular/platform-browser";
import {ConfirmDialogComponent} from "../../../../shared/components/ui/confirm-dialog/confirm-dialog.component";
import {FilterData} from "../../../../interfaces/gallery/filter-data";

@Component({
  selector: 'app-add-sub-category',
  templateUrl: './add-sub-category.component.html',
  styleUrl: './add-sub-category.component.scss'
})
export class AddSubCategoryComponent implements OnInit, OnDestroy {

  // Decorator
  @ViewChild('formElement') formElement: NgForm;

  // Data Form
  dataForm?: FormGroup;

  // Store Data
  id: string;
  subCategory: SubCategory;
  dataStatus: Select[] = DATA_STATUS;
  autoSlug: boolean = true;
  categories: Category[] = [];

  // Loading Control
  isLoading: boolean = false;

  // Image Control
  pickedImages: string[] = [];

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Inject
  private readonly uiService = inject(UiService);
  private readonly dialog = inject(MatDialog);
  private readonly subCategoryService = inject(SubCategoryService);
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);

  ngOnInit(): void {
    this.initDataForm();
    // ParamMap Subscription
    const subParamMap = this.activatedRoute.paramMap.subscribe((param) => {
      this.id = param.get('id');
      if (this.id) {
        this.getSubCategoryById();
      }
    });
    this.subscriptions.push(subParamMap);

    // Auto Slug
    this.autoGenerateSlug();

    //  Base Data
    this.getAllSubCategories();
    this.setPageData();
  }


  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Add Sub Category');
    this.pageDataService.setPageData({
      title: 'Add Sub Category',
      navArray: [
        {name: 'Dashboard', url: `/dashboard`},
        {name: 'Add Sub Category', url: null},
      ]
    })
  }

  /**
   * FORM METHODS
   * initDataForm()
   * onSubmit()
   * onDiscard()
   * setFormValue()
   */
  private initDataForm() {
    this.dataForm = this.fb.group({
      name: [null, Validators.required],
      images: [null],
      slug: [null],
      description: [null],
      category: [null],
      type: [null],
      url: [null],
      priority: [null],
      status: ['publish'],
    });
  }

  onSubmit() {
    if (this.dataForm.invalid) {
      this.uiService.message('Please filed all the required field', 'warn');
      return;
    }

    const mData = {
      ...this.dataForm.value,
      ...{
        category: {
          _id: this.dataForm.value.category,
          name: this.categories.find(f => f._id === this.dataForm.value.category).name,
          slug: this.categories.find(f => f._id === this.dataForm.value.category).slug,
        }
      }
    }

    if (!this.subCategory) {
      this.addSubCategory(mData);
    } else {
      this.updateSubCategoryById(mData);
    }
  }

  onDiscard() {
    if (this.dataForm.dirty) {
      this.openConfirmDialog();
    } else {
      this.router.navigate(['/', 'catalog', 'all-sub-category']).then();
    }
  }

  private setFormValue() {
    this.dataForm.patchValue(this.subCategory);

    this.dataForm.patchValue(
      {
        ...this.subCategory,
        ...{
          category: this.dataForm.value.category._id,
        }
      }
    );

    if (this.subCategory.images) {
      this.pickedImages = this.subCategory.images;
    }
  }

  private patchDefaultValue() {
    this.dataForm.patchValue({status: 'publish'});
    this.pickedImages = [];
  }


  /**
   * COMPONENT DIALOG
   * openConfirmDialog()
   * onPickedImage()
   */
  public openConfirmDialog() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '400px',
      data: {
        title: 'Confirm Discard',
        message: 'Are you sure you want to discard?'
      }
    });
    const subDialogResult = dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.router.navigate(['/catalog/all-sub-category']).then();
      }
    });
    this.subscriptions.push(subDialogResult);
  }

  onPickedImage(event: any) {
    this.dataForm.patchValue({images: event});
  }

  /**
   * HTTP REQ HANDLE
   * getSubCategoryById()
   * addSubCategory()
   * updateSubCategoryById()
   * getAllSubCategories()
   */
  private getSubCategoryById() {
    const subscription = this.subCategoryService.getSubCategoryById(this.id).subscribe({
      next: (res) => {
        if (res.data) {
          this.subCategory = res.data;
          this.setFormValue();
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
    this.subscriptions.push(subscription);
  }

  private addSubCategory(data: any) {
    const subscription = this.subCategoryService.addSubCategory(data)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.uiService.message(res.message, 'success');
            this.formElement.resetForm();
            this.patchDefaultValue();
          } else {
            this.uiService.message(res.message, 'warn');
          }
        },
        error: (error) => {
          console.log(error);
        },
      });
    this.subscriptions.push(subscription);
  }

  private updateSubCategoryById(data: any) {
    const subscription = this.subCategoryService.updateSubCategoryById(this.subCategory._id, data)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.uiService.message(res.message, 'success');
          } else {
            this.uiService.message(res.message, 'warn');
          }
        },
        error: (error) => {
          console.log(error);
        },
      });
    this.subscriptions.push(subscription);
  }

  private getAllSubCategories() {
    // Select
    const mSelect = {
      name: 1,
      slug: 1,
    }

    const filterData: FilterData = {
      pagination: null,
      filter: null,
      select: mSelect,
      sort: { name: 1 }
    }
    const subscription = this.categoryService.getAllCategories(filterData, null)
      .subscribe({
        next: (res => {
          this.categories = res.data;

        }),
        error: (error => {
          console.log(error);
        })
      });
    this.subscriptions.push(subscription)
  }


  /*
   * LOGICAL PART
   * autoGenerateSlug()
   */
  autoGenerateSlug() {
    let subAutoSlug: any;
    if (this.autoSlug === true) {
      subAutoSlug = this.dataForm.get('name').valueChanges
        .pipe(
          // debounceTime(200),
          // distinctUntilChanged()
        ).subscribe(d => {
          const res = d?.trim().replace(/\s+/g, '-').toLowerCase();
          this.dataForm.patchValue({
            slug: res
          });
        });
      this.subscriptions.push(subAutoSlug);
    } else {
      if (!subAutoSlug) {
        return;
      }
      this.subscriptions.push(subAutoSlug);
    }
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
