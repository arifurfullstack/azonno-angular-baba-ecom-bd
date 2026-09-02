import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const TagSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      required: false,
    },
    endDate: {
      type: String,
      required: false,
    },
    startDate: {
      type: String,
      required: false,
    },
    isShow: {
      type: Boolean,
      required: false,
    },
    enableDate: {
      type: Boolean,
      required: false,
    },
    slug: {
      type: String,
      required: false,
    },
    priority: {
      type: Number,
      required: false,
      default: 0,
    },
    status: {
      type: String,
      required: false,
    },
    deleteDateString: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

// Storefront read path (getAllTagForUi): shop + publish + isShow, priority sort.
TagSchema.index({ shop: 1, status: 1, isShow: 1, priority: -1 });
