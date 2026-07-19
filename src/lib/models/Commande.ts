import { Schema, model, models, type Model, type Types } from "mongoose";

export type CommandeStatus =
  | "DRAFT"
  | "PENDING"
  | "CONFIRMED"
  | "PAID"
  | "DELIVERED"
  | "CANCELLED";

export interface ICommandeItem {
  product: Types.ObjectId;
  designation: string;
  code?: string;
  qte: number;
  unitPrice: number;
  currency: "USD" | "CDF";
  reduction: number;
  total: number;
}

export interface ICommandePromotion {
  promotionId: Types.ObjectId;
  designation: string;
  code: string;
  reduction: number;
  discountAmount: number;
}

export interface ICommande {
  tenantId: Types.ObjectId;
  agentId: Types.ObjectId;
  commandes: ICommandeItem[];
  anneeId: Types.ObjectId;
  clientId: Types.ObjectId;
  currency: string;
  shopId: Types.ObjectId;
  promotion?: ICommandePromotion | null;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  invoice?: { generatedAt: Date } | null;
  status: CommandeStatus;
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommandeItemSchema = new Schema<ICommandeItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    designation: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    qte: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ["USD", "CDF"], required: true },
    reduction: { type: Number, default: 0, min: 0, max: 100 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const CommandeSchema = new Schema<ICommande>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: "Saler", required: true, index: true },
    commandes: {
      type: [CommandeItemSchema],
      required: true,
      validate: {
        validator: (items: ICommandeItem[]) => items.length > 0,
        message: "Une commande doit contenir au moins un produit.",
      },
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
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: "CDF",
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    promotion: {
      type: new Schema<ICommandePromotion>({
        promotionId: { type: Schema.Types.ObjectId, ref: "Promotion", required: true },
        designation: { type: String, required: true },
        code: { type: String, required: true },
        reduction: { type: Number, required: true, min: 0, max: 100 },
        discountAmount: { type: Number, required: true, min: 0 },
      }, { _id: false }),
      default: null,
    },
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    invoice: {
      type: new Schema({ generatedAt: { type: Date, required: true } }, { _id: false }),
      default: null,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "CONFIRMED", "PAID", "DELIVERED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
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

CommandeSchema.index({ shopId: 1, reference: 1 }, { unique: true });
CommandeSchema.index({ anneeId: 1, shopId: 1, createdAt: -1 });
CommandeSchema.index({ clientId: 1, createdAt: -1 });
CommandeSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, createdAt: -1 });
CommandeSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, status: 1, createdAt: -1 });
CommandeSchema.index({ tenantId: 1, "commandes.product": 1, status: 1 });
CommandeSchema.index({ tenantId: 1, clientId: 1, createdAt: -1 });
CommandeSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
CommandeSchema.index({ tenantId: 1, agentId: 1, createdAt: -1 });

const Commande =
  (models.Commande as Model<ICommande>) ||
  model<ICommande>("Commande", CommandeSchema);

export default Commande;
