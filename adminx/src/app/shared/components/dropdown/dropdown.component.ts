import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {Dropdown} from './interfaces/dropdown.interface';
import {OutSideClickModule} from '../../directives/out-side-click/out-side-click.module';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [
    NgForOf,
    NgClass,
    NgIf,
    OutSideClickModule
  ],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss'
})
export class DropdownComponent {
  dropdownOpen = false;
  selectedOption: string | null = null;


  @Input({required: true}) options: Dropdown[] = [];
  @Input() iconName: string = 'title';
  @Input() minDropdownWidth = '200px';
  @Output() onChange = new EventEmitter();


  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    console.log('this.dropdownOpen', this.dropdownOpen)
  }

  selectOption($event: MouseEvent, option: Dropdown) {
    $event.stopPropagation();
    this.selectedOption = option.viewValue;
    this.dropdownOpen = false;
    this.onChange.emit(option.value);
  }

  onOutsideClick() {
    this.dropdownOpen = false;
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
