import {Component, inject, OnInit} from '@angular/core';
import {VendorDataService} from "../../services/vendor/vendor-data.service";
import {VendorService} from "../../services/vendor/vendor.service";
import {StorageService} from "../../services/core/storage.service";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {PageDataService} from "../../services/core/page-data.service";
import {Title} from "@angular/platform-browser";
import {UiService} from "../../services/core/ui.service";

@Component({
  selector: 'app-vendor-login-device',
  templateUrl: './vendor-login-device.component.html',
  styleUrl: './vendor-login-device.component.scss',
  animations: [
    trigger('fadeIn', [
      state('hidden', style({
        opacity: 0,
        transform: 'translateY(20px)'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      transition('hidden => visible', [
        animate('300ms ease-out')
      ])
    ])
  ]
})
export class VendorLoginDeviceComponent implements OnInit{

  sessions: any[] = [];
  currentDeviceId:string = null;
  confirmingDeviceId: string | null = null;

  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);

  constructor(
    private vendorDataService: VendorDataService,
    private uiService: UiService,
    private storageService: StorageService,
  ) {}

  ngOnInit(): void {
    this.currentDeviceId= this.storageService.getDeviceId()
    this.loadSessions();
    this.setPageData();
  }

  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Login Device');
    this.pageDataService.setPageData({
      title: 'Login Device',
      navArray: [
        {name: 'Dashboard', url: `/dashboard`},
        {name: 'Login Device', url: ''},
      ]
    })
  }

  loadSessions() {
    this.vendorDataService.getSessions().subscribe((res) => {
      this.sessions = res.data;
    });
  }


  isCurrentDevice(deviceId: string): boolean {
    return this.currentDeviceId === deviceId;
  }


  // logout(deviceId: string) {
  //   if (confirm('Logout this device?')) {
  //     this.vendorDataService.logoutDevice(deviceId).subscribe(() => {
  //       this.loadSessions();
  //       // this.vendorService.userLogOut(true)
  //     });
  //   }
  // }


  confirmLogout(deviceId: string) {
    this.confirmingDeviceId = deviceId;
  }

  cancelLogout() {
    this.confirmingDeviceId = null;
  }

  proceedLogout() {
    if (!this.confirmingDeviceId) return;

    this.vendorDataService.logoutDevice(this.confirmingDeviceId).subscribe((res) => {

      if (res.success){
        this.loadSessions();
        this.confirmingDeviceId = null;
        // Optional: show success toast/snackBar
        this.uiService.message(res.message, 'success')
      }

    });
  }



  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
