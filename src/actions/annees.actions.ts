"use server";

import { signUpgradeQuote, verifyUpgradeQuote } from "@/lib/payments/upgrade-quote";
import { getSessionSecret } from "@/lib/auth/session";
import { randomUUID } from "node:crypto";
import { upgradePrice, isPlan, type Plan } from "@/lib/payments/plans";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import Commande from "@/lib/models/Commande";
import Depense from "@/lib/models/Depense";
import { scheduleAdminNotification } from "@/lib/admin/notify";
import { Tenant } from "@/lib/models/User";
import { applyAnneePayment, recordPromoUse } from "@/lib/payments/flexpay-results";
import { computeSubscriptionPrice, type SubscriptionPrice } from "@/lib/payments/pricing";
import { checkStatus, initiateCollection } from "@/lib/utils/payment.service";

export type ActionResponse<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string> };

/* ───── Types ───── */

export interface AnneeListItem {
  plan: Plan;
  id: string;
  debut: string;
  fin: string;
  slug: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED";
  provider: {
    name: "FLEXPAY";
    orderNumber: string | null;
    message: string;
    status: "PENDING" | "PAID" | "FAILED";
    amount: number;
    currency: "USD" | "CDF";
    paidAt: string | null;
  };
  createdAt: string;
  totalRecettesUSD: number;
  totalRecettesCDF: number;
  totalDepensesUSD: number;
  totalDepensesCDF: number;
  totalRecettes: number;
  totalDepenses: number;
  resultat: number;
  nbCommandes: number;
  nbDepenses: number;
}

export interface AnneeMetrics {
  total: number;
  courant: string | null;
  totalRecettesUSD: number;
  totalRecettesCDF: number;
  totalDepensesUSD: number;
  totalDepensesCDF: number;
}

export interface PaginatedAnnees {
  items: AnneeListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ───── Helpers ───── */

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function priceFields(price: SubscriptionPrice) {
  return {
    amount: price.amount,
    currency: price.currency,
    baseAmount: price.baseAmount,
    discountPercent: price.discountPercent,
    discountSource: price.discountSource,
    promoCode: price.promoCode,
  };
}

async function notifyPaymentInitiated(tenantId: string, anneeLabel: string, price: SubscriptionPrice, orderNumber?: string | null, error?: string) {
  const tenant = await Tenant.findById(tenantId).select("designation email telephone").lean();
  scheduleAdminNotification(
    error ? `Paiement non initie - ${tenant?.designation ?? tenantId}` : `Paiement initie - ${tenant?.designation ?? tenantId}`,
    error ? "Echec d'initiation d'un abonnement annuel" : "Nouveau paiement d'abonnement annuel initie",
    [
      ["Entreprise", tenant?.designation],
      ["Contact", [tenant?.email, tenant?.telephone].filter(Boolean).join(" - ")],
      ["Exercice", anneeLabel],
      ["Montant", `${price.amount} ${price.currency}`],
      ["Reduction", price.label],
      ["Commande FlexPay", orderNumber],
      ["Erreur", error],
    ]
  );
}

/** Prix de l'abonnement pour le tenant connecté (aperçu avant création). */
export async function previewSubscriptionPrice(input: {
  plan?: Plan;
  currency: "USD" | "CDF";
  promoCode?: string;
}): Promise<ActionResponse<SubscriptionPrice>> {
  try {
    const { tenantId } = await requireTenantSession();
    if (input.plan !== undefined && !isPlan(input.plan)) throw new Error("Formule invalide.");
    const { price, error } = await computeSubscriptionPrice({ tenantId, plan: input.plan, currency: input.currency, promoCode: input.promoCode });
    if (error) return { success: false, message: error, errors: { promoCode: error } };
    return { success: true, message: price.label ?? "Tarif standard.", data: price };
  } catch (error: unknown) {
    return { success: false, message: (error instanceof Error ? error.message : "Calcul du prix impossible.") };
  }
}

/* ───── Métriques ───── */

export async function getAnneeMetrics(): Promise<ActionResponse<AnneeMetrics>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const tenantOid = new Types.ObjectId(tenantId);

