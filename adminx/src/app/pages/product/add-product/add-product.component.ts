import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, NgForm, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatSelectChange } from "@angular/material/select";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription, take } from "rxjs";
import { Brand } from "../../../interfaces/common/brand.interface";
import { Category } from "../../../interfaces/common/category.interface";
import { ChildCategory } from "../../../interfaces/common/child-category.interface";
import { Product } from "../../../interfaces/common/product.interface";
import { SubCategory } from "../../../interfaces/common/sub-category.interface";
import { Tag } from "../../../interfaces/common/tag.interface";
import { Variation } from "../../../interfaces/common/variation.interface";
import { FilterData } from "../../../interfaces/gallery/filter-data";
import { BrandService } from "../../../services/common/brand.service";
import { CategoryService } from "../../../services/common/category.service";
import { ChildCategoryService } from "../../../services/common/child-category.service";
import { ProductService } from "../../../services/common/product.service";
import { SettingService } from '../../../services/common/setting.service';
import { ShopInformationService } from "../../../services/common/shop-information.service";
import { SkinConcernService } from "../../../services/common/skin-concern.service";
import { SkinTypeService } from "../../../services/common/skin-type.service";
import { SubCategoryService } from "../../../services/common/sub-category.service";
import { TagService } from "../../../services/common/tag.service";
import { PageDataService } from "../../../services/core/page-data.service";
import { ReloadService } from "../../../services/core/reload.service";
import { UiService } from "../../../services/core/ui.service";
import { StringToSlugPipe } from "../../../shared/pipes/string-to-slug.pipe";
import { MyGalleryComponent } from '../../my-gallery/my-gallery.component';
import { AddBrandComponent } from "./catalog-popup/add-brand/add-brand.component";
import { AddCategoryComponent } from "./catalog-popup/add-category/add-category.component";
import { AddChildCategoryComponent } from "./catalog-popup/add-child-category/add-child-category.component";
import { AddSubCategoryComponent } from "./catalog-popup/add-sub-category/add-sub-category.component";
import { AddTagComponent } from "./catalog-popup/add-tag/add-tag.component";
import { SkinConcernComponent } from "./catalog-popup/skin-concern/skin-concern.component";
import { SkinTypeComponent } from "./catalog-popup/skin-type/skin-type.component";

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.scss',
  providers: [StringToSlugPipe]
})
export class AddProductComponent implements OnInit {


  @ViewChild('formElement') formElement: NgForm;

  // Form Data
  dataForm?: FormGroup;

  // Gallery View
  protected isGalleryOpen: boolean = false;
  protected galleryImages: string[] = [];
  protected selectedImageIndex: number = 0;

  // Store Data
  categories: Category[] = [];
  subCategories: SubCategory[] = [];
  childCategories: ChildCategory[] = [];
  brands: Brand[] = [];
  skinTypes: Brand[] = [];
  skinConcerns: Brand[] = [];
  tags: Tag[] = [];
  id?: string;
  product?: Product;
  variations: Variation[] = [];
  isEnableVariation2: boolean = false;
  selectedOption: string = 'publish';
  facebookCatalog: any;
  productSetting: any;
  affiliateSetting: any;

  // Image Control
  pickedImages: string[] = [];
  chooseImage: string[] = [];
  isPopupVisible = false;
  popupImageUrl: string = '';
  protected shopInformation: any;

  // Form Arrays
  specificationDataArray?: FormArray;
  variationOptionsDataArray?: FormArray;
  variation2OptionsDataArray?: FormArray;
  variationListDataArray?: FormArray;
  driveLinkDataArray?: FormArray;

  // Subscriptions
  private subDataOne: Subscription;
  private subDataTwo: Subscription;
  private subDataThree: Subscription;
  private subDataFour: Subscription;
  private subDataFive: Subscription;
  private subDataSix: Subscription;
  private subDataSeven: Subscription;
  private subAutoSlug: Subscription;
  private subReload: Subscription;

