import { Schema, model, models, type Model, type Types } from "mongoose";

import type { Plan } from "@/lib/payments/plans";

export type AnneeStatus = "PENDING" | "ACTIVE" | "COMPLETED";
export type AnneeProviderStatus = "PENDING" | "PAID" | "FAILED";

export interface IAnneeProvider {
  name: "FLEXPAY";
  orderNumber?: string | null;
  message: string;
  status: AnneeProviderStatus;
  amount: number;
  currency: "USD" | "CDF";
  paidAt?: Date | null;
  /** Prix avant réduction */
  baseAmount?: number | null;
  discountPercent?: number;
  discountSource?: DiscountSource | null;
  promoCode?: string | null;
}

export type DiscountSource = "PROMO" | "FILLEUL" | "PARRAIN";

export interface IAnneeUpgrade {
  from?: Plan;
  target: Plan;
  amount: number;
  currency?: "USD";
  orderNumber: string | null;
  status: "PENDING" | "PAID" | "FAILED";
  reference: string;
  createdAt?: Date;
  paidAt?: Date | null;
  message?: string;
}

export interface IAnnee {
  plan: Plan;
  upgrade?: IAnneeUpgrade;
  upgradeHistory?: IAnneeUpgrade[];
  tenantId: Types.ObjectId;
  debut: Date;
  fin: Date;
  slug: string;
  status: AnneeStatus;
  provider: IAnneeProvider;
  createdAt: Date;
  updatedAt: Date;
}

const AnneeProviderSchema = new Schema<IAnneeProvider>(
  {
    name: { type: String, enum: ["FLEXPAY"], default: "FLEXPAY", required: true },
    orderNumber: { type: String, trim: true, default: null },
    message: { type: String, trim: true, default: "", maxlength: 1000 },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
      required: true,
    },
    amount: { type: Number, min: 0, required: true },
    currency: { type: String, enum: ["USD", "CDF"], required: true },
    paidAt: { type: Date, default: null },
    baseAmount: { type: Number, min: 0, default: null },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    discountSource: { type: String, enum: ["PROMO", "FILLEUL", "PARRAIN", null], default: null },
    promoCode: { type: String, trim: true, uppercase: true, default: null },
  },
  { _id: false }
);

const UpgradeSchema = new Schema<IAnneeUpgrade>({
  from: { type: String, enum: ["STARTER", "BUSINESS", "PREMIUM"] },
  target: { type: String, enum: ["BUSINESS", "PREMIUM"], required: true },
  amount: { type: Number, min: 0, required: true },
  currency: { type: String, enum: ["USD"], default: "USD" },
  orderNumber: { type: String, default: null },
  status: { type: String, enum: ["PENDING", "PAID", "FAILED"], default: "PENDING" },
  reference: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  paidAt: { type: Date, default: null },
  message: { type: String, default: "" },
}, { _id: false });

const AnneeSchema = new Schema<IAnnee>(
  {
    upgrade: { type: UpgradeSchema, default: undefined },
    upgradeHistory: { type: [UpgradeSchema], default: [] },
    plan: { type: String, enum: ["STARTER", "BUSINESS", "PREMIUM"], default: "STARTER" },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    debut: {
      type: Date,
      required: true,
    },
    fin: {
      type: Date,
      required: true,
      validate: {
        validator(value: Date) {
          const doc = this as IAnnee;
          return !doc.debut || value > doc.debut;
        },
        message: "La date de fin doit être postérieure à la date de début.",
      },
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "COMPLETED"],
      default: "PENDING",
      required: true,
      index: true,
    },
    provider: {
      type: AnneeProviderSchema,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AnneeSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
AnneeSchema.index({ tenantId: 1, debut: -1, fin: -1 });
AnneeSchema.index({ tenantId: 1, status: 1, debut: -1 });

const Annee =
  (models.Annee as Model<IAnnee>) || model<IAnnee>("Annee", AnneeSchema);

export default Annee;
