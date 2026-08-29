import {Component, inject, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormBuilder, FormGroup} from '@angular/forms';
import {FileUploadService} from '../../../services/gallery/file-upload.service';
import {GalleryService} from '../../../services/gallery/gallery.service';
import {Gallery} from '../../../interfaces/gallery/gallery.interface';
import {ImageConvertOption} from '../../../interfaces/gallery/image-convert-option.interface';
import {FileTypes} from '../../../enum/file-types.enum';
import {UiService} from '../../../services/core/ui.service';
import {FileFolder} from '../../../interfaces/gallery/file-folder.interface';
import {FileFolderService} from '../../../services/gallery/file-folder.service';
import {FilterData} from '../../../interfaces/gallery/filter-data';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-upload-dialog',
  templateUrl: './upload-dialog.component.html',
  styleUrl: './upload-dialog.component.scss'
})
export class UploadDialogComponent {

  // Store Data
  files: FileList | File[];
  pickedImages: any[] = [];
  isUploading: boolean = false;
  fileFolders: FileFolder[] = [];
  selectItem: FileFolder = null;

  // Data Form
  dataForm: FormGroup;

  // Inject
  private readonly fb = inject(FormBuilder);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly galleryService = inject(GalleryService);
  private readonly uiService = inject(UiService);
  private readonly fileFolderService = inject(FileFolderService);

  // Subscription
  private subGetAllFileFolders: Subscription;
  private subAddFileFolder: Subscription;

  constructor(
    public dialogRef: MatDialogRef<UploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {}


  ngOnInit() {
    this.initDataForm();
    if (this.data) {
      this.files = this.data.files;
      this.pickedImages = this.data.pickedImages;
    }
    // console.log('this.data',this.data)

    // Base data
    this.getAllFileFolders();
  }


  /**
   * FORM METHODS
   * initDataForm()
   * onSubmit()
   */
  private initDataForm() {
    this.dataForm = this.fb.group({
      folder: [null],
      isConvert: [true],
    });
  }

  onSubmit() {
    if (this.dataForm.invalid) {
      return;
    }
    this.onUploadImages();
  }

  /**
   * HTTP Request Handle
   * onUploadImages()
   * insertManyGallery()
   */
  onUploadImages() {
    if (!this.files || this.files.length <= 0) {
      this.uiService.message('No Image selected!', "warn");
      return;
    }

    this.isUploading = true;
    let option: ImageConvertOption = null;
    if (this.dataForm.value.isConvert) {
      option = {
        convert: 'yes'
      }
    }
    // console.log('data', this.files)
    this.subAddFileFolder = this.fileUploadService.uploadMultiImage(this.files, option)
      .subscribe({
        next: res => {
          const data: Gallery[] = res.map(m => {
            return {
              url: m.url,
              name: m.name,
              size: m.size,
              width: m?.width?.toString(),
              height: m?.height?.toString(),
              folder: this.dataForm.value.folder ?? 'Default',
              type: FileTypes.IMAGE
            } as Gallery;
          });
          // console.log('data', data)
          this.insertManyGallery(data);
        },
        error: err => {
          console.log(err)
          this.uiService.message('Something went wrong', "warn");
          this.isUploading = false;
        }
      });
  }

  private insertManyGallery(data: Gallery[]) {
    this.subAddFileFolder = this.galleryService.insertManyGallery(data)
      .subscribe({
        next: res => {
          this.isUploading = false;
          this.dialogRef.close({data: res.data});
        },
        error: err => {
          this.isUploading = false;
          console.log(err)
          this.uiService.message('Something went wrong', "warn");
        }
      });
  }

  /**
   * COMPONENT DIALOG
   * getAllFileFolders()
   * addFileFolder()
   */
  private getAllFileFolders() {
    const mSelect = {
      name: 1,
    }

    const filterData: FilterData = {
      pagination: null,
      filter: null,
      select: mSelect,
      sort: {name: 1}
    }

    this.subGetAllFileFolders = this.fileFolderService.getAllFileFolders(filterData, null)
      .subscribe({
        next: res => {
          const defaultData = {_id: null, name: 'Default'};
          this.fileFolders = res.data;
          this.fileFolders.unshift(defaultData);
          this.selectItem = defaultData;
        },
        error: err => {}
      });
  }

  protected addFileFolder(data: any) {
    this.subAddFileFolder = this.fileFolderService.addFileFolder(data)
      .subscribe({
        next: res => {
          if (res.success) {
            const obj: any = {...data, ...{_id: res.data._id}}
            this.fileFolders.unshift(obj);
            this.selectItem = obj;
          }
        },
        error: err => {}
      });
  }

  /**
   * Other Methods
   * onRemovePickedImage()
   * onClose()
   */
  onRemovePickedImage(i: number) {
    this.pickedImages.splice(i, 1);

    const fileArray = Array.from(this.files);
    fileArray.splice(i, 1);
    this.files = fileArray;

    if (!this.files.length) {
      this.dialogRef.close();
    }
  }

  onClose() {
    this.dialogRef.close();
  }

  /**
   * ON Destroy
   */
  ngOnDestroy() {
    this.subGetAllFileFolders?.unsubscribe();
    this.subAddFileFolder?.unsubscribe();
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
