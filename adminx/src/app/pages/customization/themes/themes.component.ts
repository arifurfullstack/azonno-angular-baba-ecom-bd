import {Component, inject, OnInit, ViewChild} from '@angular/core';
import {ConfirmDialogComponent} from "../../../shared/components/ui/confirm-dialog/confirm-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {NgForm} from "@angular/forms";
import {ShopInformationService} from "../../../services/common/shop-information.service";

@Component({
  selector: 'app-themes',
  templateUrl: './themes.component.html',
  styleUrl: './themes.component.scss'
})
export class ThemesComponent implements OnInit {
  searchQuery = null;
  protected shopInformation: any;

  // Decorator
  @ViewChild('searchForm', {static: true}) private searchForm: NgForm;
  private readonly dialog = inject(MatDialog);
  private readonly shopInformationService = inject(ShopInformationService);

  ngOnInit(): void {
    this.getShopInformation();
  }

  private getShopInformation() {
    this.shopInformationService.getShopInformation().subscribe({
      next: (res) => {
        this.shopInformation = res.fShopDomain;
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  /**
   * COMPONENT DIALOG VIEW
   * openConfirmDialog()
   * openDetailsDialog()
   */
  public openConfirmDialog() {

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
          maxWidth: '400px',
          data: {
            title: 'Confirm Delete',
            message: 'Are you sure you want change your theme?'
          }
        });
        dialogRef.afterClosed().subscribe(dialogResult => {
          if (dialogResult) {

            console.log('this.deleteMultipleProductsById()');
          }
        });
      }

  onClearSearch() {
    this.searchForm.reset();
    this.searchQuery = null;
    // this.router.navigate([], {queryParams: {search: null}}).then();
  }
}
