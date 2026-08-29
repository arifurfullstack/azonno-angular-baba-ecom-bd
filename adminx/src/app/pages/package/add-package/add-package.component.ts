import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {adminBaseMixin} from "../../../mixin/admin-base.mixin";
import {FormArray, FormBuilder, FormGroup, NgForm, Validators} from "@angular/forms";
import {NavBreadcrumb} from "../../../interfaces/core/nav-breadcrumb.interface";
import {Package} from "../../../interfaces/common/package.interface";
import {
  DATA_STATUS,
  DISCOUNT_TYPES,
  PACKAGE_TYPES,
  THEME_CATEGORIES,
  THEME_SUB_CATEGORIES
} from "../../../core/utils/app-data";
import {Select} from "../../../interfaces/core/select";
import {Subscription} from "rxjs";
import {ActivatedRoute, Router} from "@angular/router";
import {UiService} from "../../../services/core/ui.service";
import {MatDialog} from "@angular/material/dialog";
import {PackageService} from "../../../services/common/package.service";
import {ConfirmDialogComponent} from "../../../shared/components/ui/confirm-dialog/confirm-dialog.component";
import {MatSelectChange} from "@angular/material/select";

@Component({
  selector: 'app-add-package',
  templateUrl: './add-package.component.html',
  styleUrl: './add-package.component.scss'
})
export class AddPackageComponent extends adminBaseMixin(Component) implements OnInit, OnDestroy {
  // Data Form
  @ViewChild('formElement') formElement: NgForm;
  dataForm?: FormGroup;
  discountTypes: Select[] = DISCOUNT_TYPES;
  packageTypes: Select[] = PACKAGE_TYPES;
  // Loading Control
  isLoading: boolean = false;

  // Form Array
  dataLimitsDataArray?: FormArray;
  routeLimitsDataArray?: FormArray;
  featuresDataArray?: FormArray;
  featureLimitsDataArray?: FormArray;
  // Nav Data
  navArray: NavBreadcrumb[] = [
    {name: 'Dashboard', url: `/dashboard`},
    {name: 'All Package ', url: `/package/all-package`},
    {name: 'Add Package', url: null},
  ];

  // Store Data
  id?: string;
  package?: Package;
  categories: any[] = THEME_CATEGORIES;
  subCategories: any[] = [];
  dataStatus: Select[] = DATA_STATUS;

  // Subscriptions
  private subDataGet: Subscription;
  private subDataAdd: Subscription;
  private subDataUpdate: Subscription;
  private subRouteParam: Subscription;

  // Inject
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly uiService = inject(UiService);
  private readonly dialog = inject(MatDialog);
  private readonly packageService = inject(PackageService);


