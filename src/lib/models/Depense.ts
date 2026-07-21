import { Schema, model, models, type Model, type Types } from "mongoose";

export type DepenseItemStatus = "PENDING" | "APPROVED" | "PAID" | "REJECTED";

export interface IDepenseItem {
  libelle: string;
  amount: number;
  status: DepenseItemStatus;
  observation?: string;
}

export interface IDepense {
  tenantId: Types.ObjectId;
  depenses: IDepenseItem[];
  anneeId: Types.ObjectId;
  shopId: Types.ObjectId;
  agentId: Types.ObjectId;
  currency: "USD" | "CDF";
  totalAmount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepenseItemSchema = new Schema<IDepenseItem>(
  {
    libelle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "PAID", "REJECTED"],
      default: "PENDING",
    },
    observation: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  { _id: true }
);

const DepenseSchema = new Schema<IDepense>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    depenses: {
      type: [DepenseItemSchema],
      required: true,
      validate: {
        validator: (items: IDepenseItem[]) => items.length > 0,
        message: "Une dépense doit contenir au moins une ligne.",
      },
    },
    anneeId: {
      type: Schema.Types.ObjectId,
      ref: "Annee",
      required: true,
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    currency: { type: String, enum: ["USD", "CDF"], required: true, uppercase: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"], default: "PENDING", index: true },
    reference: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

DepenseSchema.index({ shopId: 1, reference: 1 }, { unique: true });
DepenseSchema.index({ anneeId: 1, shopId: 1, createdAt: -1 });
DepenseSchema.index({ agentId: 1, createdAt: -1 });
DepenseSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, createdAt: -1 });
DepenseSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, status: 1, createdAt: -1 });
DepenseSchema.index({ tenantId: 1, reference: 1 }, { unique: true });

const Depense =
  (models.Depense as Model<IDepense>) || model<IDepense>("Depense", DepenseSchema);

export default Depense;
