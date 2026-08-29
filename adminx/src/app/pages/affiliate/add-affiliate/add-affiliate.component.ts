import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {adminBaseMixin} from "../../../mixin/admin-base.mixin";
import {environment} from "../../../../environments/environment";
import {FormBuilder, FormGroup, NgForm, Validators} from "@angular/forms";
import {Affiliate} from "../../../interfaces/common/affiliate.interface";
import {Select} from "../../../interfaces/core/select";
import {ADMIN_ROLES, DATA_BOOLEAN} from "../../../core/utils/app-data";
import {Subscription} from "rxjs";
import {NavBreadcrumb} from "../../../interfaces/core/nav-breadcrumb.interface";
import {ActivatedRoute, Router} from "@angular/router";
import {UiService} from "../../../services/core/ui.service";
import {AffiliateService} from "../../../services/common/affiliate.service";
import {MatDialog} from "@angular/material/dialog";
import {FileUploadService} from "../../../services/gallery/file-upload.service";
import {ConfirmDialogComponent} from "../../../shared/components/ui/confirm-dialog/confirm-dialog.component";
import {ImageCropComponent} from "../../../shared/components/image-crop/image-crop.component";
import {FileData} from "../../../interfaces/gallery/file-data";

@Component({
  selector: 'app-add-affiliate',
  templateUrl: './add-affiliate.component.html',
  styleUrl: './add-affiliate.component.scss'
})
export class AddAffiliateComponent extends adminBaseMixin(Component) implements OnInit, OnDestroy {

  // Env Base Data
  protected readonly env = environment;

  // Data Form
  @ViewChild('formElement') formElement: NgForm;
  dataForm?: FormGroup;

  // Store Data
  private readonly adminBaseUrl: string = environment.adminBaseUrl;
  showPassword: boolean = false;
  id: string = null;
  affiliate: Affiliate = null;
  allStatus: Select[] = DATA_BOOLEAN;
  adminRoles: Select[] = ADMIN_ROLES;

  // Loading Control
  isLoading: boolean = false;
  private reqStartTime: Date = null;
  private reqEndTime: Date = null;

  // Image Picker

  // Image Upload
  imageChangedEvent: any = null;
  staticImage = '/assets/images/avatar/user-young.jpg';
  imgPlaceHolder = '/assets/images/avatar/user-young.jpg';
  defaultPlaceholder = '/assets/images/avatar/user-young.jpg';
  pickedImage?: any;
  file: any = null;
  newFileName: string;

  imgBlob: any = null;
  isProfileImageRemove: boolean = false;

  // Image Upload
  files: File[] = [];
  // NID Upload
  nidFiles: File[] = [];
  oldNidImages: string[] = [];
  nidFileNotPicked: boolean = false;

  // NID Back Upload
  nidBackFiles: File[] = [];
  oldNidBackImages: string[] = [];
  nidBackFileNotPicked: boolean = false;
  mData: any;

  // Image Control
  pickedImages: string[] = [];
  profileImages: string[] = [];

  // Subscriptions
  private subActivateRoute: Subscription;
  private subDataGet: Subscription;
  private subDataGetAll: Subscription;
  private subDataAdd: Subscription;
  private subDataUpdate: Subscription;
  private subFileUpload: Subscription;
  private subFileRemove: Subscription;
  private subscriptions: Subscription[] = [];

  // Nav Data
  navArray: NavBreadcrumb[] = [
    {name: 'Dashboard', url: `/${this.adminBaseUrl}/dashboard`},
    {name: 'Affiliate', url: `/${this.adminBaseUrl}/affiliate`},
  ];

  // Inject
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly uiService = inject(UiService);
  private readonly affiliateService = inject(AffiliateService);
  private readonly dialog = inject(MatDialog);
  private readonly fileUploadService = inject(FileUploadService);


  ngOnInit(): void {

    // Init Data Form
    this.initDataForm();

    // Get Data from Param
    this.subActivateRoute = this.activatedRoute.paramMap.subscribe((param) => {
      this.id = param.get('id');
      if (this.id) {
        this.navArray.push({name: 'Update Affiliate', url: null})
        this.getAffiliateById();
      } else {
        this.navArray.push({name: 'Add New Affiliate', url: null})
      }
    });
  }

