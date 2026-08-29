import {Component, EventEmitter, Input, Output} from '@angular/core';
@Component({
  selector: 'app-drop-zone',
  templateUrl: './drop-zone.component.html',
  styleUrls: ['./drop-zone.component.scss']
})
export class DropZoneComponent {

  @Output() newItemEvent = new EventEmitter();
  @Output() onDeleteOldImage = new EventEmitter<string[]>();
  files: File[] = [];
  @Input() fileNotPicked: boolean = false;
  @Input() images: string[] = [];
  @Input() nidText!: string;
  @Input() paymentReceiptText!: string;
  filePreviews: string[] = [];

  constructor(
  ) { }


  /**
   * IMAGE DRUG & DROP
   * onSelect()
   * onRemove()
   */
  // onSelect(event: { addedFiles: any; }) {
  //   if (event) {
  //     this.files.push(...event.addedFiles);
  //     this.newItemEvent.emit(this.files);
  //
  //     console.log("  this.files",  this.files)
  //     console.log(" this.newItemEvent", this.newItemEvent)
  //     console.log(" this.oldImages", this.images)
  //   }
  // }
  //
  // onRemove(event: File) {
  //   this.files.splice(this.files.indexOf(event), 1);
  //   this.newItemEvent.emit(this.files);
  // }

  onSelect(event: { addedFiles: File[] }) {
    if (this.files.length + this.images.length >= 1) {
      // Don't allow more than 1 image
      return;
    }

    const selectedFile = event.addedFiles[0];
    this.files = [selectedFile]; // overwrite
    this.filePreviews = [URL.createObjectURL(selectedFile)];
    this.newItemEvent.emit(this.files);
  }

  onRemove(file: File) {
    this.files = [];
    this.filePreviews = [];
    this.newItemEvent.emit(this.files);
  }

  removeOldImage(index: number) {
    this.images.splice(index, 1);
    this.onDeleteOldImage.emit(this.images);
  }



  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
