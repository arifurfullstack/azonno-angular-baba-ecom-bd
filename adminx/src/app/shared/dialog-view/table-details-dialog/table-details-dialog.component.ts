import {Component, Inject, Input} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-table-details-dialog',
  standalone: true,
  imports: [
    NgForOf,
    NgIf
  ],
  templateUrl: './table-details-dialog.component.html',
  styleUrl: './table-details-dialog.component.scss'
})
export class TableDetailsDialogComponent {
  dataArray: { label: string; value: any }[] = [];

  constructor(
    public dialogRef: MatDialogRef<TableDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    if (data) {
      this.prepareData(data);
    }

  }

  prepareData(data: any) {
    this.dataArray = [];

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        let value = data[key];

        // Handle nested objects
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Use the specified field or default to 'name'
          value = JSON.stringify(value, null, 2);
        } else if (Array.isArray(value)) {
          value = value.join(', '); // Join arrays as a string
        }

        // Push the processed key-value pair into the data array
        this.dataArray.push({label: key, value: value});
      }
    }
  }


  closeDialog(): void {
    this.dialogRef.close();
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
