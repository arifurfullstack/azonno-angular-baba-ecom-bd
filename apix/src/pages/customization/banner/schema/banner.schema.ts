import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const BannerSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },

    title: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: false,
    },
    images: {
      type: [String],
      required: false,
    },
    url: {
      type: String,
      required: false,
    },
    urlType: {
      type: String,
      required: false,
    },
    showHome: {
      type: Boolean,
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

BannerSchema.index({ shop: 1, type: 1, status: 1 });

