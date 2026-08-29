import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { ChartComponent } from './chart/chart.component';
import {MenuCardComponent} from '../../shared/components/menu-card/menu-card.component';
import { SalesInformationComponent } from './sales-information/sales-information.component';
import { ChartSectionComponent } from './chart-section/chart-section.component';
import { LineChartComponent } from './line-chart/line-chart.component';
import { PieChartComponent } from './pie-chart/pie-chart.component';

import {NotificationComponent} from "../../shared/components/notification/notification.component";
import {DashboardCardComponent} from "./dashboard-card/dashboard-card.component";
import {MaterialModule} from "../../material/material.module";
import { RecentOrderComponent } from './recent-order/recent-order.component';
import {GalleryImageViewerComponent} from "../../shared/components/gallery-image-viewer/gallery-image-viewer.component";
import { TopProductComponent } from './top-product/top-product.component';
import {PricePipe} from "../../shared/pipes/price.pipe";
import {ProductPricePipe} from "../../shared/pipes/product-price.pipe";
import { SubscriptionExpireDialogModule } from '../../shared/dialog-view/subscription-expire-dialog/subscription-expire-dialog.module';
import {CurrencyPipe} from "../../shared/pipes/currency.pipe";



@NgModule({
    declarations: [
        DashboardComponent,
        ChartComponent,
        SalesInformationComponent,
        ChartSectionComponent,
        LineChartComponent,
        PieChartComponent,
        DashboardCardComponent,
        RecentOrderComponent,
        TopProductComponent,
    ],
    exports: [
        DashboardCardComponent
    ],
    imports: [
        CommonModule,
        DashboardRoutingModule,
        MenuCardComponent,
        NotificationComponent,
        MaterialModule,
        GalleryImageViewerComponent,
        PricePipe,
        ProductPricePipe,
        SubscriptionExpireDialogModule,
        CurrencyPipe,
    ]
})
export class DashboardModule { }
