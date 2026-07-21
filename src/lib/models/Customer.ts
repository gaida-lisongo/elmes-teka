import { v4 as uuidv4 } from "uuid";
import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ICustomer {
  tenantId: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  matricule: string;
  promotions?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    matricule: {
      type: String,
      required: true,
      default: () => uuidv4(),
      index: true,
    },
    promotions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Promotion",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

CustomerSchema.index({ tenantId: 1, phone: 1 }, { unique: true });
CustomerSchema.index({ tenantId: 1, matricule: 1 }, { unique: true });
CustomerSchema.index({ tenantId: 1, name: 1 });
CustomerSchema.index(
  { email: 1 },
  { partialFilterExpression: { email: { $type: "string" } } }
);

const Customer =
  (models.Customer as Model<ICustomer>) ||
  model<ICustomer>("Customer", CustomerSchema);

export default Customer;
