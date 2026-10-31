import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import Annee from "@/lib/models/Annee";
import PlatformPromo from "@/lib/models/PlatformPromo";
import Promotion from "@/lib/models/Promotion";
import { Tenant } from "@/lib/models/User";
import { scheduleAdminNotification } from "@/lib/admin/notify";
import connectToDb from "@/lib/utils/db";
import type { StatusResponse } from "@/lib/utils/payment.service";

/*
 * Application d'un statut FlexPay (issu de /check) aux documents en base.
 * Partagé par le webhook et par les actions « Vérifier le paiement ».
 * Ce module n'est pas un fichier "use server" : l'appelant doit avoir
 * authentifié la requête (session tenant ou clé de callback).
 * Les mises à jour sont conditionnées au statut PENDING : un callback rejoué
 * ou une vérification concurrente ne crédite jamais deux fois.
 */

export type AppliedPayment = { state: "PAID" | "PENDING" | "FAILED"; message: string; tenantId?: string };

export const ANNEE_PREFIX = "ANNEE-";
export const PROMO_PREFIX = "PROMO-";

/** Compte une utilisation payée d'un code promo plateforme (quota). */
export async function recordPromoUse(code?: string | null): Promise<void> {
  if (!code) return;
  await PlatformPromo.updateOne({ code }, { $inc: { uses: 1 } });
}

async function notifyConfirmed(tenantId: string, title: string, rows: Array<[string, string | number | null | undefined]>) {
  const tenant = await Tenant.findById(tenantId).select("designation email telephone").lean();
  scheduleAdminNotification(`Paiement confirme - ${tenant?.designation ?? tenantId}`, title, [
    ["Entreprise", tenant?.designation],
    ["Contact", [tenant?.email, tenant?.telephone].filter(Boolean).join(" - ")],
    ...rows,
  ]);
}

export async function applyAnneePayment(
  anneeId: string,
  result: StatusResponse,
  tenantId?: string,
): Promise<AppliedPayment> {
  await connectToDb();
  if (!Types.ObjectId.isValid(anneeId)) return { state: "FAILED", message: "Exercice invalide." };
  const filter = { _id: anneeId, ...(tenantId ? { tenantId } : {}) };

  const annee = await Annee.findOne(filter).select("tenantId status debut fin provider").lean();
  if (!annee) return { state: "FAILED", message: "Exercice introuvable." };
  const owner = annee.tenantId.toString();
  if (annee.status !== "PENDING") return { state: "PAID", message: "Exercice deja actif.", tenantId: owner };
  if (result.orderNumber && annee.provider?.orderNumber && result.orderNumber !== annee.provider.orderNumber) {
    return { state: "PENDING", message: "Transaction differente de celle en cours.", tenantId: owner };
  }

  if (result.status === "SUCCES") {
    const activated = await Annee.updateOne(
      { ...filter, status: "PENDING" },
      {
        $set: {
          status: "ACTIVE",
          "provider.status": "PAID",
          "provider.message": result.message ?? "Paiement confirme.",
          "provider.paidAt": new Date(),
        },
      },
    );
    if (activated.modifiedCount) {
      await recordPromoUse(annee.provider?.promoCode);
      await notifyConfirmed(owner, "Abonnement annuel paye", [
        ["Exercice", `${annee.debut.getFullYear()} - ${annee.fin.getFullYear()}`],
        ["Montant", `${annee.provider?.amount} ${annee.provider?.currency}`],
        ["Reduction", annee.provider?.discountPercent ? `${annee.provider.discountPercent} % (${annee.provider.discountSource})` : null],
        ["Commande FlexPay", annee.provider?.orderNumber],
        ["Canal", result.raw?.channel],
      ]);
    }
    revalidatePath("/annees");
    revalidatePath("/", "layout");
    return { state: "PAID", message: "Paiement confirme, exercice actif.", tenantId: owner };
  }

  const failed = result.status === "ECHEC";
  await Annee.updateOne(
    { ...filter, status: "PENDING" },
    {
      $set: {
        "provider.status": failed ? "FAILED" : "PENDING",
        "provider.message": result.message ?? (failed ? "Paiement echoue." : "Paiement en attente."),
      },
    },
  );
  revalidatePath("/annees");
  return failed
    ? { state: "FAILED", message: "Le paiement a echoue.", tenantId: owner }
    : { state: "PENDING", message: "Paiement toujours en attente.", tenantId: owner };
}

