import { Schema, model, models, type Model, type Types } from "mongoose";

export type FondsType = "APPORT" | "RETRAIT";
export type FondsStatus = "VALIDE" | "ANNULE";

export interface IFonds {
  tenantId: Types.ObjectId;
  shopId: Types.ObjectId;
  anneeId: Types.ObjectId;
  libelle: string;
  montant: number;
  currency: string;
  type: FondsType;
  reference: string;
  dateOperation: Date;
  status: FondsStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FondsSchema = new Schema<IFonds>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    anneeId: {
      type: Schema.Types.ObjectId,
      ref: "Annee",
      required: true,
      index: true,
    },
    libelle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    montant: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: "CDF",
    },
    type: {
      type: String,
      enum: ["APPORT", "RETRAIT"],
      required: true,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    dateOperation: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["VALIDE", "ANNULE"],
      default: "VALIDE",
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

FondsSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
FondsSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, createdAt: -1 });
FondsSchema.index({ anneeId: 1, shopId: 1, createdAt: -1 });
FondsSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, type: 1, status: 1 });

const Fonds =
  (models.Fonds as Model<IFonds>) ||
  model<IFonds>("Fonds", FondsSchema);

export default Fonds;
