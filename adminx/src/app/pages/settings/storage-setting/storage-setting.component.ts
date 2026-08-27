import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UiService } from '../../../services/core/ui.service';
import { SettingService } from '../../../services/common/setting.service';
import { Title } from '@angular/platform-browser';
import { PageDataService } from '../../../services/core/page-data.service';

@Component({
  selector: 'app-storage-setting',
  templateUrl: './storage-setting.component.html',
  styleUrl: './storage-setting.component.scss',
})
export class StorageSettingComponent implements OnInit, OnDestroy {
  dataForm: FormGroup;
  storageSetting: any;

  selectedProvider: 'local' | 'cloudinary' | 'cloudflare_r2' = 'local';
  hideCloudinarySecret = true;
  hideR2Secret = true;

  testingConnection = false;
  testResult: { success: boolean; message: string } | null = null;

  // Injections
  private readonly fb = inject(FormBuilder);
  private readonly uiService = inject(UiService);
  private readonly settingService = inject(SettingService);
  private readonly title = inject(Title);
  private readonly pageDataService = inject(PageDataService);

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.initFormGroup();
    this.setPageData();
    this.getSetting();
  }

  private setPageData(): void {
    this.title.setTitle('Storage Settings');
    this.pageDataService.setPageData({
      title: 'Storage Settings',
      navArray: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Settings', url: '/settings' },
        { name: 'Storage Settings', url: '' },
      ],
    });
  }

  private initFormGroup(): void {
    this.dataForm = this.fb.group({
      activeProvider: ['local', Validators.required],
      cloudinary: this.fb.group({
        cloudName: [''],
        apiKey: [''],
        apiSecret: [''],
        folder: ['azonnox'],
      }),
      cloudflareR2: this.fb.group({
        accountId: [''],
        accessKeyId: [''],
        secretAccessKey: [''],
        bucketName: [''],
        publicDomain: [''],
      }),
      local: this.fb.group({
        folderPath: ['upload/images'],
      }),
    });
  }

  selectProvider(provider: 'local' | 'cloudinary' | 'cloudflare_r2'): void {
    this.selectedProvider = provider;
    this.dataForm.patchValue({ activeProvider: provider });
    this.testResult = null;
  }

  private setFormData(): void {
    if (this.storageSetting) {
      this.dataForm.patchValue(this.storageSetting);
      if (this.storageSetting.activeProvider) {
        this.selectedProvider = this.storageSetting.activeProvider;
      }
    }
  }

  onTestConnection(): void {
    const provider = this.selectedProvider;
    let config: any = {};

    if (provider === 'cloudinary') {
      config = this.dataForm.get('cloudinary')?.value;
      if (!config?.cloudName || !config?.apiKey || !config?.apiSecret) {
        this.uiService.message(
          'Please enter Cloud Name, API Key, and API Secret to test.',
          'warn',
        );
        return;
      }
    } else if (provider === 'cloudflare_r2') {
      config = this.dataForm.get('cloudflareR2')?.value;
      if (
        !config?.accountId ||
        !config?.accessKeyId ||
        !config?.secretAccessKey ||
        !config?.bucketName
      ) {
        this.uiService.message(
          'Please fill all Cloudflare R2 credentials to test.',
          'warn',
        );
        return;
      }
    } else {
      config = this.dataForm.get('local')?.value;
    }

    this.testingConnection = true;
    this.testResult = null;

    const sub = this.settingService
      .testStorageConnection(provider, config)
      .subscribe({
        next: (res) => {
          this.testingConnection = false;
          this.testResult = res;
          if (res.success) {
            this.uiService.message(res.message, 'success');
          } else {
            this.uiService.message(res.message, 'warn');
          }
        },
        error: (err) => {
          this.testingConnection = false;
          this.testResult = {
            success: false,
            message: err.message || 'Connection test failed',
          };
          this.uiService.message(this.testResult.message, 'wrong');
        },
      });

    this.subscriptions.push(sub);
  }

  onSubmit(): void {
    if (this.dataForm.invalid) {
      this.uiService.message('Please fill the required fields', 'warn');
      return;
    }

    const payload = {
      storageSetting: this.dataForm.value,
    };

    const sub = this.settingService.addSetting(payload).subscribe({
      next: (res) => {
        this.uiService.message(res.message || 'Storage settings updated successfully!', 'success');
      },
      error: (err) => {
        this.uiService.message(err.message || 'Failed to update storage settings', 'wrong');
      },
    });

    this.subscriptions.push(sub);
  }

  private getSetting(): void {
    const sub = this.settingService.getSetting('storageSetting').subscribe({
      next: (res: any) => {
        if (res.data && res.data.storageSetting) {
          this.storageSetting = res.data.storageSetting;
          this.setFormData();
        }
      },
      error: (err) => {
        console.error('Error fetching storage settings:', err);
      },
    });

    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub?.unsubscribe());
  }
}
