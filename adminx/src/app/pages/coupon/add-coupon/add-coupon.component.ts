import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, NgForm, Validators} from "@angular/forms";
import {Coupon} from "../../../interfaces/common/coupon.interface";
import {Select} from "../../../interfaces/core/select";
import {DATA_STATUS, DISCOUNT_TYPES} from "../../../core/utils/app-data";
import {Subscription} from "rxjs";
import {UiService} from "../../../services/core/ui.service";
import {MatDialog} from "@angular/material/dialog";
import {CouponService} from "../../../services/common/coupon.service";
import {ActivatedRoute, Router} from "@angular/router";
import {UtilsService} from "../../../services/core/utils.service";
import {PageDataService} from "../../../services/core/page-data.service";
import {Title} from "@angular/platform-browser";
import {ConfirmDialogComponent} from "../../../shared/components/ui/confirm-dialog/confirm-dialog.component";

@Component({
  selector: 'app-add-coupon',
  templateUrl: './add-coupon.component.html',
  styleUrl: './add-coupon.component.scss'
})
export class AddCouponComponent implements OnInit, OnDestroy {

  today: Date = new Date();
  minDate = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() + 1);


  // Decorator
  @ViewChild('formElement') formElement: NgForm;

  // Data Form
  dataForm?: FormGroup;

  // Store Data
  id: string;
  coupon: Coupon;
  dataStatus: Select[] = DATA_STATUS;
  autoSlug: boolean = true;

  // Loading Control
  isLoading: boolean = false;

  // Image Control
  pickedImages: any[]= [];
  pickedIcon: string[] = [];

  // Static Data
  discountTypes: Select[] = DISCOUNT_TYPES;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Inject
  private readonly uiService = inject(UiService);
  private readonly dialog = inject(MatDialog);
  private readonly couponService = inject(CouponService);
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
        this.getCouponById();
      }
    });
    this.subscriptions.push(subParamMap);

    // Auto Slug
    this.autoGenerateSlug();
    this.setPageData();
  }

  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Add Coupon');
    this.pageDataService.setPageData({
      title: 'Add Coupon',
      navArray: [
        {name: 'Dashboard', url: `/dashboard`},
        {name: 'Add Coupon', url: 'https://www.youtube.com/embed/XgpQ4XMWkoo'},
      ]
    })
  }

  /**
   * FORM METHODS
   * initDataForm()
   * onSubmit()
   * onDiscard()
   * setFormValue()
   * patchDefaultValue()
   */
  private initDataForm() {
    this.dataForm = this.fb.group({
      name: [null, Validators.required],
      discountType: [null, Validators.required],
      discountAmount: [null, Validators.required],
      minimumAmount: [null, Validators.required],
      bannerImage: [null],
      couponCode: [null],
      description: [null],
      startDateTime: [null, Validators.required],
      endDateTime: [null, Validators.required],
    });
  }

  onSubmit() {


    if (this.dataForm.invalid) {
      this.uiService.message('Please fill all the required fields', 'warn');
      return;
    }


    let mData = {
      ...this.dataForm.value,
    };

    if (this.dataForm.value.urlType === 'internal') {
      mData = {
        ...mData,
        ...{
          url: this.utilsService.extractPath(this.dataForm.value.url)
        }
      }
    }

    if (!this.coupon) {
      this.addCoupon(mData);
    } else {
      this.updateCouponById(mData);
    }
  }

  onDiscard() {
    if (this.dataForm.dirty) {
      this.openConfirmDialog();
    } else {
      this.router.navigate(['/', 'coupon', 'all-coupon']).then();

    }
  }

  private setFormValue() {
    this.dataForm.patchValue(this.coupon);

    if (this.coupon.bannerImage) {
      this.pickedImages = [this.coupon.bannerImage];
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
        this.router.navigate(['/coupon/all-coupon']).then();
      }
    });
    this.subscriptions.push(subDialogResult);
  }

  onPickedImage(event: any) {
    this.dataForm.patchValue({bannerImage: event[0]});
  }

  onPickedIcon(event: any) {
    this.dataForm.patchValue({image: event});
  }

  /**
   * HTTP REQ HANDLE
   * getCouponById()
   * addCoupon()
   * updateCouponById()
   */
  private getCouponById() {
    const subscription = this.couponService.getCouponById(this.id).subscribe({
      next: (res) => {
        if (res.data) {
          this.coupon = res.data;
          this.setFormValue();
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
    this.subscriptions.push(subscription);
  }

  private addCoupon(data: any) {
    const subscription = this.couponService.addCoupon(data)
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

  private updateCouponById(data: any) {
    const subscription = this.couponService.updateCouponById(this.coupon._id, data)
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
