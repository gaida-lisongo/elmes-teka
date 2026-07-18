import { v4 as uuidv4 } from "uuid";
import { Schema, model, models, type Model, type Types } from "mongoose";

export interface ICustomer {
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
      unique: true,
      default: uuidv4,
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

CustomerSchema.index({ phone: 1 }, { unique: true });
CustomerSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } }
);

const Customer =
  (models.Customer as Model<ICustomer>) ||
  model<ICustomer>("Customer", CustomerSchema);

export default Customer;
