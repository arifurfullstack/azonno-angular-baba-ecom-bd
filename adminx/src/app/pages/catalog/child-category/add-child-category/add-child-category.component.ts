import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, NgForm, Validators} from "@angular/forms";
import {ChildCategory} from "../../../../interfaces/common/child-category.interface";
import {Select} from "../../../../interfaces/core/select";
import {DATA_STATUS, URL_TYPES} from "../../../../core/utils/app-data";
import {Category} from "../../../../interfaces/common/category.interface";
import {Subscription} from "rxjs";
import {UiService} from "../../../../services/core/ui.service";
import {MatDialog} from "@angular/material/dialog";
import {SubCategoryService} from "../../../../services/common/sub-category.service";
import {CategoryService} from "../../../../services/common/category.service";
import {ChildCategoryService} from "../../../../services/common/child-category.service";
import {ActivatedRoute, Router} from "@angular/router";
import {UtilsService} from "../../../../services/core/utils.service";
import {PageDataService} from "../../../../services/core/page-data.service";
import {Title} from "@angular/platform-browser";
import {MatSelectChange} from "@angular/material/select";
import {ConfirmDialogComponent} from "../../../../shared/components/ui/confirm-dialog/confirm-dialog.component";
import {FilterData} from "../../../../interfaces/gallery/filter-data";

@Component({
  selector: 'app-add-child-category',
  templateUrl: './add-child-category.component.html',
  styleUrl: './add-child-category.component.scss'
})
export class AddChildCategoryComponent implements OnInit, OnDestroy {

  // Decorator
  @ViewChild('formElement') formElement: NgForm;

  // Data Form
  dataForm?: FormGroup;

  // Store Data
  id: string;
  subCategory: ChildCategory;
  dataStatus: Select[] = DATA_STATUS;
  autoSlug: boolean = true;
  categories: Category[] = [];
  subCategories: Category[] = [];
  childCategory?: ChildCategory;

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
  private readonly childCategoryService = inject(ChildCategoryService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly utilsService = inject(UtilsService);
  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);

  ngOnInit(): void {
    this.initDataForm();
    // ParamMap Subscription
    const subParamMap = this.activatedRoute.paramMap.subscribe((param) => {
      this.id = param.get('id');
      if (this.id) {
        this.getChildCategoryById();
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
    this.title.setTitle('Add Child Category');
    this.pageDataService.setPageData({
      title: 'Add Child Category',
      navArray: [
        {name: 'Dashboard', url: `/dashboard`},
        {name: 'Add Child Category', url: null},
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
      subCategory: [null],
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
        },
        subCategory: {
          _id: this.dataForm.value.subCategory,
          name: this.subCategories.find(f => f._id === this.dataForm.value.subCategory).name,
          slug: this.subCategories.find(f => f._id === this.dataForm.value.subCategory).slug,
        }
      }
    }

    if (!this.childCategory) {
      this.addChildCategory(mData);
    } else {
      this.updateChildCategoryById(mData);
    }
  }

  onDiscard() {
    if (this.dataForm.dirty) {
      this.openConfirmDialog();
    } else {
      this.router.navigate(['/', 'catalog', 'all-child-category']).then();
    }
  }

  private setFormValue() {
    this.dataForm.patchValue(this.childCategory);

    this.dataForm.patchValue(
      {
        ...this.childCategory,
        ...{
          category: this.dataForm.value.category._id,
          subCategory: this.dataForm?.value?.subCategory._id,
        }
      }
    );

    // Get Sub Child Category By Sub Category
    if (this.childCategory.subCategory) {
      this.getSubCategoriesByCategoryId(this.childCategory.category._id);
    }

    if (this.childCategory.images) {
      this.pickedImages = this.childCategory.images;
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
   * getAllSubCategories()
   * addCategory()
   * updateCategoryById()
   * getAllSubCategories()
   */


  private addChildCategory(data: any) {
    const subscription = this.childCategoryService.addChildCategory(data)
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

  private updateChildCategoryById(data: any) {
    const subscription = this.childCategoryService.updateChildCategoryById(this.childCategory._id, data)
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
    this.subscriptions.push(subscription);
  }


  private getChildCategoryById() {
    const subscription = this.childCategoryService.getChildCategoryById(this.id).subscribe({
      next: (res) => {
        if (res.data) {
          this.childCategory = res.data;
          this.setFormValue();
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
    this.subscriptions.push(subscription);
  }

  /**
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
   * Selection Change
   * onChangeCategory()
   */

  onCategorySelect(event: MatSelectChange) {
    if (event.value) {
      this.getSubCategoriesByCategoryId(event.value);
    }
  }

  private getSubCategoriesByCategoryId(categoryId: string) {
    const select = 'name slug'
    const subscription = this.subCategoryService.getSubCategoriesByCategoryId(categoryId, select)
      .subscribe(res => {
        this.subCategories = res.data;
      }, error => {
        console.log(error);
      });
    this.subscriptions.push(subscription);
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
