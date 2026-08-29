import {Component, Inject, inject} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {MaterialModule} from "../../../material/material.module";
import {DatePipe, NgForOf} from "@angular/common";
import {Order} from "../../../interfaces/common/order.interface";
import {OrderService} from "../../../services/common/order.service";
import {UiService} from "../../../services/core/ui.service";
import {ReloadService} from "../../../services/core/reload.service";
import {Subscription} from "rxjs";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-courier-dialog',
  templateUrl: './courier-dialog.component.html',
  styleUrl: './courier-dialog.component.scss',
  standalone: true,
  imports: [
    FormsModule,
    MaterialModule,
    DatePipe,
    NgForOf
  ],
})
export class CourierDialogComponent  {

  newNote = '';
  editingIndex: number | null = null;
  id?: string;
  order?: Order;

  private readonly orderService = inject(OrderService);
  private readonly uiService = inject(UiService);
  private readonly reloadService = inject(ReloadService);

  private subDataGet: Subscription;
  private subDataUpdate: Subscription;

  constructor( public dialogRef: MatDialogRef<CourierDialogComponent>,@Inject(MAT_DIALOG_DATA) public data: any) {

  }

  ngOnInit() {
    this.id = this.data;
    if (this.id) {
      this.getShopById();
    }
  }


  private getShopById() {
    this.subDataGet = this.orderService.getOrderById(this.id).subscribe({
      next: (res) => {
        if (res.data) {
          this.order = res.data;
        }
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  private updateShopById() {
    const mData:any = {
      customerNotes: this.order.customerNotes
    };

    this.subDataUpdate = this.orderService.updateOrderById(this.order._id, mData).subscribe({
      next: (res) => {
        this.uiService.message(res.message || 'Note updated successfully', 'success');
        this.reloadService.needRefreshData$();
      },
      error: (error) => {
        console.error('Update Error:', error);
        this.uiService.message('Failed to update note', 'warn');
      }
    });
  }

  saveNote() {
    if (!this.newNote.trim()) return;
    // If editing, update the existing note
    if (this.editingIndex !== null) {
      this.order.customerNotes[this.editingIndex].note = this.newNote;
      this.order.customerNotes[this.editingIndex].updatedAt = new Date().toISOString();
      this.editingIndex = null;
    } else {
      // If adding, push new note
      this.order.customerNotes.push({
        note: this.newNote,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    this.updateShopById(); // Save to backend
    this.newNote = '';
  }


  closeDialog(): void {
    this.dialogRef.close();
  }

  editNote(index: number) {
    const originalIndex = this.order.customerNotes.length - 1 - index;
    this.editingIndex = originalIndex;
    this.newNote = this.order.customerNotes[originalIndex].note;
    this.reloadService.needRefreshData$();
  }


  deleteNote(index: number) {
    const originalIndex = this.order.customerNotes.length - 1 - index;
    this.order.customerNotes.splice(originalIndex, 1);
    this.updateShopById(); // Sync with backend
  }

  /**
   * ON DESTROY
   * ngOnDestroy()
   */

  ngOnDestroy() {
    if (this.subDataGet) {
      this.subDataGet.unsubscribe();
    }
    if (this.subDataUpdate) {
      this.subDataUpdate.unsubscribe();
    }
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
