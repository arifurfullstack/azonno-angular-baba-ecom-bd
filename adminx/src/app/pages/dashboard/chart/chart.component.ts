import {Component, ViewChild} from '@angular/core';
import {Chart, ChartConfiguration, ChartOptions} from "chart.js";

// export type ChartOptions = {
//   series: ApexAxisChartSeries;
//   chart: ApexChart;
//   xaxis: ApexXAxis;
//   stroke: ApexStroke;
//   tooltip: ApexTooltip;
//   dataLabels: ApexDataLabels;
// };


@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent {
  // @ViewChild("chart") chart: any;
  // public chartOptions: Partial<ChartOptions>;
  //
  // constructor() {
  //   this.chartOptions = {
  //     series: [
  //       {
  //         name: "series1",
  //         data: [31, 40, 28, 51, 42, 109, 100]
  //       },
  //       {
  //         name: "series2",
  //         data: [11, 32, 45, 32, 34, 52, 41]
  //       }
  //     ],
  //     chart: {
  //       height: 350,
  //       type: "area"
  //     },
  //     dataLabels: {
  //       enabled: false
  //     },
  //     stroke: {
  //       curve: "smooth"
  //     },
  //     xaxis: {
  //       type: "datetime",
  //       categories: [
  //         "2018-09-19T00:00:00.000Z",
  //         "2018-09-19T01:30:00.000Z",
  //         "2018-09-19T02:30:00.000Z",
  //         "2018-09-19T03:30:00.000Z",
  //         "2018-09-19T04:30:00.000Z",
  //         "2018-09-19T05:30:00.000Z",
  //         "2018-09-19T06:30:00.000Z"
  //       ]
  //     },
  //     tooltip: {
  //       x: {
  //         format: "dd/MM/yy HH:mm"
  //       }
  //     }
  //   };
  // }
  // public generateData(baseval, count, yrange) {
  //   var i = 0;
  //   var series = [];
  //   while (i < count) {
  //     var x = Math.floor(Math.random() * (750 - 1 + 1)) + 1;
  //     var y =
  //       Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
  //     var z = Math.floor(Math.random() * (75 - 15 + 1)) + 15;
  //
  //     series.push([x, y, z]);
  //     baseval += 86400000;
  //     i++;
  //   }
  //   return series;
  // }
  // ngOnInit(): void {
  // }
  ngAfterViewInit() {
    this.createBarChart();
  }

  createBarChart() {
    const canvas = document.getElementById('barChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun'], // X-axis labels
          datasets: [
            {
              label: 'Due',
              data: [2000, 3000, 4000, 2500, 3200], // Data for 'Due'
              backgroundColor: '#2684ff', // Bar color for 'Due'
            },
            {
              label: 'Over Due',
              data: [4000, 3200, 5000, 2700, 4200], // Data for 'Over Due'
              backgroundColor: '#8200fb', // Bar color for 'Over Due'
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: '#555', // Legend text color
                font: { size: 14 },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#777' },
            },
            y: {
              beginAtZero: true,
              grid: { color: '#eaeaea' },
              ticks: { color: '#777' },
            },
          },
        },
      });
    }
  }
}
