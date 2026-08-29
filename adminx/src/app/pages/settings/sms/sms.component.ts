import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {UiService} from "../../../services/core/ui.service";
import {SettingService} from "../../../services/common/setting.service";
import {DELIVERY_TYPES, SMS_PROVIDERS} from "../../../core/utils/app-data";
import {Select} from '../../../interfaces/core/select';
import {Title} from '@angular/platform-browser';
import {PageDataService} from '../../../services/core/page-data.service';
import {CountryService} from "../../../services/core/country.service";

@Component({
  selector: 'app-sms-api',
  templateUrl: './sms.component.html',
  styleUrl: './sms.component.scss',
})
export class SmsComponent implements OnInit, OnDestroy {
  // Store Data
  readonly allSmsProviders: Select[] = SMS_PROVIDERS; // store all for reuse
   smsProviders: Select[] = [];
  protected smsSendingOption: any = {
    orderPlaced: false,
    orderConfirmed: false,
    orderDelivered: false,
    orderCanceled: false
  };
  smsMethods: any[] = [];
  selectedIndex: number;
  formViewMode: 'add' | 'edit' | '' = '';
  isLoading: boolean = false;
  country: any;

  // Data Form
  dataForm?: FormGroup;

  // Inject
  private readonly fb = inject(FormBuilder);
  private readonly uiService = inject(UiService);
  private readonly settingService = inject(SettingService);
  private readonly title = inject(Title);
  private readonly pageDataService = inject(PageDataService);
  private readonly countryService = inject(CountryService);

  // Subscriptions
  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.countryService.getShopCountryInfo().subscribe(setting => {
        this.country = setting?.country?.name || 'Bangladesh';
        if(this.country){
          // Filter delivery types based on country
          this.filterSmsProviderByCountry();
        }
    });
    // Init Data Form
    this.initFormGroup();

    // Base Data
    this.setPageData();
    this.getSetting();

  }

  private filterSmsProviderByCountry(): void {
    if (!this.country || this.country === 'Bangladesh') {
      // If no country OR country is Bangladesh ➜ show Bangladesh providers
      this.smsProviders = this.allSmsProviders.filter(
        provider => provider.country === 'Bangladesh'
      );
    } else {
      // Otherwise ➜ show international providers only
      this.smsProviders = this.allSmsProviders.filter(
        provider => provider.country === 'international'
      );
    }
  }


  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('SMS Methods');
    this.pageDataService.setPageData({
      title: 'SMS Methods',
      navArray: [
        {name: 'Settings', url: `/settings`},
        {name: 'SMS Methods', url: null},
      ]
    })
  }


  /**
   * FORMS METHODS
   * initFormGroup()
   * onSubmit()
   */
  private initFormGroup() {
    this.dataForm = this.fb.group({
      providerName: [null, Validators.required],
      senderId: [null],
      secretKey: [null],
      apiKey: [null],
      clientId: [null],
      username: [null],
      password: [null],
      status: [null],
    });
  }


  onSubmit() {

    if (this.dataForm.invalid) {
      this.uiService.message('Please complete all the required fields', 'warn');
      return;
    }

    if (this.formViewMode === 'add') {
      const data = {
        ...this.dataForm.value,
        ...{
          status: !this.smsMethods.length ? 'active' : 'inactive'
        }
      }
      this.smsMethods.push(data);
      this.selectedIndex = this.smsMethods.length - 1;
      this.addSetting()
    } else if (this.formViewMode === 'edit') {
      const fIndex = this.smsMethods.findIndex(f => f.providerName === this.dataForm.value.providerName);
      this.smsMethods[fIndex] = {
        ...this.smsMethods[fIndex],
        ...this.dataForm.value,
      }
      this.addSetting()
    }
  }


  /**
   * HTTP REQ HANDLE
   * addSetting()
   * getSetting()
   */

  private getSetting() {
    const subscription = this.settingService.getSetting('smsMethods smsSendingOption')
      .subscribe({
        next: res => {
          if (res.data && res.data.smsMethods) {
            this.smsMethods = res.data.smsMethods;
            if (res.data.smsSendingOption) {
              this.patchSmsSendingOption(res.data.smsSendingOption);
            }
            // if (this.smsMethods.length) {
            //   this.onSelectItem(0);
            // }

            if (this.smsMethods.length) {
              // 👉 Active থাকলে সেটি select হবে
              const activeIndex = this.smsMethods.findIndex(m => m.status === 'active');
              if (activeIndex !== -1) {
                this.onSelectItem(activeIndex);
              } else {
                this.onSelectItem(0);
              }
            }
          }
        },
        error: err => {
          console.log(err)
        }
      });

    this.subscriptions.push(subscription);
  }

  private addSetting(others?: any) {
    this.isLoading = true;
    const data = {
      smsMethods: this.smsMethods
    };

    const subscription = this.settingService.addSetting(others ?? data)
      .subscribe({
        next: res => {
          this.isLoading = false;
          if (res.success) {
            this.uiService.message(res.message, "success");
          } else {
            this.uiService.message(res.message, "warn");
          }

          if (this.formViewMode === 'add') {
            this.formViewMode = '';
          }
        },
        error: err => {
          this.isLoading = false;
          console.log(err);
        }
      });
    this.subscriptions.push(subscription);
  }


  /**
   * UI Logics
   * onAddNewPaymentType()
   * toggleCheckbox()
   * onSelectItem()
   * isDisabledOpt()
   */
  onAddNewPaymentType() {
    this.formViewMode = 'add';
    const missingTypes = this.smsProviders.filter((f) =>
      !this.smsMethods.some(
        (charge) => charge.providerName === f.value
      )
    );
    this.dataForm.reset();
    if (!missingTypes.length) {
      this.dataForm.patchValue({providerName: this.smsProviders[0].value});
    } else {
      this.dataForm.patchValue({providerName: missingTypes[0].value});
    }
  }

  // toggleCheckbox(index: number): void {
  //   this.smsMethods.forEach((method, i) => {
  //     method.status = i === index ? 'active' : 'inactive';
  //   });
  //   this.onSelectItem(index);
  //   this.addSetting();
  // }

  toggleCheckbox(index: number): void {
    this.smsMethods.forEach((method, i) => {
      method.status = i === index ? 'active' : 'inactive';
    });
    this.onSelectItem(index);
    this.addSetting();
  }


  onSelectItem(index: number) {
    this.formViewMode = 'edit';
    this.selectedIndex = index;
    this.dataForm.patchValue(this.smsMethods[this.selectedIndex]);
  }

  isDisabledOpt(value: string): boolean {
    return this.smsMethods.some(charge => charge.providerName === value);
  }

  /**
   * Checkbox Object Control
   * smsOptionKeys()
   * formatLabel()
   * onSmsSendingOptChange()
   * patchSmsSendingOption()
   */

  get smsOptionKeys() {
    return Object.keys(this.smsSendingOption)
  }

  formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  onSmsSendingOptChange() {
    this.addSetting({smsSendingOption: this.smsSendingOption});
  }

  private patchSmsSendingOption(apiData: any): void {
    Object.keys(this.smsSendingOption).forEach(key => {
      if (apiData.hasOwnProperty(key)) {
        this.smsSendingOption[key] = apiData[key];
      }
    });
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
