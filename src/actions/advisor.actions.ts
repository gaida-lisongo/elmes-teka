"use server";

import { Types } from "mongoose";

import { getTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import { callLLM } from "@/lib/ai/llm-client";
import { buildBusinessContext, formatContextForPrompt } from "@/lib/ai/context-builder";
import AdvisorConversation from "@/lib/models/AdvisorConversation";
import {
  conversationTitle,
  loadConversation,
  type ConversationMessage,
  type ConversationSummary,
} from "@/lib/ai/conversations";
import { deductCredits } from "./credits.actions";
import type { ActionResponse } from "./annees.actions";

const SYSTEM_CONSEILLER = `Tu es ELMES Conseiller, l'assistant de gestion commerciale d'ELMES-TEKA pour les entrepreneurs congolais (RDC).
Règles strictes :
- Appuie-toi UNIQUEMENT sur les données chiffrées fournies dans le contexte. N'invente jamais de chiffre, de client, de produit ni de pourcentage.
- Si une donnée manque pour répondre, dis-le simplement et indique quelle page d'ELMES-TEKA permet de la compléter.
- Monnaies : FC (francs congolais) et USD. Pas d'euros.
- Réponds en français simple, sans jargon, en moins de 250 mots.
- Mise en forme Markdown légère : un titre court (###) si utile, des listes à puces, du gras pour les chiffres clés. Un tableau seulement s'il compare au moins trois lignes réelles.`;

export interface Recommendation {
  titre: string;
  action: string;
  impact: string;
  priorite: "haute" | "moyenne" | "basse";
}

function parseRecommendations(raw: string): Recommendation[] {
  const jsonText = raw.match(/\[[\s\S]*\]/)?.[0];
  if (jsonText) {
    try {
      const parsed = JSON.parse(jsonText) as Array<Partial<Recommendation>>;
      const recos = parsed
        .filter((r) => r && typeof r.titre === "string" && typeof r.action === "string")
        .map((r) => ({
          titre: String(r.titre).replace(/\*\*/g, "").trim(),
          action: String(r.action).replace(/\*\*/g, "").trim(),
          impact: String(r.impact ?? "").replace(/\*\*/g, "").trim(),
          priorite: (["haute", "moyenne", "basse"].includes(String(r.priorite)) ? r.priorite : "moyenne") as Recommendation["priorite"],
        }));
      if (recos.length) return recos.slice(0, 5);
    } catch {
      /* repli sur l'analyse texte */
    }
  }
  // Repli : un bloc par élément numéroté « 1. **Titre** : texte »
  return raw
    .split(/\n(?=\s*(?:\d+[.)]|[-*])\s)/)
    .map((block) => block.replace(/^\s*(?:\d+[.)]|[-*])\s*/, "").trim())
    .filter((b) => b.length > 10)
    .slice(0, 5)
    .map((b) => {
      const clean = b.replace(/\*\*/g, "");
      const [titre, ...rest] = clean.split(/\s*[:—–-]\s+|\n/);
      return { titre: titre.trim(), action: rest.join(" ").trim() || clean, impact: "", priorite: "moyenne" as const };
    });
}

async function verifyPremiumAnnee(anneeId: string, tenantId: string) {
  if (!Types.ObjectId.isValid(anneeId)) return null;
  return Annee.findOne({
    _id: anneeId,
    tenantId,
    plan: "PREMIUM",
    status: "ACTIVE",
  })
    .select("aiCredits plan")
    .lean();
}

