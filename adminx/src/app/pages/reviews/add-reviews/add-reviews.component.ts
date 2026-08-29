import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, NgForm, Validators} from "@angular/forms";
import {Review} from "../../../interfaces/common/review.interface";
import {Select} from "../../../interfaces/core/select";
import {BANNER_TYPE, DATA_STATUS, URL_TYPES} from "../../../core/utils/app-data";
import {Subscription} from "rxjs";
import {UiService} from "../../../services/core/ui.service";
import {MatDialog} from "@angular/material/dialog";
import {ReviewService} from "../../../services/common/review.service";
import {ActivatedRoute, Router} from "@angular/router";
import {UtilsService} from "../../../services/core/utils.service";
import {PageDataService} from "../../../services/core/page-data.service";
import {Title} from "@angular/platform-browser";
import {MatSelectChange} from "@angular/material/select";
import {ConfirmDialogComponent} from "../../../shared/components/ui/confirm-dialog/confirm-dialog.component";
import {Product} from "../../../interfaces/common/product.interface";

@Component({
  selector: 'app-add-reviews',
  templateUrl: './add-reviews.component.html',
  styleUrl: './add-reviews.component.scss'
})
export class AddReviewsComponent implements OnInit, OnDestroy {

  // Decorator
  @ViewChild('formElement') formElement: NgForm;

  reviewStatus: Select[] = [
    {value: false, viewValue: 'Not Approve'},
    {value: true, viewValue: 'Approve'},
  ];
  // Data Form
  dataForm?: FormGroup;
  stars = [1, 2, 3, 4, 5]; // Array to display 5 stars
  currentHover = 0; // Temporary hover rating
  ratingText = '';
  rating = 0;
  allTableData: Product[] = [];
  // Store Data
  id: string;
  review: Review;
  dataStatus: Select[] = DATA_STATUS;
  urlTypes: Select[] = URL_TYPES;
  reviewType: Select[] = BANNER_TYPE;

  // Loading Control
  isLoading: boolean = false;

  // Image Control
  pickedImages: string[] = [];

  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Inject
  private readonly uiService = inject(UiService);
  private readonly dialog = inject(MatDialog);
  private readonly reviewService = inject(ReviewService);
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
        this.getReviewById();
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
    this.title.setTitle('Add Review');
    this.pageDataService.setPageData({
      title: 'Add Review',
      navArray: [
        {name: 'Dashboard', url: `/dashboard`},
        {name: 'Add Review', url: 'https://www.youtube.com/embed/2bAgtL1YI_E'},
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
      product: [null],
      name: [null],
      review: [null],
      rating: [null],
      deliveryExperienceRating: [null],
      reviewDate: [null],
      replyDate: [null],
      reply: [null],
      status: [true],
      like: 0,
      dislike: 0,
      images: [null],
      deliveryExperience: [null],
    });
  }

  onSubmit() {
    // if (!this.dataForm.value.images || !this.dataForm.value.images.length) {
    //   this.uiService.message('Image is required, Please select image', 'warn');
    //   this.dataForm.markAllAsTouched();
    //   return;
    // }

    if (this.dataForm.invalid) {
      this.uiService.message('Please fill all the required fields', 'warn');
      return;
    }


    let mData = {
      ...this.dataForm.value,
      ...{
        rating: this.rating,
        reviewDate: this.utilsService.getDateString(new Date()),
        product: this.allTableData[0]?._id,
        status: this.review?.status,
      }
    };

    if (this.dataForm.value.urlType === 'internal') {
      mData = {
        ...mData,
        ...{
          url: this.utilsService.extractPath(this.dataForm.value.url)
        }
      }
    }

    if (!this.review) {
      this.addReview(mData);
    } else {

      let mData = {
        ...this.dataForm.value,
        ...{
          rating: this.rating,
          reviewDate: this.utilsService.getDateString(new Date()),
          product: this.review?.product,
          // status: this.review?.status,
          _id: this.id
        }
      };
      this.updateReviewById(mData);
    }
  }

  onDiscard() {
    if (this.dataForm.dirty) {
      this.openConfirmDialog();
    } else {
      this.router.navigate(['/', 'review']).then();
    }
  }

  private setFormValue() {
    this.dataForm.patchValue(this.review);

    if (this.review.images) {
      this.pickedImages = this.review.images;
    }
    this.rating = this.review?.rating;
    this.allTableData = [this.review.product]
  }

  private patchDefaultValue() {
    this.dataForm.patchValue({status: 'publish'});
    this.pickedImages = [];
  }

  /**
   * LOGICAL PART
   * onProductSelect()
   * deleteProducts()
   */

  onProductSelect(event: Product) {
    // console.log("event",event)
    this.allTableData.push(event);
  }
  /**
   * SELECTION CHANGE
   * onUrlTypeChange()
   */
  onUrlTypeChange(event: MatSelectChange) {
    if (!event.value) {
      this.dataForm.get('url').setValue(null);
    }
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
        this.router.navigate(['/customization/all-review']).then();
      }
    });
    this.subscriptions.push(subDialogResult);
  }

  onPickedImage(event: any) {
    this.dataForm.patchValue({images: event});
  }

  /**
   * HTTP REQ HANDLE
   * getReviewById()
   * getAllSubCategories()
   * addReview()
   * updateReviewById()
   * getAllCategories()
   */
  private getReviewById() {
    const subscription = this.reviewService.getReviewByReviewId(this.id).subscribe({
      next: (res) => {
        if (res.data) {
          this.review = res.data;
          this.setFormValue();
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
    this.subscriptions.push(subscription);
  }

  private addReview(data: any) {
    const subscription = this.reviewService.addReview(data)
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

  private updateReviewById(data: any) {
    const subscription = this.reviewService.updateReview(data)
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
  rate(value: number): void {
    this.rating = value;
    this.updateRatingText();
  }

  hover(value: number): void {
    this.currentHover = value;
  }

  updateRatingText(): void {
    const texts = ['Poor', 'Fair', 'Good', 'Very Good', 'Delightful'];
    this.ratingText = texts[this.rating - 1] || '';
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