    const [anneeCount] = await Annee.aggregate([
      { $match: { tenantId: tenantOid } },
      { $count: "total" },
    ]);

    const now = new Date();
    const courant = await Annee.findOne({
      tenantId: tenantOid,
      status: { $in: ["ACTIVE", null] },
      debut: { $lte: now },
      fin: { $gte: now },
    })
      .select("slug")
      .sort({ debut: -1 })
      .lean();

    /* Recettes globales */
    const recettesAgg = await Commande.aggregate([
      {
        $lookup: {
          from: "annees",
          localField: "anneeId",
          foreignField: "_id",
          as: "_annee",
        },
      },
      { $unwind: "$_annee" },
      { $match: { "_annee.tenantId": tenantOid, status: { $nin: ["CANCELLED", "DRAFT"] } } },
      {
        $group: {
          _id: "$currency",
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    /* Dépenses globales */
    const [depensesAgg] = await Depense.aggregate([
      {
        $lookup: {
          from: "annees",
          localField: "anneeId",
          foreignField: "_id",
          as: "_annee",
        },
      },
      { $unwind: "$_annee" },
      { $match: { "_annee.tenantId": tenantOid } },
      { $unwind: "$depenses" },
      { $match: { "depenses.status": { $nin: ["REJECTED"] } } },
      {
        $group: {
          _id: null,
          totalUSD: {
            $sum: { $cond: [{ $eq: ["$currency", "USD"] }, "$depenses.amount", 0] },
          },
          totalCDF: {
            $sum: { $cond: [{ $eq: ["$currency", "CDF"] }, "$depenses.amount", 0] },
          },
        },
      },
    ]);

    return {
      success: true,
      message: "Metriques recuperees.",
      data: {
        total: anneeCount?.total ?? 0,
        courant: courant?.slug ?? null,
        totalRecettesUSD: recettesAgg.find(row => row._id === "USD")?.total ?? 0,
        totalRecettesCDF: recettesAgg.find(row => row._id === "CDF")?.total ?? 0,
        totalDepensesUSD: depensesAgg?.totalUSD ?? 0,
        totalDepensesCDF: depensesAgg?.totalCDF ?? 0,
      },
    };
  } catch (error: unknown) {
    return { success: false, message: (error instanceof Error ? error.message : "Erreur metriques.") };
  }
}

/* ───── Liste paginée ───── */

export async function getAnnees(
  page: number = 1,
  limit: number = 12
): Promise<ActionResponse<PaginatedAnnees>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const safePage = Math.max(1, Math.min(page, 100));
    const safeLimit = Math.max(1, Math.min(limit, 50));
    const skip = (safePage - 1) * safeLimit;

    const tenantOid = new Types.ObjectId(tenantId);

    const [totalResult] = await Annee.aggregate([
      { $match: { tenantId: tenantOid } },
      { $count: "total" },
    ]);

    const total = totalResult?.total ?? 0;
    const totalPages = Math.ceil(total / safeLimit) || 1;

    const annees = await Annee.find({ tenantId: tenantOid })
      .sort({ debut: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    const items = await Promise.all(
      annees.map(async (annee) => {
        const anneeOid = annee._id;

        /* Recettes de l'exercice */
        const [recettesAgg] = await Commande.aggregate([
          {
            $match: {
              anneeId: anneeOid,
              status: { $nin: ["CANCELLED", "DRAFT"] },
            },
          },
          {
            $group: {
              _id: null,
              totalUSD: { $sum: { $cond: [{ $eq: ["$currency", "USD"] }, "$totalAmount", 0] } },
              totalCDF: { $sum: { $cond: [{ $eq: ["$currency", "CDF"] }, "$totalAmount", 0] } },
              nbCommandes: { $sum: 1 },
            },
          },
        ]);

        /* Dépenses de l'exercice */
        const [depensesAgg] = await Depense.aggregate([
          { $match: { anneeId: anneeOid } },
          { $unwind: "$depenses" },
          { $match: { "depenses.status": { $nin: ["REJECTED"] } } },
          {
            $group: {
              _id: null,
              totalUSD: { $sum: { $cond: [{ $eq: ["$currency", "USD"] }, "$depenses.amount", 0] } },
              totalCDF: { $sum: { $cond: [{ $eq: ["$currency", "CDF"] }, "$depenses.amount", 0] } },
              nbDepenses: { $sum: 1 },
            },
          },
        ]);

        const totalRecettes = recettesAgg?.totalUSD ?? 0;
        const totalDepenses = depensesAgg?.totalUSD ?? 0;

        return {
          plan: annee.plan ?? "STARTER",
          id: annee._id.toString(),
          debut: annee.debut.toISOString(),
          fin: annee.fin.toISOString(),
          slug: annee.slug,
          status: annee.status ?? "ACTIVE",
          provider: {
            name: annee.provider?.name ?? "FLEXPAY",
            orderNumber: annee.provider?.orderNumber ?? null,
            message: annee.provider?.message ?? "Exercice existant avant la facturation annuelle.",
            status: annee.provider?.status ?? "PAID",
            amount: annee.provider?.amount ?? 0,
            currency: annee.provider?.currency ?? "USD",
            paidAt: annee.provider?.paidAt?.toISOString() ?? null,
          },
          createdAt: annee.createdAt.toISOString(),
          totalRecettesUSD: recettesAgg?.totalUSD ?? 0,
          totalRecettesCDF: recettesAgg?.totalCDF ?? 0,
          totalDepensesUSD: depensesAgg?.totalUSD ?? 0,
          totalDepensesCDF: depensesAgg?.totalCDF ?? 0,
          totalRecettes,
          totalDepenses,
          resultat: totalRecettes - totalDepenses,
          nbCommandes: recettesAgg?.nbCommandes ?? 0,
          nbDepenses: depensesAgg?.nbDepenses ?? 0,
        };
      })
    );

    return {
      success: true,
      message: "Liste recuperee.",
      data: { items, total, page: safePage, limit: safeLimit, totalPages },
    };
  } catch (error: unknown) {
    return { success: false, message: (error instanceof Error ? error.message : "Erreur liste.") };
  }
}

/* ───── Création ───── */

export async function createAnnee(input: {
  plan?: Plan;
  debut: string;
  fin: string;
  phone: string;
  currency: "USD" | "CDF";
  promoCode?: string;
}): Promise<ActionResponse<{ id: string; paymentInitiated: boolean }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const errors: Record<string, string> = {};

    /* Extraire l'année depuis la valeur saisie et forcer 1jan/31dec */
    const parsedDebut = new Date(input.debut);
    const parsedFin = new Date(input.fin);

    if (isNaN(parsedDebut.getTime())) errors.debut = "Date de debut invalide.";
    if (isNaN(parsedFin.getTime())) errors.fin = "Date de fin invalide.";
    if (!["USD", "CDF"].includes(input.currency)) {
      errors.currency = "Devise invalide.";
    }
    if (input.plan !== undefined && !isPlan(input.plan)) throw new Error("Formule invalide.");
    const { price, error: promoError } = await computeSubscriptionPrice({
      tenantId,
      plan: input.plan,
      currency: input.currency === "CDF" ? "CDF" : "USD",
      promoCode: input.promoCode,
    });
    if (promoError) errors.promoCode = promoError;
    if (price.amount > 0 && (!input.phone || input.phone.trim().length < 8)) {
      errors.phone = "Numero de telephone invalide.";
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Champs invalides.", errors };
    }

    const anneeNumerique = parsedDebut.getFullYear();

    /* Forcer les dates à 1er janvier / 31 décembre de l'année extraite */
    const debut = new Date(Date.UTC(anneeNumerique, 0, 1));
    const fin = new Date(Date.UTC(anneeNumerique, 11, 31, 23, 59, 59, 999));

    const slug = slugify(`${debut.getFullYear()}-${fin.getFullYear()}`);

    /* Unicité par tenant + année calendaire */
    const existing = await Annee.findOne({
      tenantId,
      debut: { $gte: new Date(anneeNumerique, 0, 1), $lt: new Date(anneeNumerique + 1, 0, 1) },
    }).lean();
    if (existing) {
      return { success: false, message: "Un exercice pour cette annee calendaire existe deja." };
    }

    const label = `${debut.getFullYear()} - ${fin.getFullYear()}`;

    /* Réduction de 100 % : exercice offert, aucun paiement FlexPay */
    if (price.amount <= 0) {
      const annee = await Annee.create({
        plan: input.plan ?? "STARTER",
        tenantId: new Types.ObjectId(tenantId),
        debut,
        fin,
        slug,
        status: "ACTIVE",
        provider: {
          name: "FLEXPAY",
          orderNumber: null,
          message: `Exercice offert (${price.label}).`,
          status: "PAID",
          paidAt: new Date(),
          ...priceFields(price),
        },
      });
      await recordPromoUse(price.promoCode);
      await notifyPaymentInitiated(tenantId, `${label} (offert)`, price);
      revalidatePath("/annees");
      revalidatePath("/", "layout");
      return {
        success: true,
        message: "Exercice offert et active.",
        data: { id: annee._id.toString(), paymentInitiated: false },
      };
    }

    const annee = await Annee.create({
        plan: input.plan ?? "STARTER",
      tenantId: new Types.ObjectId(tenantId),
      debut,
      fin,
      slug,
      status: "PENDING",
      provider: {
        name: "FLEXPAY",
        orderNumber: null,
        message: "Initiation du paiement en cours.",
        status: "PENDING",
        paidAt: null,
        ...priceFields(price),
      },
    });

    const paymentResult = await initiateCollection({
      phone: input.phone.trim(),
      amount: price.amount,
      reference: `ANNEE-${annee._id.toString()}`,
      currency: price.currency,
    });
    const paymentInitiated = Boolean(paymentResult.success && paymentResult.orderNumber);

    await Annee.updateOne(
      { _id: annee._id, tenantId: new Types.ObjectId(tenantId) },
      {
        $set: {
          "provider.orderNumber": paymentResult.orderNumber ?? null,
          "provider.message": paymentResult.message ?? paymentResult.error ?? "Echec de l'initiation du paiement.",
          "provider.status": paymentInitiated ? "PENDING" : "FAILED",
        },
      }
    );
    await notifyPaymentInitiated(
      tenantId,
      label,
      price,
      paymentResult.orderNumber,
      paymentInitiated ? undefined : paymentResult.error ?? "Echec de l'initiation."
    );

    revalidatePath("/annees");

    return {
      success: true,
      message: paymentInitiated
        ? "Exercice cree. Validez le paiement sur votre telephone."
        : `Exercice cree, mais le paiement n'a pas pu etre initie : ${paymentResult.error ?? "erreur inconnue"}.`,
      data: { id: annee._id.toString(), paymentInitiated },
    };
  } catch (error: unknown) {
    return { success: false, message: (error instanceof Error ? error.message : "Erreur creation.") };
  }
}

export async function initiateAnneePayment(input: {
  anneeId: string;
  phone: string;
  currency: "USD" | "CDF";
}): Promise<ActionResponse<{ orderNumber: string }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(input.anneeId)) {
      return { success: false, message: "Exercice invalide." };
    }
    if (!input.phone || input.phone.trim().length < 8) {
      return { success: false, message: "Numero de telephone invalide." };
    }

    const annee = await Annee.findOne({ _id: input.anneeId, tenantId }).lean();
    if (!annee) return { success: false, message: "Exercice introuvable." };
    if (annee.status !== "PENDING") {
      return { success: false, message: "Seul un exercice en attente peut etre paye." };
    }
    if (annee.provider?.orderNumber && annee.provider.status === "PENDING") {
      return {
        success: true,
        message: "Paiement deja initie.",
        data: { orderNumber: annee.provider.orderNumber },
      };
    }

    /* Le code promo choisi à la création est reconduit, revalidé (période, quota). */
    const { price, error: priceError } = await computeSubscriptionPrice({
      tenantId,
      currency: input.currency === "CDF" ? "CDF" : "USD",
      plan: annee.plan ?? "STARTER",
      promoCode: annee.provider?.promoCode ?? undefined,
    });
    if (priceError) return { success: false, message: priceError };
    const result = await initiateCollection({
      phone: input.phone.trim(),
      amount: price.amount,
      reference: `ANNEE-${annee._id.toString()}`,
      currency: price.currency,
    });
    const initiated = Boolean(result.success && result.orderNumber);
    await Annee.updateOne(
      { _id: annee._id, tenantId },
      {
        $set: {
          provider: {
            name: "FLEXPAY",
            orderNumber: result.orderNumber ?? null,
            message: result.message ?? result.error ?? "Echec de l'initiation du paiement.",
            status: initiated ? "PENDING" : "FAILED",
            paidAt: null,
            ...priceFields(price),
          },
        },
      }
    );
    await notifyPaymentInitiated(
      tenantId,
      `${annee.debut.getFullYear()} - ${annee.fin.getFullYear()} (relance)`,
      price,
      result.orderNumber,
      initiated ? undefined : result.error ?? "Echec de l'initiation."
    );
    revalidatePath("/annees");

    if (!initiated || !result.orderNumber) {
      return { success: false, message: result.error ?? "Echec de l'initiation du paiement." };
    }
    return { success: true, message: "Paiement initie.", data: { orderNumber: result.orderNumber } };
  } catch (error: unknown) {
    return { success: false, message: (error instanceof Error ? error.message : "Erreur paiement.") };
  }
}

