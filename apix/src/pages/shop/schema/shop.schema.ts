import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { NOTE_LIST } from '../../../schema/sub-schema.schema';

export const ShopSchema = new mongoose.Schema(
  {
    websiteName: {
      type: String,
      required: true,
      trim: true,
    },
    domainType: {
      type: String,
      required: false,
    },
    domain: {
      type: String,
      required: false,
    },
    themeColor: {
      primary: {
        type: String,
        required: false,
      },
      secondary: {
        type: String,
        required: false,
      },
      tertiary: {
        type: String,
        required: false,
      },
    },
    isSsr: {
      type: Boolean,
      required: false,
    },
    port: {
      type: Number,
      required: false,
    },
    affiliateAccess: {
      type: Boolean,
      required: false,
      default: true,
    },
    isTrailPrice: {
      type: Boolean,
      required: false,
      default: false,
    },
    package: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Package',
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
    },
    category: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'ThemeCategory',
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
      slug: {
        type: String,
        required: false,
      },
    },
    subCategory: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'ThemeSubCategory',
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
      slug: {
        type: String,
        required: false,
      },
    },
    theme: {
      _id: {
        type: Schema.Types.ObjectId,
        ref: 'Theme',
        required: false,
      },
      name: {
        type: String,
        required: false,
      },
      images: {
        type: [String],
        required: false,
      },
      category: {
        _id: {
          type: Schema.Types.ObjectId,
          ref: 'ThemeCategory',
          required: false,
        },
        name: {
          type: String,
          required: false,
        },
        slug: {
          type: String,
          required: false,
        },
      },
      subCategory: {
        _id: {
          type: Schema.Types.ObjectId,
          ref: 'ThemeSubCategory',
          required: false,
        },
        name: {
          type: String,
          required: false,
        },
        slug: {
          type: String,
          required: false,
        },
      },
      version: {
        type: String,
        required: false,
      },
    },
    dateString: {
      type: String,
      required: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
    },
    users: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          ref: 'Vendor',
          required: false,
        },
        username: {
          type: String,
          required: false,
        },
        email: {
          type: String,
          required: false,
        },
        phoneNo: {
          type: String,
          required: false,
        },
        role: {
          type: String,
          required: false,
        },
      },
    ],
    buildStatus: {
      type: String,
      required: false,
    },
    shopType: {
      type: String,
      required: false,
    },
    registeredBy: {
      type: String,
      required: false,
      default: 'self',
    },
    trialPeriod: {
      type: Number,
      required: false,
      default: 0,
    },
    updateStatus: {
      type: String,
      required: false,
    },
    paymentStatus: {
      type: String,
      required: false,
    },
    paymentRefId: {
      type: String,
      required: false,
    },
    paymentMethod: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
    serverIp: {
      type: String,
      required: false,
    },
    deleteDateString: {
      type: String,
      required: false,
    },
    startDate: {
      type: String,
      required: false,
    },
    inactiveDate: {
      type: String,
      required: false,
    },

    clientNotes: {
      type: [NOTE_LIST],
      required: false,
    },
    affiliateId: {
      type: String,
      required: false,
    },
    affiliateProductId: {
      type: String,
      required: false,
    },
    todayFraudCheckCount: {
      type: Number,
      required: false,
    },
    fraudCheckDate: {
      type: String,
      required: false,
    },

    // Payment settings
    paymentInstructions: {
      type: String,
      required: false,
    },
    minWithdrawAmount: {
      type: Number,
      required: false,
      default: 0
    },

    country: {
      name: {
        type: String,
        required: false,
      },
      code: {
        type: String,
        required: false,
      },
    },

    customServer: {
      ui: {
        type: Boolean,
        required: false,
      },
      admin: {
        type: Boolean,
        required: false,
      },
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

ShopSchema.index({ domain: 1 });
ShopSchema.index({ subDomain: 1 });

