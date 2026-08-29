import { Component, inject, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ShopInformation } from "../../../interfaces/common/shop-information.interface";
import { Select } from "../../../interfaces/core/select";
import { Subscription } from "rxjs";
import { UiService } from "../../../services/core/ui.service";
import { Router } from "@angular/router";
import { ShopInformationService } from "../../../services/common/shop-information.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { AdminService } from "../../../services/common/admin.service";
import { PageDataService } from "../../../services/core/page-data.service";
import { Title } from "@angular/platform-browser";


@Component({
  selector: 'app-shop-information',
  templateUrl: './shop-information.component.html',
  styleUrl: './shop-information.component.scss'
})
export class ShopInformationComponent implements OnInit, OnDestroy {

  @ViewChild('dialogTemplate') dialogTemplate!: TemplateRef<any>;

  radioValue = 'after';
  radioLabel = 'Powered by huipper (Show in footer).';
  showRadio = true;
  inputText = '';
  dialogRef!: MatDialogRef<any>;

  // Admin Base Data
  adminId: string;

  dataForm?: FormGroup;
  addressesDataArray?: FormArray;
  emailsDataArray?: FormArray;
  phonesDataArray?: FormArray;
  downloadsUrlsArray?: FormArray;
  socialLinksArray?: FormArray;

  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);
  shopInformation: ShopInformation;
  isLoading = false;

  // Store Data from param
  id?: string;

  // Image Picker
  // pickedImage = defaultUploadImage;
  pickedImages: string[] = [];
  pickedImage: string[] = [];

  // Dummy Data
  downloadTypes: Select[] = [
    { value: 0, viewValue: 'Play Store' },
    { value: 1, viewValue: 'App Store' }
  ];

  socialTypes: Select[] = [
    { value: 0, viewValue: 'Facebook' },
    { value: 1, viewValue: 'YouTube' },
    { value: 2, viewValue: 'Twitter' },
    { value: 3, viewValue: 'Instagram' },
    { value: 4, viewValue: 'LinkedIn' },
    { value: 5, viewValue: 'Tiktok' },
    { value: 6, viewValue: 'Messenger' },
    { value: 7, viewValue: 'Telegram' },
    { value: 8, viewValue: 'Join Group' }
  ];

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private uiService: UiService,
    public router: Router,
    private shopInformationService: ShopInformationService,
    private dialog: MatDialog,
    private adminService: AdminService,
  ) {
  }

  ngOnInit(): void {

    // INIT FORM
    this.initFormGroup();

    // Base Admin Data
    this.getAdminBaseData();

    // GET DATA
    this.getShopInformation();
    this.setPageData();
  }


  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Website Information');
    this.pageDataService.setPageData({
      title: 'Website Information',
      navArray: [
        { name: 'Dashboard', url: `/dashboard` },
        { name: 'Website Info', url: 'https://www.youtube.com/embed/dyagcBrsglI' },
      ]
    })
  }
  /**
   * FORMS METHODS
   * initDataForm()
   * setFormValue()
   * onSubmit()
   */
  private initFormGroup() {

    this.dataForm = this.fb.group({
      websiteName: [null, Validators.required],
      shortDescription: [null],
      downloadAppDescription: [null],
      logoPrimary: [null],
      navLogo: [null],
      footerLogo: [null],
      othersLogo: [null],
      fabIcon: [null],
      headerNews: [null],
      whatsappNumber: [null],
      addresses: this.fb.array([]),
      emails: this.fb.array([]),
      phones: this.fb.array([]),
      downloadUrls: this.fb.array([]),
      socialLinks: this.fb.array([]),
      showBranding: [true],
      showCopyright: [false],
      brandingText: [null]
    });

    this.addressesDataArray = this.dataForm.get('addresses') as FormArray;
    this.emailsDataArray = this.dataForm.get('emails') as FormArray;
    this.phonesDataArray = this.dataForm.get('phones') as FormArray;
    this.downloadsUrlsArray = this.dataForm.get('downloadUrls') as FormArray;
    this.socialLinksArray = this.dataForm.get('socialLinks') as FormArray;

  }

  onSubmit() {
    if (this.dataForm.invalid) {
      this.uiService.message('Please complete all the required fields', 'warn')
      return;
    }

    if (this.shopInformation) {
      const finalData = { ...this.dataForm.value };
      // console.log('finalData',finalData)
      this.updateShopInformationById(finalData);
    } else {
      this.addShopInformation(this.dataForm.value);
    }

  }

  private getAdminBaseData() {
    this.adminId = this.adminService.getAdminId();

  }

  // onPickedImage(event: any, type: any) {
  //   switch (type) {
  //     case 'logo':
  //       this.dataForm.patchValue({ logoPrimary: event[0] });
  //       break;
  //     case 'febIcon':
  //       this.dataForm.patchValue({ fabIcon: event[0] });
  //       break;
  //     default:
  //       break;
  //   }
  // }

  onPickedImage(image: string[] | string, type: string) {
    console.log("type", type);
    console.log("image", image);
    if (type === 'logo') {
      this.pickedImages = Array.isArray(image) ? image : [image];
      this.dataForm.get('logoPrimary')?.setValue(this.pickedImages.length ? this.pickedImages[0] : null);
    }
    if (type === 'febIcon') {
      this.pickedImage = Array.isArray(image) ? image : [image];
      this.dataForm.get('fabIcon')?.setValue(this.pickedImage.length ? this.pickedImage[0] : null);
    }
  }


  /**
   * FORM ARRAY BUILDER
   */
  onAddNewShopObject(formControl: string) {
    const f = this.fb.group({
      type: [null],
      value: [null, Validators.required]
    });
    (this.dataForm?.get(formControl) as FormArray).push(f);
  }

  /**
   * REMOVE FORM BUILDER OBJECT
   */
  removeFormArrayField(formControl: string, index: number) {
    let formDataArray: FormArray;
    switch (formControl) {
      case 'addresses': {
        formDataArray = this.addressesDataArray;
        break;
      }
      case 'emails': {
        formDataArray = this.emailsDataArray;
        break;
      }
      case 'phones': {
        formDataArray = this.phonesDataArray;
        break;
      }
      case 'downloadUrls': {
        formDataArray = this.downloadsUrlsArray;
        break;
      }
      case 'socialLinks': {
        formDataArray = this.socialLinksArray;
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
   * SET DATA
   */
  private setData() {
    this.shopInformation.addresses.map(m => {
      const f = this.fb.group({
        type: [m.type],
        value: [m.value, Validators.required],
      });
      (this.dataForm?.get('addresses') as FormArray).push(f);
    });

    this.shopInformation.emails.map(m => {
      const f = this.fb.group({
        type: [m.type],
        value: [m.value, Validators.required],
      });
      (this.dataForm?.get('emails') as FormArray).push(f);
    });

    this.shopInformation.phones.map(m => {
      const f = this.fb.group({
        type: [m.type],
        value: [m.value, Validators.required],
      });
      (this.dataForm?.get('phones') as FormArray).push(f);
    });

    this.shopInformation.downloadUrls.map(m => {
      const f = this.fb.group({
        type: [m.type],
        value: [m.value, Validators.required],
      });
      (this.dataForm?.get('downloadUrls') as FormArray).push(f);
    });

    this.shopInformation.socialLinks.map(m => {
      const f = this.fb.group({
        type: [m.type],
        value: [m.value, Validators.required],
      });
      (this.dataForm?.get('socialLinks') as FormArray).push(f);
    });

    if (this.shopInformation.logoPrimary) {
      this.pickedImages = [this.shopInformation.logoPrimary];
    }

    if (this.shopInformation.fabIcon) {
      this.pickedImage = [this.shopInformation.fabIcon];
    }
    this.dataForm.patchValue(this.shopInformation);
  }


  /**
   * HTTP REQ HANDLE
   *addShopInformation()
   * getShopInformation
   * updateShopInformationById
   */
  private addShopInformation(data: any) {
    const subscription = this.shopInformationService.addShopInformation(data)
      .subscribe(res => {
        this.uiService.message(res.message, 'success');
      }, err => {
        console.log(err);
      });
    this.subscriptions.push(subscription);
  }

  private getShopInformation() {
    const subscription = this.shopInformationService.getShopInformation()
      .subscribe(res => {
        this.shopInformation = res.data;
        if (this.shopInformation) {
          this.setData();
        }

      }, err => {
        console.log(err);
      });
    this.subscriptions.push(subscription);
  }

  private updateShopInformationById(data: ShopInformation) {
    const subscription = this.shopInformationService.addShopInformation(data)
      .subscribe(res => {
        this.uiService.message(res.message, 'success');
      }, err => {
        console.log(err);
      });
    this.subscriptions.push(subscription);
  }



  onRadioChange(event: any) {
    // If unchecked
    if (!event.source.checked) {
      this.inputText = this.radioLabel;
      this.dialogRef = this.dialog.open(this.dialogTemplate);
    }
  }

  saveInput() {
    if (this.inputText.trim()) {
      this.radioLabel = this.inputText;
      this.showRadio = false; // Hide radio button
    }
    this.dialogRef.close();
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
