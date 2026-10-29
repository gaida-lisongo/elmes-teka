import { Schema, model, models, type Model, type Types } from "mongoose";

export type LiquiditeType = "ENTREE" | "SORTIE";
export type LiquiditeStatus = "VALIDE" | "ANNULE";

export interface ILiquidite {
  tenantId: Types.ObjectId;
  shopId: Types.ObjectId;
  anneeId: Types.ObjectId;
  agentId: Types.ObjectId;
  libelle: string;
  montant: number;
  currency: string;
  type: LiquiditeType;
  reference: string;
  dateOperation: Date;
  status: LiquiditeStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LiquiditeSchema = new Schema<ILiquidite>(
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
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
      enum: ["ENTREE", "SORTIE"],
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

LiquiditeSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
LiquiditeSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, createdAt: -1 });
LiquiditeSchema.index({ anneeId: 1, shopId: 1, createdAt: -1 });
LiquiditeSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, type: 1, status: 1 });

const Liquidite =
  (models.Liquidite as Model<ILiquidite>) ||
  model<ILiquidite>("Liquidite", LiquiditeSchema);

export default Liquidite;
