import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const BlogSchema = new mongoose.Schema(
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
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    autoSlug: {
      type: Boolean,
      required: false,
    },
    images: {
      type: [String],
      required: false,
    },
    authorName: {
      type: String,
      required: false,
    },
    totalView: {
      type: Number,
      required: false,
      default: 0,
    },
    description: {
      type: String,
      required: false,
    },
    shortDesc: {
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

// Storefront read path (getAllBlogForUi): shop + publish, priority sort.
BlogSchema.index({ shop: 1, status: 1, priority: -1 });
