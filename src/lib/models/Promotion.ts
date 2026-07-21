import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IPromotionPhoto {
  title: string;
  url: string;
}

export interface IPromotionRecharge {
  orderNumber: string;
  credits: number;
  amount: number;
  currency: "USD";
  phone: string;
  status: "PENDING" | "PAID" | "FAILED";
  message: string;
  paidAt?: Date | null;
  createdAt: Date;
}

export interface IPromotion {
  tenantId: Types.ObjectId;
  designation: string;
  description: string;
  code: string;
  reduction: number;
  commandes: number;
  credits: number;
  recharges: IPromotionRecharge[];
  smsStats: { sent: number; failed: number; skipped: number; lastSentAt?: Date | null };
  photo?: IPromotionPhoto | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
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

const PromotionRechargeSchema = new Schema<IPromotionRecharge>(
  {
    orderNumber: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 30 },
    amount: { type: Number, required: true, min: 2 },
    currency: { type: String, enum: ["USD"], default: "USD" },
    phone: { type: String, required: true, trim: true },
    status: { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PENDING" },
    message: { type: String, default: "Paiement initie." },
    paidAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PromotionSchema = new Schema<IPromotion>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
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
    commandes: { type: Number, required: true, min: 1, default: 1 },
    credits: { type: Number, required: true, min: 0, default: 0 },
    recharges: { type: [PromotionRechargeSchema], default: [] },
    smsStats: {
      sent: { type: Number, min: 0, default: 0 },
      failed: { type: Number, min: 0, default: 0 },
      skipped: { type: Number, min: 0, default: 0 },
      lastSentAt: { type: Date, default: null },
    },
    photo: {
      type: PromotionPhotoSchema,
      default: null,
    },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "ARCHIVED"], default: "ACTIVE", index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

PromotionSchema.index({ designation: 1 });
PromotionSchema.index({ tenantId: 1, status: 1, designation: 1 });
PromotionSchema.index({ tenantId: 1, code: 1 }, { unique: true });
PromotionSchema.index({ tenantId: 1, "recharges.orderNumber": 1 });

const Promotion =
  (models.Promotion as Model<IPromotion>) ||
  model<IPromotion>("Promotion", PromotionSchema);

export default Promotion;
