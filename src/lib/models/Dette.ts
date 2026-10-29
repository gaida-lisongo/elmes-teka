import { Schema, model, models, type Model, type Types } from "mongoose";

export type DetteStatus = "EN_COURS" | "REMBOURSEE" | "LITIGIEUSE";

export interface IDette {
  tenantId: Types.ObjectId;
  shopId: Types.ObjectId;
  anneeId: Types.ObjectId;
  fournisseurNom: string;
  fournisseurTel?: string;
  designation: string;
  montant: number;
  currency: string;
  dateEcheance: Date;
  dateCreation: Date;
  status: DetteStatus;
  reference: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DetteSchema = new Schema<IDette>(
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
    fournisseurNom: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    fournisseurTel: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },
    designation: {
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
    dateEcheance: {
      type: Date,
      required: true,
    },
    dateCreation: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    status: {
      type: String,
      enum: ["EN_COURS", "REMBOURSEE", "LITIGIEUSE"],
      default: "EN_COURS",
      index: true,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
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

DetteSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
DetteSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, createdAt: -1 });
DetteSchema.index({ anneeId: 1, shopId: 1, createdAt: -1 });
DetteSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, status: 1 });

const Dette =
  (models.Dette as Model<IDette>) ||
  model<IDette>("Dette", DetteSchema);

export default Dette;
