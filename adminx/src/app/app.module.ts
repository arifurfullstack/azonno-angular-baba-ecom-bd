import { NgModule } from '@angular/core';
import { BrowserModule, Meta, Title } from '@angular/platform-browser';

import {
    HTTP_INTERCEPTORS,
    HttpClientModule,
    provideHttpClient,
    withFetch,
    withInterceptors
} from '@angular/common/http';
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatIconModule } from "@angular/material/icon";
import { MatMenuModule } from "@angular/material/menu";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NgxPaginationModule } from "ngx-pagination";
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { authUserInterceptor } from './auth-interceptor/auth-user-interceptor';
import { MaterialModule } from "./material/material.module";
import { BreadcrumbComponent } from "./shared/components/breadcrumb/breadcrumb.component";
import { NoContentComponent } from "./shared/components/no-content/no-content.component";
import { NotificationComponent } from './shared/components/notification/notification.component';
import { PageLoaderComponent } from "./shared/components/page-loader/page-loader.component";
import { RouteProgressInterceptor } from './shared/components/route-progress/route-progress.interceptor';


@NgModule({
    declarations: [
        AppComponent,
    ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    BreadcrumbComponent,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MaterialModule,
    NgxPaginationModule,
    NoContentComponent,
    PageLoaderComponent,
    NotificationComponent,
  ],
    providers: [
        Title,
        Meta,
        provideHttpClient(
          withInterceptors([authUserInterceptor]),
          withFetch()
        ),
        provideAnimationsAsync(),
        {provide: HTTP_INTERCEPTORS, useClass: RouteProgressInterceptor, multi: true}
    ],

    bootstrap: [AppComponent]
})
export class AppModule {
}
