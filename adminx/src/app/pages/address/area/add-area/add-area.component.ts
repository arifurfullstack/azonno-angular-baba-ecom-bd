import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, NgForm, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {UiService} from '../../../../services/core/ui.service';
import {Select} from '../../../../interfaces/core/select';
import {DATA_STATUS, THEME_CATEGORIES, THEME_SUB_CATEGORIES} from '../../../../core/utils/app-data';
import {adminBaseMixin} from "../../../../mixin/admin-base.mixin";
import {NavBreadcrumb} from "../../../../interfaces/core/nav-breadcrumb.interface";
import {Area} from "../../../../interfaces/common/area.interface";
import {MatDialog} from "@angular/material/dialog";
import {AreaService} from "../../../../services/common/area.service";
import {ConfirmDialogComponent} from "../../../../shared/components/ui/confirm-dialog/confirm-dialog.component";
import {MatSelectChange} from "@angular/material/select";
import {Division} from "../../../../interfaces/common/division.interface";
import {FilterData} from "../../../../interfaces/gallery/filter-data";
import {DivisionService} from "../../../../services/common/division.service";


@Component({
  selector: 'app-add-area',
  templateUrl: './add-area.component.html',
  styleUrls: ['./add-area.component.scss']
})
export class AddAreaComponent extends adminBaseMixin(Component) implements OnInit, OnDestroy {
  // Data Form
  @ViewChild('formElement') formElement: NgForm;
  dataForm?: FormGroup;

  // Loading Control
  isLoading: boolean = false;

  // Nav Data
  navArray: NavBreadcrumb[] = [
    {name: 'Dashboard', url: `/dashboard`},
    {name: 'All Area ', url: `/area/all-area`},
    {name: 'Add Area', url: null},
  ];

  // Store Data
  id?: string;
  area?: Area;
  categories: any[] = THEME_CATEGORIES;
  subCategories: any[] = [];
  dataStatus: Select[] = DATA_STATUS;

  divisions: Division[] = [];
  // Subscriptions
  private subDataGet: Subscription;
  private subDataAdd: Subscription;
  private subDataUpdate: Subscription;
  private subRouteParam: Subscription;
  private subDataFour: Subscription;
  // Inject
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly uiService = inject(UiService);
  private readonly dialog = inject(MatDialog);
  private readonly areaService = inject(AreaService);
  private readonly divisionService = inject(DivisionService);


  ngOnInit(): void {
    // Init Form
    this.initDataForm();

    // GET ID FORM PARAM
    this.subRouteParam = this.activatedRoute.paramMap.subscribe((param) => {
      this.id = param.get('id');
      if (this.id) {
        this.getAreaById();
      }
    });

    // Base Data
    this.getAllDivisions();
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
      division: [null, Validators.required],
      status: [null],
    });
  }

  private setFormValue() {
    if (this.area) {
      this.dataForm.patchValue({
          ...this.area,
          ...{
            division: this.area.division._id,
          }
        }
      );
    }
  }

  onSubmit() {
    console.log("this.dataForm.value:::", this.dataForm.value);

    if (this.dataForm.invalid) {
      this.uiService.message('Please filed all the required field', 'warn');
      return;
    }
    const selectedDivision = this.divisions.find(f => f._id === this.dataForm.value.division);
    const mData = {
      ...this.dataForm.value,
      ...{division: selectedDivision}
    }
    if (!this.area) {
      this.addArea(mData);
    } else {
      this.updateAreaById(mData);
    }
  }

  onDiscard() {
    if (this.dataForm.dirty) {
      this.openConfirmDialog();
    } else {
      this.router.navigate(['/', 'area', 'all-area']).then()
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
        this.router.navigate(['/area']).then();
      }
    });

  }

  /**
   * HTTP REQ HANDLE
   * getAreaById()
   * getAllDivisions()
   * addArea()
   * updateAreaById()
   */

  private getAreaById() {
    this.subDataGet = this.areaService.getAreaById(this.id).subscribe({
      next: (res) => {
        if (res.data) {
          this.area = res.data;
          this.setFormValue();
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  private getAllDivisions() {
    // Select
    const mSelect = {
      name: 1,
    }

    const filterData: FilterData = {
      pagination: null,
      filter: null,
      select: mSelect,
      sort: {priority: 1}
    }

    this.subDataFour = this.divisionService.getAllDivisions(filterData, null)
      .subscribe({
        next: (res => {
          this.divisions = res.data;
        }),
        error: (error => {
          console.log(error);
        })
      });
  }

  private addArea(data: any) {
    this.subDataAdd = this.areaService
      .addArea(data)
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

  private updateAreaById(data: any) {
    this.subDataUpdate = this.areaService
      .updateAreaById(this.area._id, data)
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
