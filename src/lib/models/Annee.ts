import { Schema, model, models, type Model, type Types } from "mongoose";

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
}

export interface IAnnee {
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
  },
  { _id: false }
);

const AnneeSchema = new Schema<IAnnee>(
  {
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
