import { Schema, model, models, type Model } from "mongoose";

/** Lien de connexion à usage unique envoyé par mail à l'administrateur de la plateforme. */
export interface IAdminMagicLink {
  tokenHash: string;
  email: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

const AdminMagicLinkSchema = new Schema<IAdminMagicLink>(
  {
    tokenHash: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

// Purge automatique des liens expirés
AdminMagicLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const AdminMagicLink =
  (models.AdminMagicLink as Model<IAdminMagicLink>) ||
  model<IAdminMagicLink>("AdminMagicLink", AdminMagicLinkSchema);

export default AdminMagicLink;
