import { PLANS, type Plan } from "./plans";
import crypto from "node:crypto";
import { Types } from "mongoose";
import Annee, { type DiscountSource } from "@/lib/models/Annee";
import PlatformPromo from "@/lib/models/PlatformPromo";
import { Tenant } from "@/lib/models/User";
import connectToDb from "@/lib/utils/db";

/*
 * Prix de l'abonnement annuel d'un exercice et réductions.
 * Règles :
 *  - code promo plateforme (créé par l'admin) : % défini, période et quota d'utilisations ;
 *  - filleul : 10 % sur son premier exercice payé ;
 *  - parrain : +5 % par tranche de 5 filleuls ayant payé, plafonné à 50 % ;
 *  - une seule réduction s'applique : la plus élevée.
 */

export const SUBSCRIPTION_USD = PLANS.STARTER.annualUsd;
export const FILLEUL_REDUCTION = 10;
export const PARRAIN_STEP = 5;
export const PARRAIN_REDUCTION_PER_STEP = 5;
export const PARRAIN_MAX_REDUCTION = 50;

export interface SubscriptionPrice {
  baseAmount: number;
  amount: number;
  currency: "USD" | "CDF";
  discountPercent: number;
  discountSource: DiscountSource | null;
  promoCode: string | null;
  label: string | null;
}

