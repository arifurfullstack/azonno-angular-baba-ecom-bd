import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import { Chart, registerables } from 'chart.js'
import { Subscription } from 'rxjs';
import { ThemeControllService } from '../../../services/common/theme-controll.service';
import {DashboardService} from "../../../services/common/dashboard.service";
@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineChartComponent implements OnInit,OnChanges, OnDestroy {
  @Input() periodData!: string;
  selectColor: any;
  barChart: any;
  dashboardSaleData: any;

  //Subscriptions
  private subColor!: Subscription;
  private subGetVendorDashboard: Subscription;



  constructor(
    private themeControlService: ThemeControllService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {
    Chart.register(...registerables);

  }
  ngOnInit(): void {
    this.subColor = this.themeControlService.refreshColor$.subscribe((res) => {
      this.selectColor = res;
      this.barChart?.destroy();
      this.cdr.markForCheck();
    });

  }

  ngOnChanges(changes: SimpleChanges) {
    this.getDashboardSalesData()
  }


  private getDashboardSalesData() {
    if (this.subGetVendorDashboard) {
      this.subGetVendorDashboard.unsubscribe();
    }
    this.subGetVendorDashboard = this.dashboardService.getSalesData(this.periodData)
      .subscribe({
        next: res => {
          this.dashboardSaleData = res.data;
          if (this.dashboardSaleData){
            this.chartFunctionality();
            this.cdr.markForCheck();
          }

        },
        error: err => {
          console.log(err)
        }
      })
  }

  chartFunctionality() {
    const barCanvasEle: any = document.getElementById('bar')
    // Check if the chart already exists and destroy it
    if (this.barChart) {
      this.barChart.destroy();
    }

    this.barChart = new Chart(barCanvasEle.getContext('2d'), {
      type: 'bar',
      data: {
        labels: this.dashboardSaleData.labels,
        datasets: [
          {
            data: this.dashboardSaleData.datasets[0].data,
            label: 'Revenue',
            borderColor: `${this.selectColor && this.selectColor !== undefined ? this.selectColor?.colorHexCode : '#5457cd'}`,
            backgroundColor: `${this.selectColor && this.selectColor !== undefined ? this.selectColor?.colorHexCode : '#5457cd'}`,
            borderRadius: 50,
            pointStyle: "circle",
            categoryPercentage: 0.25,
            barPercentage: 1

          },
          {
            data: this.dashboardSaleData.datasets[1].data,
            label: 'Profit',
            borderColor: `${this.selectColor && this.selectColor !== undefined ? this.selectColor?.colorRgb5Code : '#dadafc'}`,
            backgroundColor: `${this.selectColor && this.selectColor !== undefined ? this.selectColor?.colorRgb5Code : '#dadafc'}`,
            borderRadius: 50,
            categoryPercentage: 0.25,
            barPercentage: 1
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,

          },
          x: {
            ticks: {
              color: '#64748b',
            },
            border: {
              color: '#dfe7ef',
            },

          },
        },
        plugins: {
          legend: {
            position: "bottom",
            align: "center",
            maxWidth: 100,
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              useBorderRadius: true,
              borderRadius: 1,
              usePointStyle: true,
            }
          },

        },
        layout: {
          padding: 10
        }
      }
    });
  }


  /**
 * NG ON DESTROY
 */

  ngOnDestroy(): void {
    if (this.subColor) {
      this.subColor.unsubscribe();
    }
  }



}