export async function applyPromotionRecharge(
  orderNumber: string,
  result: StatusResponse,
  tenantId?: string,
): Promise<AppliedPayment & { credits?: number }> {
  await connectToDb();
  const promotion = await Promotion.findOne({
    ...(tenantId ? { tenantId } : {}),
    recharges: { $elemMatch: { orderNumber, status: "PENDING" } },
  })
    .select("tenantId code recharges")
    .lean();
  if (!promotion) return { state: "FAILED", message: "Recharge en attente introuvable." };
  const owner = promotion.tenantId.toString();
  const recharge = promotion.recharges.find((item) => item.orderNumber === orderNumber && item.status === "PENDING");
  if (!recharge) return { state: "PAID", message: "Recharge deja traitee.", tenantId: owner };

  const pendingItem = { arrayFilters: [{ "item.orderNumber": orderNumber, "item.status": "PENDING" }] };
  if (result.status === "EN_ATTENTE") return { state: "PENDING", message: "Le paiement est toujours en attente.", tenantId: owner };

  if (result.status === "ECHEC") {
    await Promotion.updateOne(
      { _id: promotion._id },
      { $set: { "recharges.$[item].status": "FAILED", "recharges.$[item].message": result.message || "Paiement echoue." } },
      pendingItem,
    );
    revalidatePath(`/clients/${promotion.code}`);
    return { state: "FAILED", message: "Le paiement a echoue.", tenantId: owner };
  }

  const updated = await Promotion.updateOne(
    { _id: promotion._id, recharges: { $elemMatch: { orderNumber, status: "PENDING" } } },
    {
      $inc: { credits: recharge.credits },
      $set: {
        "recharges.$[item].status": "PAID",
        "recharges.$[item].message": result.message || "Paiement confirme.",
        "recharges.$[item].paidAt": new Date(),
      },
    },
    pendingItem,
  );
  if (!updated.modifiedCount) return { state: "PAID", message: "Cette recharge a deja ete creditee.", tenantId: owner };
  await notifyConfirmed(owner, "Recharge de credits SMS payee", [
    ["Promotion", promotion.code],
    ["Credits", recharge.credits],
    ["Montant", `${recharge.amount} ${recharge.currency}`],
    ["Commande FlexPay", orderNumber],
  ]);
  revalidatePath(`/clients/${promotion.code}`);
  return { state: "PAID", message: `${recharge.credits} credits ajoutes.`, tenantId: owner, credits: recharge.credits };
}

export async function applyUpgradePayment(anneeId: string, reference: string, result: StatusResponse, tenantId?: string): Promise<AppliedPayment> {
  await connectToDb();
  if (!Types.ObjectId.isValid(anneeId) || !result.success || !result.orderNumber) return { state: "FAILED", message: "Paiement non vérifié." };
  const ownerFilter = { _id: anneeId, ...(tenantId ? { tenantId } : {}) };
  const annee = await Annee.findOne(ownerFilter).lean();
  if (!annee) return { state: "FAILED", message: "Exercice introuvable." };
  const owner = annee.tenantId.toString();
  const payment = annee.upgrade?.reference === reference ? annee.upgrade : annee.upgradeHistory?.find(item => item.reference === reference);
  if (!payment || (payment.orderNumber && result.orderNumber !== payment.orderNumber) ||
      (result.reference && result.reference !== reference) || (!payment.orderNumber && result.reference !== reference)) {
    return { state: "FAILED", message: "Paiement différent de la demande.", tenantId: owner };
  }
  if (payment.status !== "PENDING") return { state: payment.status, message: payment.status === "PAID" ? "Formule déjà activée." : "Cette demande a échoué. Contactez le support si vous avez été débité.", tenantId: owner };
  if (annee.upgrade?.reference !== reference) return { state: "FAILED", message: "Demande archivée : vérification manuelle requise.", tenantId: owner };
  const state = result.status === "SUCCES" ? "PAID" : result.status === "ECHEC" ? "FAILED" : "PENDING";
  const from = payment.from ?? "STARTER";
  const updated = await Annee.updateOne({ ...ownerFilter, "upgrade.reference": reference, "upgrade.status": "PENDING",
    ...(from === "STARTER" ? { $or: [{ plan: "STARTER" }, { plan: { $exists: false } }] } : { plan: from }),
  }, { $set: {
    "upgrade.status": state,
    "upgrade.orderNumber": result.orderNumber,
    "upgrade.message": result.message ?? "Paiement vérifié.",
    ...(state === "PAID" ? { plan: payment.target, "upgrade.paidAt": new Date() } : {}),
  } });
  if (!updated.modifiedCount) {
    const actual = await Annee.findOne(ownerFilter).select("upgrade").lean();
    const actualState = actual?.upgrade?.reference === reference ? actual.upgrade.status : "FAILED";
    return { state: actualState, message: actualState === "PAID" ? "Formule déjà activée." : "Paiement non appliqué : vérifiez la demande en cours.", tenantId: owner };
  }
  revalidatePath("/annees");
  revalidatePath("/", "layout");
  return { state, message: state === "PAID" ? "Nouvelle formule activée." : state === "FAILED" ? "Paiement échoué." : "Paiement en attente.", tenantId: owner };
}
