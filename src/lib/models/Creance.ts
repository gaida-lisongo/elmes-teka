import { Schema, model, models, type Model, type Types } from "mongoose";

export type CreanceStatus = "EN_COURS" | "RECOUVREE" | "CONTENTIEUX";

export interface ICreance {
  tenantId: Types.ObjectId;
  shopId: Types.ObjectId;
  anneeId: Types.ObjectId;
  clientId: Types.ObjectId;
  commandeId?: Types.ObjectId;
  montant: number;
  currency: string;
  dateEcheance: Date;
  dateCreation: Date;
  status: CreanceStatus;
  reference: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CreanceSchema = new Schema<ICreance>(
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
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    commandeId: {
      type: Schema.Types.ObjectId,
      ref: "Commande",
      default: null,
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
      enum: ["EN_COURS", "RECOUVREE", "CONTENTIEUX"],
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

CreanceSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
CreanceSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, createdAt: -1 });
CreanceSchema.index({ anneeId: 1, shopId: 1, createdAt: -1 });
CreanceSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, status: 1 });
CreanceSchema.index({ clientId: 1, createdAt: -1 });

const Creance =
  (models.Creance as Model<ICreance>) ||
  model<ICreance>("Creance", CreanceSchema);

export default Creance;