  /**
   * FORM METHODS
   * initDataForm()
   * setFormValue()
   * onSubmit()
   * onDiscard()
   * togglePasswordVisibility()
   */

  private initDataForm() {
    this.dataForm = this.fb.group({
      name: [null, Validators.required],
      username: [null, Validators.required],
      isPasswordLess: [false],
      password: [null],
      newPassword: [null],
      registrationType: ['phone'],
      phoneNo: [null, Validators.required],
      countryCode: [null],
      fullPhoneNo: [null],
      profileBanner: [null],
      dateOfBirth: [null],
      email: [null, [Validators.email, Validators.required]],
      gender: [null],
      profileImg: [null],
      nidImg: [null],
      nidBackImg: [null],
      experience: [null],
      addedBy: ['shop'],
      hasAccess: [this.allStatus[0].value, Validators.required],
    });
  }

  private setFormValue() {
    this.dataForm.patchValue({...this.affiliate});

    if (this.affiliate.nidImg) {
      this.oldNidImages = [encodeURI(this.affiliate.nidImg.replace(/\\/g, '/'))];

      this.nidFileNotPicked = false;
    }
    if (this.affiliate.nidBackImg) {
      this.oldNidBackImages = [this.affiliate.nidBackImg.replace(/\\/g, '/')];
      this.nidBackFileNotPicked = false;
    }

    if (this.affiliate.profileImg) {
      this.profileImages = [this.affiliate.profileImg];
      this.imgPlaceHolder = this.affiliate.profileImg;
    }
    if (this.affiliate.profileBanner) {
      this.pickedImages = [this.affiliate.profileBanner];
    }
  }

  onSubmit() {
    if (this.dataForm.invalid) {
      this.uiService.message('Please filed all the required field', 'warn');
      return;
    }


    this.isLoading = true;

    const imageUploadTasks = [];

    if (this.pickedImage) {

      this.imageUploadOnServer();
    }


    // Upload nidImg if selected
    if (this.nidFiles && this.nidFiles.length) {
      imageUploadTasks.push(
        this.fileUploadService.uploadMultiImageOriginal(this.nidFiles).toPromise()
      );
    } else {
      imageUploadTasks.push(Promise.resolve([]));
    }

    // Upload nidBackImg if selected
    if (this.nidBackFiles && this.nidBackFiles.length) {
      imageUploadTasks.push(
        this.fileUploadService.uploadMultiImageOriginal(this.nidBackFiles).toPromise()
      );
    } else {
      imageUploadTasks.push(Promise.resolve([]));
    }

    Promise.all(imageUploadTasks)
      .then(([nidImgs, nidBackImgs]) => {
        this.dataForm.patchValue({
          nidImg: this.nidFiles && this.nidFiles?.length ? nidImgs[0]?.url : this.affiliate?.nidImg ?? null,
          nidBackImg: this.nidBackFiles && this.nidBackFiles?.length ? nidBackImgs[0]?.url : this.affiliate?.nidBackImg ?? null,
        });

        this.mData = {
          ...this.dataForm.value,
          registrationType: 'default',
          isPasswordLess: false,
          // permissions: ['create', 'edit', 'delete', 'get'],
        };

        if (this.affiliate) {

          if (this.affiliate) {
            let finalData = this.mData;
            if (this.dataForm.value.newPassword) {
              finalData = {
                ...finalData,
                ...{
                  newPassword: this.dataForm.value.newPassword
                }
              }
            }

            this.updateAffiliateById(finalData);

            // console.log("finalData", finalData)
          }

        } else {
          // console.log("this.mData", this.mData)
          this.addAffiliate(this.mData);
        }

      })
      .catch((err) => {
        this.uiService.message('Image upload failed', 'warn');
        this.isLoading = false;
        console.error(err);
      });


    // const mData = {
    //   ...this.dataForm.value,
    //   ...{
    //     registrationType: 'default',
    //     isPasswordLess: false,
    //     permissions: ['create', 'edit', 'delete', 'get']
    //   }
    // }


    // if (this.affiliate) {
    //   let finalData = mData;
    //   if (this.dataForm.value.newPassword) {
    //     finalData = {
    //       ...finalData,
    //       ...{
    //         newPassword: this.dataForm.value.newPassword
    //       }
    //     }
    //   }
    //   if (this.pickedImage) {
    //     this.uploadSingleImage('update', mData);
    //   } else {
    //     this.updateAffiliateById(finalData);
    //   }
    //
    // } else {
    //   if (this.pickedImage) {
    //     this.uploadSingleImage('add', mData);
    //   } else {
    //     this.addAffiliate(mData);
    //   }
    //
    // }

  }