export async function verifyAnneePayment(
  anneeId: string
): Promise<ActionResponse<{ status: "PENDING" | "ACTIVE" }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();
    if (!Types.ObjectId.isValid(anneeId)) {
      return { success: false, message: "Exercice invalide." };
    }

    const annee = await Annee.findOne({ _id: anneeId, tenantId }).lean();
    if (!annee) return { success: false, message: "Exercice introuvable." };
    if (annee.status === "ACTIVE") {
      return { success: true, message: "Exercice deja actif.", data: { status: "ACTIVE" } };
    }
    if (annee.status !== "PENDING" || !annee.provider?.orderNumber) {
      return { success: false, message: "Aucun paiement en attente pour cet exercice." };
    }

    const result = await checkStatus(annee.provider.orderNumber);
    if (!result.success) {
      await Annee.updateOne(
        { _id: anneeId, tenantId },
        { $set: { "provider.message": result.error ?? "Verification impossible." } }
      );
      return { success: false, message: result.error ?? "Verification impossible." };
    }

    const applied = await applyAnneePayment(anneeId, result, tenantId);
    return {
      success: true,
      message: applied.message,
      data: { status: applied.state === "PAID" ? "ACTIVE" : "PENDING" },
    };
  } catch (error: unknown) {
    return { success: false, message: (error instanceof Error ? error.message : "Erreur verification.") };
  }
}

