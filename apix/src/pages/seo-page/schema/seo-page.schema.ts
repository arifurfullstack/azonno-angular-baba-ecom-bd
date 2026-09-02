import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const SeoPageSchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    seoTitle: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: false,
    },
    seoDescription: {
      type: String,
      required: false,
    },
    seoKeyword: {
      type: String,
      required: false,
    },
    images: {
      type: [String],
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
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

// Storefront read path (getAllSeoPageForUi): shop + status/type filter.
SeoPageSchema.index({ shop: 1, status: 1, type: 1 });
