import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PagesComponent} from './pages.component';


const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule),
        // data: { animation: 'HomePage' },
      },
      {
        path: "package",
        loadChildren: () => import('./package/package.module').then(m => m.PackageModule)
      },
      {
        path: 'additional-pages',
        loadChildren: () => import('./additional-pages/additional-pages.module').then(m => m.AdditionalPagesModule)
      },

      /**
       * Test
       */
      {
        path: 'test',
        loadChildren: () => import('./test/test.module').then(m => m.TestModule)
      },
 {
        path: 'test2',
        loadChildren: () => import('./test2/test2.module').then(m => m.Test2Module)
      },

      /*
       * CUSTOMIZATION
       */
      {
        path: 'customization/add-banner',
        loadChildren: () => import('./customization/banner/add-banner/add-banner.module').then(m => m.AddBannerModule)
      },
      {
        path: 'customization/edit-banner',
        loadChildren: () => import('./customization/banner/add-banner/add-banner.module').then(m => m.AddBannerModule)
      },
      {
        path: 'customization/all-banner',
        loadChildren: () => import('./customization/banner/all-banner/all-banner.module').then(m => m.AllBannerModule)
      },
      {
        path: 'customization/add-carousel',
        loadChildren: () => import('./customization/carousel/add-carousel/add-carousel.module').then(m => m.AddCarouselModule)
      },
      {
        path: 'customization/edit-carousel',
        loadChildren: () => import('./customization/carousel/add-carousel/add-carousel.module').then(m => m.AddCarouselModule)
      },
      {
        path: 'customization/all-carousel',
        loadChildren: () => import('./customization/carousel/all-carousel/all-carousel.module').then(m => m.AllCarouselModule)
      },
      {
        path: 'customization/add-popup',
        loadChildren: () => import('./customization/popup/add-popup/add-popup.module').then(m => m.AddPopupModule)
      },
      {
        path: 'customization/edit-popup',
        loadChildren: () => import('./customization/popup/add-popup/add-popup.module').then(m => m.AddPopupModule)
      },
      {
        path: 'customization/all-popup',
        loadChildren: () => import('./customization/popup/all-popup/all-popup.module').then(m => m.AllPopupModule)
      },
      {
        path: 'customization/website-information',
        loadChildren: () => import('./customization/shop-information/shop-information.module').then(m => m.ShopInformationModule)
      },
      {
        path: 'customization/themes',
        loadChildren: () => import('./customization/themes/themes.module').then(m => m.ThemesModule)

      },
      {
        path: 'customization/theme-view',
        loadChildren: () => import('./customization/theme-view/theme-view.module').then(m => m.ThemeViewModule)
      },
      {
        path: 'customization/page-view',
        loadChildren: () => import('./customization/page-view/page-view.module').then(m => m.PageViewModule)
      },

      /*
       * CATALOG
       */

      {
        path: 'catalog/add-category',
        loadChildren: () => import('./catalog/category/add-category/add-category.module').then(m => m.AddCategoryModule)
      },
      {
        path: 'catalog/edit-category',
        loadChildren: () => import('./catalog/category/add-category/add-category.module').then(m => m.AddCategoryModule)
      },
      {
        path: 'catalog/all-category',
        loadChildren: () => import('./catalog/category/all-category/all-category.module').then(m => m.AllCategoryModule)
      },
      {
        path: 'catalog/add-sub-category',
        loadChildren: () => import('./catalog/sub-category/add-sub-category/add-sub-category.module').then(m => m.AddSubCategoryModule)
      },
      {
        path: 'catalog/edit-sub-category',
        loadChildren: () => import('./catalog/sub-category/add-sub-category/add-sub-category.module').then(m => m.AddSubCategoryModule)
      },
      {
        path: 'catalog/all-sub-category',
        loadChildren: () => import('./catalog/sub-category/all-sub-category/all-sub-category.module').then(m => m.AllSubCategoryModule)
      },
      {
        path: 'catalog/add-child-category',
        loadChildren: () => import('./catalog/child-category/add-child-category/add-child-category.module').then(m => m.AddChildCategoryModule)
      },
      {
        path: 'catalog/edit-child-category',
        loadChildren: () => import('./catalog/child-category/add-child-category/add-child-category.module').then(m => m.AddChildCategoryModule)
      },
      {
        path: 'catalog/all-child-category',
        loadChildren: () => import('./catalog/child-category/all-child-category/all-child-category.module').then(m => m.AllChildCategoryModule)
      },
      {
        path: 'catalog/add-brand',
        loadChildren: () => import('./catalog/brand/add-brand/add-brand.module').then(m => m.AddBrandModule)
      },
      {
        path: 'catalog/edit-brand',
        loadChildren: () => import('./catalog/brand/add-brand/add-brand.module').then(m => m.AddBrandModule)
      },
      {
        path: 'catalog/all-brand',
        loadChildren: () => import('./catalog/brand/all-brand/all-brand.module').then(m => m.AllBrandModule)
      },
      {
        path: 'catalog/add-skin-concern',
        loadChildren: () => import('./catalog/skin-concern/add-skin-concern/add-skin-concern.module').then(m => m.AddSkinConcernModule)
      },
      {
        path: 'catalog/edit-skin-concern',
        loadChildren: () => import('./catalog/skin-concern/add-skin-concern/add-skin-concern.module').then(m => m.AddSkinConcernModule)
      },
      {
        path: 'catalog/all-skin-concern',
        loadChildren: () => import('./catalog/skin-concern/all-skin-concern/all-skin-concern.module').then(m => m.AllSkinConcernModule)
      },

      {
        path: 'catalog/add-skin-type',
        loadChildren: () => import('./catalog/skin-type/add-skin-type/add-skin-type.module').then(m => m.AddSkinTypeModule)
      },
      {
        path: 'catalog/edit-skin-type',
        loadChildren: () => import('./catalog/skin-type/add-skin-type/add-skin-type.module').then(m => m.AddSkinTypeModule)
      },
      {
        path: 'catalog/all-skin-type',
        loadChildren: () => import('./catalog/skin-type/all-skin-type/all-skin-type.module').then(m => m.AllSkinTypeModule)
      },

      {
        path: 'catalog/add-tag',
        loadChildren: () => import('./catalog/tag/add-tag/add-tag.module').then(m => m.AddTagModule)
      },
      {
        path: 'catalog/edit-tag',
        loadChildren: () => import('./catalog/tag/add-tag/add-tag.module').then(m => m.AddTagModule)
      },
      {
        path: 'catalog/all-tag',
        loadChildren: () => import('./catalog/tag/all-tag/all-tag.module').then(m => m.AllTagModule)
      },

      /*
       * ORDER
       */
      {
        path: 'order/add-order',
        loadChildren: () => import('./order/add-order/add-order.module').then(m => m.AddOrderModule)
      },
      {
        path: 'order/edit-order',
        loadChildren: () => import('./order/add-order/add-order.module').then(m => m.AddOrderModule)
      },
      {
        path: 'order/all-order',
        loadChildren: () => import('./order/all-order/all-order.module').then(m => m.AllOrderModule)
      },
      {
        path: 'order/all-incomplete-order',
        loadChildren: () => import('./incomplete-order/all-incomplete-order/all-incomplete-order.module').then(m => m.AllIncompleteOrderModule)
      },
      {
        path: 'order/order-details/:id',
        loadChildren: () => import('./order/order-details/order-details.module').then(m => m.OrderDetailsModule)
      },
      {
        path: 'order/incomplete-order-details/:id',
        loadChildren: () => import('./incomplete-order/incomplete-order-details/incomplete-order-details.module').then(m => m.IncompleteOrderDetailsModule)
      },
      {
        path: 'order-invoice/:id',
        loadChildren: () => import('./print/invoice/invoice.module').then(m => m.InvoiceModule),
        // data: { preloadAfter: ['/bill'] },
      },

      /*
      * MY GALLERY
      */

      {
        path: 'my-gallery',
        loadChildren: () => import('./my-gallery/my-gallery.module').then(m => m.MyGalleryModule)
      },
      {
        path: 'my-gallery/folders',
        loadChildren: () => import('./my-gallery/folder/all-folders/all-folders.module').then(m => m.AllFoldersModule)
      },
      {
        path: 'my-gallery/add-folder',
        loadChildren: () => import('./my-gallery/folder/add-folder/add-folder.module').then(m => m.AddFolderModule)
      },
      {
        path: 'my-gallery/edit-folder/:id',
        loadChildren: () => import('./my-gallery/folder/add-folder/add-folder.module').then(m => m.AddFolderModule)
      },

      /*
      * Tutorial Page
      */
      {
        path: 'tutorial',
        loadChildren: () => import('./tutorial-page/tutorial-page.module').then(m => m.TutorialPageModule)
      },

      /*
      * New Release Report Page
      */
      {
        path: 'new-release-report',
        loadChildren: () => import('./new-release-report/new-release-report.module').then(m => m.NewReleaseReportModule)
      },

      /*
      * Vendor all login device record
      */
      {
        path: 'login-all-device',
        loadChildren: () => import('./vendor-login-device/vendor-login-device.module').then(m => m.VendorLoginDeviceModule)
      },


      /*
       * SUBSCRIPTION
       */

      {
        path: 'subscription/all-subscription',
        loadChildren: () => import('./subscription/all-subscription/all-subscription.module').then(m => m.AllSubscriptionModule)
      },
      {
        path: 'subscription/subscription-report',
        loadChildren: () => import('./subscription/subscription-report/subscription-report.module').then(m => m.SubscriptionReportModule)
      }, {
        path: 'subscription/my-subscription',
        loadChildren: () => import('./subscription/my-subscription/my-subscription.module').then(m => m.MySubscriptionModule)
      },

      /*
       * MANAGER(LOG/TRASH)
       */

      {
        path: 'manager/all-log',
        loadChildren: () => import('./manager/log-manager/all-log-manager/all-log-manager.module').then(m => m.AllLogManagerModule)
      },
      {
        path: 'manager/add-log',
        loadChildren: () => import('./manager/log-manager/add-log-manager/add-log-manager.module').then(m => m.AddLogManagerModule)
      },
      {
        path: 'manager/edit-log',
        loadChildren: () => import('./manager/log-manager/add-log-manager/add-log-manager.module').then(m => m.AddLogManagerModule)
      },
      {
        path: 'manager/all-trash',
        loadChildren: () => import('./manager/trash-manager/all-trash-manager/all-trash-manager.module').then(m => m.AllTrashManagerModule)
      },
      {
        path: 'manager/add-trash',
        loadChildren: () => import('./manager/trash-manager/add-trash-manager/add-trash-manager.module').then(m => m.AddTrashManagerModule)
      },
      {
        path: 'manager/edit-trash',
        loadChildren: () => import('./manager/trash-manager/add-trash-manager/add-trash-manager.module').then(m => m.AddTrashManagerModule)
      },

      /*
      * EXPENSE
      */
      {
        path: 'expense/add-expense',
        loadChildren: () => import('./expense/add-expense/add-expense.module').then(m => m.AddExpenseModule)
      },
      {
        path: 'expense/edit-expense',
        loadChildren: () => import('./expense/add-expense/add-expense.module').then(m => m.AddExpenseModule)
      },
      {
        path: 'expense/all-expense',
        loadChildren: () => import('./expense/all-expense/all-expense.module').then(m => m.AllExpenseModule)
      },

      /*
      * EXPENSE
      */

      {
        path: 'ip-block/all-ip-block',
        loadChildren: () => import('./ip-block/all-ip-block/all-ip-block.module').then(m => m.AllIpBlockModule)
      },

      {
        path: 'seo-page/add-seo-page',
        loadChildren: () => import('./seo-page/add-seo-page/add-seo-page.module').then(m => m.AddSeoPageModule)
      },
      {
        path: 'seo-page/edit-seo-page',
        loadChildren: () => import('./seo-page/add-seo-page/add-seo-page.module').then(m => m.AddSeoPageModule)
      },
      {
        path: 'seo-page/all-seo-page',
        loadChildren: () => import('./seo-page/all-seo-page/all-seo-page.module').then(m => m.AllSeoPageModule)
      },

      /*
       * Vendor (Admin as Known)
       */
      {
        path: 'admin',
        loadChildren: () => import('./vendor/all-vendor/all-vendor.module').then(m => m.AllVendorModule),
      },
      {
        path: 'admin/add-admin',
        loadChildren: () => import('./vendor/add-vendor/add-vendor.module').then(m => m.AddVendorModule),
      },
      {
        path: 'admin/edit-admin/:id',
        loadChildren: () => import('./vendor/add-vendor/add-vendor.module').then(m => m.AddVendorModule)
      },


      /*
       * USERS
       */
      {
        path: 'users/add-user',
        loadChildren: () => import('./user/add-user/add-user.module').then(m => m.AddUserModule)
      },
      {
        path: 'users/edit-user',
        loadChildren: () => import('./user/add-user/add-user.module').then(m => m.AddUserModule)
      },
      {
        path: 'users/all-users',
        loadChildren: () => import('./user/all-user/all-user.module').then(m => m.AllUserModule)
      },
      {
        path: 'users/dashboard',
        loadChildren: () => import('./user/user-dashboard/user-dashboard.module').then(m => m.UserDashboardModule)
      },

      /*
     * Offer Page
     */
      {
        path: 'offer-page/add-offer',
        loadChildren: () => import('./offer-page/add-offer-page/add-offer-page.module').then(m => m.AddOfferPageModule)
      },
      {
        path: 'offer-page/edit-offer',
        loadChildren: () => import('./offer-page/add-offer-page/add-offer-page.module').then(m => m.AddOfferPageModule)
      },
      {
        path: 'offer-page/all-offer',
        loadChildren: () => import('./offer-page/all-offer-page/all-offer-page.module').then(m => m.AllOfferPageModule)
      },

      /*
    * Landing Page
    */
      {
        path: 'landing-page/add-customizable-landing-page',
        loadChildren: () => import('./landing-page/customizable/add-landing-page/add-landing-page.module').then(m => m.AddLandingPageModule)
      },
      {
        path: 'landing-page/edit-customizable-landing-page',
        loadChildren: () => import('./landing-page/customizable/add-landing-page/add-landing-page.module').then(m => m.AddLandingPageModule)
      },
      {
        path: 'landing-page/all-customizable-landing-page',
        loadChildren: () => import('./landing-page/customizable/all-landing-page/all-landing-page.module').then(m => m.AllLandingPageModule)
      },
      {
        path: 'landing-page/add-fixed-landing-page',
        loadChildren: () => import('./landing-page/fixed/add-fixed-landing-page/add-fixed-landing-page.module').then(m => m.AddFixedLandingPageModule)
      },
      {
        path: 'landing-page/edit-fixed-landing-page',
        loadChildren: () => import('./landing-page/fixed/add-fixed-landing-page/add-fixed-landing-page.module').then(m => m.AddFixedLandingPageModule)
      },
      {
        path: 'landing-page/all-fixed-landing-page',
        loadChildren: () => import('./landing-page/fixed/all-fixed-landing-page/all-fixed-landing-page.module').then(m => m.AllFixedLandingPageModule)
      },


      /*
      * REVIEW
      */
      {
        path: 'review',
        loadChildren: () => import('./reviews/reviews.module').then(m => m.ReviewsModule),
      },

      /*
        * REVIEW
       */
      {
        path: 'support',
        loadChildren: () => import('./support/support.module').then(m => m.SupportModule),
      },



      /*
      * PROFILE
      */

      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule)
      },



      /*
      * DOMAIN INFORMATION
      */

      {
        path: 'domain-information',
        loadChildren: () => import('./domain-information/domain-information.module').then(m => m.DomainInformationModule)
      },


      /*
       * PRODUCT
       */
      {
        path: 'product/add-product',
        loadChildren: () => import('./product/add-product/add-product.module').then(m => m.AddProductModule)
      },
      {
        path: 'product/edit',
        loadChildren: () => import('./product/add-product/add-product.module').then(m => m.AddProductModule)
      },
      {
        path: 'product/all-product',
        loadChildren: () => import('./product/all-product/all-product.module').then(m => m.AllProductModule)
      },
      {
        path: 'product/add-digital-product',
        loadChildren: () => import('./product/digital-product/digital-product.module').then(m => m.DigitalProductModule)
      },
      {
        path: 'product/edit-digital-product',
        loadChildren: () => import('./product/digital-product/digital-product.module').then(m => m.DigitalProductModule)
      },

      /*
       * COUPON
       */
      {
        path: 'coupon/add-coupon',
        loadChildren: () => import('./coupon/add-coupon/add-coupon.module').then(m => m.AddCouponModule)
      },
      {
        path: 'coupon/edit-coupon',
        loadChildren: () => import('./coupon/add-coupon/add-coupon.module').then(m => m.AddCouponModule)
      },
      {
        path: 'coupon/all-coupon',
        loadChildren: () => import('./coupon/all-coupon/all-coupon.module').then(m => m.AllCouponModule)
      },

      /*
            * COUPON
            */
      {
        path: 'blog/add-blog',
        loadChildren: () => import('./blog/add-blog/add-blog.module').then(m => m.AddBlogModule)
      },
      {
        path: 'blog/edit-blog',
        loadChildren: () => import('./blog/add-blog/add-blog.module').then(m => m.AddBlogModule)
      },
      {
        path: 'blog/all-blog',
        loadChildren: () => import('./blog/all-blog/all-blog.module').then(m => m.AllBlogModule)
      },

      {
        path: 'blog-comment/add-blog-comments',
        loadChildren: () => import('./blog-comments/add-blog-comment/add-blog-comment.module').then(m => m.AddBlogCommentModule)
      },
      {
        path: 'blog-comment/edit-blog-comment',
        loadChildren: () => import('./blog-comments/add-blog-comment/add-blog-comment.module').then(m => m.AddBlogCommentModule)
      },
      {
        path: 'blog-comment/all-blog-comments',
        loadChildren: () => import('./blog-comments/all-blog-comment/all-blog-comment.module').then(m => m.AllBlogCommentModule)
      },
      /*
        * SETTINGS
      */
      {
        path: 'settings',
        redirectTo: 'settings/all-settings',
        pathMatch: 'full'
      },
      {
        path: 'settings/all-settings',
        loadChildren: () => import('./settings/all-settings/all-settings.module').then(m => m.AllSettingsModule)
      },
      {
        path: 'settings/courier',
        loadChildren: () => import('./settings/courier/courier.module').then(m => m.CourierModule)
      },
      {
        path: 'settings/delivery-charge',
        loadChildren: () => import('./settings/delivery-charge/delivery-charge.module').then(m => m.DeliveryChargeModule)
      },
      {
        path: 'settings/sms',
        loadChildren: () => import('./settings/sms/sms.module').then(m => m.SmsModule)
      },
      {
        path: 'settings/social-login',
        loadChildren: () => import('./settings/social-login/social-login.module').then(m => m.SocialLoginModule)
      },
      {
        path: 'settings/facebook-pixel',
        loadChildren: () => import('./settings/facebook-pixel/facebook-pixel.module').then(m => m.FacebookPixelModule)
      },
      {
        path: 'settings/facebook-catalog',
        loadChildren: () => import('./settings/facebook-catalog/facebook-catalog.module').then(m => m.FacebookCatalogModule)
      },
      {
        path: 'settings/google-tag-manager',
        loadChildren: () => import('./settings/google-tag-manager/google-tag-manager.module').then(m => m.GoogleTagManagerModule)
      },
      {
        path: 'settings/google-analytics',
        loadChildren: () => import('./settings/google-analytics/google-analytics.module').then(m => m.GoogleAnalyticsModule)
      },
      {
        path: 'settings/payment-methods',
        loadChildren: () => import('./settings/payment-methods/payment-methods.module').then(m => m.PaymentMethodsModule)
      },
      {
        path: 'settings/manage-websites',
        loadChildren: () => import('./settings/manage-websites/manage-websites.module').then(m => m.ManageWebsitesModule)
      },
      {
        path: 'settings/manage-offer',
        loadChildren: () => import('./settings/manage-offer/manage-offer.module').then(m => m.ManageOfferModule)
      },
      {
        path: 'settings/chat-manage',
        loadChildren: () => import('./settings/chat-manage/chat-manage.module').then(m => m.ChatManageModule)
      },
      {
        path: 'settings/currency',
        loadChildren: () => import('./settings/currency/currency.module').then(m => m.CurrencyModule)
      },
      {
        path: 'settings/country',
        loadChildren: () => import('./settings/country/country.module').then(m => m.CountryModule)
      },
      {
        path: 'settings/domain',
        loadChildren: () => import('./settings/domain-setting/domain-setting.module').then(m => m.DomainSettingModule)
      },
      {
        path: 'settings/add-custom-domain',
        loadChildren: () => import('./settings/add-custom-domain/add-custom-domain.module').then(m => m.AddCustomDomainModule)
      },
      {
        path: 'settings/order-setting',
        loadChildren: () => import('./settings/order-setting/order-setting.module').then(m => m.OrderSettingModule)
      },
      {
        path: 'settings/product-setting',
        loadChildren: () => import('./settings/product-setting/product-setting.module').then(m => m.ProductSettingModule)
      },
      {
        path: 'settings/advance-payment',
        loadChildren: () => import('./settings/advance-payment/advance-payment.module').then(m => m.AdvancePaymentModule)
      },
      {
        path: 'settings/google-console',
        loadChildren: () => import('./settings/google-console/google-console.module').then(m => m.GoogleConsoleModule)
      },
      {
        path: 'settings/affiliate-marketing',
        loadChildren: () => import('./settings/affiliate-marketing/affiliate-marketing.module').then(m => m.AffiliateMarketingModule)
      },
      {
        path: 'settings/storage-setting',
        loadChildren: () => import('./settings/storage-setting/storage-setting.module').then(m => m.StorageSettingModule)
      },
      {
        path: 'blog/blog-setting',
        loadChildren: () => import('./settings/blog-setting/blog-setting.module').then(m => m.BlogSettingModule),
        // data: { animation: 'AboutPage' },
      },
      {
        path: 'affiliate',
        loadChildren: () => import('./affiliate/affiliate.module').then(m => m.AffiliateModule),
        // data: { animation: 'AboutPage' },
      },
      {
        path: 'affiliate-product',
        loadChildren: () => import('./affiliate-product/affiliate-product.module').then(m => m.AffiliateProductModule),
        // data: { animation: 'AboutPage' },
      },
      {
        path:"address",
        loadChildren:() => import('./address/address.module').then(m => m.AddressModule)
      },

    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule {
}
