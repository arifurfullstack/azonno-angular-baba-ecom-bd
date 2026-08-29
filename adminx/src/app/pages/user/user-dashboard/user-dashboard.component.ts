import {Component, inject, OnInit} from '@angular/core';
import {User} from "../../../interfaces/common/user.interface";
import {Subscription} from "rxjs";
import {UiService} from "../../../services/core/ui.service";
import {UserService} from "../../../services/common/user.service";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrl: './user-dashboard.component.scss'
})
export class UserDashboardComponent implements OnInit {
  user: User = null;
  id: string = null;
  userId: boolean = false;

  // Subscriptions
  private subscriptions: Subscription[] = [];
  // Inject
  private readonly uiService = inject(UiService);
  private readonly userService = inject(UserService);
  private readonly activatedRoute = inject(ActivatedRoute);

  ngOnInit() {
    const subscription = this.activatedRoute.queryParamMap.subscribe((qParam:any) => {
      if (qParam.get('userId')) {
        this.userId = qParam.get('userId');
      }
    });
    // Get Data from Param
    const subActivateRoute = this.activatedRoute.paramMap.subscribe((param) => {
      this.id = param.get('phoneNo');
      if (this.id) {
        this.getUserById();
      }
    });

    this.subscriptions.push(subActivateRoute);
    this.subscriptions.push(subscription);
  }


  /**
   * HTTP REQ HANDLE
   * getUserById()
   * addUser()
   * updateUserById()
   */

  private getUserById() {
    const subscription = this.userService.getUserByPhoneNo(this.id,null,this.userId)
      .subscribe({
        next: res => {
          this.user = res.data;
        },
        error: err => {
          console.log(err)
        }
      })
    this.subscriptions.push(subscription);
  }

  /**
   * ON Destroy
   */
  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub?.unsubscribe());
  }


  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
