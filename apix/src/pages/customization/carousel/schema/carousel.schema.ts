import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const CarouselSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
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
    priority: {
      type: Number,
      required: false,
      default: 0,
    },
    status: {
      type: String,
      required: false,
      index: true,
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

// Storefront read path (getAllCarouselForUi): shop + publish, top-5 priority ASC.
CarouselSchema.index({ shop: 1, status: 1, priority: 1 });
