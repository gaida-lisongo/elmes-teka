import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IAnnee {
  tenantId: Types.ObjectId;
  debut: Date;
  fin: Date;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnneeSchema = new Schema<IAnnee>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    debut: {
      type: Date,
      required: true,
    },
    fin: {
      type: Date,
      required: true,
      validate: {
        validator(this: IAnnee, value: Date) {
          return !this.debut || value > this.debut;
        },
        message: "La date de fin doit être postérieure à la date de début.",
      },
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

AnneeSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
AnneeSchema.index({ tenantId: 1, debut: -1, fin: -1 });

const Annee =
  (models.Annee as Model<IAnnee>) || model<IAnnee>("Annee", AnneeSchema);

export default Annee;
