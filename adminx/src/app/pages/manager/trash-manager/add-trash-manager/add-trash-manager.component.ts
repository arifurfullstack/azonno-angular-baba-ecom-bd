import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {adminBaseMixin} from "../../../../mixin/admin-base.mixin";
import {FormBuilder, FormGroup, NgForm, Validators} from "@angular/forms";
import {Category} from "../../../../interfaces/common/category.interface";
import {DATA_STATUS, THEME_CATEGORIES, THEME_SUB_CATEGORIES} from "../../../../core/utils/app-data";
import {Select} from "../../../../interfaces/core/select";
import {Subscription} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {UiService} from "../../../../services/core/ui.service";
import {MatDialog} from "@angular/material/dialog";
import {CategoryService} from "../../../../services/common/category.service";
import {PageDataService} from "../../../../services/core/page-data.service";
import {Title} from "@angular/platform-browser";
import {ConfirmDialogComponent} from "../../../../shared/components/ui/confirm-dialog/confirm-dialog.component";

@Component({
  selector: 'app-add-trash-manager',
  templateUrl: './add-trash-manager.component.html',
  styleUrl: './add-trash-manager.component.scss'
})
export class AddTrashManagerComponent extends adminBaseMixin(Component) implements OnInit, OnDestroy {
  // Data Form
  @ViewChild('formElement') formElement: NgForm;
  dataForm?: FormGroup;
  autoSlug: boolean = true;

  // Loading Control
  isLoading: boolean = false;

  // Store Data
  id?: string;
  category?: Category;
  categories: any[] = THEME_CATEGORIES;
  subCategories: any[] = [];
  dataStatus: Select[] = DATA_STATUS;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Inject
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly uiService = inject(UiService);
  private readonly dialog = inject(MatDialog);
  private readonly categoryService = inject(CategoryService);
  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);


  ngOnInit(): void {
    // Init Form
    this.initDataForm();

    // GET ID FORM PARAM
    const subRouteParam = this.activatedRoute.paramMap.subscribe((param) => {
      this.id = param.get('id');
      if (this.id) {
        this.getCategoryById();
      }
    });
    this.subscriptions.push(subRouteParam);

    // Auto Slug
    this.autoGenerateSlug();
    this.setPageData();
  }


  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Add Trash Manager');
    this.pageDataService.setPageData({
      title: 'Add Trash Manager',
      navArray: [
        {name: 'Dashboard', url: `/dashboard`},
        {name: 'Add Trash Manager', url: null},
      ]
    })
  }


  /**
   * FORM METHODS
   * initDataForm()
   * setFormValue()
   * onSubmit()
   * onDiscard()
   */
  private initDataForm() {
    this.dataForm = this.fb.group({
      shop: ['66add80607c926d69c0119f6'],
      name: [null, Validators.required],
      slug: [null],
      images: [null],
      description: [null],
      serial: [null],
      commission: [null],
      featureStatus: [null],
      status: [null],
    });
  }

  private setFormValue() {
    this.dataForm.patchValue(this.category);
  }

  onSubmit() {

    if (this.dataForm.invalid) {
      this.uiService.message('Please filed all the required field', 'warn');
      return;
    }
    if (!this.category) {
      this.addCategory();
    } else {
      this.updateCategoryById();
    }
  }

  onDiscard() {
    if (this.dataForm.dirty) {
      this.openConfirmDialog();
    } else {
      this.router.navigate(['/', 'manager', 'all-trash']).then()
    }
  }

  /**
   * COMPONENT DIALOG VIEW
   * openConfirmDialog()
   */
  public openConfirmDialog() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '400px',
      data: {
        title: 'Confirm Discard',
        message: 'Are you sure you want discard?'
      }
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.router.navigate(['/manager']).then();
      }
    });

  }

  /**
   * HTTP REQ HANDLE
   * getCategoryById()
   * addCategory()
   * updateCategoryById()
   */

  private getCategoryById() {
    const subscription = this.categoryService.getCategoryById(this.id).subscribe({
      next: (res) => {
        if (res.data) {
          this.category = res.data;
          this.setFormValue();
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
    this.subscriptions.push(subscription);
  }

  private addCategory() {
    const subscription = this.categoryService
      .addCategory(this.dataForm.value)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.uiService.message(res.message, 'success');
            this.formElement.resetForm();
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

  private updateCategoryById() {
    const subscription = this.categoryService
      .updateCategoryById(this.category._id, this.dataForm.value)
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
   * ON Destroy
   */
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub?.unsubscribe());
  }



  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