export async function completeAnnee(anneeId: string): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();
    if (!Types.ObjectId.isValid(anneeId)) {
      return { success: false, message: "Exercice invalide." };
    }
    const result = await Annee.updateOne(
      { _id: anneeId, tenantId, status: "ACTIVE" },
      { $set: { status: "COMPLETED" } }
    );
    if (result.modifiedCount !== 1) {
      return { success: false, message: "Seul un exercice actif peut etre cloture." };
    }
    revalidatePath("/annees");
    revalidatePath("/", "layout");
    return { success: true, message: "Exercice cloture.", data: null };
  } catch (error: unknown) {
    return { success: false, message: (error instanceof Error ? error.message : "Erreur cloture.") };
  }
}

/* ───── Modification ───── */

export async function updateAnnee(
  id: string,
  input: { debut: string; fin: string }
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const annee = await Annee.findOne({ _id: id, tenantId }).lean();
    if (!annee) {
      return { success: false, message: "Exercice introuvable." };
    }

    if (annee.status !== "PENDING" || annee.provider?.status === "PAID" || annee.provider?.orderNumber) {
      return { success: false, message: "Les dates d’un exercice payé ou en cours de paiement ne peuvent pas être modifiées." };
    }

    const errors: Record<string, string> = {};
    const parsedDebut = new Date(input.debut);
    const parsedFin = new Date(input.fin);

    if (isNaN(parsedDebut.getTime())) errors.debut = "Date de debut invalide.";
    if (isNaN(parsedFin.getTime())) errors.fin = "Date de fin invalide.";

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Champs invalides.", errors };
    }

    const anneeNumerique = parsedDebut.getFullYear();

    /* Forcer les dates à 1er janvier / 31 décembre de l'année extraite */
    const debut = new Date(Date.UTC(anneeNumerique, 0, 1));
    const fin = new Date(Date.UTC(anneeNumerique, 11, 31, 23, 59, 59, 999));

    /* Vérifier l'unicité par année calendaire (exclure cet exercice) */
    const duplicate = await Annee.findOne({
      tenantId,
      _id: { $ne: new Types.ObjectId(id) },
      debut: { $gte: new Date(anneeNumerique, 0, 1), $lt: new Date(anneeNumerique + 1, 0, 1) },
    }).lean();
    if (duplicate) {
      return { success: false, message: "Un exercice pour cette annee calendaire existe deja." };
    }

    await Annee.updateOne({ _id: id, tenantId, status: "PENDING", "provider.status": { $ne: "PAID" }, "provider.orderNumber": null }, { $set: { debut, fin, slug: slugify(`${anneeNumerique}-${anneeNumerique}`) } });

    revalidatePath("/annees");

    return { success: true, message: "Exercice mis a jour.", data: null };
  } catch (error: unknown) {
    return { success: false, message: (error instanceof Error ? error.message : "Erreur modification.") };
  }
}

