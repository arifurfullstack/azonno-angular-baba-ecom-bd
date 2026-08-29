import {Component, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Subscription} from 'rxjs';
import {FileUploadService} from '../../services/gallery/file-upload.service';
import {Vendor} from '../../interfaces/common/vendor.interface';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

import {ReloadService} from '../../services/core/reload.service';
import {UiService} from '../../services/core/ui.service';

import {FileData} from '../../interfaces/gallery/file-data';
import {ImageCropComponent} from '../../shared/components/image-crop/image-crop.component';
import {VendorDataService} from "../../services/vendor/vendor-data.service";
import {AdminChangePasswordComponent} from "./admin-change-password/admin-change-password.component";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  // Image Upload
  imageChangedEvent: any = null;
  staticImage = '/assets/images/avatar/user-young.jpg';
  imgPlaceHolder = '/assets/images/avatar/user-young.jpg';
  pickedImage?: any;
  file: any = null;
  newFileName: string;
  imgBlob: any = null;

  // Store data
  vendor?: Vendor;

  // Data Form
  dataForm?: FormGroup;

  // Subscriptions
  private subReload: Subscription;
  private subDateGet: Subscription;
  private subDateUpdate: Subscription;
  private subFileUpload: Subscription;
  private subFileRemove: Subscription;

  constructor(
    private dialog: MatDialog,
    private fileUploadService: FileUploadService,
    private vendorDataService: VendorDataService,
    private reloadService: ReloadService,
    private fb: FormBuilder,
    private uiService: UiService,
  ) {
  }

  ngOnInit(): void {

    // Reload Data
    this.subReload = this.reloadService.refreshData$
      .subscribe(() => {
        this.getLoginVendorInfo();
      });

    // Init Form
    this.initFormGroup();

    // Base Data
    this.getLoginVendorInfo();
  }

  /**
   * FORMS METHODS
   * initFormGroup()
   * setFormData()
   * onSubmit()
   */

  private initFormGroup() {
    this.dataForm = this.fb.group({
      name: [null, Validators.required],
      email: [null],
      username: [null, Validators.required],
      phoneNo: [null]
    });
  }

  private setFormData() {
    this.dataForm.patchValue(this.vendor);
    this.imgPlaceHolder = this.vendor?.profileImg ? this.vendor?.profileImg : this.staticImage;
  }

  onSubmit() {
    if (this.pickedImage) {
      this.uploadSingleImage();
    } else {
      this.updateLoggedInVendorInfo();
    }
  }


  /**
   * DIALOG VIEW
   * openComponentDialog()
   * openChangePasswordDialog()
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

  public openChangePasswordDialog() {
    this.dialog.open(AdminChangePasswordComponent, {
      data: this.vendor,
      panelClass: ['theme-dialog'],
      autoFocus: false,
      disableClose: false,

    });
  }


  /**
   * HTTP REQ Handle
   * getLoginVendorInfo()
   * updateLoggedInVendorInfo()
   */
  private getLoginVendorInfo() {
    this.subDateGet = this.vendorDataService.getLoggedInVendorData()
      .subscribe({
        next: res => {
          this.vendor = res.data;
          console.log("vendor inormation");
          this.setFormData();
        },
        error: err => {
          console.log(err)
        }
      });
  }

  private updateLoggedInVendorInfo(image?: string) {
    const formData = {
      name: this.dataForm.value.name,
      phoneNo: this.dataForm.value.phoneNo,
      email: this.dataForm.value.email,
    } as Vendor;

    const data = image ? {...formData, ...{profileImg: image}} : formData;
    this.subDateUpdate = this.vendorDataService.updateLoggedInVendorInfo(data)
      .subscribe({
        next: res => {
          this.uiService.message(res.message, 'success');
          this.reloadService.needRefreshData$();
        },
        error: err => {
          console.log(err)
        }
      });
  }

  /**
   * File Picker & Upload
   * fileChangeEvent()
   * removeSingleFile()
   * uploadSingleImage()
   * removeSingleFile()
   */

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
      // this.imgPlaceHolder = reader.result as string;
    };

    // Open Upload Dialog
    if (event.target.files[0]) {
      this.openComponentDialog(event);
    }

    // NGX Image Cropper Event..
    this.imageChangedEvent = event;
  }

  private removeImageFiles() {
    this.file = null;
    this.newFileName = null;
    this.pickedImage = null;
    this.imgBlob = null;
  }

  uploadSingleImage() {
    const data: FileData = {
      fileName: this.newFileName,
      file: this.imgBlob,
      folderPath: 'vendors'
    };
    this.subFileUpload = this.fileUploadService.uploadSingleImage(data)
      .subscribe({
        next: res => {
          this.removeImageFiles();
          if (this.vendor.profileImg) {
            this.removeSingleFile(this.vendor.profileImg);
          }
          this.updateLoggedInVendorInfo(res.url);
        },
        error: err => {
          console.log(err)
        }
      });
  }

  removeSingleFile(imgUrl: string) {
    this.subFileRemove = this.fileUploadService.removeSingleFile(imgUrl)
      .subscribe({
        next: res => {},
        error: err => {
          console.log(err)
        }
      });
  }

  /**
   * ON DESTROY
   */
  ngOnDestroy() {
    if (this.subReload) {
      this.subReload.unsubscribe();
    }
    if (this.subDateGet) {
      this.subDateGet.unsubscribe();
    }
    if (this.subDateUpdate) {
      this.subDateUpdate.unsubscribe();
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
