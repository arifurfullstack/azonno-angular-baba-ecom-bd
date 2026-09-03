import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {Subscription} from "rxjs";
import {ReloadService} from "../../services/core/reload.service";
import {UiService} from "../../services/core/ui.service";
import {ShopService} from "../../services/common/shop.service";
import {Shop} from "../../interfaces/common/shop.interface";
import {DATABASE_KEY} from "../../core/utils/global-variable";
import {StorageService} from "../../services/core/storage.service";

@Component({
  selector: 'app-domain-information',
  templateUrl: './domain-information.component.html',
  styleUrl: './domain-information.component.scss'
})
export class DomainInformationComponent implements OnInit, OnDestroy {

  // Store data
  protected shopId?: string;
  protected shop?: Shop;

  // Data Form
  dataForm?: FormGroup;

  // Subscriptions
  private subReload: Subscription;
  private subscriptions: Subscription[] = [];

  constructor(
    private shopService: ShopService,
    private storageService: StorageService,
    private reloadService: ReloadService,
    private fb: FormBuilder,
    private uiService: UiService,
  ) {
  }

  ngOnInit(): void {

    // Reload Data
    this.subReload = this.reloadService.refreshData$
      .subscribe(() => {
        this.getShopById();
      });

    // Init Form
    this.initFormGroup();

    // Base Data

    this.shopId = this.storageService.getDataFromEncryptLocal(
      DATABASE_KEY.encryptShop
    )?.shop;
    if (this.shopId){
      this.getShopById();
    }
  }

  /**
   * FORMS METHODS
   * initFormGroup()
   * setFormData()
   * onSubmit()
   */

  private initFormGroup() {
    this.dataForm = this.fb.group({
      domain: [null],
      websiteName: [null],
    });
  }

  private setFormData() {
    this.dataForm.patchValue(this.shop);
  }

  onSubmit() {
    this.updateDomainInformation();
  }


  /**
   * HTTP REQ Handle
   * getShopById()
   * updateDomainInformation()
   */
  private getShopById() {
    const subscription = this.shopService.getShopById(this.shopId).subscribe({
      next: (res) => {
        if (res.data) {
          this.shop = res.data;
          this.setFormData();
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
    this.subscriptions.push(subscription);
  }

  private updateDomainInformation() {
    const {domain, ...rest} = this.dataForm.value;
    const payload = {...rest, domain: this.normalizeDomain(domain)};
    this.shopService.updateShopById(this.shop._id, payload)
      .subscribe({
        next: () => {
          this.uiService.message('Domain Information updated successfully', 'success');
          // Re-fetch so the field shows the canonical form the API stored
          // (pasted "https://MyShop.com/" reads back as "myshop.com").
          this.getShopById();
        },
        error: (err) => {
          console.error(err);
          this.uiService.message('Failed to update domain information', 'warn');
        }
      });
  }

  /**
   * Users paste the full URL from the browser bar ("https://MyShop.com/"),
   * and mobile keyboards auto-capitalize. Send only the bare lowercase
   * host so the stored value always matches the storefront lookup.
   */
  private normalizeDomain(domain: string | null): string | null {
    if (typeof domain !== 'string' || domain.trim() === '') {
      return domain;
    }
    return domain
      .trim()
      .toLowerCase()
      .replace(/^[a-z0-9+.-]+:\/\//, '')
      .replace(/^www\./, '')
      .split(/[/?#]/)[0];
  }



  /**
   * ON DESTROY
   */
  ngOnDestroy() {
    if (this.subReload) {
      this.subReload.unsubscribe();
    }
    this.subscriptions.forEach(sub => sub?.unsubscribe());
  }


}