/* ───── Suppression ───── */

export async function deleteAnnee(id: string): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const annee = await Annee.findOne({ _id: id, tenantId }).lean();
    if (!annee) {
      return { success: false, message: "Exercice introuvable." };
    }

    if (annee.status !== "PENDING" || annee.provider?.status === "PAID" || annee.provider?.orderNumber || annee.upgrade) {
      return { success: false, message: "Un exercice payé ou contenant un paiement ne peut pas être supprimé. Clôturez-le." };
    }
    const [hasOrders, hasExpenses] = await Promise.all([
      Commande.exists({ tenantId, anneeId: id }), Depense.exists({ tenantId, anneeId: id }),
    ]);
    if (hasOrders || hasExpenses) return { success: false, message: "Impossible de supprimer un exercice contenant des opérations." };
    const deleted = await Annee.deleteOne({ _id: id, tenantId, status: "PENDING", "provider.status": { $ne: "PAID" }, "provider.orderNumber": null, upgrade: { $exists: false } });
    if (!deleted.deletedCount) return { success: false, message: "L’exercice a changé. Actualisez la page." };

    revalidatePath("/annees");

    return { success: true, message: "Exercice supprime.", data: null };
  } catch (error: unknown) {
    return { success: false, message: (error instanceof Error ? error.message : "Erreur suppression.") };
  }
}

