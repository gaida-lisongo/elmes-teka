import { Schema, model, models, type Model, type Types } from "mongoose";

export type ProductStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface IProductPhoto {
  title: string;
  url: string;
}

export interface IProductPrice {
  amount: number;
  currency: string;
}

export interface IProductDescription {
  title: string;
  content: string;
}

export interface IProduct {
  tenantId: Types.ObjectId;
  designation: string;
  categorie: string;
  photos?: IProductPhoto[];
  price: IProductPrice[];
  code: string;
  description?: IProductDescription[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ProductPhotoSchema = new Schema<IProductPhoto>(
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

const ProductPriceSchema = new Schema<IProductPrice>(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
  },
  { _id: false }
);

const ProductDescriptionSchema = new Schema<IProductDescription>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
      index: true,
    },
    categorie: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
      index: true,
    },
    photos: {
      type: [ProductPhotoSchema],
      default: [],
    },
    price: {
      type: [ProductPriceSchema],
      required: true,
      validate: {
        validator: (prices: IProductPrice[]) => prices.length > 0,
        message: "Un produit doit avoir au moins un prix.",
      },
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: [ProductDescriptionSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ProductSchema.index({ categorie: 1, status: 1 });
ProductSchema.index({ tenantId: 1, status: 1 });
ProductSchema.index({ tenantId: 1, designation: 1 });
ProductSchema.index({ tenantId: 1, code: 1 }, { unique: true });

const Product =
  (models.Product as Model<IProduct>) || model<IProduct>("Product", ProductSchema);

export default Product;
