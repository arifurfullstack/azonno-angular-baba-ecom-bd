import {Component, inject, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, NgForm, Validators} from "@angular/forms";
import {Support} from "../../../interfaces/common/support.interface";
import {Subscription} from "rxjs";
import {UiService} from "../../../services/core/ui.service";
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {SupportService} from "../../../services/common/support.service";
import {ActivatedRoute, Router} from "@angular/router";
import {PageDataService} from "../../../services/core/page-data.service";
import {Title} from "@angular/platform-browser";
import {ConfirmDialogComponent} from "../../../shared/components/ui/confirm-dialog/confirm-dialog.component";

@Component({
  selector: 'app-add-support',
  templateUrl: './add-support.component.html',
  styleUrl: './add-support.component.scss'
})
export class AddSupportComponent implements OnInit, OnDestroy {

  // Decorator
  @ViewChild('formElement') formElement: NgForm;
  @ViewChild('successDialog') successDialogTemplate!: TemplateRef<any>;
  successDialogRef!: MatDialogRef<any>;


  // Data Form
  dataForm?: FormGroup;

  // Store Data
  id: string;
  support: Support;
  selectedTabIndex: number = 0;

  readonly ticketTypes = [
    {label: 'Website Issue', value: 'issue', description: 'Report a problem you faced'},
    {label: 'Website Feedback', value: 'feedback', description: 'Share your experience'},
    {label: 'Custom Feature', value: 'feature', description: 'Request a new feature'},
  ];

  // Loading Control
  isLoading: boolean = false;

  // Image Control
  pickedImages: string[] = [];

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Inject
  private readonly uiService = inject(UiService);
  private readonly dialog = inject(MatDialog);
  private readonly supportService = inject(SupportService);
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
        this.getSupportById();
      }
    });
    this.subscriptions.push(subParamMap);

    // Base Data
    this.setPageData();
  }


  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Add Support');
    this.pageDataService.setPageData({
      title: 'Add Support',
      navArray: [
        {name: 'Dashboard', url: `/dashboard`},
        {name: 'Add Support', url: 'https://www.youtube.com/embed/2bAgtL1YI_E'},
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
      type: ['issue'],
      description: ['', Validators.required],
      images: [null],
    });
  }

  onSubmit() {
    if (this.dataForm.invalid) {
      this.uiService.message('Description is required', 'warn');
      return;
    }

    if (!this.support) {
      this.addSupport(this.dataForm.value);
    } else {
      this.updateSupportById(this.dataForm.value);
    }
  }

  onDiscard() {
    if (this.dataForm.dirty) {
      this.openConfirmDialog();
    } else {
      this.router.navigate(['/', 'support']).then();
    }
  }

  private setFormValue() {
    this.dataForm.patchValue(this.support);

    if (this.support.images) {
      this.pickedImages = this.support.images;
    }

    if (this.support.type) {
      this.selectedTabIndex = this.ticketTypes.findIndex(f => f.value === this.support.type)
    }
  }

  private patchDefaultValue() {
    this.dataForm.patchValue({type: 'issue'});
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
        this.router.navigate(['/support/all-support']).then();
      }
    });
    this.subscriptions.push(subDialogResult);
  }

  onPickedImage(event: any) {
    this.dataForm.patchValue({images: event});
  }

  /**
   * HTTP REQ HANDLE
   * getSupportById()
   * getAllSubCategories()
   * addSupport()
   * updateSupportById()
   * getAllCategories()
   */
  private getSupportById() {
    const subscription = this.supportService.getSupportById(this.id).subscribe({
      next: (res) => {
        if (res.data) {
          this.support = res.data;
          this.setFormValue();
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
    this.subscriptions.push(subscription);
  }

  private addSupport(data: any) {
    const subscription = this.supportService.addSupport(data)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.uiService.message(res.message, 'success');
            this.formElement.resetForm();
            this.openSuccessDialog();
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

  private updateSupportById(data: any) {
    const subscription = this.supportService.updateSupport(this.id, data)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.uiService.message(res.message, 'success');
            this.openSuccessDialog();
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


  selectTicketType(index: number) {
    this.selectedTabIndex = index;
    this.dataForm.get('type')?.setValue(this.ticketTypes[index].value);
  }

  openSuccessDialog() {
    this.successDialogRef = this.dialog.open(this.successDialogTemplate, {
      panelClass: 'success-dialog-panel',
      disableClose: true,
      width: '400px',
    });
  }

  onDialogClose() {
    this.successDialogRef.close();
    this.router.navigate(['/support']);
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