export async function getRecommendations(
  anneeId: string,
): Promise<ActionResponse<{ recommendations: Recommendation[] }>> {
  const session = await getTenantSession();
  if (!session) return { success: false, message: "Non autorisé." };

  await connectToDb();

  const annee = await verifyPremiumAnnee(anneeId, session.tenantId);
  if (!annee) return { success: false, message: "Exercice Premium actif requis." };

  const deductResult = await deductCredits(anneeId, 5);
  if (!deductResult.success) return deductResult as ActionResponse<{ recommendations: Recommendation[] }>;

  const ctx = await buildBusinessContext(session.tenantId, anneeId);
  const prompt = formatContextForPrompt(ctx);

  let raw: string;
  try {
    raw = await callLLM(
      "analysis",
      SYSTEM_CONSEILLER,
      `Voici les données réelles de l'exercice :\n${prompt}\n\nDonne 4 recommandations concrètes et prioritaires, chacune fondée sur un chiffre du contexte.
  Réponds UNIQUEMENT par un tableau JSON, sans texte autour, au format :
  [{"titre":"5 à 8 mots","action":"ce qu'il faut faire concrètement, 1 à 2 phrases","impact":"le chiffre du contexte qui justifie l'action","priorite":"haute|moyenne|basse"}]`,
    );
  } catch {
    return { success: false, message: "Le conseiller est momentanément indisponible. Réessayez dans un instant." };
  }

  const recommendations = parseRecommendations(raw);

  return { success: true, message: "Recommandations générées.", data: { recommendations } };
}

const MAX_MESSAGES_PER_CONVERSATION = 20;

export interface ChatReply {
  conversation: ConversationSummary;
  reply: string;
}

/**
 * Envoie une question au conseiller. La conversation est créée au premier message
 * puis enregistrée en base ; l'historique est relu côté serveur (jamais fourni par le client).
 */
export async function sendChatMessage(
  anneeId: string,
  conversationId: string | null,
  message: string,
): Promise<ActionResponse<ChatReply>> {
  const session = await getTenantSession();
  if (!session) return { success: false, message: "Non autorisé." };

  const question = (message ?? "").trim().slice(0, 2000);
  if (!question) return { success: false, message: "Message vide." };

  await connectToDb();

  const annee = await verifyPremiumAnnee(anneeId, session.tenantId);
  if (!annee) return { success: false, message: "Exercice Premium actif requis." };

  let conversation = null;
  if (conversationId) {
    if (!Types.ObjectId.isValid(conversationId)) return { success: false, message: "Conversation introuvable." };
    conversation = await AdvisorConversation.findOne({ _id: conversationId, tenantId: session.tenantId, anneeId });
    if (!conversation) return { success: false, message: "Conversation introuvable." };
    if (conversation.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
      return { success: false, message: "Cette conversation a atteint 20 messages. Commencez-en une nouvelle." };
    }
  }

  const deductResult = await deductCredits(anneeId, 2);
  if (!deductResult.success) return deductResult as ActionResponse<ChatReply>;

  const ctx = await buildBusinessContext(session.tenantId, anneeId);
  const contextLine = `Données réelles de l'exercice :\n${formatContextForPrompt(ctx)}`;

  const historyText = (conversation?.messages ?? [])
    .slice(-10)
    .map((m) => `${m.role === "user" ? "Entrepreneur" : "Conseiller"}: ${m.content}`)
    .join("\n");

  const userPrompt = historyText
    ? `${contextLine}\n\nHistorique récent:\n${historyText}\n\nEntrepreneur: ${question}`
    : `${contextLine}\n\nEntrepreneur: ${question}`;

  let reply: string;
  try {
    reply = (await callLLM("chat", SYSTEM_CONSEILLER, userPrompt)).trim();
  } catch {
    return { success: false, message: "Le conseiller est momentanément indisponible. Réessayez dans un instant." };
  }

  const now = new Date();
  const newMessages = [
    { role: "user" as const, content: question, createdAt: now },
    { role: "assistant" as const, content: reply, createdAt: new Date(now.getTime() + 1) },
  ];

  if (conversation) {
    conversation.messages.push(...newMessages);
    await conversation.save();
  } else {
    conversation = await AdvisorConversation.create({
      tenantId: session.tenantId,
      anneeId,
      userId: session.userId,
      title: conversationTitle(question),
      messages: newMessages,
    });
  }

  return {
    success: true,
    message: "Réponse générée.",
    data: {
      reply,
      conversation: {
        id: conversation._id.toString(),
        title: conversation.title,
        messageCount: conversation.messages.length,
        updatedAt: (conversation.updatedAt ?? now).toISOString(),
      },
    },
  };
}

