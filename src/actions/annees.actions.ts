"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Annee from "@/lib/models/Annee";
import Commande from "@/lib/models/Commande";
import Depense from "@/lib/models/Depense";
import { checkStatus, initiateCollection } from "@/lib/utils/payment.service";

export type ActionResponse<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string> };

/* ───── Types ───── */

export interface AnneeListItem {
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

function getSubscriptionAmount(currency: "USD" | "CDF") {
  const taux = Number.parseFloat(process.env.TAUX ?? "0");
  return currency === "CDF" && taux > 0
    ? ({ amount: Math.round(50 * taux), currency: "CDF" } as const)
    : ({ amount: 50, currency: "USD" } as const);
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
    const [recettesAgg] = await Commande.aggregate([
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
          total: { $sum: { $sum: "$commandes.qte" } },
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
            $sum: { $cond: [{ $eq: ["$depenses.currency", "USD"] }, "$depenses.amount", 0] },
          },
          totalCDF: {
            $sum: { $cond: [{ $eq: ["$depenses.currency", "CDF"] }, "$depenses.amount", 0] },
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
        totalRecettesUSD: recettesAgg?.total ?? 0,
        totalRecettesCDF: 0,
        totalDepensesUSD: depensesAgg?.totalUSD ?? 0,
        totalDepensesCDF: depensesAgg?.totalCDF ?? 0,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur metriques." };
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
              total: { $sum: { $sum: "$commandes.qte" } },
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
              total: { $sum: "$depenses.amount" },
              nbDepenses: { $sum: 1 },
            },
          },
        ]);

        const totalRecettes = recettesAgg?.total ?? 0;
        const totalDepenses = depensesAgg?.total ?? 0;

        return {
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
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur liste." };
  }
}

/* ───── Création ───── */

export async function createAnnee(input: {
  debut: string;
  fin: string;
  phone: string;
  currency: "USD" | "CDF";
}): Promise<ActionResponse<{ id: string; paymentInitiated: boolean }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const errors: Record<string, string> = {};

    const debut = new Date(input.debut);
    const fin = new Date(input.fin);

    if (isNaN(debut.getTime())) errors.debut = "Date de debut invalide.";
    if (isNaN(fin.getTime())) errors.fin = "Date de fin invalide.";
    if (!isNaN(debut.getTime()) && !isNaN(fin.getTime()) && fin <= debut) {
      errors.fin = "La date de fin doit etre posterieure a la date de debut.";
    }
    if (!input.phone || input.phone.trim().length < 8) {
      errors.phone = "Numero de telephone invalide.";
    }
    if (!["USD", "CDF"].includes(input.currency)) {
      errors.currency = "Devise invalide.";
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Champs invalides.", errors };
    }

    const slug = slugify(`${debut.getFullYear()}-${fin.getFullYear()}`);

    const existing = await Annee.findOne({ tenantId, slug }).lean();
    if (existing) {
      return { success: false, message: "Un exercice avec ce slug existe deja." };
    }

    const payment = getSubscriptionAmount(input.currency);
    const annee = await Annee.create({
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
        amount: payment.amount,
        currency: payment.currency,
        paidAt: null,
      },
    });

    const paymentResult = await initiateCollection({
      phone: input.phone.trim(),
      amount: payment.amount,
      reference: `ANNEE-${annee._id.toString()}`,
      currency: payment.currency,
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

    revalidatePath("/annees");

    return {
      success: true,
      message: paymentInitiated
        ? "Exercice cree, paiement initie."
        : "Exercice cree, mais le paiement n'a pas pu etre initie.",
      data: { id: annee._id.toString(), paymentInitiated },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur creation." };
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

    const payment = getSubscriptionAmount(input.currency);
    const result = await initiateCollection({
      phone: input.phone.trim(),
      amount: payment.amount,
      reference: `ANNEE-${annee._id.toString()}`,
      currency: payment.currency,
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
            amount: payment.amount,
            currency: payment.currency,
            paidAt: null,
          },
        },
      }
    );
    revalidatePath("/annees");

    if (!initiated || !result.orderNumber) {
      return { success: false, message: result.error ?? "Echec de l'initiation du paiement." };
    }
    return { success: true, message: "Paiement initie.", data: { orderNumber: result.orderNumber } };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur paiement." };
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

    if (result.status === "SUCCES") {
      await Annee.updateOne(
        { _id: anneeId, tenantId, status: "PENDING" },
        {
          $set: {
            status: "ACTIVE",
            "provider.status": "PAID",
            "provider.message": result.message ?? "Paiement confirme.",
            "provider.paidAt": new Date(),
          },
        }
      );
      revalidatePath("/annees");
      revalidatePath("/", "layout");
      return { success: true, message: "Paiement confirme, exercice actif.", data: { status: "ACTIVE" } };
    }

    const failed = result.status === "ECHEC";
    await Annee.updateOne(
      { _id: anneeId, tenantId },
      {
        $set: {
          "provider.status": failed ? "FAILED" : "PENDING",
          "provider.message": result.message ?? (failed ? "Paiement echoue." : "Paiement en attente."),
        },
      }
    );
    revalidatePath("/annees");
    return {
      success: true,
      message: failed ? "Le paiement a echoue." : "Paiement toujours en attente.",
      data: { status: "PENDING" },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur verification." };
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
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur cloture." };
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

    const errors: Record<string, string> = {};
    const debut = new Date(input.debut);
    const fin = new Date(input.fin);

    if (isNaN(debut.getTime())) errors.debut = "Date de debut invalide.";
    if (isNaN(fin.getTime())) errors.fin = "Date de fin invalide.";
    if (!isNaN(debut.getTime()) && !isNaN(fin.getTime()) && fin <= debut) {
      errors.fin = "La date de fin doit etre posterieure a la date de debut.";
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Champs invalides.", errors };
    }

    await Annee.updateOne({ _id: id }, { $set: { debut, fin } });

    revalidatePath("/annees");

    return { success: true, message: "Exercice mis a jour.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur modification." };
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

    /* Vérifier s'il y a des commandes ou dépenses liées */
    const [hasData] = await Commande.aggregate([
      { $match: { anneeId: new Types.ObjectId(id) } },
      { $limit: 1 },
      { $count: "count" },
    ]);

    if (hasData?.count > 0) {
      return {
        success: false,
        message: "Impossible de supprimer un exercice contenant des commandes.",
      };
    }

    await Annee.deleteOne({ _id: id });

    revalidatePath("/annees");

    return { success: true, message: "Exercice supprime.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur suppression." };
  }
}