export function normalizeCode(value?: string | null): string {
  return (value ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

function basePrice(currency: "USD" | "CDF", plan: Plan = "STARTER") {
  const annualUsd = PLANS[plan].annualUsd;
  const taux = Number.parseFloat(process.env.TAUX ?? "0");
  if (currency === "CDF" && (!Number.isFinite(taux) || taux <= 0)) throw new Error("Le taux de conversion CDF n’est pas configuré. Choisissez USD.");
  return currency === "CDF"
    ? { amount: Math.round(annualUsd * taux), currency: "CDF" as const }
    : { amount: annualUsd, currency: "USD" as const };
}

/** Code promo plateforme utilisable maintenant, ou la raison du refus. */
export async function findUsablePromo(code: string) {
  await connectToDb();
  const promo = await PlatformPromo.findOne({ code: normalizeCode(code) }).lean();
  const now = new Date();
  if (!promo || promo.status !== "ACTIVE") return { promo: null, error: "Code promo inconnu ou desactive." } as const;
  if (promo.startsAt > now) return { promo: null, error: "Ce code promo n'est pas encore actif." } as const;
  if (promo.endsAt < now) return { promo: null, error: "Ce code promo a expire." } as const;
  if (promo.maxUses !== null && promo.uses >= promo.maxUses)
    return { promo: null, error: "Le quota de ce code promo est atteint." } as const;
  return { promo, error: null } as const;
}

/** Nombre de filleuls ayant réellement payé au moins un exercice. */
export async function countPaidReferrals(tenantId: string): Promise<number> {
  await connectToDb();
  const filleuls = await Tenant.find({ referredBy: new Types.ObjectId(tenantId) }).select("_id").lean();
  if (!filleuls.length) return 0;
  const paying = await Annee.distinct("tenantId", {
    tenantId: { $in: filleuls.map((f) => f._id) },
    "provider.status": "PAID",
    // Un exercice offert (code à 100 %) ne compte pas : évite les faux filleuls
    "provider.amount": { $gt: 0 },
  });
  return paying.length;
}

export function parrainReduction(paidReferrals: number): number {
  return Math.min(Math.floor(paidReferrals / PARRAIN_STEP) * PARRAIN_REDUCTION_PER_STEP, PARRAIN_MAX_REDUCTION);
}

/**
 * Calcule le prix pour un tenant (identifiant issu de la session, jamais du client).
 * Un code saisi invalide renvoie une erreur plutôt que d'être ignoré en silence.
 */
export async function computeSubscriptionPrice(input: {
  tenantId: string;
  plan?: Plan;
  currency: "USD" | "CDF";
  promoCode?: string | null;
}): Promise<{ price: SubscriptionPrice; error: string | null }> {
  await connectToDb();
  const base = basePrice(input.currency, input.plan);
  const tenant = await Tenant.findById(input.tenantId).select("referredBy signupPromoCode").lean();
  const hasPaid = Boolean(await Annee.exists({ tenantId: input.tenantId, "provider.status": "PAID" }));

  const candidates: Array<{ percent: number; source: DiscountSource; code: string | null; label: string }> = [];
  let error: string | null = null;

  const typed = normalizeCode(input.promoCode);
  const promoCode = typed || (!hasPaid ? normalizeCode(tenant?.signupPromoCode) : "");
  if (promoCode) {
    const found = await findUsablePromo(promoCode);
    if (found.promo) {
      candidates.push({ percent: found.promo.reduction, source: "PROMO", code: found.promo.code, label: `Code ${found.promo.code}` });
    } else if (typed) {
      error = found.error;
    }
  }
  if (tenant?.referredBy && !hasPaid) {
    candidates.push({ percent: FILLEUL_REDUCTION, source: "FILLEUL", code: null, label: "Parrainage (filleul)" });
  }
  const parrain = parrainReduction(await countPaidReferrals(input.tenantId));
  if (parrain > 0) candidates.push({ percent: parrain, source: "PARRAIN", code: null, label: "Bonus parrain" });

  const best = candidates.sort((a, b) => b.percent - a.percent)[0];
  const percent = Math.min(best?.percent ?? 0, 100);
  return {
    error,
    price: {
      baseAmount: base.amount,
      amount:
        base.currency === "CDF"
          ? Math.round((base.amount * (100 - percent)) / 100)
          : Math.round(base.amount * (100 - percent)) / 100,
      currency: base.currency,
      discountPercent: percent,
      discountSource: best?.source ?? null,
      promoCode: best?.source === "PROMO" ? best.code : null,
      label: best ? `${best.label} -${percent} %` : null,
    },
  };
}

/** Code de parrainage du tenant, généré à la première demande. */
export async function ensureReferralCode(tenantId: string): Promise<string> {
  await connectToDb();
  const tenant = await Tenant.findById(tenantId).select("referralCode designation").lean();
  if (!tenant) throw new Error("Tenant introuvable.");
  if (tenant.referralCode) return tenant.referralCode;

  const prefix = normalizeCode(tenant.designation).replace(/[^A-Z0-9]/g, "").slice(0, 4) || "ELMS";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `${prefix}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const clash = await Tenant.exists({ referralCode: code });
    if (clash) continue;
    const updated = await Tenant.findOneAndUpdate(
      { _id: tenantId, $or: [{ referralCode: { $exists: false } }, { referralCode: null }] },
      { $set: { referralCode: code } },
      { new: true }
    )
      .select("referralCode")
      .lean();
    if (updated?.referralCode) return updated.referralCode;
    // Code attribué entre-temps par une autre requête
    const current = await Tenant.findById(tenantId).select("referralCode").lean();
    if (current?.referralCode) return current.referralCode;
  }
  throw new Error("Impossible de generer le code de parrainage.");
}

export interface ReferralSummary {
  code: string;
  shareUrl: string;
  totalReferrals: number;
  paidReferrals: number;
  currentReduction: number;
  nextStepIn: number;
  maxReached: boolean;
}

/** Résumé du parrainage affiché au tenant. */
export async function getReferralSummary(tenantId: string, origin: string): Promise<ReferralSummary> {
  const code = await ensureReferralCode(tenantId);
  const [totalReferrals, paidReferrals] = await Promise.all([
    Tenant.countDocuments({ referredBy: new Types.ObjectId(tenantId) }),
    countPaidReferrals(tenantId),
  ]);
  const currentReduction = parrainReduction(paidReferrals);
  const shareUrl = new URL("/signup", origin);
  shareUrl.searchParams.set("ref", code);
  return {
    code,
    shareUrl: shareUrl.toString(),
    totalReferrals,
    paidReferrals,
    currentReduction,
    nextStepIn: PARRAIN_STEP - (paidReferrals % PARRAIN_STEP),
    maxReached: currentReduction >= PARRAIN_MAX_REDUCTION,
  };
}
