import { Types } from "mongoose";

import AdvisorConversation from "@/lib/models/AdvisorConversation";
import connectToDb from "@/lib/utils/db";

export interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/** Conversations du tenant pour un exercice, sans le contenu des messages. */
export async function listConversations(tenantId: string, anneeId: string, limit = 30): Promise<ConversationSummary[]> {
  if (!Types.ObjectId.isValid(tenantId) || !Types.ObjectId.isValid(anneeId)) return [];
  await connectToDb();
  const rows = await AdvisorConversation.aggregate<{ _id: Types.ObjectId; title: string; messageCount: number; updatedAt: Date }>([
    { $match: { tenantId: new Types.ObjectId(tenantId), anneeId: new Types.ObjectId(anneeId) } },
    { $sort: { updatedAt: -1 } },
    { $limit: limit },
    { $project: { title: 1, updatedAt: 1, messageCount: { $size: "$messages" } } },
  ]);
  return rows.map((r) => ({
    id: r._id.toString(),
    title: r.title,
    messageCount: r.messageCount,
    updatedAt: new Date(r.updatedAt).toISOString(),
  }));
}

/** Messages d'une conversation, uniquement si elle appartient au tenant et à l'exercice. */
export async function loadConversation(
  tenantId: string,
  anneeId: string,
  conversationId: string,
): Promise<{ id: string; title: string; messages: ConversationMessage[] } | null> {
  if (![tenantId, anneeId, conversationId].every((id) => Types.ObjectId.isValid(id))) return null;
  await connectToDb();
  const conv = await AdvisorConversation.findOne({ _id: conversationId, tenantId, anneeId })
    .select("title messages")
    .lean();
  if (!conv) return null;
  return {
    id: conv._id.toString(),
    title: conv.title,
    messages: conv.messages.map((m) => ({
      role: m.role,
      content: m.content,
      createdAt: new Date(m.createdAt).toISOString(),
    })),
  };
}

/** Titre court tiré de la première question. */
export function conversationTitle(message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  return clean.length > 60 ? `${clean.slice(0, 57)}…` : clean;
}
