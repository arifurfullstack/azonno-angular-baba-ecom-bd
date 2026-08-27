import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StorageSettingComponent } from './storage-setting.component';

const routes: Routes = [
  { path: '', component: StorageSettingComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StorageSettingRoutingModule {}