  onDiscard() {
    if (!this.id && this.dataForm.valid) {
      console.log("if")

      this.openConfirmDialog();
    } else {
      console.log("else if")
      this.router.navigate(['/', 'affiliate/all-affiliate']).then()
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
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
        this.router.navigate(['/', this.env.adminBaseUrl, 'users']).then();
      }
    });

  }


  // fileChangeEvent(event: any) {
  //   this.file = (event.target as HTMLInputElement).files[0];
  //   // File Name Modify...
  //   const originalNameWithoutExt = this.file.name.toLowerCase().split(' ').join('-').split('.').shift();
  //   const fileExtension = this.file.name.split('.').pop();
  //   // Generate new File Name.
  //   this.newFileName = `${Date.now().toString()}_${originalNameWithoutExt}.${fileExtension}`;
  //
  //   const reader = new FileReader();
  //   reader.readAsDataURL(this.file);
  //
  //   reader.onload = () => {
  //     // this.imgPlaceHolder = reader.result as string;
  //   };
  //
  //   // Open Upload Dialog
  //   if (event.target.files[0]) {
  //     this.openComponentDialog(event);
  //   }
  //
  //   // NGX Image Cropper Event..
  //   this.imageChangedEvent = event;
  // }


  onPickedImage(event: any) {
    this.dataForm.patchValue({profileBanner: event});
  }

  onPickedProfileImage(event: any) {
    this.dataForm.patchValue({profileImg: event});
  }

  /**
   * OPEN COMPONENT DIALOG
   */
  public openComponentDialog(data?: any) {
    const dialogRef = this.dialog.open(ImageCropComponent, {
      data,
      panelClass: ['theme-dialog'],
      autoFocus: false,
      disableClose: true,
      width: '680px',
      minHeight: '400px',
      maxHeight: '600px'
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        if (dialogResult.imgBlob) {
          this.imgBlob = dialogResult.imgBlob;
        }
        if (dialogResult.croppedImage) {
          this.pickedImage = dialogResult.croppedImage;
          this.imgPlaceHolder = this.pickedImage;
        }
      }
    });
  }

  /**
   * HTTP REQ HANDLE
   * getAffiliateById()
   * addAffiliate()
   * updateAffiliateById()
   */

  private getAffiliateById() {
    this.subDataGet = this.affiliateService.getAffiliateById(this.id)
      .subscribe({
        next: res => {
          this.affiliate = res.data;

          // Set Data
          if (this.affiliate) {
            this.setFormValue();
          }
        },
        error: err => {
          console.log(err)
        }
      })
  }

  private addAffiliate(data: any) {
    // Start Request Time
    this.reqStartTime = new Date();
    this.dataForm.disable();
    this.subDataAdd = this.affiliateService.affiliateSignup(data)
      .subscribe({
        next: async res => {
          // Loader Logic
          await this.calculateReqTimeAndHideLoader();
          if (res.success) {
            this.uiService.message(res.message, 'success');
            this.formElement.resetForm({status: this.allStatus[0]?.value, role: this.adminRoles[0].value});
            if (this.pickedImage) {
              this.removeImageFiles();
            }

            this.dataForm.enable();
          } else {
            this.dataForm.enable();
            this.uiService.message(res.message, 'warn');
          }
        },
        error: err => {
          this.uiService.message(err?.error?.message[0], 'wrong');
          this.isLoading = false;
          this.dataForm.enable();
          console.log(err)
        }
      })
  }

  private updateAffiliateById(data: Affiliate) {
    // Start Request Time
    this.reqStartTime = new Date();
    this.dataForm.disable();
    this.subDataUpdate = this.affiliateService.updateAffiliateById(this.id, data)
      .subscribe({
        next: async res => {
          // Loader Logic
          await this.calculateReqTimeAndHideLoader();
          if (res.success) {
            this.uiService.message(res.message, 'success');
            this.dataForm.enable();
            if (this.isProfileImageRemove) {
              this.removeOldImageFromServer(this.affiliate.profileImg);
            }
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

  /**
   * Request Time Calculate and Loader Logic
   * calculateReqTimeAndHideLoader()
   */

  private async calculateReqTimeAndHideLoader() {
    return new Promise((resolve) => {
      // Response Time Loader
      this.reqEndTime = new Date;
      const totalReqTimeInSec = (this.reqEndTime.getTime() - this.reqStartTime.getTime()) / 1000;
      if (totalReqTimeInSec < 0.5) {
        setTimeout(() => {
          this.isLoading = false;
          resolve(true);
        }, 500)
      } else {
        this.isLoading = false;
        resolve(true);
      }
    })
  }

  /**
   * File Upload
   * imageUploadOnServer()
   * removeImageFiles()
   * removeImage()
   * removeOldImageFromServer()
   */



  private imageUploadOnServer() {
    const data: FileData = {
      fileName: this.newFileName,
      file: this.imgBlob,
      folderPath: 'admins',
    };
    const subscription = this.fileUploadService.uploadSingleImage(data).subscribe({
      next: (res) => {
        if (res) {

          this.removeImageFiles();


          this.dataForm.patchValue({profileImg: res?.url});

        }
      },
      error: (err) => {
        console.log(err);
      },
    });
    this.subscriptions?.push(subscription);
  }

  private removeImageFiles() {
    this.file = null;
    this.newFileName = null;
    this.pickedImage = null;
    this.imgBlob = null;
  }

  removeImage(event: any) {
    // prevent triggering the click-on-image picker
    event.stopPropagation();
    this.imgPlaceHolder = this.defaultPlaceholder;

    if (event) {
      this.isProfileImageRemove = true
      // this.removeOldImageFromServer( this.affiliate.profileImg);
    }
  }

  private removeOldImageFromServer(imgUrl: string) {
    const subscription = this.fileUploadService.removeSingleFile(imgUrl).subscribe({
      next: (res) => {

        // if (res?.success) {
        //   this.isProfileImageRemove = false
        // }

      },
      error: (err) => {
        console.log(err);
      },
    });
    this.subscriptions?.push(subscription);
  }


  onSelectNid(event: any[]) {
    this.nidFiles = event;
    this.nidFileNotPicked = false;
  }

  onDeleteOldNidImage(event: any) {
    this.oldNidImages = event;
  }

  onSelectNidBack(event: any[]) {
    this.nidBackFiles = event;
    this.nidBackFileNotPicked = false;
  }

  onDeleteOldNidBackImage(event: any) {
    this.oldNidBackImages = event;
  }

  fileChangeEvent(event: any) {
    this.file = (event.target as HTMLInputElement).files[0];
    // File Name Modify
    const originalNameWithoutExt = this.file.name.toLowerCase().split(' ').join('-').split('.').shift();
    const fileExtension = this.file.name.split('.').pop();
    // Generate new File Name
    this.newFileName = `${Date.now().toString()}_${originalNameWithoutExt}.${fileExtension}`;

    const reader = new FileReader();
    reader.readAsDataURL(this.file);

    reader.onload = () => {
      this.imgPlaceHolder = reader.result as string;
    };

    // Open Upload Dialog
    if (event.target.files[0]) {
      this.openComponentDialog(event);
    }

    // NGX Image Cropper Event..
    this.imageChangedEvent = event;
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
    if (this.subDataGetAll) {
      this.subDataGetAll.unsubscribe();
    }
    if (this.subFileUpload) {
      this.subFileUpload.unsubscribe();
    }
    if (this.subFileRemove) {
      this.subFileRemove.unsubscribe();
    }
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
