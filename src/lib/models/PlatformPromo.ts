import { Schema, model, models, type Model, type Types } from "mongoose";

/**
 * Code promo créé par l'administrateur de la plateforme (ex. conférence),
 * appliqué à l'abonnement annuel d'un exercice.
 */
export interface IPlatformPromo {
  code: string;
  label: string;
  reduction: number;
  startsAt: Date;
  endsAt: Date;
  /** Nombre maximal d'utilisations payées ; null = illimité */
  maxUses: number | null;
  uses: number;
  /** Affiché sur le site public */
  isPublic: boolean;
  status: "ACTIVE" | "INACTIVE";
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PlatformPromoDocument = IPlatformPromo & { _id: Types.ObjectId };

const PlatformPromoSchema = new Schema<IPlatformPromo>(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true, minlength: 3, maxlength: 30 },
    label: { type: String, required: true, trim: true, maxlength: 150 },
    reduction: { type: Number, required: true, min: 1, max: 100 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    maxUses: { type: Number, min: 1, default: null },
    uses: { type: Number, min: 0, default: 0 },
    isPublic: { type: Boolean, default: false },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    createdBy: { type: String, required: true, trim: true },
  },
  { timestamps: true, versionKey: false }
);

PlatformPromoSchema.index({ status: 1, isPublic: 1, endsAt: 1 });

const PlatformPromo =
  (models.PlatformPromo as Model<IPlatformPromo>) ||
  model<IPlatformPromo>("PlatformPromo", PlatformPromoSchema);

export default PlatformPromo;