  // Inject Services
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly uiService = inject(UiService);
  private readonly dialog = inject(MatDialog);
  private readonly stringToSlugPipe = inject(StringToSlugPipe);
  private readonly tagService = inject(TagService);
  private readonly brandService = inject(BrandService);
  private readonly skinTypeService = inject(SkinTypeService);
  private readonly skinConcernService = inject(SkinConcernService);
  private readonly childCategoryService = inject(ChildCategoryService);
  private readonly subCategoryService = inject(SubCategoryService);
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);
  private readonly reloadService = inject(ReloadService);
  private readonly pageDataService = inject(PageDataService);
  private readonly shopInformationService = inject(ShopInformationService);
  private readonly title = inject(Title);
  private readonly settingService = inject(SettingService);

  // Subscriptions
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.initDataForm();

    this.activatedRoute.paramMap.subscribe((param) => {
      this.id = param.get('id');
      if (this.id) {
        this.getProductById();
      }
    });

    this.subReload = this.reloadService.refreshData$.subscribe(() => {
      this.getAllCategories();
      this.getAllBrands();
      this.getAllConcerns();
      this.getAllTypes();
      this.getAllTags();
    });

    // Base Data
    this.setPageData();
    this.getShopInformation();
    // this.autoGenerateSlug();
    this.getAllCategories();
    this.getAllBrands();
    this.getAllConcerns();
    this.getAllTypes();
    this.getAllTags();
    this.getSetting();
    this.monitorOptionChanges();
    this.monitorVariationOptions();
    this.monitorVariation2Options();
    this.autoSyncSeoTitle();
    this.getAffiliateSetting();
  }

  private initDataForm() {
    this.dataForm = this.fb.group({
      shop: [null],
      autoSlug: [true],
      name: [null, [Validators.required, Validators.minLength(10)]],
      slug: [null],
      description: [null],
      affiliateDescription: [null],
      affiliateUrl: [null],
      affiliatePrice: [null],
      costPrice: [null],
      salePrice: [null],
      sku: [null],
      priority: [null],
      seoKeyword: [null],
      seoDescription: [null],
      seoTitle: [null],
      sameVariantValue: [false],
      variationCostPrice: [null],
      variationSku: [null],
      variationPrice: [null],
      variationRegularPrice: [null],
      variationQuantity: [null],
      keyWord: [null],
      skinType: [null],
      skinConcern: [null],
      warranty: [null],
      regularPrice: [null],
      weight: [],
      model: [null],
      discountType: [null],
      discountAmount: [null],
      images: [null],
      quantity: [null],
      category: [null, Validators.required],
      subCategory: [null],
      childCategory: [null],
      brand: [null],
      tags: [null],
      status: ['publish', Validators.required],
      videoUrl: [null],
      unit: ['Kg'],
      isFacebookCatalog: [false],
      isAffiliateProduct: [false],
      isEnablePhoneModel: [false],
      isWholesale: [false],
      wholesaleUnit: [null],
      minimumWholesaleQuantity: [null],
      maximumWholesaleQuantity: [null],
      wholesalePrice: [null],
      advancePayment: [null],
      insideCity: [null],
      outsideCity: [null],
      specifications: this.fb.array([
        this.createSpecificationGroup()
      ]),
      driveLinks: this.fb.array([
        this.createSpecificationGroup()
      ]),
      isVariation: [false],
      variation: [null],
      variationOptions: this.fb.array([
        this.createStringElement()
      ]),
      variation2: [null],
      variation2Options: this.fb.array([
        this.createStringElement()
      ]),
      variationList: this.fb.array([]),
    });

    this.specificationDataArray = this.dataForm.get('specifications') as FormArray;
    this.driveLinkDataArray = this.dataForm.get('driveLinks') as FormArray;
    this.variationOptionsDataArray = this.dataForm.get('variationOptions') as FormArray;
    this.variation2OptionsDataArray = this.dataForm.get('variation2Options') as FormArray;
    this.variationListDataArray = this.dataForm.get('variationList') as FormArray;

    this.applyConditionalValidators();
    this.dataForm.get('isVariation')?.valueChanges.subscribe(() => {
      this.applyConditionalValidators();
    });
    this.monitorSpecifications();
    this.monitorDriveLinks();
    this.applyVariationValidators();

    this.dataForm.get('isVariation').valueChanges.subscribe(() => {
      this.applyVariationValidators();
    });
  }


  // Helper function to apply or remove required validators
  private applyConditionalValidators() {
    const isVariation = this.dataForm.get('isVariation')?.value;

    if (isVariation) {
      this.dataForm.get('salePrice')?.clearValidators();
      this.dataForm.get('regularPrice')?.clearValidators();
      this.dataForm.get('costPrice')?.clearValidators();
      this.dataForm.get('quantity')?.clearValidators();
    } else {
      this.dataForm.get('salePrice')?.setValidators(Validators.required);
      this.dataForm.get('regularPrice')?.setValidators(Validators.required);
      this.dataForm.get('costPrice')?.setValidators(Validators.required);
      this.dataForm.get('quantity')?.setValidators(Validators.required);
    }

    this.dataForm.get('salePrice')?.updateValueAndValidity();
    this.dataForm.get('regularPrice')?.updateValueAndValidity();
    this.dataForm.get('costPrice')?.updateValueAndValidity();
    this.dataForm.get('quantity')?.updateValueAndValidity();
  }

  private applyVariationValidators() {
    const isVariation = this.dataForm.get('isVariation').value;

    if (isVariation) {
      // Set required validators
      this.dataForm.get('variation').setValidators(Validators.required);
      this.variationOptionsDataArray.controls.forEach(control => control.setValidators(Validators.required));

      if (this.isEnableVariation2) {
        this.dataForm.get('variation2').setValidators(Validators.required);
        this.variation2OptionsDataArray.controls.forEach(control => control.setValidators(Validators.required));
      }
    } else {
      // Clear validators
      this.dataForm.get('variation').clearValidators();
      this.variationOptionsDataArray.controls.forEach(control => control.clearValidators());

      this.dataForm.get('variation2').clearValidators();
      this.variation2OptionsDataArray.controls.forEach(control => control.clearValidators());
    }

    // Update validity
    this.dataForm.get('variation').updateValueAndValidity();
    this.dataForm.get('variation2').updateValueAndValidity();
    this.variationOptionsDataArray.controls.forEach(control => control.updateValueAndValidity());
    this.variation2OptionsDataArray.controls.forEach(control => control.updateValueAndValidity());
  }


  private setFormValue() {
    this.dataForm.patchValue({
      ...this.product,
      ...{
        category: this.product.category._id
      }
    }
    );

    if (this.product.brand) {
      this.dataForm.patchValue({
        brand: this.product.brand._id,
      })
    }

    if (this.product.skinType) {
      this.dataForm.patchValue({
        skinType: this.product.skinType._id,
      })
    }

    if (this.product.skinConcern) {
      this.dataForm.patchValue({
        skinConcern: this.product.skinConcern._id,
      })
    }

    if (this.product.deliveryCharge) {
      this.dataForm.patchValue({
        insideCity: this.product.deliveryCharge.insideCity, outsideCity: this.product.deliveryCharge.outsideCity,
      })
    }

    this.dataForm.patchValue({ status: this.product?.status });
    this.selectedOption = this.product?.status;

    if (this.product.keyWord) {
      this.dataForm.patchValue({ keyWord: this.product.keyWord })
    }

    if (this.product.subCategory) {
      this.dataForm.patchValue({
        subCategory: this.product.subCategory._id,
      })
    }

    if (this.product.childCategory) {
      this.dataForm.patchValue({
        childCategory: this.product.childCategory._id,
      })
    }

    // Tags
    if (this.product.tags && this.product.tags.length) {
      this.dataForm.patchValue({
        tags: this.product.tags.map(m => m?._id)
      })
    }

    this.specificationDataArray.clear();
    if (this.product.specifications && this.product.specifications.length) {
      this.product.specifications.forEach((f: any) => {
        const data = this.fb.group({
          name: [f.name],
          value: [f.value]
        });
        (this.dataForm?.get('specifications') as FormArray).push(data);
      });
    }

    this.driveLinkDataArray.clear();
    if (this.product.driveLinks && this.product.driveLinks.length) {
      this.product.driveLinks.forEach((f: any) => {
        const data = this.fb.group({
          name: [f.name],
          value: [f.value]
        });
        (this.dataForm?.get('driveLinks') as FormArray).push(data);
      });
    }

    // Variations
    if (this.product?.isVariation) {
      this.isEnableVariation2 = true;

      // Clear form arrays first to avoid duplicates
      this.variationOptionsDataArray.clear();
      this.variation2OptionsDataArray.clear();

      // Push existing variation options to the form
      this.product.variationOptions.forEach((f: any) => {
        const ctrl = this.fb.control(f, Validators.required);
        this.variationOptionsDataArray.push(ctrl);
      });

      this.product.variation2Options.forEach((f: any) => {
        const ctrl = this.fb.control(f, Validators.required);
        this.variation2OptionsDataArray.push(ctrl);
      });

      // Ensure at least one blank input in `variationOptions`
      if (this.variationOptionsDataArray.length === 0 || this.variationOptionsDataArray.at(this.variationOptionsDataArray.length - 1)?.value !== '') {
        this.variationOptionsDataArray.push(this.createStringElement());
      }

      // Ensure at least one blank input in `variation2Options`
      if (this.variation2OptionsDataArray.length === 0 || this.variation2OptionsDataArray.at(this.variation2OptionsDataArray.length - 1)?.value !== '') {
        this.variation2OptionsDataArray.push(this.createStringElement());
      }

      this.variationListDataArray.clear();
      this.product.variationList.map(m => {
        const f = this.fb.group({
          name: [m.name, Validators.required],
          salePrice: [m.salePrice, Validators.required],
          regularPrice: [m.regularPrice, Validators.required],
          costPrice: [m.costPrice, Validators.required],
          quantity: [m.quantity],
          image: [m.image],
          sku: [m.sku],
        });
        this.variationListDataArray.push(f);
      });
    } else {
      // Ensure at least one blank input in `variationOptions` when no variation is enabled
      if (this.variationOptionsDataArray.length === 0 || this.variationOptionsDataArray.at(this.variationOptionsDataArray.length - 1)?.value !== '') {
        this.variationOptionsDataArray.push(this.createStringElement());
      }
    }

    if (this.product.images) {
      this.pickedImages = this.product.images;
    }

    // Get Sub Category By Category
    if (this.product.category) {
      this.getSubCategoriesByCategoryId(this.product.category._id);
    }
    if (this.product.subCategory) {
      this.getChildCategoriesBySubCategoryId(this.product.subCategory._id);
    }
  }

  // picked product Image
  onPickedImage(event: any) {
    this.dataForm.patchValue({ images: event });
  }


  //specification
  onAddNewSpecifications() {
    const f = this.fb.group({
      name: [null],
      value: [null]
    });
    (this.dataForm?.get('specifications') as FormArray).push(f);
  }

  //driveLinks
  onAddNewLink() {
    const f = this.fb.group({
      name: [null],
      value: [null]
    });
    (this.dataForm?.get('driveLinks') as FormArray).push(f);
  }


  private monitorSpecifications() {
    const specificationsArray = this.specificationDataArray;

    const monitorLastField = () => {
      const lastField = specificationsArray.at(specificationsArray.length - 1);
      if (lastField) {
        lastField.get('value').valueChanges.pipe(take(1)).subscribe(value => {
          if (value && value.trim() !== '') {
            specificationsArray.push(this.createSpecificationGroup());
            monitorLastField(); // Recurse to keep adding as fields are filled
          }
        });
      }
    };
    // Start monitoring
    monitorLastField();
  }

  private monitorDriveLinks() {
    const driveLinksArray = this.driveLinkDataArray;

    const monitorLastField = () => {
      const lastField = driveLinksArray.at(driveLinksArray.length - 1);
      if (lastField) {
        lastField.get('value').valueChanges.pipe(take(1)).subscribe(value => {
          if (value && value.trim() !== '') {
            driveLinksArray.push(this.createSpecificationGroup());
            monitorLastField(); // Recurse to keep adding as fields are filled
          }
        });
      }
    };
    // Start monitoring
    monitorLastField();
  }


  private createSpecificationGroup(): FormGroup {
    return this.fb.group({
      name: [null],
      value: [null]
    });
  }

  removeFormArrayField1(formControl: string, index: number) {
    let formDataArray: FormArray;
    switch (formControl) {
      case 'specifications': {
        formDataArray = this.specificationDataArray;
        break;
      }
      case 'driveLinks': {
        formDataArray = this.driveLinkDataArray;
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
   * VARIATIONS LOGICS
   * onAddNewVariationObject()
   * createVariationsOptions()
   * removeVariationImage()
   * onCheckEnableVariations()
   */

  //variation

  onToggleVariation2(type: 'add' | 'remove') {
    this.isEnableVariation2 = type === 'add';


    if (type === 'remove') {
      // Get the values in variation2Options to be removed from the variation names
      const variation2Values = this.dataForm.value.variation2Options || [];

      // Loop through variationList to remove variation2Options values from the `name` field
      this.variationListDataArray.controls.forEach((group: FormGroup) => {
        let variationName = group.get('name').value;

        // Remove each variation2 option from the name
        variation2Values.forEach(value => {
          if (variationName.includes(value)) {
            variationName = variationName.replace(new RegExp(`,?\\s*${value}\\b`), '').trim();
          }
        });

        // Update the name without variation2 options
        group.patchValue({ name: variationName });
      });

      // Clear `variation2Options` data array and reset related form control
      this.dataForm.patchValue({ variation2: null });
      this.variation2OptionsDataArray.clear();
    } else {
      // Add an empty input for `variation2Options` when enabled
      this.onAddNewFormString('variation2Options');
      if (this.dataForm.value.regularPrice || this.dataForm.value.salePrice || this.dataForm.value.variationCostPrice) {
        this.steValue();
      }
    }
  }

  steValue() {
    this.dataForm.patchValue({
      variationRegularPrice: this.dataForm.value.regularPrice,
      variationPrice: this.dataForm.value.salePrice,
      variationCostPrice: this.dataForm.value.costPrice,
      variationQuantity: this.dataForm.value.quantity,
      variationSku: this.dataForm.value.sku
    });

  }

  // Monitor changes in variationOptions and variation2Options
  monitorOptionChanges() {
    // Monitor changes in variationOptions
    this.variationOptionsDataArray.valueChanges.subscribe(() => {
      this.updateVariationList();
    });

    // Monitor changes in variation2Options
    this.variation2OptionsDataArray.valueChanges.subscribe(() => {
      this.updateVariationList();
    });
  }

  // Update the variation list based on changes in options
  updateVariationList() {
    // Create a map of current variations with their names as keys for easy lookup
    const existingVariations = new Map<string, any>();
    this.variationListDataArray.controls.forEach((group: FormGroup) => {
      existingVariations.set(group.get('name').value, group.value);
    });

    // Clear existing variationList entries to re-populate
    this.variationListDataArray.clear();

    const variationOptions = this.dataForm.value.variationOptions || [];
    const variation2Options = this.dataForm.value.variation2Options || [];

    const validVariationOptions = variationOptions.filter(v => v && v.trim() !== '');
    const validVariation2Options = variation2Options.filter(v => v && v.trim() !== '');

    if (validVariationOptions.length > 0) {
      if (validVariation2Options.length > 0) {
        validVariationOptions.forEach((v1) => {
          validVariation2Options.forEach((v2) => {
            const variationName = `${v1}, ${v2}`;
            const existingData = existingVariations.get(variationName);

            const newVariation = this.fb.group({
              name: [variationName, Validators.required],
              sku: [existingData ? existingData.sku : null],
              salePrice: [existingData ? existingData.salePrice : null, Validators.required],
              costPrice: [existingData ? existingData.costPrice : null, Validators.required],
              regularPrice: [existingData ? existingData.regularPrice : null, Validators.required],
              quantity: [existingData ? existingData.quantity : null, Validators.required],
              image: [existingData ? existingData.image : null],
            });

            this.variationListDataArray.push(newVariation);
          });
        });
      } else {
        validVariationOptions.forEach((v1) => {
          const existingData = existingVariations.get(v1);

          const newVariation = this.fb.group({
            name: [v1, Validators.required],
            sku: [existingData ? existingData.sku : null],
            salePrice: [existingData ? existingData.salePrice : null, Validators.required],
            costPrice: [existingData ? existingData.costPrice : null, Validators.required],
            regularPrice: [existingData ? existingData.regularPrice : null, Validators.required],
            quantity: [existingData ? existingData.quantity : null, Validators.required],
            image: [existingData ? existingData.image : null],
          });

          this.variationListDataArray.push(newVariation);
        });
      }
    }
  }


  // Apply the form control values to all variations
  applyToAll() {
    const price = this.dataForm.get('variationPrice').value;
    const regPrice = this.dataForm.get('variationRegularPrice').value;
    const costPrice = this.dataForm.get('variationCostPrice').value;
    const sku = this.dataForm.get('variationSku').value;
    const quantity = this.dataForm.get('variationQuantity').value;

    this.variationListDataArray.controls.forEach((group: FormGroup) => {
      if (price !== null) {
        group.get('salePrice').setValue(price);
      }
      if (regPrice !== null) {
        group.get('regularPrice').setValue(regPrice);
      }
      if (costPrice !== null) {
        group.get('costPrice').setValue(costPrice);
      }
      if (quantity !== null) {
        group.get('quantity').setValue(quantity);
      }
      if (sku !== null) {
        group.get('sku').setValue(sku);
      }
    });
  }

  onPickImage(index: number) {
    // this.variationListDataArray.at(index).patchValue({image: 'https://cdn.huipper.com'})
    this.openVariationGalleryDialog(index)
  }

  // Method to open the popup and display the image
  openPopup(index: number) {
    const imageUrl = this.variationListDataArray.at(index).get('image').value;
    if (imageUrl) {
      this.popupImageUrl = imageUrl;
      this.isPopupVisible = true;
    } else {
      console.log('No image available to view');
    }
  }

  /**
   * Variation Click Events
   * onToggleVariation()
   */
  onToggleVariation(isEnableVariation: boolean) {
    this.dataForm.patchValue({ isVariation: isEnableVariation });

    if (isEnableVariation) {
      // If enabling, ensure there is at least one variation option field
      if (this.variationOptionsDataArray.length === 0) {
        this.variationOptionsDataArray.push(this.createStringElement());
      }
      // Additional code to initialize any other variation-related data can go here
    } else {
      // If disabling, clear the variation options and other related fields
      this.variationOptionsDataArray.clear();
      this.variation2OptionsDataArray.clear();
      this.variationListDataArray.clear();
      this.dataForm.patchValue({
        variation: null,
        variation2: null
      });
    }
    if (this.dataForm.value.regularPrice || this.dataForm.value.salePrice || this.dataForm.value.variationCostPrice) {
      this.steValue();
    }
  }

  private monitorVariationOptions() {
    const variationOptionsArray = this.dataForm.get('variationOptions') as FormArray;

    variationOptionsArray.valueChanges.subscribe(() => {
      const lastField = variationOptionsArray.at(variationOptionsArray.length - 1);

      // Only add a new blank field if the last one is non-empty
      if (lastField && lastField.value && lastField.value.trim() !== '') {
        variationOptionsArray.push(this.createStringElement());
      }
      // Remove any extra blank fields, leaving only one at the end
      for (let i = variationOptionsArray.length - 2; i >= 0; i--) {
        const field = variationOptionsArray.at(i);
        if (field && !field.value.trim()) {
          variationOptionsArray.removeAt(i);
        }
      }
    });
  }


  // Monitor `variation2Options` specifically
  private monitorVariation2Options() {
    const variation2OptionsArray = this.dataForm.get('variation2Options') as FormArray;

    variation2OptionsArray.valueChanges.subscribe(() => {
      const lastField = variation2OptionsArray.at(variation2OptionsArray.length - 1);

      // Only add a new blank field if the last one is non-empty
      if (lastField && lastField.value && lastField.value.trim() !== '') {
        variation2OptionsArray.push(this.createStringElement());
      }

      // Remove any extra blank fields, leaving only one at the end
      for (let i = variation2OptionsArray.length - 2; i >= 0; i--) {
        const field = variation2OptionsArray.at(i);
        if (field && !field.value.trim()) {
          variation2OptionsArray.removeAt(i);
        }
      }
    });
  }

  createStringElement() {
    return this.fb.control('');
  }

  private onAddNewFormString(name: 'variationOptions' | 'variation2Options') {
    const formArray = this.dataForm?.get(name) as FormArray;

    // Ensure the array has at least one field to start monitoring
    if (formArray.length === 0) {
      formArray.push(this.createStringElement());
    }

    // Monitor the last field in the form array
    const monitorLastField = () => {
      const lastField = formArray.at(formArray.length - 1);
      if (lastField) {
        lastField.valueChanges.pipe(take(1)).subscribe(value => {
          if (value && value.trim() !== '') {
            formArray.push(this.createStringElement());
            monitorLastField(); // Continue monitoring for new additions
          }
        });
      }
    };

    // Start monitoring the last field in the form array
    monitorLastField();
  }


  removeFormArrayField(name: 'variationOptions' | 'variation2Options' | 'specifications' | 'variationList', index: number) {

    let removed = 0
    this.dataForm.value.variationList.forEach((item, i) => {
      if (name === 'variation2Options') {
        const v2Value = (this.dataForm?.get('variation2Options') as FormArray).at(index).value;
        const position = item.name.search(v2Value)
        if (position !== -1) {
          (this.dataForm?.get('variationList') as FormArray).removeAt(i - removed);
          removed += 1
        }
      }

      if (name === 'variationOptions') {
        const vValue = (this.dataForm?.get('variationOptions') as FormArray).at(index).value;
        const position = item.name.search(vValue)
        if (position !== -1) {
          (this.dataForm?.get('variationList') as FormArray).removeAt(i - removed);
          removed += 1
        }
      }
    });
    (this.dataForm?.get(name) as FormArray).removeAt(index);
  }


  onSubmit() {

    if (this.dataForm.invalid) {
      this.uiService.message('Please filed all the required field', 'warn');
      this.dataForm.markAllAsTouched();
      return;
    }

    if (!this.categories.find(f => f._id === this.dataForm.value.category)?.name) {
      this.uiService.message('Please filed all the required field', 'warn');
      this.dataForm.get('category')?.reset();
      this.dataForm.markAllAsTouched();
      return;
    }

    // Filter non-empty and unique specifications
    const filteredSpecifications = this.specificationDataArray.controls
      .map(control => control.value)
      .filter(spec => spec.name && spec.value && spec.name.trim() !== '' && spec.value.trim() !== '')
      .reduce((uniqueSpecs, spec) => {
        const isDuplicate = uniqueSpecs.some(uniqueSpec => uniqueSpec.name === spec.name && uniqueSpec.value === spec.value);
        if (!isDuplicate) {
          uniqueSpecs.push(spec);
        }
        return uniqueSpecs;
      }, []);

    const filteredDriveLinks = this.driveLinkDataArray.controls
      .map(control => control.value)
      .filter(spec => spec.name && spec.value && spec.name.trim() !== '' && spec.value.trim() !== '')
      .reduce((uniqueSpecs, spec) => {
        const isDuplicate = uniqueSpecs.some(uniqueSpec => uniqueSpec.name === spec.name && uniqueSpec.value === spec.value);
        if (!isDuplicate) {
          uniqueSpecs.push(spec);
        }
        return uniqueSpecs;
      }, []);

    const filteredVariationOptions = this.variationOptionsDataArray.controls
      .filter(control => control.value.trim() !== '')
      .map(control => control.value);

    const filteredVariation2Options = this.variation2OptionsDataArray.controls
      .filter(control => control.value.trim() !== '')
      .map(control => control.value);

    // console.log('this.dataForm', this.dataForm.value);


    const mData = {
      ...this.dataForm.value,
      ...{
        category: {
          _id: this.dataForm.value.category,
          name: this.categories.find(f => f._id === this.dataForm.value.category)?.name,
          slug: this.categories.find(f => f._id === this.dataForm.value.category)?.slug,
          images: this.categories.find(f => f._id === this.dataForm.value.category)?.images,
        },
        variationOptions: filteredVariationOptions,
        variation2Options: filteredVariation2Options,
        specifications: filteredSpecifications,
        driveLinks: filteredDriveLinks,
        deliveryCharge: {
          insideCity: this.dataForm.value.insideCity,
          outsideCity: this.dataForm.value.outsideCity,
        },
      }
    }

    if (this.dataForm.value.subCategory) {
      mData.subCategory = {
        _id: this.dataForm.value.subCategory,
        name: this.subCategories.find(f => f._id === this.dataForm.value.subCategory)?.name,
        slug: this.subCategories.find(f => f._id === this.dataForm.value.subCategory)?.slug,
        images: this.subCategories.find(f => f._id === this.dataForm.value.subCategory)?.images,
      }
    }

    if (this.dataForm.value.childCategory) {
      mData.childCategory = {
        _id: this.dataForm.value.childCategory,
        name: this.childCategories.find(f => f._id === this.dataForm.value.childCategory)?.name,
        slug: this.childCategories.find(f => f._id === this.dataForm.value.childCategory)?.slug,
        images: this.childCategories.find(f => f._id === this.dataForm.value.childCategory)?.images,
      }
    }

    if (this.dataForm?.value?.brand) {
      mData.brand = {
        _id: this.dataForm.value.brand,
        name: this.brands.find(f => f._id === this.dataForm.value.brand)?.name,
        slug: this.brands.find(f => f._id === this.dataForm.value.brand)?.slug,
        images: this.brands.find(f => f._id === this.dataForm.value.brand)?.images,
      }
    }

    if (this.dataForm?.value?.skinType) {
      mData.skinType = {
        _id: this.dataForm.value.skinType,
        name: this.skinTypes.find(f => f._id === this.dataForm.value.skinType)?.name,
        slug: this.skinTypes.find(f => f._id === this.dataForm.value.skinType)?.slug,
        images: this.skinTypes.find(f => f._id === this.dataForm.value.skinType)?.images,
      }
    }

    if (this.dataForm?.value?.skinConcern) {
      mData.skinConcern = {
        _id: this.dataForm.value.skinConcern,
        name: this.skinConcerns.find(f => f._id === this.dataForm.value.skinConcern)?.name,
        slug: this.skinConcerns.find(f => f._id === this.dataForm.value.skinConcern)?.slug,
        images: this.skinConcerns.find(f => f._id === this.dataForm.value.skinConcern)?.images,
      }
    }


    if (this.dataForm.value.keyWord && !this.product?.keyWord) {
      let str = this.dataForm.value.keyWord;
      let array = str.split(",");
      mData.keyWord = array;
    }

    if (this.dataForm.value.keyWord && this.product?.keyWord) {
      mData.keyWord = this.dataForm.value.keyWord;
    }


    if (this.dataForm.value.tags && this.dataForm.value.tags.length) {
      const tags: any[] = [];
      this.dataForm.value.tags.forEach(m => {
        const fTag = this.tags.find(f => m === f._id);
        tags.push(fTag);
      })
      mData.tags = tags
    }
    // console.log(mData);
    if (this.product) {
      this.updateProductById(mData);
    } else {
      this.addProduct({ ...mData, ...{ rating: 0, approval: 'approved' } });

    }

  }

  /**
   * HTTP REQ HANDLE
   * getAllCategories
   * getAllBrands
   * getAllTags
   * getAllVariations()
   * getSubCategoriesByCategoryId()
   * getProductById()
   * addProduct()
   * updateProductById()
   */
  private getAllCategories() {

    // Select
    const mSelect = {
      name: 1,
      slug: 1,
      images: 1
    }

    const filterData: FilterData = {
      pagination: null,
      filter: null,
      select: mSelect,
      sort: { name: 1 }
    }


    this.subDataFour = this.categoryService.getAllCategories(filterData, null)
      .subscribe({
        next: (res) => {
          this.categories = res.data;
        }, error: (error) => {
          console.log(error);
        },
      });
  }

  private getAllBrands() {
    // Select
    const mSelect = {
      name: 1,
      slug: 1,
      images: 1
    }

    const filterData: FilterData = {
      pagination: null,
      filter: null,
      select: mSelect,
      sort: { name: 1 }
    }


    this.subDataFive = this.brandService.getAllBrands(filterData, null)
      .subscribe({
        next: (res) => {
          this.brands = res.data;
        }, error: (error) => {
          console.log(error);
        },
      });
  }


  private getAllTypes() {
    // Select
    const mSelect = {
      name: 1,
      slug: 1,
      images: 1
    }

    const filterData: FilterData = {
      pagination: null,
      filter: null,
      select: mSelect,
      sort: { name: 1 }
    }


    this.subDataFive = this.skinTypeService.getAllSkinTypes(filterData, null)
      .subscribe({
        next: (res) => {
          this.skinTypes = res.data;
        }, error: (error) => {
          console.log(error);
        },
      });
  }

  private getAllConcerns() {
    // Select
    const mSelect = {
      name: 1,
      slug: 1,
      images: 1
    }

    const filterData: FilterData = {
      pagination: null,
      filter: null,
      select: mSelect,
      sort: { name: 1 }
    }

    this.subDataFive = this.skinConcernService.getAllSkinConcerns(filterData, null)
      .subscribe({
        next: (res) => {
          this.skinConcerns = res.data;
          console.log('this.skinConcerns', this.skinConcerns)
        }, error: (error) => {
          console.log(error);
        },
      });
  }

  private getAllTags() {
    // Select
    const mSelect = {
      name: 1,
      slug: 1
    }

    const filterData: FilterData = {
      pagination: null,
      filter: null,
      select: mSelect,
      sort: { name: 1 }
    }


    this.subDataSix = this.tagService.getAllTags(filterData, null)
      .subscribe({
        next: (res) => {
          this.tags = res.data;
        }, error: (error) => {
          console.log(error);
        },
      });
  }


  private getSubCategoriesByCategoryId(categoryId: string) {
    const select = 'name category slug images'
    this.subDataSeven = this.subCategoryService.getSubCategoriesByCategoryId(categoryId, select)
      .subscribe({
        next: (res) => {
          this.subCategories = res.data;
        }, error: (error) => {
          console.log(error);
        },
      });
  }

  private getChildCategoriesBySubCategoryId(categoryId: string) {
    const select = 'name slug images'
    this.subDataSeven = this.childCategoryService.getChildCategoriesByCategoryId(categoryId, select)
      .subscribe({
        next: (res) => {
          this.childCategories = res.data;
        }, error: (error) => {
          console.log(error);
        },
      });
  }

  private getProductById() {
    // const select = 'name email username phoneNo gender role permissions hasAccess'
    this.subDataTwo = this.productService.getProductById(this.id)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.product = res.data;
            this.setFormValue();
          }
        }, error: (error) => {
          console.log(error);
        },
      });
  }

  private addProduct(data: any) {
    // this.vendorID = this.vendorService.getVendorId(),

    this.subDataOne = this.productService.addProduct({ ...data })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.uiService.message(res.message, 'success');
            // if (this.dataForm.value.resetForm) {
            //   this.formElement.resetForm();
            //   // this.clearFormArray(this.variationsDataArray);
            // }
            this.formElement.resetForm();
            this.dataForm.reset();
            this.clearFormArray(this.specificationDataArray);
            this.clearFormArray(this.variationOptionsDataArray);
            this.clearFormArray(this.variation2OptionsDataArray);
            this.clearFormArray(this.variationListDataArray);
            this.chooseImage = [];
            this.pickedImages = [];
            this.dataForm.patchValue({ status: 'publish' })
          } else {
            this.uiService.message(res.message, 'warn');
          }
        }, error: (error) => {
          console.log(error);
        },
      });
  }

  private updateProductById(data: any) {
    this.subDataThree = this.productService.updateProductById(this.product._id, data)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.uiService.message(res.message, 'success');
          } else {
            this.uiService.message(res.message, 'warn');
          }
        }, error: (error) => {
          console.log(error);
        },
      });
  }

  private getSetting() {
    const subscription = this.settingService.getSetting('facebookCatalog productSetting')
      .subscribe({
        next: res => {
          if (res.data) {
            this.facebookCatalog = res.data.facebookCatalog;
            this.productSetting = res.data.productSetting;
          }
        },
        error: err => {
          console.log(err)
        }
      });

    this.subscriptions.push(subscription);
  }

  private getAffiliateSetting() {
    const subscription = this.settingService.getSetting('affiliate')
      .subscribe({
        next: res => {
          if (res.data && res.data.affiliate) {
            this.affiliateSetting = res.data;

            console.log('this.affiliateSetting', this.affiliateSetting);
          }
        },
        error: err => {
          console.log(err)
        }
      });

    this.subscriptions.push(subscription);
  }

  private getShopInformation() {
    const subscription = this.shopInformationService.getShopInformation()
      .subscribe({
        next: res => {
          if (res.data) {
            this.shopInformation = res.fShopDomain;
          }
        },
        error: err => {
          console.log(err)
        }
      });
    this.subscriptions.push(subscription);
  }

  private clearFormArray(formArray: FormArray) {
    while (formArray.length !== 0) {
      formArray.removeAt(0)
    }
  }

  /**
   * REMOVE SELECTED IMAGE
   */

  removeImage(index: number) {
    this.variationListDataArray.at(index).patchValue({ image: null });
  }


  /**
   * ON CATEGORY SELECT
   */
  onCategorySelect(event: MatSelectChange) {
    if (event.value) {
      this.getSubCategoriesByCategoryId(event.value);
    }
  }

  onSubCategorySelect(event: MatSelectChange) {
    if (event.value) {
      this.getChildCategoriesBySubCategoryId(event.value);
    }
  }

  /**
   * LOGICAL PART
   * autoGenerateSlug()
   */
  autoGenerateSlug() {
    if (this.dataForm.get('autoSlug').value === true) {
      this.subAutoSlug = this.dataForm.get('name').valueChanges
        .pipe(
        // debounceTime(200),
        // distinctUntilChanged()
      ).subscribe(d => {
        const res = this.stringToSlugPipe.transform(d, '-')
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


  onSlugChange() {
    const slugControl = this.dataForm.get('slug');
    if (slugControl) {
      let value = slugControl.value || '';

      // Format: remove special characters, replace spaces with dashes, and lowercase
      let formatted = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')     // remove non-alphanumeric except space/dash
        .replace(/\s+/g, '-')         // replace spaces with dash
        .replace(/-+/g, '-');         // collapse multiple dashes

      // Set the formatted value back to the control
      slugControl.setValue(formatted, { emitEvent: false });
    }
  }


  private autoSyncSeoTitle(): void {
    const nameControl = this.dataForm.get('name');
    const seoTitleControl = this.dataForm.get('seoTitle');

    if (!nameControl || !seoTitleControl) return;

    nameControl.valueChanges.subscribe((nameValue: string) => {
      // Auto-set SEO Title only if the user hasn't manually edited it
      if (!seoTitleControl.dirty) {
        seoTitleControl.setValue(nameValue, { emitEvent: false });
      }
    });
  }


  // Method to close the popup
  closePopup() {
    this.isPopupVisible = false;
    this.popupImageUrl = '';
  }

  setOption(option: string): void {
    this.selectedOption = option;
    this.dataForm.patchValue({ status: this.selectedOption });
  }


  /**
   * DIALOG VIEW COMPONENT
   * openCategoryDialog()
   * openSubCategoryDialog()
   * openChildCategoryDialog()
   * openBrandDialog()
   * openTagDialog()
   */
  public openVariationGalleryDialog(index: number) {
    const dialogRef = this.dialog.open(MyGalleryComponent, {
      data: { type: 'multiple', count: 1 },
      panelClass: ['theme-dialog', 'full-screen-modal-lg'],
      width: '100%',
      minHeight: '100%',
      autoFocus: false,
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        if (dialogResult.data && dialogResult.data.length > 0) {
          this.variationListDataArray.at(index).patchValue({ image: dialogResult.data[0].url })
        }
      }
    });
  }

  public openCategoryDialog(event: MouseEvent) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(AddCategoryComponent, {
      panelClass: ['theme-dialog', 'no-padding-dialog'],
      width: '98%',
      maxWidth: '500px',
      height: 'auto',
      maxHeight: '100vh',
      autoFocus: false,
      disableClose: false
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.dataForm.patchValue({ category: dialogResult?._id });
      }
    });
  }


  public openSubCategoryDialog(event: MouseEvent) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(AddSubCategoryComponent, {
      panelClass: ['theme-dialog', 'no-padding-dialog'],
      data: this.dataForm?.value?.category,
      width: '98%',
      maxWidth: '500px',
      height: 'auto',
      maxHeight: '100vh',
      autoFocus: false,
      disableClose: false
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult && dialogResult._id) {
        this.getSubCategoriesByCategoryId(this.dataForm?.value?.category);
        this.dataForm.patchValue({ subCategory: dialogResult._id });
      }
    });
  }

  public openChildCategoryDialog(event: MouseEvent) {
    const mData = {
      subCategory: this.dataForm?.value?.subCategory,
      category: this.dataForm?.value?.category
    }
    event.stopPropagation();
    const dialogRef = this.dialog.open(AddChildCategoryComponent, {
      panelClass: ['theme-dialog', 'no-padding-dialog'],
      width: '98%',
      data: mData,
      maxWidth: '500px',
      height: 'auto',
      maxHeight: '100vh',
      autoFocus: false,
      disableClose: false
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.getChildCategoriesBySubCategoryId(this.dataForm?.value?.subCategory);
        this.dataForm.patchValue({ childCategory: dialogResult?._id });
      }
    });
  }

  public openBrandDialog(event: MouseEvent) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(AddBrandComponent, {
      panelClass: ['theme-dialog', 'no-padding-dialog'],
      width: '98%',
      maxWidth: '500px',
      height: 'auto',
      maxHeight: '100vh',
      autoFocus: false,
      disableClose: false
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.dataForm.patchValue({ brand: dialogResult?._id });
      }
    });
  }

  public openSkinTypeDialog(event: MouseEvent) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(SkinTypeComponent, {
      panelClass: ['theme-dialog', 'no-padding-dialog'],
      width: '98%',
      maxWidth: '500px',
      height: 'auto',
      maxHeight: '100vh',
      autoFocus: false,
      disableClose: false
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.dataForm.patchValue({ skinType: dialogResult?._id });
      }
    });
  }

  public openSkinConcernDialog(event: MouseEvent) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(SkinConcernComponent, {
      panelClass: ['theme-dialog', 'no-padding-dialog'],
      width: '98%',
      maxWidth: '500px',
      height: 'auto',
      maxHeight: '100vh',
      autoFocus: false,
      disableClose: false
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.dataForm.patchValue({ skinConcern: dialogResult?._id });
      }
    });
  }


  public openTagDialog(event: MouseEvent) {
    event.stopPropagation();
    const dialogRef = this.dialog.open(AddTagComponent, {
      panelClass: ['theme-dialog', 'no-padding-dialog'],
      width: '98%',
      maxWidth: '500px',
      height: 'auto',
      maxHeight: '100vh',
      autoFocus: false,
      disableClose: false
    });
    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult && dialogResult.data) {
      }
    });
  }

  /**
   * Gallery Image View
   * openGallery()
   * closeGallery()
   * copyToClipboard()
   */
  openGallery(event: any, images: string[], index?: number): void {
    event.stopPropagation();

    if (index) {
      this.selectedImageIndex = index;
    }
    this.galleryImages = images;
    this.isGalleryOpen = true;
    this.router.navigate([], { queryParams: { 'gallery-image-view': true }, queryParamsHandling: 'merge' }).then();
  }

  closeGallery(): void {
    this.isGalleryOpen = false;
    this.router.navigate([], { queryParams: { 'gallery-image-view': null }, queryParamsHandling: 'merge' }).then();
  }

  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Product Add');
    this.pageDataService.setPageData({
      title: 'Product',
      navArray: [
        { name: 'Dashboard', url: `/dashboard` },
        { name: 'Product', url: 'https://www.youtube.com/embed/pxIyUD4EBzY?si=dUnJ8F_kNHSL07yr' },
      ]
    })
  }

  /**
   * ON DESTROY
   */
  ngOnDestroy() {
    if (this.subDataOne) {
      this.subDataOne.unsubscribe();
    }
    if (this.subDataTwo) {
      this.subDataTwo.unsubscribe();
    }
    if (this.subDataThree) {
      this.subDataThree.unsubscribe();
    }
    if (this.subDataFour) {
      this.subDataFour.unsubscribe();
    }
    if (this.subDataFive) {
      this.subDataFive.unsubscribe();
    }
    if (this.subDataSix) {
      this.subDataSix.unsubscribe();
    }
    if (this.subDataSeven) {
      this.subDataSeven.unsubscribe();
    }
    if (this.subAutoSlug) {
      this.subAutoSlug.unsubscribe();
    }
    this.subscriptions.forEach(sub => sub?.unsubscribe());
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
