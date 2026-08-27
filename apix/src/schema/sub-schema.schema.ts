import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const ORDER_ITEM_SCHEMA = new mongoose.Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: false,
    },
    slug: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    phoneModel: {
      type: String,
      required: false,
    },
    purchaseType: {
      type: String,
      required: false,
    },
    salePrice: {
      type: Number,
      required: false,
    },
    regularPrice: {
      type: Number,
      required: false,
    },
    costPrice: {
      type: Number,
      required: false,
    },

    advancePayment: {
      type: Number,
      required: false,
      default: 0,
    },

    deliveryCharge: {
      insideCity: {
        type: Number,
        required: false,
        default: 0
      },
      outsideCity: {
        type: Number,
        required: false,
        default: 0
      },

    },
    quantity: {
      type: Number,
      required: true,
    },
    isReview: {
      type: Boolean,
      required: false,
    },
    variation: {
      _id: {
        type: String,
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
      option: {
        type: String,
        required: false,
      },
      image: {
        type: String,
        required: false,
      },
      sku: {
        type: String,
        required: false,
      },
    },

    category: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
      name: {
        type: String,
      },
      slug: {
        type: String,
      },
    },
    subCategory: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'SubCategory',
      },
      name: {
        type: String,
      },
      slug: {
        type: String,
      },
    },
    childCategory: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'ChildCategory',
      },
      name: {
        type: String,
      },
      slug: {
        type: String,
      },
    },

    brand: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Brand',
      },
      name: {
        type: String,
      },
      slug: {
        type: String,
      },
    },
    model: {
      type: String,
      required: false,
    },
  },
  {
    _id: true,
  },
);

export const PACKAGES_SCHEMA = new mongoose.Schema(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    shopName: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
    deleteDateString: {
      type: String,
      required: false,
    },

    deliveryDate: {
      type: Date,
      required: false,
    },
    paidAmount: {
      type: Number,
      required: false,
      default: 0,
    },
    subTotal: {
      type: Number,
      required: false,
    },

    discount: {
      type: Number,
      required: false,
    },
    deliveryCharge: {
      type: Number,
      required: false,
    },
    total: {
      type: Number,
      required: false,
    },
    commission: {
      type: Number,
      required: false,
    },

    orderItems: [ORDER_ITEM_SCHEMA],
    orderTimeline: {
      type: Object,
      required: false,
    },
    vendorPaymentStatus: {
      type: String,
      required: false,
    },
    preferableDate: {
      type: String,
      required: false,
    },
    preferableTime: {
      type: String,
      required: false,
    },
    paymentOptions: {
      type: String,
      required: false,
    },
  },
  {
    _id: true,
  },
);

export const VARIATION_LIST = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    sku: {
      type: String,
      required: false,
    },
    costPrice: {
      type: Number,
      required: false,
    },
    regularPrice: {
      type: Number,
      required: false,
    },
    salePrice: {
      type: Number,
      required: false,
    },
    discountType: {
      type: String,
      required: false,
    },
    discountAmount: {
      type: Number,
      required: false,
    },
    quantity: {
      type: Number,
      required: false,
      default: 0,
    },
    image: {
      type: String,
      required: false,
    },
  },
  {
    _id: true,
  },
);

export const SPECIFICATION = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    value: {
      type: String,
      required: false,
    },
  },
  {
    _id: false,
  },
);

export const USER_ADDRESS = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    phoneNo: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    division: {
      type: String,
      required: false,
    },
    area: {
      type: String,
      required: false,
    },
    zone: {
      type: String,
      required: false,
    },
    shippingAddress: {
      type: String,
      required: false,
    },
    addressType: {
      type: String,
      required: false,
    },
    isDefaultAddress: {
      type: Boolean,
      required: false,
    },
  },
  {
    _id: true,
  },
);

const THEME_SETTING_VALUE = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    note: {
      type: String,
      required: false,
    },
    isDefault: {
      type: Boolean,
      required: false,
    },
  },
  {
    _id: false,
  },
);

const PAGE_SETTING_VALUE = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    isLoginRequire: {
      type: Boolean,
      required: false,
    },
    isDefault: {
      type: Boolean,
      required: false,
    },
  },
  {
    _id: false,
  },
);

export const THEME_CUSTOM_OPTION = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: false,
    },
    selectType: {
      type: String,
      required: false,
    },
    value: [THEME_SETTING_VALUE],
  },
  {
    _id: false,
  },
);

