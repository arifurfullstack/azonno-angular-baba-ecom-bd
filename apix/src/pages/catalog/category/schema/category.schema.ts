import * as mongoose from 'mongoose';
import { Schema } from 'mongoose';

export const CategorySchema = new mongoose.Schema(
  {
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },

    readOnly: {
      type: Boolean,
      required: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: false,
    },
    images: {
      type: [String],
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    featureImage: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    deleteDateString: {
      type: String,
      required: false,
    },
    serial: {
      type: Number,
      required: false,
    },
    commission: {
      type: Number,
      required: false,
    },
    // featureStatus: {
    //   type: Boolean,
    //   required: false,
    // },

    menuStatus: {
      type: Boolean,
      required: false,
    },
    priority: {
      type: Number,
      required: false,
      default: 0,
    },
    categoryProducts: {
      type: Number,
      required: false,
      default: 0,
    },
    status: {
      type: String,
      required: false,
      default: 'publish',
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

CategorySchema.index({ shop: 1, status: 1, priority: 1, serial: 1 });
CategorySchema.index({ shop: 1, slug: 1 });

