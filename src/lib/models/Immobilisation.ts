import { Schema, model, models, type Model, type Types } from "mongoose";

export type ImmobilisationCategorie =
  | "MOBILIER"
  | "MATERIEL"
  | "VEHICULE"
  | "IMMEUBLE"
  | "AUTRE";

export type ImmobilisationStatus = "ACTIF" | "CEDE" | "AMORTI";

export interface IImmobilisation {
  tenantId: Types.ObjectId;
  shopId: Types.ObjectId;
  anneeId: Types.ObjectId;
  agentId: Types.ObjectId;
  designation: string;
  categorie: ImmobilisationCategorie;
  valeurAchat: number;
  dureeVieAns: number;
  dateAcquisition: Date;
  reference: string;
  status: ImmobilisationStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ImmobilisationSchema = new Schema<IImmobilisation>(
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
    designation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
    categorie: {
      type: String,
      enum: ["MOBILIER", "MATERIEL", "VEHICULE", "IMMEUBLE", "AUTRE"],
      required: true,
    },
    valeurAchat: {
      type: Number,
      required: true,
      min: 0,
    },
    dureeVieAns: {
      type: Number,
      required: true,
      min: 1,
    },
    dateAcquisition: {
      type: Date,
      required: true,
    },
    reference: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["ACTIF", "CEDE", "AMORTI"],
      default: "ACTIF",
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

ImmobilisationSchema.index({ tenantId: 1, reference: 1 }, { unique: true });
ImmobilisationSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, createdAt: -1 });
ImmobilisationSchema.index({ anneeId: 1, shopId: 1, createdAt: -1 });
ImmobilisationSchema.index({ tenantId: 1, shopId: 1, anneeId: 1, status: 1 });

const Immobilisation =
  (models.Immobilisation as Model<IImmobilisation>) ||
  model<IImmobilisation>("Immobilisation", ImmobilisationSchema);

export default Immobilisation;
