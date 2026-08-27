import { Component, inject, OnInit } from '@angular/core';
import { TABLE_TAB_DATA } from '../../../core/utils/app-data';
import { PageDataService } from "../../../services/core/page-data.service";
import { Title } from "@angular/platform-browser";
import { CountryService } from "../../../services/core/country.service";
import { VendorService } from "../../../services/vendor/vendor.service";

@Component({
  selector: 'app-courier-api',
  templateUrl: './all-settings.component.html',
  styleUrl: './all-settings.component.scss'
})
export class AllSettingsComponent implements OnInit {
  searchQuery: string = '';
  country: any;
  allowedShopIds = [
    // clients Id
    '6874c8b1c74bb203b3cbf147',
    '6874bc3ac74bb203b3cbc665',

    // Nicer id gulo amader test er jonno
    '67b8a04ba827d974b010ccc3',
    '679511745a429b7bb55421c4',
    '67a8615b53a1da782b9acad9'
  ];

  private readonly pageDataService = inject(PageDataService);
  private readonly title = inject(Title);
  private readonly countryService = inject(CountryService);
  private readonly vendorService = inject(VendorService);


  ngOnInit() {

    this.countryService.getShopCountryInfo().subscribe(setting => {
      // if (setting?.country) {
      this.country = setting?.country?.name || 'Bangladesh';
      if (this.country) {
        this.updateMenu();
      }
      // }
    });

    this.handleDynamicMenu()
    // Base Data
    this.setPageData();
  }

  /**
   * Page Data
   * setPageData()
   */
  private setPageData(): void {
    this.title.setTitle('Settings');
    this.pageDataService.setPageData({
      title: 'Settings',
      navArray: [
        { name: 'Dashboard', url: `/dashboard` },
        { name: 'Settings', url: 'https://youtu.be/spWmMI6Orko?si=KAQON6ARzNbS_TGf' },
      ]
    })
  }

