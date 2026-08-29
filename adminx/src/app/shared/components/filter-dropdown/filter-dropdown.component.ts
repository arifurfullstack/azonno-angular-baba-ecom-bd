import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import {FormControl, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';
import {OutSideClickModule} from '../../directives/out-side-click/out-side-click.module';

@Component({
  selector: 'app-filter-dropdown',
  standalone: true,
  imports: [
    FormsModule,
    NgIf,
    NgForOf,
    OutSideClickModule
  ],
  templateUrl: './filter-dropdown.component.html',
  styleUrl: './filter-dropdown.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FilterDropdownComponent),
      multi: true
    }
  ]
})
export class FilterDropdownComponent implements OnInit, OnChanges {

  // Decorator
  @Output() onAddedNewItem = new EventEmitter();
  @Input() maxHeight: string = '200px';
  @Input() needAddFunc: boolean = false;
  @Input() items: any[] = [];
  @Input() selectedData: any = null;

  // Store Data
  filteredItems = [...this.items];
  searchTerm = '';
  showAddButton = false;
  control = new FormControl();
  dropdownOpen = false;
  selectedItem: any = null;

  // Inject
  constructor(private eRef: ElementRef) {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.selectedData) {
      this.selectItem(this.selectedData);
    }
  }

  /**
   * FORM METHODS
   * writeValue()
   * registerOnChange()
   * registerOnTouched()
   * setDisabledState()
   */
  writeValue(obj: any): void {
    if (obj) {
      this.searchTerm = obj;
      this.selectedItem = this.items.find(item => item.name === obj);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // You can add logic for handling disabled state if required
  }

  /**
   * Other Methods
   * filterItems()
   * selectItem()
   * addFolder()
   * toggleDropdown()
   * onClick()
   */
  filterItems(): void {
    this.dropdownOpen = true;
    if (!this.searchTerm) {
      this.filteredItems = [...this.items];
      this.showAddButton = false;
    } else {
      this.filteredItems = this.items.filter(item => item.name.toLowerCase().includes(this.searchTerm.toLowerCase()));
      const fullMatchExists = this.items.some(item => item.name.toLowerCase() === this.searchTerm.toLowerCase());
      this.showAddButton = !fullMatchExists;
    }
  }

  selectItem(item: any): void {
    this.searchTerm = item.name;
    this.selectedItem = item;
    this.onChange(this.searchTerm);  // Notify form control about the change
    this.onTouched();  // Notify form control about the touch
    this.filteredItems = [...this.items];
    this.showAddButton = false;
    this.dropdownOpen = false;
  }

  addFolder(): void {
    const newItem = {name: this.searchTerm};
    this.onAddedNewItem.emit(newItem);
  }

  toggleDropdown(state: boolean): void {
    this.dropdownOpen = state;
  }


  onOutsideClick() {
    this.dropdownOpen = false;
  }

  // Store Handlers
  onChange: any = () => {
  };
  onTouched: any = () => {
  };

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