  ngOnInit(): void {
    // Init Form
    this.initDataForm();

    // GET ID FORM PARAM
    this.subRouteParam = this.activatedRoute.paramMap.subscribe((param) => {
      this.id = param.get('id');
      if (this.id) {
        this.getPackageById();
      }
    });
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
      name: [null, Validators.required],
      discountType: [null],
      discountAmount: [null],
      renewInDay: [null],
      price: [null],
      type: [null],
      previewLink: [null],
      status: [null],
      dataLimits: this.fb.array([]),
      routeLimits: this.fb.array([]),
      featureLimits: this.fb.array([]),
      features: this.fb.array([
        this.createStringElement()
      ]),
    });

    this.dataLimitsDataArray = this.dataForm.get(
      'dataLimits'
    ) as FormArray;

    this.routeLimitsDataArray = this.dataForm.get(
      'routeLimits'
    ) as FormArray;

    this.featureLimitsDataArray = this.dataForm.get(
      'featureLimits'
    ) as FormArray;
    this.featuresDataArray = this.dataForm.get('features') as FormArray;
  }

  private setFormValue() {
    this.dataForm.patchValue(this.package);

    // Form Array
    if (this.package.featureLimits && this.package.featureLimits.length) {
      this.package.featureLimits.map((m) => {
        const f = this.fb.group({
          name: [m.name],
          value: [m.value],
        });
        (this.dataForm?.get('featureLimits') as FormArray).push(f);
      });
    }

    if (this.package.routeLimits && this.package.routeLimits.length) {
      this.package.routeLimits.map((m) => {
        const f = this.fb.group({
          name: [m.name],
          value: [m.value],
        });
        (this.dataForm?.get('routeLimits') as FormArray).push(f);
      });
    }

    if (this.package.dataLimits && this.package.dataLimits.length) {
      this.package.dataLimits.map((m) => {
        const f = this.fb.group({
          name: [m.name],
          value: [m.value],
        });
        (this.dataForm?.get('dataLimits') as FormArray).push(f);
      });
    }

    this.featuresDataArray.removeAt(0);
    this.package.features.forEach(f => {
      const ctrl = this.fb.control(f);
      (this.dataForm?.get('features') as FormArray).push(ctrl);
    });
  }

  onSubmit() {
    console.log("this.dataForm.value:::", this.dataForm.value);

    if (this.dataForm.invalid) {
      this.uiService.message('Please filed all the required field', 'warn');
      return;
    }
    if (!this.package) {
      this.addPackage();
    } else {
      this.updatePackageById();
    }
  }

  onDiscard() {
    if (this.dataForm.dirty) {
      this.openConfirmDialog();
    } else {
      this.router.navigate(['/', 'package', 'all-package']).then()
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
        this.router.navigate(['/package']).then();
      }
    });

  }

  /**
   * HTTP REQ HANDLE
   * getPackageById()
   * addPackage()
   * updatePackageById()
   */

  private getPackageById() {
    this.subDataGet = this.packageService.getPackageById(this.id).subscribe({
      next: (res) => {
        if (res.data) {
          this.package = res.data;
          this.setFormValue();
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  private addPackage() {
    this.subDataAdd = this.packageService
      .addPackage(this.dataForm.value)
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
  }

  private updatePackageById() {
    this.subDataUpdate = this.packageService
      .updatePackageById(this.package._id, this.dataForm.value)
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
  }


  createStringElement() {
    return this.fb.control('');
  }

  onAddNewSpecifications(formControl: string) {
    const f = this.fb.group({
      name: [null],
      value: [null]
    });
    (this.dataForm?.get(formControl) as FormArray).push(f);
  }

  onAddNewFormString(formControl: string) {
    (this.dataForm?.get(formControl) as FormArray).push(this.createStringElement());
  }

  removeFormArrayField(formControl: string, index: number) {
    let formDataArray: FormArray;
    switch (formControl) {
      case 'dataLimits': {
        formDataArray = this.dataLimitsDataArray;
        break;
      }
      case 'routeLimits': {
        formDataArray = this.routeLimitsDataArray;
        break;
      }
      case 'featureLimits': {
        formDataArray = this.featureLimitsDataArray;
        break;
      }
      case 'features': {
        formDataArray = this.featuresDataArray;
        break;
      }
      default: {
        formDataArray = null;
        break;
      }
    }
    formDataArray?.removeAt(index);
  }

  /**
   * Selection Change
   * onChangeCategory()
   */
  onChangeCategory(event: MatSelectChange) {
    if (event.value) {
      const fCat = this.categories.find(f => f.name === event.value);
      this.subCategories = THEME_SUB_CATEGORIES.filter(f => f.category === fCat._id)
    }
  }


  /**
   * ON DESTROY
   * ngOnDestroy()
   */

  ngOnDestroy() {
    if (this.subDataGet) {
      this.subDataGet.unsubscribe();
    }
    if (this.subDataAdd) {
      this.subDataAdd.unsubscribe();
    }
    if (this.subDataUpdate) {
      this.subDataUpdate.unsubscribe();
    }

    if (this.subRouteParam) {
      this.subRouteParam.unsubscribe();
    }
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
