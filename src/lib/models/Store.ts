import { Schema, model, models, type Model, type Types } from "mongoose";

export type StoreAmountStatus = "PENDING" | "ACTIVE" | "CLOSED" | "CANCELLED";

export interface IStoreCoordinate {
  title: string;
  content: string;
}

export interface IStoreAmount {
  anneeId: Types.ObjectId;
  amount: number;
  currency: string;
  status: StoreAmountStatus;
}

export interface IStorePhoto {
  title: string;
  url: string;
}

export interface IStore {
  designation: string;
  description: string;
  coordonnes: IStoreCoordinate[];
  capitals: IStoreAmount[];
  reference: string;
  caisses: IStoreAmount[];
  photos?: IStorePhoto[];
  createdAt: Date;
  updatedAt: Date;
}

const CoordinateSchema = new Schema<IStoreCoordinate>(
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
      maxlength: 1000,
    },
  },
  { _id: false }
);

const StoreAmountSchema = new Schema<IStoreAmount>(
  {
    anneeId: {
      type: Schema.Types.ObjectId,
      ref: "Annee",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: "CDF",
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "CLOSED", "CANCELLED"],
      default: "ACTIVE",
    },
  },
  { _id: true }
);

const StorePhotoSchema = new Schema<IStorePhoto>(
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

const StoreSchema = new Schema<IStore>(
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
    coordonnes: {
      type: [CoordinateSchema],
      default: [],
    },
    capitals: {
      type: [StoreAmountSchema],
      default: [],
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    caisses: {
      type: [StoreAmountSchema],
      default: [],
    },
    photos: {
      type: [StorePhotoSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

StoreSchema.index({ designation: 1 });

const Store =
  (models.Store as Model<IStore>) || model<IStore>("Store", StoreSchema);

export default Store;
