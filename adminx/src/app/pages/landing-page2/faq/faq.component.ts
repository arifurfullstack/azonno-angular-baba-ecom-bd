import {isPlatformBrowser, NgClass, NgFor, NgIf, ViewportScroller} from '@angular/common';
import {Component, HostListener, inject, Input, PLATFORM_ID} from '@angular/core';
import {ReloadService} from "../../../services/core/reload.service";

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
  standalone:true,
  imports: [
    NgFor,
    NgIf,
    NgClass
  ]
})
export class FaqComponent {
  @Input() singleLandingPage: any;
  selectedMenu = 0;
  imageVisible = false;
  textVisible = false;

  @Input() cartSaleSubTotal: any;

  private readonly reloadService = inject(ReloadService);
  private readonly viewportScroller = inject(ViewportScroller);
  private readonly platformId = inject(PLATFORM_ID);

// Store Data
  faqList = [
    {
      question: 'আপনার পণ্য কি গ্যারান্টিযুক্ত?',
      answer: 'হ্যাঁ, আমাদের সমস্ত পণ্য গুণগত মান নিশ্চিত করা হয় এবং পণ্য গ্রহণের পর যদি কোনো সমস্যা থাকে, আমরা সেটি ফিরিয়ে নেওয়া বা প্রতিস্থাপন করি।'
    },
    {
      question: 'অর্ডার দেয়ার পর কতদিনে ডেলিভারি হবে?',
      answer: 'অর্ডার করার পর সাধারণত ৩-৫ কর্মদিবসের মধ্যে পণ্যটি আপনার ঠিকানায় পৌঁছে যাবে।'
    },
    {
      question: 'আমি কি আমার অর্ডার ক্যন্সেল করতে পারি?',
      answer: 'হ্যাঁ, যদি অর্ডার এখনও প্রক্রিয়া হয়নি, তাহলে আপনি আপনার অর্ডার ক্যন্সেল করতে পারবেন। অর্ডার শিপিংয়ের পর ক্যন্সেল করা সম্ভব নয়।'
    },
    {
      question: 'পেমেন্ট কি নিরাপদ?',
      answer: 'হ্যাঁ, আমাদের সাইটে সকল পেমেন্ট প্রক্রিয়া SSL সুরক্ষিত এবং আমরা আপনার তথ্য নিরাপদ রাখি।'
    },
    {
      question: 'আমি কি পণ্য পরিবর্তন বা ফেরত দিতে পারি?',
      answer: 'হ্যাঁ, যদি পণ্যটি ত্রুটিপূর্ণ বা ভুল আসা হয়, তবে আপনি ৭ দিনের মধ্যে সেটি ফেরত বা পরিবর্তন করতে পারবেন।'
    },
    {
      question: 'কীভাবে পেমেন্ট করা যাবে?',
      answer: 'আপনি আমাদের সাইটে বিভিন্ন পেমেন্ট পদ্ধতি যেমন ক্রেডিট কার্ড, ডেবিট কার্ড, বিকাশ, রকেট, এবং ক্যাশ অন ডেলিভারি (COD) এর মাধ্যমে পেমেন্ট করতে পারবেন।'
    },
    {
      question: 'ডেলিভারি চার্জ কি?',
      answer: 'ডেলিভারি চার্জ আপনার অবস্থান ও অর্ডারের পরিমাণের উপর নির্ভর করে। সাধারণত ৫০-১০০ টাকা ডেলিভারি চার্জ প্রযোজ্য।'
    }
  ];


// Store selected opened index
openedIndex: number | null = null;

// Toggle selected FAQ
toggleFaq(index: number): void {
  this.openedIndex = this.openedIndex === index ? null : index;
}


  /**
   * SCROLL WITH NAVIGATE
   * onScrollWithNavigate()
   */

  public onScrollWithNavigate(type: string) {
    switch (true) {
      case type === "payment":
        this.selectedMenu = 1;
        this.reloadService.needRefreshSticky$(true);
        break;
      default:
        this.selectedMenu = 0;
    }
  }

  @HostListener('window:scroll')
  scrollBody() {
    if (isPlatformBrowser(this.platformId)) {
      // Get the footer's Y offset position
      const [_, footerTop] = this.viewportScroller.getScrollPosition();
      const windowHeight = window.innerHeight;
      const footerOffsetTop = document.getElementById('faq')?.offsetTop || 0;

      if (window.scrollY + windowHeight >= footerOffsetTop) {
        this.imageVisible = true;
        this.textVisible = true;
      } else {
        this.imageVisible = false;
        this.textVisible = false;
      }
    }
  }

  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
