import {
  Schema,
  model,
  models,
  type HydratedDocument,
  type Model,
  type Types,
} from "mongoose";

/* =========================================================
   TYPES ET ENUMS
========================================================= */

export type AccountStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "INACTIVE";

export type TenantType =
  | "INDIVIDUAL"
  | "COMPANY"
  | "ORGANIZATION";

export interface IUser {
  pseudo: string;
  telephone: string;
  boutique?: Types.ObjectId | null;
  email: string;
  secure: string;
  matricule: string;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITenantDescription {
  title: string;
  content: string;
}

export interface ITenantDocument {
  title: string;
  url: string;
}

export interface ITenant {
  userId: Types.ObjectId;
  storesId: Types.ObjectId[];
  apiKey: string;
  apiSecret: string;
  slug: string;
  designation: string;
  logo?: string | null;
  description: ITenantDescription[];
  status: AccountStatus;
  type: TenantType;
  documents: ITenantDocument[];
  email: string;
  telephone: string;
  nRef: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISaler {
  userId: Types.ObjectId;
  storeId: Types.ObjectId;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;
export type TenantDocument = HydratedDocument<ITenant>;
export type SalerDocument = HydratedDocument<ISaler>;

/* =========================================================
   SOUS-SCHÉMAS TENANT
========================================================= */

const TenantDescriptionSchema = new Schema<ITenantDescription>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
  },
  {
    _id: false,
  }
);

const TenantDocumentSchema = new Schema<ITenantDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   USER
========================================================= */

const UserSchema = new Schema<IUser>(
  {
    pseudo: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    telephone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    boutique: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      default: null,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    /*
     * Contient uniquement le hash du mot de passe :
     * scrypt$sel$hash
     */
    secure: {
      type: String,
      required: true,
      select: false,
    },

    matricule: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
 * L'index unique normalisé évite deux utilisateurs
 * ayant la même adresse e-mail.
 */
UserSchema.index(
  { email: 1 },
  {
    unique: true,
    collation: {
      locale: "en",
      strength: 2,
    },
  }
);

UserSchema.index({ telephone: 1 }, { unique: true });

/*
 * Empêche le hash du mot de passe d'être envoyé
 * accidentellement lors d'une sérialisation.
 */
UserSchema.set("toJSON", {
  transform(_document, returnedObject) {
    delete returnedObject.secure;
    return returnedObject;
  },
});

UserSchema.set("toObject", {
  transform(_document, returnedObject) {
    delete returnedObject.secure;
    return returnedObject;
  },
});

/* =========================================================
   TENANT
========================================================= */

const TenantSchema = new Schema<ITenant>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    storesId: [
      {
        type: Schema.Types.ObjectId,
        ref: "Store",
      },
    ],

    apiKey: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    apiSecret: {
      type: String,
      required: true,
      select: false,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    logo: {
      type: String,
      default: null,
      trim: true,
    },

    description: {
      type: [TenantDescriptionSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },

    type: {
      type: String,
      enum: ["INDIVIDUAL", "COMPANY", "ORGANIZATION"],
      default: "COMPANY",
    },

    documents: {
      type: [TenantDocumentSchema],
      default: [],
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    telephone: {
      type: String,
      required: true,
      trim: true,
    },

    nRef: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* =========================================================
   SALER
========================================================= */

const SalerSchema = new Schema<ISaler>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/*
 * Recherche rapide de tous les vendeurs actifs d'une boutique.
 */
SalerSchema.index({
  storeId: 1,
  status: 1,
});

/* =========================================================
   EXPORT DES MODÈLES
========================================================= */

export const User =
  (models.User as Model<IUser>) ||
  model<IUser>("User", UserSchema);

export const Tenant =
  (models.Tenant as Model<ITenant>) ||
  model<ITenant>("Tenant", TenantSchema);

export const Saler =
  (models.Saler as Model<ISaler>) ||
  model<ISaler>("Saler", SalerSchema);