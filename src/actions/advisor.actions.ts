"use server";

import { Types } from "mongoose";

import { getTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import { callLLM } from "@/lib/ai/llm-client";
import { buildBusinessContext, formatContextForPrompt } from "@/lib/ai/context-builder";
import { deductCredits } from "./credits.actions";
import type { ActionResponse } from "./annees.actions";

const SYSTEM_CONSEILLER = `Tu es ELMES Conseiller, un assistant expert en gestion commerciale pour entrepreneurs africains.
Tu aides à analyser les performances de leur entreprise et donnes des conseils pratiques.
Sois concis, direct et pragmatique. Réponds en français. Maximum 300 mots.`;

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
): Promise<ActionResponse<{ recommendations: string[] }>> {
  const session = await getTenantSession();
  if (!session) return { success: false, message: "Non autorisé." };

  await connectToDb();

  const annee = await verifyPremiumAnnee(anneeId, session.tenantId);
  if (!annee) return { success: false, message: "Exercice Premium actif requis." };

  const deductResult = await deductCredits(anneeId, 5);
  if (!deductResult.success) return deductResult as ActionResponse<{ recommendations: string[] }>;

  const ctx = await buildBusinessContext(session.tenantId, anneeId);
  const prompt = formatContextForPrompt(ctx);

  const raw = await callLLM(
    "analysis",
    SYSTEM_CONSEILLER,
    `Voici les données de l'exercice :\n${prompt}\n\nDonne 5 recommandations concrètes et prioritaires pour améliorer les performances.`,
  );

  const recommendations = raw
    .split(/\n+/)
    .map((l) => l.replace(/^[\d\-\*\.\s]+/, "").trim())
    .filter((l) => l.length > 10)
    .slice(0, 5);

  return { success: true, message: "Recommandations générées.", data: { recommendations } };
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendChatMessage(
  anneeId: string,
  message: string,
  history: ChatMessage[],
): Promise<ActionResponse<{ reply: string }>> {
  const session = await getTenantSession();
  if (!session) return { success: false, message: "Non autorisé." };

  if (!message.trim()) return { success: false, message: "Message vide." };

  await connectToDb();

  const annee = await verifyPremiumAnnee(anneeId, session.tenantId);
  if (!annee) return { success: false, message: "Exercice Premium actif requis." };

  const deductResult = await deductCredits(anneeId, 2);
  if (!deductResult.success) return deductResult as ActionResponse<{ reply: string }>;

  const ctx = await buildBusinessContext(session.tenantId, anneeId);
  const contextLine = `Contexte exercice : ${formatContextForPrompt(ctx)}`;

  // Historique limité aux 10 derniers échanges
  const recentHistory = history.slice(-10);
  const historyText = recentHistory
    .map((m) => `${m.role === "user" ? "Client" : "Conseiller"}: ${m.content}`)
    .join("\n");

  const userPrompt = historyText
    ? `${contextLine}\n\nHistorique récent:\n${historyText}\n\nClient: ${message}`
    : `${contextLine}\n\nClient: ${message}`;

  const reply = await callLLM("chat", SYSTEM_CONSEILLER, userPrompt);

  return { success: true, message: "Réponse générée.", data: { reply } };
}

export async function generateEnrichedDossier(
  anneeId: string,
): Promise<ActionResponse<{ dossier: string; score: number; disclaimer: string }>> {
  const session = await getTenantSession();
  if (!session) return { success: false, message: "Non autorisé." };

  await connectToDb();

  const annee = await verifyPremiumAnnee(anneeId, session.tenantId);
  if (!annee) return { success: false, message: "Exercice Premium actif requis." };

  const deductResult = await deductCredits(anneeId, 10);
  if (!deductResult.success) return deductResult as ActionResponse<{ dossier: string; score: number; disclaimer: string }>;

  const ctx = await buildBusinessContext(session.tenantId, anneeId);
  const prompt = formatContextForPrompt(ctx);

  const raw = await callLLM(
    "dossier",
    `Tu es un expert en financement d'entreprises africaines.
Rédige un dossier de présentation synthétique et professionnel pour accompagner une demande de financement.
Inclus une évaluation de la viabilité (score indicatif /100). Réponds en français. Structure ton analyse clairement.`,
    `Données de l'entreprise :\n${prompt}\n\nRédige le dossier de financement enrichi.`,
  );

  // Extrait un score si présent dans la réponse
  const scoreMatch = raw.match(/(\d{1,3})\s*\/\s*100/);
  const score = scoreMatch ? Math.min(100, parseInt(scoreMatch[1], 10)) : 60;

  return {
    success: true,
    message: "Dossier généré.",
    data: {
      dossier: raw,
      score,
      disclaimer:
        "Ce dossier est généré automatiquement à titre indicatif. Il ne constitue pas une décision de financement ou de crédit.",
    },
  };
}