/** Devis signé, lié au tenant et à l'état courant ; montant figé dix minutes. */
export async function previewUpgradePrice(anneeId: string, target: Plan) {
  try {
    const { tenantId } = await requireTenantSession();
    if (!Types.ObjectId.isValid(anneeId) || !isPlan(target)) throw new Error("Demande invalide.");
    const annee = await Annee.findOne({ _id: anneeId, tenantId, status: "ACTIVE", "provider.status": "PAID" }).lean();
    if (!annee) throw new Error("Abonnement actif introuvable.");
    const quotedAt = Date.now();
    const quote = { tenantId, anneeId, from: annee.plan ?? "STARTER", target,
      amount: upgradePrice(annee.plan ?? "STARTER", target, annee.debut, annee.fin, new Date(quotedAt)),
      periodStart: annee.debut.toISOString(), periodEnd: annee.fin.toISOString(), quotedAt, expiresAt: quotedAt + 600_000 };
    if (quote.amount <= 0) throw new Error("Période restante trop courte.");
    return { success: true as const, data: { amount: quote.amount, token: signUpgradeQuote(quote, getSessionSecret()), expiresAt: quote.expiresAt } };
  } catch (error) { return { success: false as const, message: error instanceof Error ? error.message : "Devis impossible." }; }
}

