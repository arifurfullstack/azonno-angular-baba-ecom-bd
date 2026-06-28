import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule, provideClientHydration} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {NgOptimizedImage, provideImgixLoader} from '@angular/common';
import {environment} from '../environments/environment';
import {Header1Component} from './shared/components/headers/header-1/header-1.component';
import {FooterComponent} from './shared/components/core/footer/footer.component';
import {BottomNavbarComponent} from './shared/components/core/footer/bottom-navbar/bottom-navbar.component';
import {authUserInterceptor} from './auth-interceptor/auth-user-interceptor';
import {ssrApiRedirectInterceptor} from './auth-interceptor/ssr-api-redirect.interceptor';
import {provideLottieOptions} from 'ngx-lottie';
import {Header2Component} from './shared/components/headers/header-2/header-2.component';
import {ArrayToSingleImagePipe} from "./shared/pipes/array-to-single-image.pipe";
import {ImgCtrlPipe} from "./shared/pipes/img-ctrl.pipe";
// import {AdvancePaymentComponent} from './shared/dialog/advance-payment/advance-payment.component';
import {PaymentCardLoaderComponent} from "./shared/loader/payment-card-loader/payment-card-loader.component";
import {TitleComponent} from "./shared/components/title/title.component";
import {AppConfigService} from './services/core/app-config.service';
import {CurrencyCtrPipe} from "./shared/pipes/currency.pipe";
import {FormsModule} from "@angular/forms";
import {OutSideClickDirective} from "./shared/directives/out-side-click.directive";
import {ProductPricePipe} from "./shared/pipes/product-price.pipe";
import {EmptyDataComponent} from "./shared/components/ui/empty-data/empty-data.component";
import {TranslatePipe} from "./shared/pipes/translate.pipe";
import {VariationInfoInlinePipe} from "./shared/pipes/variation-info-inline.pipe";
import {Header3Component} from "./shared/components/headers/header-3/header-3.component";

export function initConfig(configService: AppConfigService) {
  return () => configService.loadConfig();
}

@NgModule({
  declarations: [
    AppComponent,
    // AdvancePaymentComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    Header1Component,
    Header2Component,
    BottomNavbarComponent,
    FooterComponent,
    ArrayToSingleImagePipe,
    ImgCtrlPipe,
    NgOptimizedImage,
    PaymentCardLoaderComponent,
    TitleComponent,
    CurrencyCtrPipe,
    FormsModule,
    OutSideClickDirective,
    ProductPricePipe,
    EmptyDataComponent,
    TranslatePipe,
    VariationInfoInlinePipe,
    Header3Component,
  ],
  providers: [
    AppConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: initConfig,
      deps: [AppConfigService],
      multi: true
    },
    provideClientHydration(),
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptors([ssrApiRedirectInterceptor, authUserInterceptor])
    ),
    provideImgixLoader(environment.ftpPrefixPath),
    provideLottieOptions({
      player: () => import('lottie-web'),
    }),
  ],

  bootstrap: [AppComponent]
})
export class AppModule {
}
