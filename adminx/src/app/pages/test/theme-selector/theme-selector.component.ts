import {Component, OnInit} from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-theme-selector',
  templateUrl: './theme-selector.component.html',
  styleUrl: './theme-selector.component.scss'
})
export class ThemeSelectorComponent implements OnInit {
  selectedTheme: any;
  themeSelected: any;

  constructor(private dialogRef: MatDialogRef<ThemeSelectorComponent>) {

  }

  ngOnInit() {
    this.templateData();
  }

  saveTemplate() {
    this.dialogRef.close();
  }

  closeDialog() {
    this.dialogRef.close();
  }


  private templateData() {
    this.themeSelected = [
      {
        _id:'5674567546',
        image: '/assets/page/34.webp',
        name: 'Natural Powder',
        link: '/assets/page/landing-page2.html',
        theme: `<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Page</title>
    <style>

              .section1 {
            background-color: #013220;
            color: white;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
              }
        .container{
            max-width: 1200px;
            margin: 0 auto;
            padding: 60px 20px;
            text-align: center;
        }

        .section1 .content-box {
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
        }

        .section1 .highlight {
            color: #ffcc00;
        }

        .section1 .button {
            background-color: #ffcc00;
            color: #013220;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            text-decoration: none;
        }
       .section1 .button:hover {
            background-color: #e6b800;
        }
        .section1 .video-container {
            position: relative;
            border: 6px solid #28a745;
            border-radius: 10px;
            overflow: hidden;
        }
        .section1 .video-container iframe {
            width: 100%;
            height: 400px;
        }
        .section1 .play-button {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80px;
            height: 80px;
            background-color: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            animation: pulse 2s infinite;
        }
        .section1 .play-button::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 100%;
            border: 2px solid rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        .section1 .play-button svg {
            width: 36px;
            height: 36px;
            fill: #013220;
        }
        @keyframes pulse {
            0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(1.5);
                opacity: 0;
            }
        }
        @media (max-width: 768px) {
            .section1 .video-container iframe {
                height: 200px;
            }
        }
        .section1 .border-box {
            border: 2px solid #01632a;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
  .section2 {
         display: flex;
            align-items: center;
            justify-content: center;
            margin: 0;
             padding: 60px 20px;
  }
      .section2 .container1 {
            background-color: #218838;
            padding: 60px 20px;
            border-radius: 10px;
            max-width:1200px;
            width:100%;
            margin: 0;
            text-align: center;
        }

.section2 .header {
            background-color:rgb(243, 19, 41);
            color: white;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .section2 .header span {
            font-weight: bold;
        }
        .section2 .content {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;

        }
        .section2 .content p {
            color: #28a745;
            margin: 0;
        }
        .section2 .content p.line-through {
            text-decoration: line-through;
            margin-bottom: 10px;
        }
        .section2 .button-container {
            display: flex;
            justify-content: center;
        }
        .section2 .button-container button {
            background-color: #fd7e14;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .section2 .button-container button:hover {
            background-color: #e67e22;
        }


 .section3{
      display: flex;
            align-items: center;
            justify-content: center;
            background-color: #28a745;
            margin: 0;
 }

 .section3 {
     background-color: #f0f9e8;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;

 }
 .section3 .container3 {
            padding: 60px 20px;
            border-radius: 10px;
            max-width: 1000px;
            width: 100%;
        }
        .section3 .grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
        }
        @media (min-width: 768px) {
             .section3 .grid {
                grid-template-columns: 1fr 1fr;
            }
        }
         .section3 .box {
            background-color: white;
            border: 4px solid #2f9e44;
            border-radius: 10px;
            padding: 20px;
        }
         .section3 .box h2 {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }
         .section3 .box ul {
            list-style-type: none;
            padding: 0;
        }
         .section3 .box ul li {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
        }
         .section3 .button-container {
            text-align: center;
            margin-top: 20px;
        }
         .section3 .button-container button {
            background-color: #ff922b;
            color: white;
            font-size: 18px;
            font-weight: bold;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
         .section3 .button-container button:hover {
            background-color: #e07b24;
        }

 .section4{
    background-color: #013220;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
 }
   .section4 .container4 {
            text-align: center;
            padding: 60px 20px;
        }
         .section4 .header {
            background-color: #2E8B57;
            border: 4px solid #00FF00;
            border-radius: 8px;
            display: inline-block;
            padding: 10px 20px;
            margin-bottom: 20px;
        }
         .section4  .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
         .section4 .content p {
            margin: 10px 0;
        }
         .section4 .button {
            background-color: #FFA500;
            color: white;
            font-weight: bold;
            padding: 10px 20px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            margin-top: 20px;
        }
         .section4 .button:hover {
            background-color: #FF8C00;
        }

         .section5{
             background-color: white;
            display: flex;
            align-items: center;
            justify-content: center;
         }

 .section5 .container5 {
      padding: 60px 20px;
            border-radius: 10px;
            max-width: 1000px;
            width: 100%;
            text-align: center;
        }
        .section5 .title {
            font-size: 1.5rem;
            border-radius: 5px;
            font-weight: bold;
            color: #006400;
            border: 2px solid #006400;
            display: inline-block;
            padding: 10px 20px;
            margin-bottom: 20px!important;
        }
        .section5 .grid {
            display: grid;
            grid-template-columns: 1fr;
            grid-template-rows: max-content;
            gap: 10px;
            align-items: center;
            margin-bottom: 20px;
        }
        @media (min-width: 768px) {
            .section5 .grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }
        .section5 .grid-item {
            border: 2px solid #006400;
            padding: 20px;
            border-radius: 5px;
            display: flex;
            justify-content: center;
        }


        .section5 .button {
            background-color: #FFA500;
            color: white;
            font-weight: bold;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        .section5 .button:hover {
            background-color: #FF8C00;
        }

         .section6 {
             display: flex;
            align-items: center;
            justify-content: center;
             background-color:rgb(255, 255, 255);
         }

 .section6 .container6 {
            border: 4px dotted #16a34a;
            padding: 60px 20px;
            border-radius: 10px;
            max-width: 1000px;
            text-align: center;
 }
            .section6 .title {
            color: #15803d;
            font-size: 1.5rem;
            font-weight: bold;
        }
         .section6 .subtitle {
            color: #15803d;
        }
         .section6 .offer {
            background-color: #dc2626;
            color: white;
            padding: 16px;
            margin-top: 16px;
            border-radius: 8px;
        }
         .section6 .offer p {
            margin: 0;
        }
         .section6 .offer .highlight {
            font-size: 1.25rem;
            font-weight: bold;
            margin-top: 8px;
        }

 </style>
</head>
<body>
    <div class="section1">
    <div class="container">
        <div class="border-box">
            <p class="text-2xl" contenteditable="true">
                প্রতিদিন ১ গ্রাম সজনে পাতার জুস আপনাকে ও আপনার পরিবারকে <span class="highlight">৩০০টি রোগ</span> থেকে রক্ষা করবে যা গবেষণায় পরীক্ষিত !!
            </p>
        </div>
        <div class="content-box">
            <p class="text-lg" contenteditable="true">
                ৫৫ গ্রাম প্রিমিয়াম সজিনা পাউডার + ১০০ গ্রাম কালোজিরা মধু ফ্রি।
            </p>
            <a href="#" class="button">অর্ডার করতে ক্লিক করুন</a>
        </div>
        <div class="video-container">
            <iframe id="video" src="https://www.youtube.com/embed/your-video-id" frameborder="0" allowfullscreen></iframe>
<!--            <div class="play-button">-->
<!--                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">-->
<!--                    <path d="M8 5v14l11-7z"/>-->
<!--                </svg>-->
<!--            </div>-->
        </div>
    </div>
    </div>
     <div class="section2">
<div class="container1">
        <div class="header" contenteditable="true">
            আমাদের থেকে বিস্তারিত জানতে এই নাম্বারে কল করুন <span>1234567890</span>
        </div>
        <div class="content">
            <p class="line-through" contenteditable="true">৪০০ গ্রাম সজিনা পাতার পাউডারের রেগুলার প্রাইস- ১৫০০/=</p>
            <p contenteditable="true">৪০০ গ্রাম সজিনা পাতার পাউডারের অফার প্রাইস- ১০৫০/=</p>
        </div>
        <div class="button-container">
            <button>অর্ডার করতে ক্লিক করুন</button>
        </div>
    </div>
    </div>

<div class="section3">
<div class="container3">
        <div class="grid">
            <div class="box">
                <h2 contenteditable="true">সজিনা পাতার উপকারিতা</h2>
                <ul>
                    <li contenteditable="true" >উচ্চ রক্তচাপ নিয়ন্ত্রণে রাখে।</li>
                    <li contenteditable="true" >এটি এন্টি-ব্যাকটেরিয়াল বৈশিষ্ট্য বিদ্যমান। এটি ফ্লুতে ও কিডনী সুস্থ রাখতে এবং রক্তের সেলেনিয়াম বৃদ্ধি করতে সাহায্য করে।</li>
                    <li contenteditable="true" >রক্তে কোলেস্টেরল কমায়।</li>
                    <li contenteditable="true" >এন্টিডিপ্রেসেন্ট বা গ্যাস্ট্রিক নিয়ন্ত্রণে রাখে।</li>
                    <li contenteditable="true" >শরীরে কোলেস্টেরল এর মাত্রা নিয়ন্ত্রণেও অনন্য অবদান রাখে।</li>
                    <li contenteditable="true" >রক্ত শর্করা দূর করে।</li>
                    <li contenteditable="true" >মানুষের শরীরের যে ৯ টি এমাইনো এসিড খাদ্যের মাধ্যমে সরবরাহ করতে হয়, তার সবগুলোই এই সজিনা পাতা গুড়ার মধ্যে বিদ্যমান।</li>
                    <li contenteditable="true" >শরীরে সুরক্ষার মাত্রা নিয়ন্ত্রণে রাখার জন্য অ্যান্টিঅক্সিডেন্ট মত কঠিন রোগের বিরুদ্ধে কাজ করে থাকে।</li>
                    <li contenteditable="true" >চোখের জন্য উপকারী।</li>
                    <li contenteditable="true" >ঠান্ডা জ্বরের সমস্যা দূর করে।</li>
                </ul>
            </div>
            <div class="box">
                <h2 contenteditable="true" >সেবনে সঠিক নিয়ম</h2>
                <ul>
                    <li contenteditable="true" >খালি পেটে এক গ্লাস পানিতে ২ চা চামচ সজিনা পাতা মিশ্র করে খেতে পারেন।</li>
                    <li contenteditable="true" >মধুর সাথে মিশ্র করে খেতে পারেন।</li>
                    <li contenteditable="true" >দুধের সাথে মিশ্র করে খেতে পারেন।</li>
                    <li contenteditable="true" >ডালের সাথে মিশ্র করে খেতে পারেন।</li>
                    <li contenteditable="true" >বিভিন্ন ধরনের ভাজির সাথে মিশ্রিত খাওয়া যায়।</li>
                    <li contenteditable="true" >পেয়ারার সাথে মিশ্র করে খেতে পারেন।</li>
                    <li contenteditable="true" >আমড়ার সাথে মিশ্র করে খেতে পারেন।</li>
                    <li contenteditable="true" >কাঁঠা আমের সাথে মিশ্রিত খেতে পারেন।</li>
                    <li contenteditable="true" >তরকারির সাথে মিশ্র করে খেতে পারেন।</li>
                    <li contenteditable="true" >চোখের জন্য উপকারী।</li>
                    <li contenteditable="true" >ঠান্ডা জ্বরের সমস্যা দূর করে।</li>
                </ul>
            </div>
        </div>
        <div class="button-container">
            <button>অর্ডার করতে ক্লিক করুন</button>
        </div>
    </div>
      </div>

<div class="section4">
 <div class="container4">
        <div class="header">
            <h1 contenteditable="true" >আমাদের উপর কেন আস্থা রাখবেন ??</h1>
        </div>
        <div class="content">
            <p contenteditable="true" >মূলানুসৃত শতভাগ হাইড্রোজেনিক মেইনটেইন করে, সম্পূর্ণ নিজস্ব তত্ত্বাবধানে প্রস্তুতকৃত প্রিমিয়াম সজিনা পাতা গুড়া</p>
            <p contenteditable="true" >প্রোডাক্ট হাতে পেয়ে, দেখে, কোয়ালিটি চেক করে পেমেন্ট করার সুবিধা ।</p>
            <p contenteditable="true" >সারা বাংলাদেশে কুরিয়ারের মাধ্যমে হোম ডেলিভারি পাবেন ।</p>
            <p contenteditable="true" >যে কোন সময় আমাদের সাথে যোগাযোগ করতে পারবেন ।</p>
            <p contenteditable="true" >অথবা এক টাকাও দিতে হবে না। ডেলিভারি ম্যান এর কাছ থেকে প্রোডাক্ট বুঝে পেয়ে তারপর টাকা দিবেন।</p>
        </div>
        <button class="button">অর্ডার করতে ক্লিক করুন</button>
    </div>
 </div>

<div class="section5">
<div class="container5">
        <h1 class="title" contenteditable="true" >এতকিছু থাকতে সজিনা পাতার গুড়া কেনা খাবেন ?</h1>
        <div class="grid">
            <div class="grid-item">
                <p contenteditable="true" >শরীরের সুগারের মাত্রা নিয়ন্ত্রণের মাধ্যমে ডায়াবেটিসের মত কঠিন রোগের বিরুদ্ধে কাজ করে থাকে।</p>
            </div>
            <div class="grid-item">
                <p contenteditable="true" >নিয়মিত সজিনার পাতা খেলে মুখে রুচি বাড়ে।</p>
            </div>
            <div class="grid-item">
                <p contenteditable="true" >লিভার ও কিডনি সুস্থ রাখতে সহায়তা করে।</p>
            </div>
            <div class="grid-item">
                <p contenteditable="true" >উচ্চ রক্ত চাপ নিয়ন্ত্রণে থাকে।</p>
            </div>
            <div class="grid-item">
                <p contenteditable="true" >শরীরে ময়েশ্চারের ছাপ সহজে পড়ে না।</p>
            </div>
            <div class="grid-item">
                <p contenteditable="true" >রোগ প্রতিরোধ ক্ষমতা বৃদ্ধি করে।</p>
            </div>
            <div class="grid-item">
                <p contenteditable="true" >ওজন কমানোর জন্য দারুণ সহায়ক হবে।</p>
            </div>
            <div class="grid-item">
                <p contenteditable="true" >জ্বর,কাশি ও ঠান্ডা জনিত সমস্যা দূর করে।</p>
            </div>
        </div>
        <button class="button">অর্ডার করতে ক্লিক করুন</button>
    </div>
    </div>

<div class="section6">
 <div class="container6">
        <h1 class="title" contenteditable="true" >মরিসা পাউডার প্রাইস</h1>
        <p class="subtitle" contenteditable="true" >সাশ্রয়ী দামে সেরা পণ্য</p>
        <div class="offer">
            <p contenteditable="true" >৫০০ গ্রাম মরিসা পাউডার এর পূর্ব মূল্যঃ ১২৫০ টাকা</p>
            <p class="highlight" contenteditable="true" >১০৫০ টাকার প্যাকেজটি ৮৫০ টাকা অফারটি সীমিত সময়ের জন্য</p>
        </div>
    </div>
</div>

</body>
</html>`
      },
      {
        _id:'5674567546',
        image: '/assets/page/36.webp',
        name: 'Beauty',
        link: '/assets/page/landing-page.html',
        theme: `<html lang="en">
 <head>
  <meta charset="utf-8"/>
  <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
  <title>
   Web Page Design
  </title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
  <style>
   body {

            font-family: Arial, sans-serif;
        }

        .section1 {
              background-image: url("/assets/page/bg.png");
                background-position: center;
                background-size: cover;
               background-repeat: no-repeat;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
            padding: 60px 0;
        }
        .section1 .container {
            text-align: center;
            max-width: 600px;
            width: 100%;
            padding: 20px;
            margin: 0 15px;
            border-radius: 40px;
            background-color: hsla(0, 0%, 100%, .08);
            box-shadow: 0 20px 20px 0 rgba(0, 0, 0, .1);
        }
        .section1 .header {
            background-color: #fff1b7;
            color: #cc0000;
            font-weight: bold;
            font-size: 22px;
            padding: 15px;
            border-radius: 10px 10px 0 0;
            border: 8px solid #ffcc00;
        }
        .section1 .content {
            padding: 20px;
        }
        .section1 .content p {
            color: #ffffff;
            margin-bottom: 20px;
        }
        .section1 .image-container {
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
        }
        .section1 .image-container img {
            width: 200px;
            height: auto;
        }
        .section1 .price {
            padding-left: 10px;
            color: #ffffff;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 17px;
            margin-bottom: 20px;
            border-radius: 16px 0;
            border-width: 1px;
            border-style: solid;
            border-color: rgb(242, 211, 53);
        }
        .section1 .price span {
            text-align: right;
            background-color: #cc0000;
            color: #ffffff;
            text-wrap: nowrap;
            display: flex;
            align-items: center;
            justify-content: center;
            padding:10px;
            height: 100%;
            border-radius: 0 0 16px;
        }
        .section1 .button {
            text-align: center;
            font-size: 20px;
            line-height: 45px;
            font-weight: 700;
            display: inline-block;
            width: auto;
            margin-top: 30px;
            box-shadow: rgba(0, 0, 0, 0.1) 0 20px 20px 0;
            background: linear-gradient(90deg, rgb(242, 211, 53) 0px, rgb(242, 211, 53) 51%, rgb(201, 172, 31)) 0% 0% / 200%;
            transition: 0.5s;
            padding: 5px 15px;
            border-radius: 10px;
            border-width: 3px;
            border-style: solid;
            border-color: rgb(242, 68, 29);
            border-image: initial;
        }

        .section3 {
            margin: 60px 0;
        }

        .section3{
            background-color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 60px 15px;
        }

        .section3 .header {
            background-color: #E6F4EA;
            border: 2px solid #38A169;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            margin-bottom: 24px;
        }
        .section3 .header h1 {
            color: #E53E3E;
            font-size: 1.25rem;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .section3 .header h1 i {
            margin: 0 8px;
        }
        .section3 .content {
            background-color: white;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
            width: 100%;
            max-width: 1024px;
        }
        .section3 .grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
        }
        @media (min-width: 768px) {
            .section3 .grid {
                grid-template-columns: 1fr 1fr;
            }
        }
        .section3 .grid div {
            border: 1px solid #E2E8F0;
            padding: 16px;
        }
        .section3 .button {
            background: linear-gradient(to right, #ffcc00, #ff9900);
            color: #ffffff;
            font-weight: bold;
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            margin-top: 24px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .section3 .button:hover {
            background: linear-gradient(to right, #ff9900, #ffcc00);
        }
        .section3 .footer {
            color: #E53E3E;
            text-align: center;
        }

        .section6 {
            margin: 60px 0;
        }

        .section6 .container {
            background-color: #1b5e20;
            color: white;
            border-radius: 10px;
            padding: 20px;
            width: 80%;
            margin: 0 auto;
            max-width: 800px;
        }
        .section6  .header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        .section6  .header i {
            color: #ff5722;
            margin-right: 10px;
        }
        .section6 .header h1 {
            font-size: 1.5rem;
            font-weight: bold;
        }
        .section6  .content {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
        }
        .section6  .content div {
            display: flex;
            align-items: start;
        }
        .section6  .content i {
            color: #4caf50;
            margin-right: 10px;
        }
        @media (min-width: 768px) {
            .section6 .content {
                grid-template-columns: 1fr 1fr;
            }
        }

        .section7{
            margin: 60px 0;
        }

        .section7 .offer-container {
            margin: 0 auto;
            background-color: #d1fae5;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 100%;
        }
        .section7 .offer-container p {
            color: #065f46;
            margin-bottom: 16px;
            font-size: 16px;
        }
        .section7 .offer-container .regular-price {
            color: #dc2626;
            font-size: 24px;
            font-weight: bold;
            text-decoration: line-through;
            margin-bottom: 8px;
        }
        .section7 .offer-container .offer-price {
            color: #065f46;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 16px;
        }
        .section7 .offer-container .contact-button {
            background-color: #f97316;
            color: white;
            padding: 10px 20px;
            border-radius: 9999px;
            font-size: 18px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
        }
        .section7 .offer-container .contact-button i {
            margin-right: 8px;
        }


        .section4 .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .section4 .video-section {
            margin-bottom: 20px;
        }
        .section4 .info-offer-section {
            background-color: #4CAF50;
            color: #FFD700;
            text-align: center;
            padding: 20px;
            border-radius: 10px;
            border: 4px solid #006400;
            margin-bottom: 20px;
        }
        .section4 .info-offer-section p {
            margin: 10px 0;
            font-size: 1.2em;
            font-weight: bold;
        }
        .section4 .offer-box {
            background-color: #C8E6C9;
            color: #2E7D32;
            padding: 20px;
            border-radius: 10px;
            border: 4px solid #4CAF50;
            display: inline-block;
        }
        .section4 .offer-box span {
            background-color: #FF5722;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            margin-left: 10px;
        }
        .section4 .order-button {
            text-align: center;
        }
        .section4 .order-button button {
            background-color: #FFEB3B;
            color: #D32F2F;
            font-size: 1.2em;
            font-weight: bold;
            padding: 10px 20px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
        }

  </style>
 </head>
 <body>
  <div class="section1">
    <div class="container">
        <div class="header">
         ঔষধ ছাড়া ন্যাচারালি গ্যাস্ট্রিক নিয়ন্ত্রণ করুন
        </div>
        <div class="content">
         <p>
          দীর্ঘ ১০বছর ইউরোপ এবং আমেরিকার চিকিৎসক দ্বারা পরিক্ষিত। এখন পর্যন্ত অনলাইনে প্রায় ৮০০০+ মানুষের এর মাধ্যমে উপকার হয়েছে।
         </p>
         <div class="image-container">
          <img alt="Two bottles of a health supplement with a red ribbon around them" height="300" src="https://storage.googleapis.com/a1aa/image/hGWOwM92DsOoO1L3YyFbyOR2XfXsgGkpv1jOMhTpUFg.jpg" width="200"/>
          <input class="ignore" type="file" accept="image/*" />
         </div>
         <div class="price">
          এখনি অর্ডার করলে পাচ্ছেন ১১০০ টাকার প্যাকেজ
          <span>
           এখন ৯৫০ টাকা
          </span>
         </div>
         <p>
          এই অফারটি গ্রহণ করুন গ্যরান্টি ১০০০ টাকার মধ্যে গ্যাস্ট্রিক থেকে মুক্তি
         </p>
         <button class="button">
          অর্ডার করতে ক্লিক করুন
         </button>
        </div>
       </div>
  </div>


  <div class="section3">
    <div class="header">
        <h1>
            <i class="fas fa-phone-alt"></i> কেন আপনি গ্যাস ক্লিয়ার পাউডার সেবন করবেন ? <i class="fas fa-phone-alt"></i>
        </h1>
    </div>
    <div class="content">
        <div class="grid">
            <div>
                <p>১০০% প্রাকৃতিক উপাদান গ্যাসট্রিক নিরাময়ে প্রাকৃতিক ভাবে ইনশাআল্লাহ</p>
            </div>
            <div>
                <p>এটি ফুল কোর্স আসা সেবন করায় গ্যাসট্রিক সমস্যার আর ফিরে আসার ভয় থাকে না।</p>
            </div>
            <div>
                <p>এটি গ্যাস ক্লিয়ার পাউডার, ল্যাবটেষ্ট করা, কোন প্রকার সাইড ইফেক্ট নেই। গ্যাসট্রিক, বুক জ্বালা, বমি, পেট ফাঁপা দূর করে।</p>
            </div>
            <div>
                <p>এটি সেবনে কোন পার্শ্বপ্রতিক্রিয়া নেই।</p>
            </div>
            <div>
                <p>এটি গ্যাস ক্লিয়ার পাউডার সেবনে গ্যাসট্রিক নিরাময়ে ক্ষতিগ্রস্ত কোষ পুনরায় তৈরি হয়।</p>
            </div>
            <div>
                <p>এটি পাকস্থলী এবং শরীরের অন্যান্য অঙ্গকে শক্তিশালী করে।</p>
            </div>
        </div>
    </div>
    <div class="button">
        অর্ডার করতে ক্লিক করুন <i class="fas fa-arrow-right"></i>
    </div>
    <p class="footer">
        উপাদান সমূহঃ আমলকি, হরিতকি, বহেড়া, সোনাপাতা, মেথি, শিমুল মূল, বিট লবন সহ ১০ টি ভেষজ উপাদান
    </p>
  </div>

  <div class="section4">
    <div class="container">
        <!-- Video Section -->
        <div class="video-section">
            <iframe id="video" class="w-full h-64 md:h-96" width="100%" height="400" src="https://www.youtube.com/embed/your-video-id" title="Funnel Liner Logo Launching Video | The First Automated E Commerce Sales Funnel in Bangladesh." frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

        </div>

        <!-- Info and Offer Section -->
        <div class="info-offer-section">
            <p><i class="fas fa-phone-alt"></i> আরও কোন প্রশ্ন থাকলে কল করুন</p>
            <div class="offer-box">
                <p>এখনি অর্ডার করলে পাচ্ছেন ১১০০ টাকার প্যাকেজ <span>মাত্র ৯৫০ টাকা</span></p>
            </div>
        </div>

        <!-- Order Button -->
        <div class="order-button">
            <button>অর্ডার করতে ক্লিক করুন</button>
        </div>
    </div>
  </div>

  <div class="section6">
    <div class="container">
        <div class="header">
            <i class="fas fa-fire"></i>
            <h1>কেনো আপনি গ্যাস ক্লিয়ার পাউডার সেবন করবেন ?</h1>
        </div>
        <div class="content">
            <div>
                <i class="fas fa-check"></i>
                <p>৩-৫ ঘন্টার ভিতরে গ্যাঁস-ফাঁপ থেকে মুক্তি পাবেন।</p>
            </div>
            <div>
                <i class="fas fa-check"></i>
                <p>খাওয়ার রুচি বাড়াবে।</p>
            </div>
            <div>
                <i class="fas fa-check"></i>
                <p>এটি পেটের এসিড নিয়ন্ত্রণ করে হজমশক্তি বৃদ্ধি করে।</p>
            </div>
            <div>
                <i class="fas fa-check"></i>
                <p>বমি বমি ভাব দূর হবে</p>
            </div>
        </div>
    </div>
  </div>

  <div class="section7">
    <div class="offer-container">
        <p>
            গ্যাস্ট্রিক-কের মত অসস্থিকর রোগ থেকে নিজে ও পরিবারকে মুক্ত রাখতে আজই অর্ডার করুন। প্রোডাক্ট হাতে পেয়ে মূল্য পরিশোধ করতে পারবেন। তাই নিশ্চিন্তে অর্ডার করতে পারেন।
        </p>
        <p class="regular-price">১ফাইল-রেগুলার মূল্য-৯৯০/-টাকা</p>
        <p class="offer-price">অফার মূল্য = ৮৫০/-টাকা (ডেলিভারী চার্জ ফ্রী)</p>
        <a href="tel:+8801894844452" class="contact-button">
            <i class="fas fa-phone-alt"></i> আরও কোন প্রশ্ন থাকলে কল করুনঃ +8801894844452
        </a>
    </div>
</div>
 </body>
</html>
`
      }
    ]
  }



  selectTheme(theme: any) {
    this.selectedTheme = theme;
    // console.log('Selected theme:', theme);
    this.dialogRef.close(this.selectedTheme); // Send back selected theme to parent
  }



  trackByFn(index: number, item: any): any {
    return item?._id || index;
  }
}