/** L'ancienne formule reste active jusqu'à confirmation FlexPay. */
export async function upgradeSubscription(input: { anneeId: string; target: Plan; phone: string; quoteToken: string }) {
  try {
    const { tenantId } = await requireTenantSession();
    if (!Types.ObjectId.isValid(input.anneeId) || !isPlan(input.target)) throw new Error("Demande invalide.");
    if (!input.phone || input.phone.trim().length < 8) throw new Error("Téléphone invalide.");
    const quote = verifyUpgradeQuote(input.quoteToken, getSessionSecret());
    if (quote.tenantId !== tenantId || quote.anneeId !== input.anneeId || quote.target !== input.target) throw new Error("Devis invalide.");
    const reference = `UPGRADE-${input.anneeId}-${randomUUID()}`;
    const filter = { _id: input.anneeId, tenantId, status: "ACTIVE" as const, "provider.status": "PAID" as const,
      debut: new Date(quote.periodStart), fin: new Date(quote.periodEnd),
      ...(quote.from === "STARTER" ? { $or: [{ plan: "STARTER" as const }, { plan: { $exists: false } }] } : { plan: quote.from }),
      "upgrade.status": { $ne: "PENDING" as const } };
    const previous = await Annee.findOne(filter).lean();
    if (!previous) throw new Error("Formule modifiée ou paiement déjà en attente. Actualisez le devis.");
    const reserved = await Annee.updateOne({ ...filter, "upgrade.reference": previous.upgrade?.reference ?? { $exists: false } }, {
      $set: { upgrade: { from: quote.from, target: input.target, amount: quote.amount, currency: "USD", reference, status: "PENDING", orderNumber: null, createdAt: new Date() } },
      ...(previous.upgrade ? { $push: { upgradeHistory: previous.upgrade } } : {}),
    });
    if (!reserved.modifiedCount) throw new Error("Un upgrade est déjà en attente. Vérifiez son paiement.");
    try {
      const result = await initiateCollection({ phone: input.phone.trim(), amount: quote.amount, currency: "USD", reference });
      const initiated = Boolean(result.success && result.orderNumber);
      const uncertain = !initiated && !result.raw && !/n.est pas d.fini/.test(result.error ?? "");
      await Annee.updateOne({ _id: input.anneeId, tenantId, "upgrade.reference": reference, "upgrade.status": "PENDING" }, { $set: {
        "upgrade.orderNumber": result.orderNumber ?? null,
        "upgrade.status": initiated || uncertain ? "PENDING" : "FAILED",
        "upgrade.message": result.message ?? result.error ?? "Paiement non initié.",
      } });
      revalidatePath("/annees");
      return { success: initiated, message: initiated ? `Validez ${quote.amount} USD sur votre téléphone.` : uncertain ? "Réponse du prestataire inconnue. Ne repayez pas : renseignez le numéro de transaction reçu pour vérifier, ou contactez le support." : "Paiement non initié. Réessayez." };
    } catch (error) {
      await Annee.updateOne({ _id: input.anneeId, tenantId, "upgrade.reference": reference, "upgrade.status": "PENDING", "upgrade.orderNumber": null }, { $set: { "upgrade.message": "Initiation interrompue. Ne repayez pas avant rapprochement du prestataire." } });
      throw error;
    }
  } catch (error) { return { success: false, message: error instanceof Error ? error.message : "Upgrade impossible." }; }
}

export async function verifyUpgradePayment(anneeId: string, receivedOrderNumber?: string) {
  try {
    const { tenantId } = await requireTenantSession();
    if (!Types.ObjectId.isValid(anneeId)) throw new Error("Exercice invalide.");
    const annee = await Annee.findOne({ _id: anneeId, tenantId }).lean();
    if (!annee?.upgrade) throw new Error("Aucun paiement à vérifier.");
    const orderNumber = annee.upgrade.orderNumber || receivedOrderNumber?.trim();
    if (!orderNumber || orderNumber.length > 200) throw new Error("Renseignez le numéro de transaction reçu ou contactez le support.");
    const result = await checkStatus(orderNumber);
    if (!result.success) throw new Error("Vérification impossible.");
    const { applyUpgradePayment } = await import("@/lib/payments/flexpay-results");
    const applied = await applyUpgradePayment(anneeId, annee.upgrade.reference, result, tenantId);
    return { success: applied.state === "PAID", message: applied.message };
  } catch (error) { return { success: false, message: error instanceof Error ? error.message : "Vérification impossible." }; }
}
