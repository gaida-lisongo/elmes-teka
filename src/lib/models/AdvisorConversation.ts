import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IAdvisorMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface IAdvisorConversation {
  tenantId: Types.ObjectId;
  anneeId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  messages: IAdvisorMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const AdvisorMessageSchema = new Schema<IAdvisorMessage>(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 20000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

/** Conversation du Conseiller IA, propre à un tenant et à un exercice. */
const AdvisorConversationSchema = new Schema<IAdvisorConversation>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: true },
    anneeId: { type: Schema.Types.ObjectId, ref: "Annee", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    messages: { type: [AdvisorMessageSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
);

// Liste des conversations d'un exercice, les plus récentes d'abord
AdvisorConversationSchema.index({ tenantId: 1, anneeId: 1, updatedAt: -1 });

const AdvisorConversation =
  (models.AdvisorConversation as Model<IAdvisorConversation>) ||
  model<IAdvisorConversation>("AdvisorConversation", AdvisorConversationSchema);

export default AdvisorConversation;