/** Ouvre une conversation enregistrée. */
export async function getConversation(
  anneeId: string,
  conversationId: string,
): Promise<ActionResponse<{ id: string; title: string; messages: ConversationMessage[] }>> {
  const session = await getTenantSession();
  if (!session) return { success: false, message: "Non autorisé." };
  const conv = await loadConversation(session.tenantId, anneeId, conversationId);
  if (!conv) return { success: false, message: "Conversation introuvable." };
  return { success: true, message: "Conversation chargée.", data: conv };
}

/** Supprime une conversation du tenant. */
export async function deleteConversation(conversationId: string): Promise<ActionResponse<{ id: string }>> {
  const session = await getTenantSession();
  if (!session) return { success: false, message: "Non autorisé." };
  if (!Types.ObjectId.isValid(conversationId)) return { success: false, message: "Conversation introuvable." };
  await connectToDb();
  const res = await AdvisorConversation.deleteOne({ _id: conversationId, tenantId: session.tenantId });
  if (!res.deletedCount) return { success: false, message: "Conversation introuvable." };
  return { success: true, message: "Conversation supprimée.", data: { id: conversationId } };
}

export async function generateEnrichedDossier(
  anneeId: string,
): Promise<ActionResponse<{ dossier: string; score: number | null; components: { regularite: number; croissance: number; diversification: number; marge: number } | null; interpretation: string; disclaimer: string }>> {
  const session = await getTenantSession();
  if (!session) return { success: false, message: "Non autorisé." };

  await connectToDb();

  const annee = await verifyPremiumAnnee(anneeId, session.tenantId);
  if (!annee) return { success: false, message: "Exercice Premium actif requis." };

  const deductResult = await deductCredits(anneeId, 10);
  if (!deductResult.success) return deductResult as ActionResponse<{ dossier: string; score: number | null; components: null; interpretation: string; disclaimer: string }>;

  const ctx = await buildBusinessContext(session.tenantId, anneeId);
  const prompt = formatContextForPrompt(ctx);

  let raw: string;
  try {
    raw = await callLLM(
      "dossier",
      `Tu es un analyste crédit qui prépare le dossier d'un commerçant congolais (RDC) pour une institution de microfinance.
  Règles strictes :
  - Utilise UNIQUEMENT les données fournies. N'invente aucun chiffre, aucun nom, aucune date. N'écris jamais de champ à compléter entre crochets.
  - Si une information manque, écris « Non renseigné dans ELMES-TEKA ».
  - Monnaies : FC et USD.
  - Le score de solvabilité est déjà calculé : reprends-le tel quel, ne le recalcule pas.
  - Français clair, 350 mots maximum, Markdown.`,
      `Données de l'entreprise :\n${prompt}\n\nRédige le dossier avec exactement ces sections (titres ###) :
  ### Présentation
  ### Activité commerciale
  ### Trésorerie et engagements
  ### Points forts
  ### Points de vigilance
  ### Conclusion pour le financeur`,
    );
  } catch {
    return { success: false, message: "Le conseiller est momentanément indisponible. Réessayez dans un instant." };
  }

  const solv = ctx.solvabilite;

  return {
    success: true,
    message: "Dossier généré.",
    data: {
      dossier: raw,
      score: solv?.score ?? null,
      components: solv?.components ?? null,
      interpretation: solv?.interpretation ?? "",
      disclaimer:
        "Ce dossier est généré automatiquement à titre indicatif. Il ne constitue pas une décision de financement ou de crédit.",
    },
  };
}
