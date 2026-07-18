import { Schema, model, models, type Model } from "mongoose";

export interface IPromotionPhoto {
  title: string;
  url: string;
}

export interface IPromotion {
  designation: string;
  description: string;
  code: string;
  reduction: number;
  photo?: IPromotionPhoto | null;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionPhotoSchema = new Schema<IPromotionPhoto>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const PromotionSchema = new Schema<IPromotion>(
  {
    designation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    reduction: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    photo: {
      type: PromotionPhotoSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

PromotionSchema.index({ designation: 1 });

const Promotion =
  (models.Promotion as Model<IPromotion>) ||
  model<IPromotion>("Promotion", PromotionSchema);

export default Promotion;
