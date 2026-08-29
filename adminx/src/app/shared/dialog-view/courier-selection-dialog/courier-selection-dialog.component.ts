import { Component, inject, OnDestroy } from '@angular/core';
import { MatDialogRef } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { SettingService } from "../../../services/common/setting.service";
import {MaterialModule} from "../../../material/material.module";
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-courier-selection-dialog',
  templateUrl: './courier-selection-dialog.component.html',
  styleUrl: './courier-selection-dialog.component.scss',
  imports: [
    MaterialModule,
    NgIf,
    NgForOf
  ],
  standalone: true
})
export class CourierSelectionDialogComponent implements OnDestroy {

  selectedCourier: any | null = null;
  courierMethods: any[] = [];

  private readonly settingService = inject(SettingService);
  private subscriptions: Subscription[] = [];

  constructor(public dialogRef: MatDialogRef<CourierSelectionDialogComponent>) {}

  ngOnInit(): void {
    this.getSetting();
  }

  private getSetting() {
    const subscription = this.settingService.getSetting('courierMethods')
      .subscribe({
        next: res => {
          if (res.data && res.data.courierMethods) {
            this.courierMethods = res.data.courierMethods;

            // 👉 Active courier খুঁজে selectedCourier set করো
            const activeCourier = this.courierMethods.find(courier => courier.status === 'active');
            if (activeCourier) {
              this.selectedCourier = activeCourier;
            }
          }
        },
        error: err => {
          console.log(err)
        }
      });

    this.subscriptions.push(subscription);
  }


  selectCourier(courier: any) {
    this.selectedCourier = courier;
  }

  confirm() {
    if (this.selectedCourier) {
      this.courierMethods.forEach(courier => {
        courier.status = (courier === this.selectedCourier) ? 'active' : 'inactive';
      });

      this.addSetting();
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  private addSetting() {
    const data = { courierMethods: this.courierMethods };

    const subscription = this.settingService.addSetting(data)
      .subscribe({
        next: res => {
          if (res.success) {
            this.dialogRef.close(this.selectedCourier);
          } else {
            console.log('Failed to update courier status');
          }
        },
        error: err => {
          console.log(err);
        }
      });

    this.subscriptions.push(subscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub?.unsubscribe());
  }


  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
