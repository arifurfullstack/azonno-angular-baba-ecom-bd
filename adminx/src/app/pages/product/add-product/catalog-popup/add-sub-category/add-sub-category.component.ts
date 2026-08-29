import {Component, Inject, inject, OnInit, ViewChild} from "@angular/core";
import {SubCategoryService} from "../../../../../services/common/sub-category.service";
import {StringToSlugPipe} from "../../../../../shared/pipes/string-to-slug.pipe";
import {FormBuilder, FormGroup, NgForm, Validators} from "@angular/forms";
import {SubCategory} from "../../../../../interfaces/common/sub-category.interface";
import {Category} from "../../../../../interfaces/common/category.interface";
import {defaultUploadImage} from "../../../../../core/utils/app-data";
import {Subscription} from "rxjs";
import {UiService} from "../../../../../services/core/ui.service";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {CategoryService} from "../../../../../services/common/category.service";
import {ReloadService} from "../../../../../services/core/reload.service";
import {FilterData} from "../../../../../interfaces/core/filter-data";
import {Gallery} from "../../../../../interfaces/gallery/gallery.interface";
import {MyGalleryComponent} from '../../../../my-gallery/my-gallery.component';


@Component({
  selector: 'app-add-sub-category',
  templateUrl: './add-sub-category.component.html',
  styleUrl: './add-sub-category.component.scss',
  providers: [StringToSlugPipe]
})
export class AddSubCategoryComponent implements OnInit{


  // Data Form
  @ViewChild('formElement') formElement: NgForm;
  dataForm?: FormGroup;

  // Store Data
  autoSlug: boolean = true;
  id?: string;
  subCategory?: SubCategory;
  categories: Category[] = [];

  // Image Picker
  pickedImage = defaultUploadImage;
  featurePickedImage = defaultUploadImage;

  // Subscriptions
  private subDataOne: Subscription;
  private subAutoSlug: Subscription;
  private subDataFour: Subscription;

  // Inject
  private readonly fb = inject(FormBuilder);
  private readonly uiService = inject(UiService);
  private readonly subCategoryService = inject(SubCategoryService);
  private readonly dialog = inject(MatDialog);
  private readonly categoryService = inject(CategoryService);
  private readonly reloadService = inject(ReloadService);

  constructor(
    public dialogRef: MatDialogRef<AddSubCategoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
  }

  ngOnInit(): void {
    // Init Form
    this.initDataForm();
    if(this.data){
      this.dataForm?.patchValue({category: this.data})
    }
    // Auto Slug
    this.autoGenerateSlug();

    // Base Data
    this.getAllCategories();
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
      shop: [null],
      name: [null, Validators.required],
      category: [null],
      description: [null],
      slug: [null],
      image: [null],
      status: ['publish'],
    });
  }


  onSubmit() {
    if (this.dataForm.invalid) {
      this.uiService.message('Please filed all the required field', 'warn');
      return;
    }
    const mData = {
      ...this.dataForm.value,
      ...{
        category: {
          _id: this.dataForm.value.category,
          name: this.categories.find(f => f._id === this.dataForm.value.category).name,
          slug: this.categories.find(f => f._id === this.dataForm.value.category).slug,
        }
      }
    }
    this.addSubCategory(mData);
  }


  private addSubCategory(data: any) {

    this.subDataOne = this.subCategoryService
      .addSubCategory(data)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.uiService.message(res.message, 'success');
            this.formElement.resetForm();
            this.reloadService.needRefreshData$();
            this.onClose(res.data);
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
   * HTTP REQ HANDLE
   * getAllCategories
   */
  private getAllCategories() {
    // Select
    const mSelect = {
      name: 1,
      slug: 1,
    }

    const filterData: FilterData = {
      pagination: null,
      filter: null,
      select: mSelect,
      sort: {name: 1}
    }
    this.subDataFour = this.categoryService.getAllCategories(filterData, null)
      .subscribe({
        next: (res => {
          this.categories = res.data;
        }),
        error: (error => {
          console.log(error);
        })
      });
  }


  /**
   * LOGICAL PART
   * autoGenerateSlug()
   */
  autoGenerateSlug() {
    if (this.autoSlug === true) {
      this.subAutoSlug = this.dataForm.get('name').valueChanges
        .pipe(
          // debounceTime(200),
          // distinctUntilChanged()
        ).subscribe(d => {
          const res = d?.trim().replace(/\s+/g, '-').toLowerCase();
          this.dataForm.patchValue({
            slug: res
          });
        });
    } else {
      if (!this.subAutoSlug) {
        return;
      }
      this.subAutoSlug?.unsubscribe();
    }
  }


  /**
   * COMPONENT DIALOG
   * openGalleryDialog
   */

  public openGalleryDialog() {
    const dialogRef = this.dialog.open(MyGalleryComponent, {
      data: {type: 'single', count: 1},
      panelClass: ['theme-dialog', 'full-screen-modal-lg'],
      width: '100%',
      minHeight: '100%',
      autoFocus: false,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        if (dialogResult.data && dialogResult.data.length > 0) {
          const image: Gallery = dialogResult.data[0] as Gallery;
          this.dataForm.patchValue({image: image.url});
          this.pickedImage = image.url;
        }
      }
    });
  }

  /**
   * ON CLOSE DIALOG
   * onClose()
   */
  onClose(data?:any) {
    if(data){
      this.dialogRef.close(data);
    }else {
      this.dialogRef.close()
    }
  }


  /**
   * ON DESTROY
   */
  ngOnDestroy() {
    if (this.subDataOne) {
      this.subDataOne.unsubscribe();
    }
    if (this.subAutoSlug) {
      this.subAutoSlug.unsubscribe();
    }
    if (this.subDataFour) {
      this.subDataFour.unsubscribe();
    }
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}

