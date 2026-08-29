import {Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import {ThemeControllService} from '../../../services/common/theme-controll.service';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-chart-section',
  templateUrl: './chart-section.component.html',
  styleUrl: './chart-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartSectionComponent implements OnInit, OnDestroy {
  selectInputStyle = 4;
  periodData = 'weekly'
  //Subscriptions
  private subInputStyle!: Subscription;

  constructor(
    private themeControlService: ThemeControllService,
    private cdr: ChangeDetectorRef
  ) {

  }

  ngOnInit() {
    this.subInputStyle = this.themeControlService.refreshInputStyle$.subscribe((res: any) => {
      this.selectInputStyle = parseInt(res?.value);
      this.cdr.markForCheck();
    })

  }

  // Filter
  revenueFilter(period: string, index: number) {
    this.selectInputStyle = index;
    this.periodData = period;
    this.cdr.markForCheck();
  }

  /**
   * NG ON DESTROY
   */

  ngOnDestroy(): void {
    if (this.subInputStyle) {
      this.subInputStyle.unsubscribe();
    }
  }

}
