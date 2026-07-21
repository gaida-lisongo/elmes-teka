import { Schema, model, models, type Model, type Types } from "mongoose";

export type StockStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "CANCELLED";

export interface IStockItem {
  product: Types.ObjectId;
  qte: number;
}

export interface IStock {
  stocks: IStockItem[];
  anneeId: Types.ObjectId;
  shopId: Types.ObjectId;
  designation?: string;
  description?: string;
  status: StockStatus;
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockItemSchema = new Schema<IStockItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    qte: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const StockSchema = new Schema<IStock>(
  {
    stocks: {
      type: [StockItemSchema],
      required: true,
      default: [],
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
    designation: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "CLOSED", "CANCELLED"],
      default: "ACTIVE",
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

StockSchema.index({ shopId: 1, reference: 1 }, { unique: true });
StockSchema.index({ anneeId: 1, shopId: 1, status: 1 });

const Stock =
  (models.Stock as Model<IStock>) || model<IStock>("Stock", StockSchema);

export default Stock;
