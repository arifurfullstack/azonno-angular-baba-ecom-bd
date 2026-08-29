import {Component, inject, Inject, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {REPLY_STATUS} from '../../../core/utils/app-data';
import {FormBuilder, FormGroup, NgForm, Validators} from '@angular/forms';
import {Project} from '../../../interfaces/common/project.interface';
import {Select} from '../../../interfaces/core/select';
import {Subscription} from 'rxjs';
import {UiService} from '../../../services/core/ui.service';
import {ProjectService} from '../../../services/common/project.service';
import {ConfirmDialogComponent} from '../ui/confirm-dialog/confirm-dialog.component';
import {Admin} from '../../../interfaces/common/admin.interface';
import {UtilsService} from '../../../services/core/utils.service';
import {Category} from '../../../interfaces/common/category.interface';

@Component({
  selector: 'app-add-project-dialog',
  templateUrl: './add-project-dialog.component.html',
  styleUrl: './add-project-dialog.component.scss'
})
export class AddProjectDialogComponent {

  // Data Form
  @ViewChild('formElement') formElement: NgForm;
  dataForm?: FormGroup;

  // Store Data
  project: Project;
  admin: Admin;
  replyStatus: Select[] = REPLY_STATUS;
  categories: Category[] = [];

  // Loading Control
  isLoading: boolean = false;

  // Subscriptions
  private subActivateRoute: Subscription;
  private subDataGet: Subscription;
  private subDataAdd: Subscription;
  private subDataUpdate: Subscription;


  // Inject
  private readonly fb = inject(FormBuilder);
  private readonly uiService = inject(UiService);
  private readonly projectService = inject(ProjectService);
  private readonly utilsService = inject(UtilsService);


  constructor(public dialogRef: MatDialogRef<ConfirmDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: {project: Project, admin: Admin, categories: Category[]}) {
  }


  ngOnInit(): void {

    // Init Data Form
    this.initDataForm();

    // Check Data & Patch Value
    if (this.data) {
      this.project = this.data.project;
      this.admin = this.data.admin;
      this.categories = this.data.categories;
      this.dataForm.patchValue({domain: this.project.domain})
    }
  }

  /**
   * FORM METHODS
   * initDataForm()
   * onSubmit()
   * onDiscard()
   */

  private initDataForm() {
    this.dataForm = this.fb.group({
      projectName: [null, Validators.required],
      domain: [null],
      contact: [null],
      da: [null],
      niche: [null],
      secondaryNiche: [null],
      price: [null],
      linkInsert: [null],
      condition: [null],
      replyStatus: [null, Validators.required],
      dr: [null],
      traffic: [null],
      keywords: [null],
    });
  }


  onSubmit() {
    if (this.dataForm.invalid) {
      this.uiService.message('Please filed all the required field', 'warn');
      return;
    }
    this.isLoading = true;
    const mData = {
      ...this.dataForm.value,
      ...{
        status: 'Confirmed',
        name: this.admin.name,
        admin: this.admin,
        date: this.utilsService.getDateWithCurrentTime(new Date()),
        dateString: this.utilsService.getDateString(new Date())
      }
    }

    this.updateProjectByIdAnalyzer(mData);

  }

  /**
   * HTTP REQ HANDLE
   * getProjectById()
   * addProject()
   * updateProjectByIdAnalyzer()
   */

  private updateProjectByIdAnalyzer(data: Project) {
    this.dataForm.disable();
    this.subDataUpdate = this.projectService.updateProjectByIdAnalyzer(this.project._id, data)
      .subscribe({
        next: async res => {
          this.isLoading = false;
          if (res.success) {
            this.uiService.message(res.message, 'success');
            this.dataForm.enable();
            this.dialogRef.close({_id: this.project._id, status: 'Confirmed'});
          } else {
            this.dataForm.enable();
            this.uiService.message(res.message, 'warn');
          }

        },
        error: err => {
          this.isLoading = false;
          this.dataForm.enable();
          console.log(err)
        }
      })
  }


  onClose(): void {
    this.dialogRef.close();
  }

  /**
   * ON DESTROY
   */

  ngOnDestroy() {
    if (this.subActivateRoute) {
      this.subActivateRoute.unsubscribe();
    }

    if (this.subDataGet) {
      this.subDataGet.unsubscribe();
    }

    if (this.subDataAdd) {
      this.subDataAdd.unsubscribe();
    }
    if (this.subDataUpdate) {
      this.subDataUpdate.unsubscribe();
    }
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