export const THEME_PAGE_CUSTOM_OPTION = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: false,
    },
    value: [PAGE_SETTING_VALUE],
  },
  {
    _id: false,
  },
);

export const THEME_VIEW_SETTING = new mongoose.Schema(
  {
    type: {
      type: String,
      required: false,
    },
    value: [String],
  },
  {
    _id: false,
  },
);

export const PAGE_VIEW_SETTING = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: false,
    },
    isLoginRequire: {
      type: Boolean,
      required: false,
    },
  },
  {
    _id: false,
  },
);

export const PAYMENT_METHOD_SETTING = new mongoose.Schema(
  {
    providerName: {
      type: String,
      required: false,
    },
    providerType: {
      type: String,
      required: false,
    },
    accountNumber: {
      type: String,
      required: false,
    },
    paymentInstruction: {
      type: String,
      required: false,
    },
    binanceType: {
      type: String,
      required: false,
    },
    apiKey: {
      type: String,
      required: false,
    },
    secretKey: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: false,
    },
    production: {
      type: Boolean,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
  },
  {
    _id: false,
  },
);

export const ADVANCE_PAYMENT_SETTING = new mongoose.Schema(
  {
    providerName: {
      type: String,
      required: false,
    },
    minimumAmount: {
      type: Number,
      required: false,
    },
    advancePaymentAmount: {
      type: Number,
      required: false,
    },
    advancePaymentNote: {
      type: String,
      required: false,
    },
    division: {
      type: [String],
      required: false,
    },

    status: {
      type: String,
      required: false,
    },
  },
  {
    _id: false,
  },
);

export const SMS_METHOD_SETTING = new mongoose.Schema(
  {
    providerName: {
      type: String,
      required: false,
    },
    senderId: {
      type: String,
      required: false,
    },
    apiKey: {
      type: String,
      required: false,
    },
    secretKey: {
      type: String,
      required: false,
    },
    clientId: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
  },
  {
    _id: false,
  },
);

export const COURIER_METHOD_SETTING = new mongoose.Schema(
  {
    providerName: {
      type: String,
      required: false,
    },
    apiKey: {
      type: String,
      required: false,
    },
    secretKey: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: false,
    },
    password: {
      type: String,
      required: false,
    },
    storeId: {
      type: Number,
      required: false,
    },
    specialInstruction: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
  },
  {
    _id: false,
  },
);

export const DELIVERY_CHARGE_SETTING = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    insideCity: {
      type: Number,
      required: false,
    },
    outsideCity: {
      type: Number,
      required: false,
    },
    freeDeliveryMinAmount: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
    note: {
      type: String,
      required: false,
    },
    isAdvancePayment: {
      type: Boolean,
      required: false,
    },
  },
  {
    _id: false,
  },
);

export const SOCIAL_LOGIN_SETTING = new mongoose.Schema(
  {
    providerName: {
      type: String,
      required: false,
    },
    authId: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
  },
  {
    _id: false,
  },
);

export const OFFER_SETTING = new mongoose.Schema(
  {
    offerType: {
      type: String,
      required: false,
    },
    discount: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
  },
  {
    _id: false,
  },
);

export const CHAT_SETTING = new mongoose.Schema(
  {
    chatType: {
      type: String,
      required: false,
    },
    url: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
  },
  {
    _id: false,
  },
);

export const DOMAIN_SETTING = new mongoose.Schema(
  {
    domainType: {
      type: String,
      required: false,
    },
    domain: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
  },
  {
    _id: false,
  },
);

export const NOTE_LIST = new mongoose.Schema(
  {
    note: {
      type: String,
      required: false,
    },
  },
  {
    _id: true,
    versionKey: false,
    timestamps: true,
  },
);

export const STORAGE_SETTING_SCHEMA = new mongoose.Schema(
  {
    activeProvider: {
      type: String,
      enum: ['local', 'cloudinary', 'cloudflare_r2'],
      default: 'local',
      required: false,
    },
    cloudinary: {
      cloudName: { type: String, required: false },
      apiKey: { type: String, required: false },
      apiSecret: { type: String, required: false },
      folder: { type: String, required: false },
    },
    cloudflareR2: {
      accountId: { type: String, required: false },
      accessKeyId: { type: String, required: false },
      secretAccessKey: { type: String, required: false },
      bucketName: { type: String, required: false },
      publicDomain: { type: String, required: false },
    },
    local: {
      folderPath: { type: String, required: false },
    },
  },
  {
    _id: false,
  },
);

