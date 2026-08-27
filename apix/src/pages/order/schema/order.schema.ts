import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';
import { NOTE_LIST, ORDER_ITEM_SCHEMA } from '../../../schema/sub-schema.schema';

export const OrderSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    isAdvancePayment: {
      type: Boolean,
      required: false,
      default: false,
    },
    carts: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Carts',
          required: false,
        },
      ],
    },
    name: {
      type: String,
      required: false,
    },
    phoneNo: {
      type: String,
      required: false,
    },
    email: {
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
    note: {
      type: String,
      required: false,
    },
    zone: {
      type: String,
      required: false,
    },
    addressType: {
      type: String,
      required: false,
    },
    shippingAddress: {
      type: String,
      required: false,
    },

    userIpAddress: {
      type: String,
      required: false,
    },

    previousOrderCount: {
      type: Number,
      required: false,
      default: 0,
    },

    providerName: {
      type: String,
      required: false,
    },
    providerType: {
      type: String,
      required: false,
    },

    month: {
      type: Number,
      default: 0,
    },
    year: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      required: false,
    },
    advancePaymentStatus: {
      type: String,
      required: false,
    },
    paymentType: {
      type: String,
      required: false,
    },
    orderStatus: {
      type: String,
      required: false,
    },
    trashDate: {
      type: String,
      required: false,
    },
    subTotal: {
      type: Number,
      required: false,
    },
    discount: {
      type: Number,
      required: false,
    },
    grandTotal: {
      type: Number,
      required: false,
    },

    orderFrom: {
      type: String,
      required: false,
    },

    deliveryCharge: {
      type: Number,
      required: false,
    },

    offerDiscount: {
      amount: {
        type: Number,
        required: false,
        default: 0,
      },
      offerType: {
        type: String,
        required: false,
      },
    },

    paymentMethod: {
      type: String,
      required: false,
    },
    paymentApiType: {
      type: String,
      required: false,
    },
    paymentRefId: {
      type: String,
      required: false,
    },
    paymentApiTrxID: {
      type: String,
      required: false,
    },
    paidAmount: {
      type: Number,
      required: false,
    },
    coupon: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      required: false,
    },
    couponDiscount: {
      type: Number,
      required: false,
    },

    advancePayment: {
      type: Number,
      required: false,
    },
    // productDiscount: {
    //   type: Number,
    //   required: false,
    // },
    checkoutDate: {
      type: String,
      required: false,
    },
    checkoutTime: {
      type: String,
      required: false,
    },
    deliveryNote: {
      type: String,
      required: false,
    },
    postCode: {
      type: String,
      required: false,
    },
    unitCode: {
      type: String,
      required: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

    orderedItems: [ORDER_ITEM_SCHEMA],

    orderedFrom: {
      type: String,
      required: false,
    },
    customerNotes: {
      type: [NOTE_LIST],
      required: false,
    },
    cancelReason: {
      type: String,
      required: false,
    },
    deliveryType: {
      type: String,
      required: false,
    },
    deliveryDate: {
      type: String,
      required: false,
    },
    deliveryTime: {
      type: String,
      required: false,
    },
    orderTimeline: {
      pending: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      confirmed: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      onHold: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      processing: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      shipped: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      delivered: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      cancelled: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      returned: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
      refunded: {
        date: {
          type: String,
        },
        time: {
          type: String,
        },
      },
    },
    courierData: {
      providerName: {
        type: String,
        required: false,
      },
      consignmentId: {
        type: String,
        required: false,
      },
      trackingId: {
        type: String,
        required: false,
      },
      createdAt: {
        type: String,
        required: false,
      },
    },
    orderType: {
      type: String,
      required: false,
    },

    shopNotes: {
      type: [NOTE_LIST],
      required: false,
    },
    status: {
      type: String,
      required: false,
    },
    adjustProductQuantity: {
      type: Boolean,
      required: false,
    },
    // status: {
    //   type: String,
    //   required: false,
    // },
    deleteDateString: {
      type: String,
      required: false,
    },
    additionalDiscount: {
      type: Number,
      required: false,
      default: 0,
    },
    customerPaymentNo: {
      type: String,
      required: false,
    },
    paymentTransactionId: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

// Indexes for production performance
OrderSchema.index({ shop: 1, status: 1, createdAt: -1 });
OrderSchema.index({ shop: 1, orderId: 1 });
OrderSchema.index({ shop: 1, 'user._id': 1, createdAt: -1 });