  get filteredSettingMenus() {
    return this.allSettingMenus.filter(menu =>
      menu.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  onClearSearch() {
    this.searchQuery = '';
  }

  allSettingMenus: any = [
    {
      name: 'Delivery Charge',
      routerLink: '/settings/delivery-charge',
      colorDark: '#3B82F6',
      colorLight: '#EEF3FF',
      icon: '<svg id="Group_452" data-name="Group 452" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"> <path id="Path_1673" data-name="Path 1673" d="M0,0H36V36H0Z" fill="none"/> <path id="Path_1674" data-name="Path 1674" d="M29.5,10H25V4H4A3.009,3.009,0,0,0,1,7V23.5H4a4.5,4.5,0,0,0,9,0h9a4.5,4.5,0,0,0,9,0h3V16ZM8.5,25.75a2.25,2.25,0,1,1,2.25-2.25A2.247,2.247,0,0,1,8.5,25.75Zm20.25-13.5L31.69,16H25V12.25ZM26.5,25.75a2.25,2.25,0,1,1,2.25-2.25A2.247,2.247,0,0,1,26.5,25.75Z" transform="translate(0.5 2)" fill="#fff"/> </svg>'
    },

    {
      name: 'Advance Payment',
      routerLink: '/settings/advance-payment',
      colorDark: '#22C55D',
      colorLight: '#EEF3FF',
      icon: '<svg id="Group_452" data-name="Group 452" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"> <path id="Path_1673" data-name="Path 1673" d="M0,0H36V36H0Z" fill="none"/> <path id="Path_1674" data-name="Path 1674" d="M29.5,10H25V4H4A3.009,3.009,0,0,0,1,7V23.5H4a4.5,4.5,0,0,0,9,0h9a4.5,4.5,0,0,0,9,0h3V16ZM8.5,25.75a2.25,2.25,0,1,1,2.25-2.25A2.247,2.247,0,0,1,8.5,25.75Zm20.25-13.5L31.69,16H25V12.25ZM26.5,25.75a2.25,2.25,0,1,1,2.25-2.25A2.247,2.247,0,0,1,26.5,25.75Z" transform="translate(0.5 2)" fill="#fff"/> </svg>'
    },
    {
      name: 'SMS',
      routerLink: '/settings/sms',
      colorDark: '#F97315',
      colorLight: '#FFF7ED',
      icon: '<svg id="Group_451" data-name="Group 451" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"> <path id="Path_1671" data-name="Path 1671" d="M0,0H36V36H0Z" fill="none"/> <path id="Path_1672" data-name="Path 1672" d="M29,2H5A3,3,0,0,0,2.015,5L2,32l6-6H29a3.009,3.009,0,0,0,3-3V5A3.009,3.009,0,0,0,29,2ZM12.5,15.5h-3v-3h3Zm6,0h-3v-3h3Zm6,0h-3v-3h3Z" transform="translate(1 1)" fill="#fff"/></svg>'
    },
    {
      name: 'Courier',
      routerLink: '/settings/courier',
      colorDark: '#9344EF',
      colorLight: '#F5EDFF',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="24.056" viewBox="0 0 36 24.056"> <g id="parcel" transform="translate(-10 -49.2)"> <g id="Group_456" data-name="Group 456" transform="translate(10 49.2)"> <g id="Group_455" data-name="Group 455" transform="translate(0 0)"> <path id="Path_1675" data-name="Path 1675" d="M91.259,49.963l-2.959.763.656.2c.366.107,3.905,1.129,7.871,2.273l7.215,2.075,3.295-.915c1.815-.5,3.295-.931,3.28-.931-.015-.015-3.158-.824-7-1.815s-7.52-1.937-8.207-2.105l-1.22-.305Z" transform="translate(-76.356 -49.2)" fill="#fff"/> <path id="Path_1676" data-name="Path 1676" d="M26.352,64.7c-1.907.5-3.569.931-3.707.976-.259.076.229.214,11.075,3.2l5.034,1.373,3.508-.961c1.937-.519,3.493-.992,3.478-1.007-.076-.076-15.651-4.5-15.8-4.485C29.891,63.8,28.259,64.212,26.352,64.7Z" transform="translate(-20.678 -61.573)" fill="#fff"/> <path id="Path_1677" data-name="Path 1677" d="M10,86.944v7.444l8.695,2.273c4.775,1.251,8.741,2.273,8.817,2.273.092,0,.107-1.586.107-7.261,0-4.149-.031-7.292-.092-7.307-.061-.046-16.414-4.576-17.3-4.805L10,79.5Z" transform="translate(-10 -74.878)" fill="#fff"/> <path id="Path_1678" data-name="Path 1678" d="M145.014,80.706l-3.631,1.007V83.33a5.589,5.589,0,0,1-.092,1.617.764.764,0,0,1-.336-.153c-.214-.137-.229-.137-.442.183l-.214.336-.305-.183-.305-.183-.214.29c-.122.153-.244.275-.29.275a8.629,8.629,0,0,1-.092-1.571l-.015-1.586-3.936,1.083-3.936,1.083-.031,7.292c-.015,4.195.015,7.292.061,7.292s3.615-.931,7.947-2.059,8.237-2.151,8.695-2.273l.808-.2V87.129c0-4.1-.015-7.444-.015-7.429C148.659,79.7,147.012,80.157,145.014,80.706Z" transform="translate(-112.69 -75.047)" fill="#fff"/> </g> </g> </g></svg>'
    },
    {
      name: 'Payment Methods',
      routerLink: '/settings/payment-methods',
      colorDark: '#22C55D',
      colorLight: '#ECFDF3',
      icon: '<svg id="Group_280" data-name="Group 280" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"> <path id="Path_1601" data-name="Path 1601" d="M0,0H36V36H0Z" fill="none"/> <path id="Path_1602" data-name="Path 1602" d="M28,19V7a3.009,3.009,0,0,0-3-3H4A3.009,3.009,0,0,0,1,7V19a3.009,3.009,0,0,0,3,3H25A3.009,3.009,0,0,0,28,19ZM14.5,17.5A4.5,4.5,0,1,1,19,13,4.494,4.494,0,0,1,14.5,17.5ZM34,8.5V25a3.009,3.009,0,0,1-3,3H5.5V25H31V8.5Z" transform="translate(0.5 2)" fill="#fff"/></svg>'
    },
    {
      name: 'Social Login',
      routerLink: '/settings/social-login',
      colorDark: '#EA4335',
      colorLight: '#fde7e5',
      icon: '<svg fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50px" height="50px"><path d="M 25.996094 48 C 13.3125 48 2.992188 37.683594 2.992188 25 C 2.992188 12.316406 13.3125 2 25.996094 2 C 31.742188 2 37.242188 4.128906 41.488281 7.996094 L 42.261719 8.703125 L 34.675781 16.289063 L 33.972656 15.6875 C 31.746094 13.78125 28.914063 12.730469 25.996094 12.730469 C 19.230469 12.730469 13.722656 18.234375 13.722656 25 C 13.722656 31.765625 19.230469 37.269531 25.996094 37.269531 C 30.875 37.269531 34.730469 34.777344 36.546875 30.53125 L 24.996094 30.53125 L 24.996094 20.175781 L 47.546875 20.207031 L 47.714844 21 C 48.890625 26.582031 47.949219 34.792969 43.183594 40.667969 C 39.238281 45.53125 33.457031 48 25.996094 48 Z"/></svg>'
    },
    // {
    //   name: 'Google Analytics',
    //   routerLink: '/settings/google-analytics',
    //   colorDark: '#F9AB00',
    //   colorLight: '#fcf6eb',
    //   icon: '<svg id="google-analytics-svgrepo-com" xmlns="http://www.w3.org/2000/svg" width="256.004" height="283.396" viewBox="0 0 256.004 283.396"> <path id="Path_1843" data-name="Path 1843" d="M256,247.933a35.222,35.222,0,0,1-39.376,35.161A36.125,36.125,0,0,1,185.8,246.488V36.845A36.125,36.125,0,0,1,216.687.239,35.222,35.222,0,0,1,256,35.4Z" fill="#fff"/> <path id="Path_1844" data-name="Path 1844" d="M35.1,213.193A35.1,35.1,0,1,1,0,248.294,35.1,35.1,0,0,1,35.1,213.193Zm92.358-106.387a36.125,36.125,0,0,0-34.138,36.907V238c0,25.588,11.259,41.122,27.756,44.433a35.161,35.161,0,0,0,42.145-34.559V142.088a35.222,35.222,0,0,0-35.763-35.282Z" fill="#fff"/></svg>'
    // },
    {
      name: 'Facebook Pixel',
      routerLink: '/settings/facebook-pixel',
      colorDark: '#1877F2',
      colorLight: '#e1ebf8',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50"style="fill:#FFFFFF;"> <path d="M25,3C12.85,3,3,12.85,3,25c0,11.03,8.125,20.137,18.712,21.728V30.831h-5.443v-5.783h5.443v-3.848 c0-6.371,3.104-9.168,8.399-9.168c2.536,0,3.877,0.188,4.512,0.274v5.048h-3.612c-2.248,0-3.033,2.131-3.033,4.533v3.161h6.588 l-0.894,5.783h-5.694v15.944C38.716,45.318,47,36.137,47,25C47,12.85,37.15,3,25,3z"></path></svg>'
    },
    {
      name: 'Tag Manager, Analytics and Data Layer',
      routerLink: '/settings/google-tag-manager',
      colorDark: '#4285F4',
      colorLight: '#e7eefa',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="255.996" height="256.004" viewBox="0 0 255.996 256.004"> <g id="Group_632" data-name="Group 632" transform="translate(846 -10007)"> <path id="Path_1840" data-name="Path 1840" d="M150.262,245.516l-44.436-43.331,95.433-97.455,46.007,45.091Z" transform="translate(-846 10007)" fill="#fff"/> <path id="Path_1841" data-name="Path 1841" d="M150.451,53.938,106.175,8.731,9.36,104.629a31.973,31.973,0,0,0,0,45.207l95.36,95.985,45.091-42.182L77.156,127.233Z" transform="translate(-846 10007)" fill="#fff"/> <path id="Path_1842" data-name="Path 1842" d="M246.625,105.371l-96-96a32,32,0,0,0-45.251,45.251l96,96a32,32,0,0,0,45.251-45.251Z" transform="translate(-846 10007)" fill="#fff"/> <circle id="Ellipse_65" data-name="Ellipse 65" cx="31.273" cy="31.273" r="31.273" transform="translate(-750.007 10200.458)" fill="#fff"/> </g></svg>'
    },
    {
      name: 'Facebook Catalog',
      routerLink: '/settings/facebook-catalog',
      colorDark: '#1877F2',
      colorLight: '#e1ebf8',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50"style="fill:#FFFFFF;"> <path d="M25,3C12.85,3,3,12.85,3,25c0,11.03,8.125,20.137,18.712,21.728V30.831h-5.443v-5.783h5.443v-3.848 c0-6.371,3.104-9.168,8.399-9.168c2.536,0,3.877,0.188,4.512,0.274v5.048h-3.612c-2.248,0-3.033,2.131-3.033,4.533v3.161h6.588 l-0.894,5.783h-5.694v15.944C38.716,45.318,47,36.137,47,25C47,12.85,37.15,3,25,3z"></path></svg>'
    },
    // {
    //   name: 'Manage Websites',
    //   routerLink: '/settings/manage-websites',
    //   colorDark: '#F97315',
    //   colorLight: '#FFF7ED',
    //   icon: '<svg id="Group_459" data-name="Group 459" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"> <path id="Path_1679" data-name="Path 1679" d="M0,0H36V36H0Z" fill="none"/> <path id="Path_1680" data-name="Path 1680" d="M17,2A15,15,0,1,0,32,17,15.005,15.005,0,0,0,17,2ZM15.5,28.9A11.983,11.983,0,0,1,5,17a12.177,12.177,0,0,1,.315-2.685L12.5,21.5V23a3.009,3.009,0,0,0,3,3Zm10.35-3.81A2.976,2.976,0,0,0,23,23H21.5V18.5A1.5,1.5,0,0,0,20,17H11V14h3a1.5,1.5,0,0,0,1.5-1.5v-3h3a3.009,3.009,0,0,0,3-3V5.885a11.973,11.973,0,0,1,4.35,19.2Z" transform="translate(1 1)" fill="#fff"/></svg>'
    // },
    {
      name: 'Manage Offer',
      routerLink: '/settings/manage-offer',
      colorDark: '#F97315',
      colorLight: '#FFF7ED',
      icon: '<svg id="Group_459" data-name="Group 459" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"> <path id="Path_1679" data-name="Path 1679" d="M0,0H36V36H0Z" fill="none"/> <path id="Path_1680" data-name="Path 1680" d="M17,2A15,15,0,1,0,32,17,15.005,15.005,0,0,0,17,2ZM15.5,28.9A11.983,11.983,0,0,1,5,17a12.177,12.177,0,0,1,.315-2.685L12.5,21.5V23a3.009,3.009,0,0,0,3,3Zm10.35-3.81A2.976,2.976,0,0,0,23,23H21.5V18.5A1.5,1.5,0,0,0,20,17H11V14h3a1.5,1.5,0,0,0,1.5-1.5v-3h3a3.009,3.009,0,0,0,3-3V5.885a11.973,11.973,0,0,1,4.35,19.2Z" transform="translate(1 1)" fill="#fff"/></svg>'
    },

    {
      name: 'Chat Manage',
      routerLink: '/settings/chat-manage',
      colorDark: '#1587f9',
      colorLight: '#edf5ff',
      icon: '<svg id="Group_459" data-name="Group 459" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"> <path id="Path_1679" data-name="Path 1679" d="M0,0H36V36H0Z" fill="none"/> <path id="Path_1680" data-name="Path 1680" d="M17,2A15,15,0,1,0,32,17,15.005,15.005,0,0,0,17,2ZM15.5,28.9A11.983,11.983,0,0,1,5,17a12.177,12.177,0,0,1,.315-2.685L12.5,21.5V23a3.009,3.009,0,0,0,3,3Zm10.35-3.81A2.976,2.976,0,0,0,23,23H21.5V18.5A1.5,1.5,0,0,0,20,17H11V14h3a1.5,1.5,0,0,0,1.5-1.5v-3h3a3.009,3.009,0,0,0,3-3V5.885a11.973,11.973,0,0,1,4.35,19.2Z" transform="translate(1 1)" fill="#fff"/></svg>'
    },

    {
      name: 'Shop Currency & Country',
      routerLink: '/settings/currency',
      colorDark: '#F97315',
      colorLight: '#FFF7ED',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="512" height="512"><path d="M12,0C5.383,0,0,5.383,0,12s5.383,12,12,12,12-5.383,12-12S18.617,0,12,0Zm-1.356,10.76l3.041,.507c1.342,.223,2.315,1.373,2.315,2.733,0,1.654-1.346,3-3,3v2h-2v-2c-1.654,0-3-1.346-3-3h2c0,.552,.448,1,1,1h2c.552,0,1-.448,1-1,0-.378-.271-.698-.644-.76l-3.041-.507c-1.342-.223-2.315-1.373-2.315-2.733,0-1.654,1.346-3,3-3v-2h2v2c1.654,0,3,1.346,3,3h-2c0-.551-.448-1-1-1h-2c-.552,0-1,.449-1,1,0,.378,.271,.698,.644,.76Z"/></svg>'
    },

    // {
    //   name: 'Country',
    //   routerLink: '/settings/country',
    //   colorDark: '#3B82F6',
    //   colorLight: '#EEF3FF',
    //   icon: '<svg id="Layer_1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" width="300" height="300" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.dev/svgjs"><g width="100%" height="100%" transform="matrix(1,0,0,1,0,0)"><path d="m15.938 22.457-4.057-11.207c-1.28-.216-2.293.241-3.352 1.134-.67.501-1.361 1.02-2.104 1.291-1.985.597-2.672.307-3.604.218l-2.821-7.549v-1.344c1.03-.028 2.092.099 3.255-.235.433-.148.975-.614 1.499-1.065.647-.556 1.316-1.131 2.082-1.411 1.977-.581 3.03-.174 3.917-.037l7.066 19.523-1.881.681zm8.062-17.459c-1.046-.029-2.026.114-3.255-.233-.433-.148-.975-.614-1.499-1.065-.647-.556-1.316-1.131-2.082-1.411-1.978-.583-3.029-.174-3.917-.037l-.184.507 3.835 10.595c1.537.909 3.533.674 4.279.539l2.822-7.549v-1.346zm-15.254 9.69-2.566 7.088 1.881.681 2.875-7.942-.401-1.108c-.25.163-1.444 1.049-1.789 1.281z" fill="" fill-opacity="1" data-original-color="#000000ff" stroke="none" stroke-opacity="1"/></g></svg>'
    // },
    {
      name: 'Domain Mange',
      routerLink: '/settings/add-custom-domain',
      colorDark: '#F97315',
      colorLight: '#FFF7ED',
      icon: '<svg id="Group_459" data-name="Group 459" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"> <path id="Path_1679" data-name="Path 1679" d="M0,0H36V36H0Z" fill="none"/> <path id="Path_1680" data-name="Path 1680" d="M17,2A15,15,0,1,0,32,17,15.005,15.005,0,0,0,17,2ZM15.5,28.9A11.983,11.983,0,0,1,5,17a12.177,12.177,0,0,1,.315-2.685L12.5,21.5V23a3.009,3.009,0,0,0,3,3Zm10.35-3.81A2.976,2.976,0,0,0,23,23H21.5V18.5A1.5,1.5,0,0,0,20,17H11V14h3a1.5,1.5,0,0,0,1.5-1.5v-3h3a3.009,3.009,0,0,0,3-3V5.885a11.973,11.973,0,0,1,4.35,19.2Z" transform="translate(1 1)" fill="#fff"/></svg>'
    },
    {
      name: 'Order Setting',
      routerLink: '/settings/order-setting',
      colorDark: '#579594',
      colorLight: '#e0ede5',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24">\n' +
        '  <path d="M14,8H4v-1H14v1Zm0,2H4v1H14v-1Zm-10,7h6v-1H4v1Zm16,1c.036,2.594-4.036,2.594-4,0-.036-2.594,4.036-2.594,4,0Zm-1,0c.018-1.297-2.018-1.297-2,0-.018,1.297,2.018,1.297,2,0Zm3.406,.851l1.527,.896-1.521,2.587-1.516-.892c-.408,.34-.881,.606-1.396,.786v1.771h-3v-1.771c-.515-.18-.988-.446-1.396-.786l-1.516,.892-1.521-2.587,1.527-.896c-.126-.6-.126-1.101,0-1.701l-1.527-.896,1.521-2.587,1.516,.892c.408-.34,.881-.606,1.396-.786v-1.771h3v1.771c.515,.18,.988,.446,1.396,.786l1.516-.892,1.521,2.587-1.527,.896c.126,.6,.126,1.101,0,1.701Zm-1.163,.477c.328-.92,.328-1.735,0-2.654l1.32-.775-.507-.862-1.306,.768c-.575-.664-1.369-1.104-2.251-1.274v-1.528h-1v1.528c-.882,.17-1.676,.611-2.251,1.274l-1.306-.768-.507,.862,1.32,.775c-.328,.92-.328,1.735,0,2.654l-1.32,.775,.507,.862,1.306-.768c.575,.664,1.369,1.104,2.251,1.274v1.528h1v-1.528c.882-.17,1.676-.611,2.251-1.274l1.306,.768,.507-.862-1.32-.775Zm-9.483-6.327H4v1h7.079c.203-.351,.429-.686,.681-1ZM2.5,23c-.827,0-1.5-.673-1.5-1.5V3H6v-.5c0-.827,.673-1.5,1.5-1.5h3c.827,0,1.5,.673,1.5,1.5v.5h5v7h1V2h-5.05c-.232-1.14-1.242-2-2.45-2h-3c-1.208,0-2.217,.86-2.45,2H0V21.5c0,1.379,1.122,2.5,2.5,2.5H12.721c-.348-.306-.67-.639-.96-1H2.5Z"/>\n' +
        '</svg>'
    },
    {
      name: 'Product Setting',
      routerLink: '/settings/product-setting',
      colorDark: '#99987d',
      colorLight: '#ccf7dd',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M19.14 12.936c.04-.305.06-.618.06-.936s-.02-.631-.06-.936l2.03-1.582a.5.5 0 00.121-.638l-1.923-3.327a.5.5 0 00-.605-.221l-2.39.96a6.994 6.994 0 00-1.616-.936l-.36-2.53A.5.5 0 0014.3 2h-4.6a.5.5 0 00-.495.43l-.36 2.53a6.994 6.994 0 00-1.616.936l-2.39-.96a.5.5 0 00-.605.221L2.31 9.21a.5.5 0 00.121.638l2.03 1.582c-.04.305-.06.618-.06.936s.02.631.06.936l-2.03 1.582a.5.5 0 00-.121.638l1.923 3.327a.5.5 0 00.605.221l2.39-.96c.498.386 1.045.703 1.616.936l.36 2.53a.5.5 0 00.495.43h4.6a.5.5 0 00.495-.43l.36-2.53c.571-.233 1.118-.55 1.616-.936l2.39.96a.5.5 0 00.605-.221l1.923-3.327a.5.5 0 00-.121-.638l-2.03-1.582zM12 15.5A3.5 3.5 0 1115.5 12 3.504 3.504 0 0112 15.5z"/>
      </svg>`
    },
    {
      name: 'Google Search Console',
      routerLink: '/settings/google-console',
      colorDark: '#4498fd',
      colorLight: 'rgba(167,207,251,0.51)',
      icon: `<svg height="2230" width="2500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 296 264"><path d="M83 22l22-22v42H83zM213 22L191 0v42h22z" fill="#7b7b7b" fill-rule="evenodd"/><path d="M105 0h86v21h-86z" fill="#5a5a5a"/><g fill-rule="evenodd"><path d="M272 264H24a24 24 0 0 1-24-24V83.238L41.238 42h213.524L296 83.238V240a24 24 0 0 1-24 24z" fill="#e6e7e8"/><path d="M0 127V83.238L41.238 42h213.524L296 83.238V127z" fill="#d0d1d2"/><path d="M34 264V94a10 10 0 0 1 10-10h208a10 10 0 0 1 10 10v170z" fill="#458cf5"/></g><path d="M34 127h228v137H34z" fill="#fff"/><path d="M194 264v-41l-20-20-13-36 9-23 51 51 9-38 32 32v75z" fill="#d2d3d4" fill-rule="evenodd"/><path d="M49 143h76v85H49zM49 247h98v17H49z" fill="#d2d3d4"/><path d="M213 232.1V264h-42v-31.447a49.507 49.507 0 0 1-1-89.651V190l21 13 22-13v-47.1a49.518 49.518 0 0 1 0 89.2z" fill="#505050" fill-rule="evenodd"/><path d="M57.5 95a8.5 8.5 0 1 1-8.5 8.5 8.5 8.5 0 0 1 8.5-8.5zm25 0a8.5 8.5 0 1 1-8.5 8.5 8.5 8.5 0 0 1 8.5-8.5z" fill="#e6e7e8" fill-rule="evenodd"/></svg>`
    },
    {
      name: 'Blog Settings',
      routerLink: '/blog/blog-setting',
      colorDark: '#4498fd',
      colorLight: 'rgba(167,207,251,0.51)',
      icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none"
           xmlns="http://www.w3.org/2000/svg">
           <circle cx="12" cy="12" r="11" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-width="2"/>
           <path d="M8 12h2.5l1-1.5L14 13l2-3 2 4H8z" fill="#ffffff"/>
           <circle cx="7" cy="6" r="1" fill="#ffffff"/>
           <circle cx="17" cy="18" r="1" fill="#ffffff"/>
         </svg>`
    },
    // {
    //   name: 'Affiliate Marketing',
    //   routerLink: '/settings/affiliate-marketing',
    //   colorDark: '#4498fd',
    //   colorLight: 'rgba(167,207,251,0.51)',
    //   icon: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none"
    //        xmlns="http://www.w3.org/2000/svg">
    //        <circle cx="12" cy="12" r="11" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-width="2"/>
    //        <path d="M8 12h2.5l1-1.5L14 13l2-3 2 4H8z" fill="#ffffff"/>
    //        <circle cx="7" cy="6" r="1" fill="#ffffff"/>
    //        <circle cx="17" cy="18" r="1" fill="#ffffff"/>
    //      </svg>`
    {
      name: 'Storage Settings',
      routerLink: '/settings/storage-setting',
      colorDark: '#0ea5e9',
      colorLight: '#e0f2fe',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`
    },
  ]

  protected readonly tableTabData = TABLE_TAB_DATA;


  private updateMenu() {
    // if (this.country !== 'Bangladesh') {
    //   this.allSettingMenus = this.allSettingMenus.filter(menu => menu.name !== 'Courier');
    // }
    if (this.country !== 'Bangladesh') {
      const excludeMenus = ['Courier'];
      this.allSettingMenus = this.allSettingMenus.filter(menu => !excludeMenus.includes(menu.name));
    }
  }

  private handleDynamicMenu() {
    const dynamicMenus = ['Blog Settings']; // Future এ যেকোনো নাম শুধু এখানে add করো

    // Step 1: Collect & Remove all dynamic menus first
    const menusToRestore = this.allSettingMenus.filter(item => dynamicMenus.includes(item.name));
    this.allSettingMenus = this.allSettingMenus.filter(item => !dynamicMenus.includes(item.name));

    // Step 2: Conditionally restore if allowed
    if (this.allowedShopIds.includes(this.vendorService.getShopId())) {
      this.allSettingMenus.push(...menusToRestore);
    }
  }

}
