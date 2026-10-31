import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import Annee from "@/lib/models/Annee";
import Promotion from "@/lib/models/Promotion";
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

export async function applyAnneePayment(
  anneeId: string,
  result: StatusResponse,
  tenantId?: string,
): Promise<AppliedPayment> {
  await connectToDb();
  if (!Types.ObjectId.isValid(anneeId)) return { state: "FAILED", message: "Exercice invalide." };
  const filter = { _id: anneeId, ...(tenantId ? { tenantId } : {}) };

  const annee = await Annee.findOne(filter).select("tenantId status provider.orderNumber").lean();
  if (!annee) return { state: "FAILED", message: "Exercice introuvable." };
  const owner = annee.tenantId.toString();
  if (annee.status !== "PENDING") return { state: "PAID", message: "Exercice deja actif.", tenantId: owner };
  if (result.orderNumber && annee.provider?.orderNumber && result.orderNumber !== annee.provider.orderNumber) {
    return { state: "PENDING", message: "Transaction differente de celle en cours.", tenantId: owner };
  }

  if (result.status === "SUCCES") {
    await Annee.updateOne(
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
  revalidatePath(`/clients/${promotion.code}`);
  return { state: "PAID", message: `${recharge.credits} credits ajoutes.`, tenantId: owner, credits: recharge.credits };
}
