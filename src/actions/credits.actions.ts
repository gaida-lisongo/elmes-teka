"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { getTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import type { ActionResponse } from "./annees.actions";

export interface CreditsBalance {
  total: number;
  used: number;
  remaining: number;
  lastResetAt: string;
}

export async function getCreditsBalance(anneeId: string): Promise<CreditsBalance | null> {
  const session = await getTenantSession();
  if (!session) return null;

  await connectToDb();

  if (!Types.ObjectId.isValid(anneeId)) return null;

  const annee = await Annee.findOne({
    _id: anneeId,
    tenantId: session.tenantId,
    plan: "PREMIUM",
  })
    .select("aiCredits")
    .lean();

  if (!annee) return null;

  const credits = annee.aiCredits;
  if (!credits) return { total: 0, used: 0, remaining: 0, lastResetAt: new Date().toISOString() };

  return {
    total: credits.total,
    used: credits.used,
    remaining: Math.max(0, credits.total - credits.used),
    lastResetAt: credits.lastResetAt.toISOString(),
  };
}

export async function deductCredits(
  anneeId: string,
  amount: number,
): Promise<ActionResponse> {
  const session = await getTenantSession();
  if (!session) return { success: false, message: "Non autorisé." };

  await connectToDb();

  if (!Types.ObjectId.isValid(anneeId)) {
    return { success: false, message: "Exercice invalide." };
  }

  const annee = await Annee.findOne({
    _id: anneeId,
    tenantId: session.tenantId,
    plan: "PREMIUM",
  })
    .select("aiCredits")
    .lean();

  if (!annee) return { success: false, message: "Exercice Premium introuvable." };

  const credits = annee.aiCredits;
  const remaining = credits ? credits.total - credits.used : 0;

  if (remaining < amount) {
    return { success: false, message: `Crédits insuffisants (${remaining} restants, ${amount} requis).` };
  }

  await Annee.updateOne(
    { _id: anneeId, tenantId: session.tenantId },
    { $inc: { "aiCredits.used": amount } },
  );

  revalidatePath("/advisor");
  return { success: true, message: `${amount} crédit(s) déduit(s).`, data: undefined };
}

const RECHARGE_PACKS = {
  "50cr": { credits: 50, usd: 2 },
  "200cr": { credits: 200, usd: 6 },
  "500cr": { credits: 500, usd: 12 },
} as const;

export type RechargePack = keyof typeof RECHARGE_PACKS;

export async function initiateRecharge(
  anneeId: string,
  pack: RechargePack,
): Promise<ActionResponse<{ orderNumber: string; amount: number }>> {
  const session = await getTenantSession();
  if (!session) return { success: false, message: "Non autorisé." };

  await connectToDb();

  if (!Types.ObjectId.isValid(anneeId)) {
    return { success: false, message: "Exercice invalide." };
  }

  const annee = await Annee.findOne({
    _id: anneeId,
    tenantId: session.tenantId,
    plan: "PREMIUM",
    status: "ACTIVE",
  })
    .select("_id")
    .lean();

  if (!annee) return { success: false, message: "Exercice Premium actif introuvable." };

  const rechargePack = RECHARGE_PACKS[pack];
  if (!rechargePack) return { success: false, message: "Pack de recharge invalide." };

  // La confirmation FlexPay arrive via /api/payments/flexpay/credits
  // Pour l'instant on retourne juste les infos de paiement à afficher
  const orderNumber = `RCH-${Date.now()}-${pack}`;
  return {
    success: true,
    message: `Recharge ${rechargePack.credits} crédits initiée.`,
    data: { orderNumber, amount: rechargePack.usd },
  };
}
