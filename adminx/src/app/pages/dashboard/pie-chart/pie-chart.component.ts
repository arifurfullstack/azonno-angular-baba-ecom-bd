import {Component, inject, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { Subscription } from 'rxjs';
import { ThemeControllService } from '../../../services/common/theme-controll.service';
import {FilterData} from "../../../interfaces/gallery/filter-data";
import {DashboardService} from "../../../services/common/dashboard.service";
@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PieChartComponent implements OnInit, OnDestroy {
  selectColor: any;
  pieChart: any;
  dashboardCategoryData: any;

  //Subscription
  private subColor!: Subscription;
  // Subscriptions
  private subGetVendorDashboard: Subscription;


  private readonly dashboardService = inject(DashboardService);
  private readonly cdr = inject(ChangeDetectorRef);
  constructor(
    private themeControlService: ThemeControllService
  ) {
    Chart.register(...registerables);
  }
  ngOnInit(): void {
    this.subColor = this.themeControlService.refreshColor$.subscribe((res) => {
      this.selectColor = res;
      this.pieChart?.destroy();
      this.cdr.markForCheck();
      // this.chartFunctionality();
    });


    this.getDashboardCategoryByProduct();

  }

  private getDashboardCategoryByProduct() {


    this.subGetVendorDashboard = this.dashboardService.getDashboardCategoryByProduct()
      .subscribe({
        next: res => {
          this.dashboardCategoryData = res.data;
          this.chartFunctionality();
          this.cdr.markForCheck();
        },
        error: err => {
          console.log(err)
        }
      })
  }


  chartFunctionality() {
    // Line Chart
    const pieCanvasEle: any = document.getElementById('pie')



// Your incoming data
    const inputData = this.dashboardCategoryData

// Extracting labels and data dynamically from inputData
    const labels = inputData.map((item) => item.categoryName);
    const data = inputData.map((item) => item.productCount);

// Define colors for each category dynamically
//     const backgroundColors = labels.map((label, index) => {
//       // Predefined unique colors for specific indices
//       const predefinedColors = [
//         '#3134c8', // Default light purple
//         // '#8183f4', // Default light purple
//         // '#dadafc', // Autumn color example
//         // '#81c784', // Light green
//         // '#64b5f6', // Light blue
//         // '#ffab91', // Light orange
//         // '#e57373', // Light red
//         // '#ba68c8', // Light violet
//         // '#ffd54f', // Light yellow
//       ];
//
//       // Use predefined colors if available; otherwise generate a random unique color
//       if (index < predefinedColors.length) {
//         return predefinedColors[index];
//       }
//
//       // Fallback: Generate a unique random color
//       return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
//     });


    // Predefined colors list (cycling through these colors)
    const predefinedColors = ['#36C5F0', '#AEDF33', '#5D36FF', '#FAA43F', '#FFBB99', '#F35050', '#A155B9'];

    // Generate colors based on predefined or random fallback
    const backgroundColors = labels.map((_, index) => {
      return predefinedColors[index % predefinedColors.length]; // Loop through predefined colors
    });

    // Destroy existing chart instance to prevent conflicts
    if (this.pieChart) {
      this.pieChart.destroy();
    }


    this.pieChart = new Chart(pieCanvasEle.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 10,
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
          }
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
