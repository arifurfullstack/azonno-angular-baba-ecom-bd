import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageSettingRoutingModule } from './storage-setting-routing.module';
import { StorageSettingComponent } from './storage-setting.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';

@NgModule({
  declarations: [StorageSettingComponent],
  imports: [
    CommonModule,
    StorageSettingRoutingModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelectModule,
  ],
})
export class StorageSettingModule {}
