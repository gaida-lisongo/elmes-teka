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
  qte: number;
}

export interface ICommande {
  commandes: ICommandeItem[];
  anneeId: Types.ObjectId;
  clientId: Types.ObjectId;
  currency: string;
  shopId: Types.ObjectId;
  promotionId?: Types.ObjectId | null;
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
    qte: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const CommandeSchema = new Schema<ICommande>(
  {
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
    promotionId: {
      type: Schema.Types.ObjectId,
      ref: "Promotion",
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

const Commande =
  (models.Commande as Model<ICommande>) ||
  model<ICommande>("Commande", CommandeSchema);

export default Commande;
