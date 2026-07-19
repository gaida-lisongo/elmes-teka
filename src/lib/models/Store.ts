import { Schema, model, models, type Model, type Types } from "mongoose";

export type StoreStatus = "PENDING_PAYMENT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type StoreAmountStatus = "PENDING" | "ACTIVE" | "CLOSED" | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED";
export type PaymentProvider = "FLEXPAY";

export interface IStorePayment {
  amount: number;
  currency: "USD" | "CDF";
  orderNumber: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  paidAt?: Date | null;
}

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
  tenantId: Types.ObjectId;
  designation: string;
  description: string;
  coordonnes: IStoreCoordinate[];
  capitals: IStoreAmount[];
  reference: string;
  caisses: IStoreAmount[];
  photos?: IStorePhoto[];
  status: StoreStatus;
  payment?: IStorePayment | null;
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

const StorePaymentSchema = new Schema<IStorePayment>(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      enum: ["USD", "CDF"],
      uppercase: true,
    },
    orderNumber: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ["FLEXPAY"],
      default: "FLEXPAY",
    },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const StoreSchema = new Schema<IStore>(
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
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },
    payment: {
      type: StorePaymentSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

StoreSchema.index({ tenantId: 1, designation: 1 });
StoreSchema.index({ tenantId: 1, status: 1 });
StoreSchema.index({ reference: 1, "payment.orderNumber": 1 });

const Store =
  (models.Store as Model<IStore>) || model<IStore>("Store", StoreSchema);

export default Store;
