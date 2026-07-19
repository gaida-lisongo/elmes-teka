import { Schema, model, models, type Model, type Types } from "mongoose";

export type SupplyRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface ISupplyRequest {
  tenantId: Types.ObjectId;
  anneeId: Types.ObjectId;
  shopId: Types.ObjectId;
  agentId: Types.ObjectId;
  products: Array<{ product: Types.ObjectId; qte: number }>;
  reference: string;
  designation?: string;
  description?: string;
  status: SupplyRequestStatus;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SupplyRequestSchema = new Schema<ISupplyRequest>({
  tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
  anneeId: { type: Schema.Types.ObjectId, ref: "Annee", required: true, index: true },
  shopId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  agentId: { type: Schema.Types.ObjectId, ref: "Saler", required: true, index: true },
  products: {
    type: [{
      product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
      qte: { type: Number, required: true, min: 1 },
    }],
    required: true,
    validate: { validator: (items: ISupplyRequest["products"]) => items.length > 0, message: "Produits requis." },
  },
  reference: { type: String, required: true, uppercase: true, trim: true },
  designation: { type: String, trim: true, maxlength: 250 },
  description: { type: String, trim: true, maxlength: 5000 },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"], default: "PENDING", index: true },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "Tenant", default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

SupplyRequestSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, status: 1, createdAt: -1 });
SupplyRequestSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
SupplyRequestSchema.index({ tenantId: 1, agentId: 1, createdAt: -1 });

const SupplyRequest = (models.SupplyRequest as Model<ISupplyRequest>) ||
  model<ISupplyRequest>("SupplyRequest", SupplyRequestSchema);

export default SupplyRequest;
