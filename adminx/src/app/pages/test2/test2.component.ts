import {Component, ComponentRef, ElementRef, ViewChild, ViewContainerRef} from '@angular/core';
import {ThemeOneComponent} from "../test/theme-one/theme-one.component";

@Component({
  selector: 'app-test2',
  templateUrl: './test2.component.html',
  styleUrl: './test2.component.scss'
})
export class Test2Component {
  @ViewChild('templateContainer', { read: ViewContainerRef }) templateContainer!: ViewContainerRef;
  @ViewChild('templateContainerElement', { static: false }) templateContainerElement!: ElementRef;

  selectedTheme: string = '';
  componentRef!: ComponentRef<any>;

  themeComponents: { [key: string]: any } = {
    'theme-one': ThemeOneComponent,
  };

  themes = [
    { _id: '5674567546', name: 'Natural Powder', image: '/assets/page/34.webp', component: 'theme-one' },
    { _id: '5674567547', name: 'Modern Design', image: '/assets/page/35.webp', component: 'theme-two' }
  ];

  constructor() {}

  ngAfterViewInit(): void {}

  /**
   * Loads the selected theme component dynamically
   */
  loadSelectedComponent(themeKey: string): void {
    this.templateContainer.clear();

    if (this.themeComponents[themeKey]) {
      this.componentRef = this.templateContainer.createComponent(this.themeComponents[themeKey]);

      // Pass data to the component
      this.componentRef.instance.data = this.themes.find(t => t.component === themeKey);
    }
  }

  /**
   * Called when user selects a theme
   */
  selectTheme(theme: any) {
    this.selectedTheme = theme.component;
    this.loadSelectedComponent(this.selectedTheme);
  }

  /**
   * Captures and submits the cleaned HTML content of the template
   */
  submitTemplate(): void {
    if (!this.templateContainerElement) {
      return;
    }

    const originalHtml = this.templateContainerElement.nativeElement.innerHTML;
    const cleanedHtml = this.cleanHTML(originalHtml);
    alert('Cleaned HTML logged in console.');
  }

  /**
   * Called on content edit
   */
  onContentEdit(): void {
    const editableContent = this.templateContainerElement.nativeElement.innerHTML;

  }

  /**
   * Cleans the HTML by removing unwanted Angular attributes and classes
   */
  cleanHTML(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Remove elements with `.ignore` class
    const ignoreElements = tempDiv.querySelectorAll('.ignore');
    ignoreElements.forEach(el => el.remove());

    // Remove Angular-specific and unwanted attributes
    const elements = tempDiv.querySelectorAll('*');
    elements.forEach(el => {
      const attributesToRemove: string[] = [];
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        if (
          attr.name.startsWith('_ngcontent-') ||
          attr.name.startsWith('_nghost-') ||
          attr.name === 'contenteditable' ||
          attr.name === 'spellcheck'
        ) {
          attributesToRemove.push(attr.name);
        }

        // Remove "guide-area" class if it exists
        if (attr.name === 'class' && el.classList.contains('guide-area')) {
          el.classList.remove('guide-area');
          if (el.classList.length === 0) {
            attributesToRemove.push('class');
          }
        }
      }
      attributesToRemove.forEach(attrName => el.removeAttribute(attrName));
    });

    return tempDiv.innerHTML;
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
