"use server";

import { Types } from "mongoose";

import { getTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import { callLLM } from "@/lib/ai/llm-client";
import { buildBusinessContext, formatContextForPrompt } from "@/lib/ai/context-builder";
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

  const raw = await callLLM(
    "analysis",
    SYSTEM_CONSEILLER,
    `Voici les données réelles de l'exercice :\n${prompt}\n\nDonne 4 recommandations concrètes et prioritaires, chacune fondée sur un chiffre du contexte.
Réponds UNIQUEMENT par un tableau JSON, sans texte autour, au format :
[{"titre":"5 à 8 mots","action":"ce qu'il faut faire concrètement, 1 à 2 phrases","impact":"le chiffre du contexte qui justifie l'action","priorite":"haute|moyenne|basse"}]`,
  );

  const recommendations = parseRecommendations(raw);

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
  const contextLine = `Données réelles de l'exercice :\n${formatContextForPrompt(ctx)}`;

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

  const raw = await callLLM(
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
