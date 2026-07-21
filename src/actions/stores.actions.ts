"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { randomBytes } from "node:crypto";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Store from "@/lib/models/Store";
import Product from "@/lib/models/Product";
import Annee from "@/lib/models/Annee";
import Stock from "@/lib/models/Stock";
import Commande from "@/lib/models/Commande";
import Depense from "@/lib/models/Depense";
import { Saler } from "@/lib/models/User";
import {
  initiateCollection,
  checkStatus,
} from "@/lib/utils/payment.service";

export type ActionResponse<T = undefined> =
  | { success: true; message: string; data: T; errors?: Record<string, string> }
  | { success: false; message: string; errors?: Record<string, string> };

/* ───── Types ───── */

export interface StoreListItem {
  id: string;
  designation: string;
  description: string;
  reference: string;
  status: string;
  createdAt: string;
  coordonnes: Array<{ title: string; content: string }>;
  photos: Array<{ title: string; url: string }>;
  capitals: Array<{
    id: string;
    anneeId: string;
    amount: number;
    currency: string;
    status: string;
  }>;
  payment: {
    amount: number;
    currency: string;
    orderNumber: string;
    status: string;
    paidAt: string | null;
  } | null;
  nbAgents: number;
  nbProducts: number;
  chiffreAffaires: number;
  depenses: number;
}

export interface StoreMetrics {
  total: number;
  actives: number;
  inactives: number;
  totalAgents: number;
}

export interface PaginatedStores {
  items: StoreListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ───── Helpers ───── */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ───── Métriques ───── */

export async function getStoreMetrics(): Promise<ActionResponse<StoreMetrics>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const tenantOid = new Types.ObjectId(tenantId);

    const [counts] = await Store.aggregate([
      { $match: { tenantId: tenantOid } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          actives: {
            $sum: { $cond: [{ $in: ["$status", ["ACTIVE", "PENDING_PAYMENT"]] }, 1, 0] },
          },
          inactives: {
            $sum: {
              $cond: [{ $in: ["$status", ["INACTIVE", "ARCHIVED"]] }, 1, 0],
            },
          },
        },
      },
    ]);

    const [agentCount] = await Saler.aggregate([
      { $match: { tenantId: tenantOid, storeId: { $ne: null } } },
      { $count: "total" },
    ]);

    return {
      success: true,
      message: "Metriques recuperees.",
      data: {
        total: counts?.total ?? 0,
        actives: counts?.actives ?? 0,
        inactives: counts?.inactives ?? 0,
        totalAgents: agentCount?.total ?? 0,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur metriques." };
  }
}

/* ───── Liste paginée ───── */

export async function getStores(
  page: number = 1,
  limit: number = 12,
  search: string = "",
  status: string = ""
): Promise<ActionResponse<PaginatedStores>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const safePage = Math.max(1, Math.min(page, 100));
    const safeLimit = Math.max(1, Math.min(limit, 50));
    const skip = (safePage - 1) * safeLimit;

    const tenantOid = new Types.ObjectId(tenantId);

    const match: Record<string, unknown> = { tenantId: tenantOid };
    if (
      status &&
      ["ACTIVE", "INACTIVE", "ARCHIVED"].includes(status)
    ) {
      match.status = status === "ACTIVE"
        ? { $in: ["ACTIVE", "PENDING_PAYMENT"] }
        : status;
    }
    if (search && search.length >= 2) {
      const escaped = escapeRegExp(search.slice(0, 80));
      match.$or = [
        { designation: { $regex: escaped, $options: "i" } },
        { reference: { $regex: escaped, $options: "i" } },
      ];
    }

    const [totalResult] = await Store.aggregate([
      { $match: { tenantId: tenantOid } },
      { $count: "total" },
    ]);

    const total = totalResult?.total ?? 0;
    const totalPages = Math.ceil(total / safeLimit) || 1;

    const stores = await Store.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    const items = await Promise.all(
      stores.map(async (store) => {
        const storeOid = store._id;

        /* Agents */
        const [agentsAgg] = await Saler.aggregate([
          { $match: { storeId: storeOid, tenantId: tenantOid } },
          { $count: "total" },
        ]);

        /* Produits (stocks) */
        const [stocksAgg] = await Stock.aggregate([
          { $match: { shopId: storeOid } },
          { $unwind: "$stocks" },
          { $group: { _id: null, products: { $addToSet: "$stocks.product" } } },
        ]);

        /* Chiffre d'affaires */
        const [ca] = await Commande.aggregate([
          {
            $match: {
              shopId: storeOid,
              status: { $nin: ["CANCELLED", "DRAFT"] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $sum: "$commandes.qte" } },
            },
          },
        ]);

        /* Dépenses */
        const [depAgg] = await Depense.aggregate([
          { $match: { shopId: storeOid } },
          { $unwind: "$depenses" },
          { $match: { "depenses.status": { $nin: ["REJECTED"] } } },
          { $group: { _id: null, total: { $sum: "$depenses.amount" } } },
        ]);

        return {
          id: store._id.toString(),
          designation: store.designation,
          description: store.description,
          reference: store.reference,
          status: store.status === "PENDING_PAYMENT" ? "ACTIVE" : store.status,
          createdAt: store.createdAt.toISOString(),
          coordonnes: store.coordonnes ?? [],
          photos: store.photos ?? [],
          capitals: (store.capitals ?? []).map((capital) => ({
            id: (capital as any)._id.toString(),
            anneeId: capital.anneeId.toString(),
            amount: capital.amount,
            currency: capital.currency,
            status: capital.status,
          })),
          payment: store.payment
            ? {
                amount: store.payment.amount,
                currency: store.payment.currency,
                orderNumber: store.payment.orderNumber,
                status: store.payment.status,
                paidAt: store.payment.paidAt?.toISOString() ?? null,
              }
            : null,
          nbAgents: agentsAgg?.total ?? 0,
          nbProducts: stocksAgg?.products?.length ?? 0,
          chiffreAffaires: ca?.total ?? 0,
          depenses: depAgg?.total ?? 0,
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

/* ───── Étape 1: Création de la boutique (info) ───── */

export async function createStoreStep1(input: {
  designation: string;
  description: string;
  coordonnes?: Array<{ title: string; content: string }>;
  photos?: Array<{ title: string; url: string }>;
  phone?: string;
}): Promise<ActionResponse<{ storeId: string; reference: string }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const errors: Record<string, string> = {};

    if (!input.designation || input.designation.trim().length < 2) {
      errors.designation = "La designation est requise.";
    }
    if (!input.description || input.description.trim().length < 2) {
      errors.description = "La description est requise.";
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Champs invalides.", errors };
    }

    /* Générer une référence unique */
    let reference = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const ref = `ST-${randomBytes(4).toString("hex").toUpperCase()}`;
      const exists = await Store.findOne({ reference: ref }).lean();
      if (!exists) {
        reference = ref;
        break;
      }
    }

    if (!reference) {
      return { success: false, message: "Impossible de generer une reference." };
    }

    const store = await Store.create({
      tenantId: new Types.ObjectId(tenantId),
      designation: input.designation.trim(),
      description: input.description.trim(),
      coordonnes: input.coordonnes ?? [],
      photos: input.photos ?? [],
      reference,
      status: "ACTIVE",
      capitals: [],
      caisses: [],
    });

    return {
      success: true,
      message: "Boutique creee.",
      data: {
        storeId: store._id.toString(),
        reference: store.reference,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur creation." };
  }
}

/* ───── Étape 2: Initier le paiement FlexPay ───── */

export async function initiateStorePayment(input: {
  storeId: string;
  currency: "USD" | "CDF";
  phone: string;
}): Promise<
  ActionResponse<{ orderNumber: string; amount: number; currency: string }>
> {
  void input;
  return {
    success: false,
    message: "La facturation est desormais geree par exercice comptable.",
  };
  /* Ancien workflow conserve temporairement pour compatibilite des donnees. */
  // try {
  //   const { tenantId } = await requireTenantSession();
  //   await connectToDb();

  //   if (!Types.ObjectId.isValid(input.storeId)) {
  //     return { success: false, message: "Boutique invalide." };
  //   }

  //   const store = await Store.findOne({
  //     _id: input.storeId,
  //     tenantId,
  //   }).lean();

  //   if (!store) {
  //     return { success: false, message: "Boutique introuvable." };
  //   }

  //   if (store!.payment?.status === "PAID") {
  //     return { success: false, message: "Cette boutique est deja payee." };
  //   }

  //   if (store!.payment?.orderNumber) {
  //     /* Ne pas créer une nouvelle transaction si une existe déjà */
  //     return {
  //       success: true,
  //       message: "Paiement deja initie.",
  //       data: {
  //         orderNumber: store!.payment.orderNumber!,
  //         amount: store!.payment.amount!,
  //         currency: store!.payment.currency!,
  //       },
  //     };
  //   }

  //   const tauxStr = process.env.TAUX;
  //   const taux = tauxStr ? parseFloat(tauxStr) : 0;

  //   let amount: number;
  //   let currency: "USD" | "CDF";

  //   if (input.currency === "CDF" && taux > 0) {
  //     amount = Math.round(50 * taux);
  //     currency = "CDF";
  //   } else {
  //     amount = 50;
  //     currency = "USD";
  //   }

  //   if (amount <= 0) {
  //     return { success: false, message: "Montant invalide." };
  //   }

  //   if (!input.phone || input.phone.trim().length < 8) {
  //     return { success: false, message: "Numero de telephone invalide." };
  //   }

  //   /* Appel FlexPay */
  //   const paymentResult = await initiateCollection({
  //     phone: input.phone.trim(),
  //     amount,
  //     reference: store.reference!,
  //     currency,
  //   });

  //   if (!paymentResult.success || !paymentResult.orderNumber) {
  //     return {
  //       success: false,
  //       message: paymentResult.error || "Echec du paiement.",
  //     };
  //   }

  //   /* Enregistrer la tentative de paiement */
  //   await Store.updateOne(
  //     { _id: input.storeId },
  //     {
  //       $set: {
  //         payment: {
  //           amount,
  //           currency,
  //           orderNumber: paymentResult.orderNumber,
  //           provider: "FLEXPAY",
  //           status: "PENDING",
  //           paidAt: null,
  //         },
  //       },
  //     }
  //   );

  //   revalidatePath("/stores");

  //   return {
  //     success: true,
  //     message: "Paiement initie.",
  //     data: {
  //       orderNumber: paymentResult.orderNumber,
  //       amount,
  //       currency,
  //     },
  //   };
  // } catch (error: any) {
  //   return { success: false, message: error.message || "Erreur paiement." };
  // }
}

/* ───── Étape 3: Vérification du paiement ───── */

export async function verifyStorePayment(
  storeId: string
): Promise<ActionResponse<{ status: string; paid: boolean }>> {
  void storeId;
  return {
    success: false,
    message: "La facturation est desormais geree par exercice comptable.",
  };
  /* Ancien workflow conserve temporairement pour compatibilite des donnees. */
  // try {
  //   const { tenantId } = await requireTenantSession();
  //   await connectToDb();

  //   if (!Types.ObjectId.isValid(storeId)) {
  //     return { success: false, message: "Boutique invalide." };
  //   }

  //   const store = await Store.findOne({ _id: storeId, tenantId }).lean();

  //   if (!store) {
  //     return { success: false, message: "Boutique introuvable." };
  //   }

  //   if (!store.payment?.orderNumber) {
  //     return { success: false, message: "Aucun paiement initie." };
  //   }

  //   if (store.payment?.status === "PAID") {
  //     return {
  //       success: true,
  //       message: "Boutique deja active.",
  //       data: { status: "PAID", paid: true },
  //     };
  //   }

  //   /* Vérification via FlexPay */
  //   const statusResult = await checkStatus(store.payment.orderNumber);

  //   if (!statusResult.success) {
  //     return {
  //       success: false,
  //       message: statusResult.error || "Impossible de verifier le paiement.",
  //     };
  //   }

  //   if (statusResult.status === "SUCCES") {
  //     await Store.updateOne(
  //       { _id: storeId },
  //       {
  //         $set: {
  //           status: "ACTIVE",
  //           "payment.status": "PAID",
  //           "payment.paidAt": new Date(),
  //         },
  //       }
  //     );

  //     revalidatePath("/stores");

  //     return {
  //       success: true,
  //       message: "Paiement confirme, boutique active.",
  //       data: { status: "PAID", paid: true },
  //     };
  //   }

  //   if (statusResult.status === "ECHEC") {
  //     await Store.updateOne(
  //       { _id: storeId },
  //       { $set: { "payment.status": "FAILED" } }
  //     );

  //     revalidatePath("/stores");

  //     return {
  //       success: true,
  //       message: "Le paiement a echoue.",
  //       data: { status: "FAILED", paid: false },
  //     };
  //   }

  //   return {
  //     success: true,
  //     message: "Paiement en attente de confirmation.",
  //     data: { status: "PENDING", paid: false },
  //   };
  // } catch (error: any) {
  //   return { success: false, message: error.message || "Erreur verification." };
  // }
}

/* ───── Mise à jour boutique ───── */

export async function updateStore(
  id: string,
  input: {
    designation?: string;
    description?: string;
    coordonnes?: Array<{ title: string; content: string }>;
    photos?: Array<{ title: string; url: string }>;
    status?: string;
  }
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const store = await Store.findOne({ _id: id, tenantId }).lean();
    if (!store) {
      return { success: false, message: "Boutique introuvable." };
    }

    const update: Record<string, unknown> = {};
    if (input.designation) update.designation = input.designation.trim();
    if (input.description) update.description = input.description.trim();
    if (input.coordonnes) update.coordonnes = input.coordonnes;
    if (input.photos) update.photos = input.photos;
    if (input.status) update.status = input.status;

    await Store.updateOne({ _id: id }, { $set: update });

    revalidatePath("/stores");

    return { success: true, message: "Boutique mise a jour.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur mise a jour." };
  }
}

/* ───── Suppression / Archivage ───── */

export async function archiveStore(id: string): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const store = await Store.findOne({ _id: id, tenantId }).lean();
    if (!store) {
      return { success: false, message: "Boutique introuvable." };
    }

    await Store.updateOne({ _id: id }, { $set: { status: "ARCHIVED" } });

    revalidatePath("/stores");

    return { success: true, message: "Boutique archivee.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur archivage." };
  }
}

type StoreCapitalInput = {
  anneeId: string;
  amount: number;
  currency: "USD" | "CDF";
  status?: "PENDING" | "ACTIVE" | "CLOSED" | "CANCELLED";
};

async function validateCapitalScope(
  tenantId: string,
  storeId: string,
  input: StoreCapitalInput
): Promise<ActionResponse<{ storeId: Types.ObjectId; anneeId: Types.ObjectId }>> {
  if (!Types.ObjectId.isValid(storeId) || !Types.ObjectId.isValid(input.anneeId)) {
    return { success: false, message: "Boutique ou exercice invalide." };
  }
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    return { success: false, message: "Le montant du capital est invalide." };
  }
  if (!["USD", "CDF"].includes(input.currency)) {
    return { success: false, message: "Devise invalide." };
  }

  const tenantOid = new Types.ObjectId(tenantId);
  const storeOid = new Types.ObjectId(storeId);
  const anneeOid = new Types.ObjectId(input.anneeId);
  const [store, annee] = await Promise.all([
    Store.findOne({ _id: storeOid, tenantId: tenantOid }).select("_id").lean(),
    Annee.findOne({
      _id: anneeOid,
      tenantId: tenantOid,
      status: { $in: ["ACTIVE", null] },
    })
      .select("_id")
      .lean(),
  ]);
  if (!store) return { success: false, message: "Boutique introuvable." };
  if (!annee) return { success: false, message: "L'exercice doit etre actif." };
  return { success: true, message: "Perimetre valide.", data: { storeId: storeOid, anneeId: anneeOid } };
}

export async function addStoreCapital(
  storeId: string,
  input: StoreCapitalInput
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();
    const scope = await validateCapitalScope(tenantId, storeId, input);
    if (!scope.success) return scope;

    const exists = await Store.exists({
      _id: scope.data.storeId,
      tenantId: new Types.ObjectId(tenantId),
      capitals: { $elemMatch: { anneeId: scope.data.anneeId } },
    });
    if (exists) {
      return { success: false, message: "Un capital existe deja pour cet exercice." };
    }

    await Store.updateOne(
      { _id: scope.data.storeId, tenantId: new Types.ObjectId(tenantId) },
      {
        $push: {
          capitals: {
            anneeId: scope.data.anneeId,
            amount: input.amount,
            currency: input.currency,
            status: input.status ?? "ACTIVE",
          },
        },
      }
    );
    revalidatePath("/stores");
    return { success: true, message: "Capital ajoute.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur ajout capital." };
  }
}

export async function updateStoreCapital(
  storeId: string,
  capitalId: string,
  input: StoreCapitalInput
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();
    if (!Types.ObjectId.isValid(capitalId)) {
      return { success: false, message: "Capital invalide." };
    }
    const scope = await validateCapitalScope(tenantId, storeId, input);
    if (!scope.success) return scope;

    const duplicate = await Store.exists({
      _id: scope.data.storeId,
      tenantId: new Types.ObjectId(tenantId),
      capitals: {
        $elemMatch: {
          anneeId: scope.data.anneeId,
          _id: { $ne: new Types.ObjectId(capitalId) },
        },
      },
    });
    if (duplicate) {
      return { success: false, message: "Un capital existe deja pour cet exercice." };
    }

    const result = await Store.updateOne(
      {
        _id: scope.data.storeId,
        tenantId: new Types.ObjectId(tenantId),
        "capitals._id": new Types.ObjectId(capitalId),
      },
      {
        $set: {
          "capitals.$.anneeId": scope.data.anneeId,
          "capitals.$.amount": input.amount,
          "capitals.$.currency": input.currency,
          "capitals.$.status": input.status ?? "ACTIVE",
        },
      }
    );
    if (result.modifiedCount !== 1) {
      return { success: false, message: "Capital introuvable ou inchange." };
    }
    revalidatePath("/stores");
    return { success: true, message: "Capital modifie.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur modification capital." };
  }
}

export async function deleteStoreCapital(
  storeId: string,
  capitalId: string
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();
    if (!Types.ObjectId.isValid(storeId) || !Types.ObjectId.isValid(capitalId)) {
      return { success: false, message: "Boutique ou capital invalide." };
    }
    const result = await Store.updateOne(
      { _id: storeId, tenantId: new Types.ObjectId(tenantId) },
      { $pull: { capitals: { _id: new Types.ObjectId(capitalId) } } }
    );
    if (result.modifiedCount !== 1) {
      return { success: false, message: "Capital introuvable." };
    }
    revalidatePath("/stores");
    return { success: true, message: "Capital supprime.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur suppression capital." };
  }
}

/* ───── Association de produits (Stock) ───── */

export async function associateProductsWithStore(
  storeId: string,
  productIds: string[],
  anneeId: string
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(storeId)) {
      return { success: false, message: "Boutique invalide." };
    }

    const store = await Store.findOne({ _id: storeId, tenantId }).lean();
    if (!store) {
      return { success: false, message: "Boutique introuvable." };
    }

    if (!Types.ObjectId.isValid(anneeId)) {
      return { success: false, message: "Exercice invalide." };
    }

    const annee = await Annee.findOne({
      _id: anneeId,
      tenantId: new Types.ObjectId(tenantId),
      status: { $in: ["ACTIVE", null] },
    })
      .select("_id")
      .lean();
    if (!annee) {
      return { success: false, message: "L'exercice doit etre actif." };
    }

    /* Vérifier que les produits appartiennent au tenant */
    const products = await Product.find({
      _id: { $in: productIds.map((id) => new Types.ObjectId(id)) },
      tenantId: new Types.ObjectId(tenantId),
    })
      .select("_id")
      .lean();

    const validProductIds = products.map((p) => p._id);

    /* Chercher un stock existant pour cette boutique et exercice */
    let stock = await Stock.findOne({
      shopId: new Types.ObjectId(storeId),
      anneeId: new Types.ObjectId(anneeId),
    }).lean();

    if (stock) {
      /* Ajouter les produits qui ne sont pas déjà dans le stock */
      const existingProductIds = stock.stocks.map((s) => s.product.toString());
      const newItems = validProductIds
        .filter((pid) => !existingProductIds.includes(pid.toString()))
        .map((pid) => ({ product: pid, qte: 0 }));

      if (newItems.length > 0) {
        await Stock.updateOne(
          { _id: stock._id },
          { $push: { stocks: { $each: newItems } } }
        );
      }
    } else {
      /* Créer un nouveau stock */
      const ref = `STK-${randomBytes(4).toString("hex").toUpperCase()}`;
      await Stock.create({
        stocks: validProductIds.map((pid) => ({ product: pid, qte: 0 })),
        anneeId: new Types.ObjectId(anneeId),
        shopId: new Types.ObjectId(storeId),
        reference: ref,
        status: "ACTIVE",
      });
    }

    revalidatePath("/stores");

    return {
      success: true,
      message: "Produits associes a la boutique.",
      data: null,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Erreur association.",
    };
  }
}

/* ───── Récupération des produits associés ───── */

export async function getStoreProducts(
  storeId: string
): Promise<
  ActionResponse<
    Array<{
      productId: string;
      designation: string;
      qte: number;
      anneeId: string;
      anneeLabel: string;
    }>
  >
> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(storeId)) {
      return { success: false, message: "Boutique invalide." };
    }

    const store = await Store.findOne({ _id: storeId, tenantId }).lean();
    if (!store) {
      return { success: false, message: "Boutique introuvable." };
    }

    const stocks = await Stock.find({
      shopId: new Types.ObjectId(storeId),
    })
      .populate({ path: "anneeId", select: "debut fin" })
      .populate({
        path: "stocks.product",
        select: "designation code",
      })
      .lean();

    const items = stocks.flatMap((stock) =>
      stock.stocks.map((s) => ({
        productId: (s.product as any)?._id?.toString() ?? "",
        designation: (s.product as any)?.designation ?? "Inconnu",
        qte: s.qte,
        anneeId: (stock.anneeId as any)?._id?.toString() ?? stock.anneeId.toString(),
        anneeLabel:
          (stock.anneeId as any)?.debut && (stock.anneeId as any)?.fin
            ? `${new Date((stock.anneeId as any).debut).getFullYear()} - ${new Date((stock.anneeId as any).fin).getFullYear()}`
            : "Exercice",
      }))
    );

    return {
      success: true,
      message: "Produits recuperes.",
      data: items,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Erreur recuperation.",
    };
  }
}

export async function removeProductFromStore(
  storeId: string,
  productId: string,
  anneeId: string
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (
      !Types.ObjectId.isValid(storeId) ||
      !Types.ObjectId.isValid(productId) ||
      !Types.ObjectId.isValid(anneeId)
    ) {
      return { success: false, message: "Boutique, produit ou exercice invalide." };
    }

    const tenantOid = new Types.ObjectId(tenantId);
    const storeOid = new Types.ObjectId(storeId);
    const productOid = new Types.ObjectId(productId);
    const anneeOid = new Types.ObjectId(anneeId);
    const [store, product, annee] = await Promise.all([
      Store.findOne({ _id: storeOid, tenantId: tenantOid }).select("_id").lean(),
      Product.findOne({ _id: productOid, tenantId: tenantOid }).select("_id").lean(),
      Annee.findOne({ _id: anneeOid, tenantId: tenantOid }).select("_id").lean(),
    ]);
    if (!store) return { success: false, message: "Boutique introuvable." };
    if (!product) return { success: false, message: "Produit introuvable." };
    if (!annee) return { success: false, message: "Exercice introuvable." };

    const stock = await Stock.findOne({
      shopId: storeOid,
      anneeId: anneeOid,
      stocks: { $elemMatch: { product: productOid } },
    })
      .select("stocks")
      .lean();
    if (!stock) return { success: false, message: "Produit non associe a cette boutique." };

    const stockItem = stock.stocks.find((item) => item.product.toString() === productId);
    if ((stockItem?.qte ?? 0) > 0) {
      return {
        success: false,
        message: "Impossible de retirer un produit dont la quantite en stock est superieure a zero.",
      };
    }

    await Stock.updateOne(
      { _id: stock._id, shopId: storeOid, anneeId: anneeOid },
      { $pull: { stocks: { product: productOid } } }
    );
    revalidatePath("/stores");
    return { success: true, message: "Produit retire de la boutique.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur retrait produit." };
  }
}

export async function updateStoreProductQuantity(
  storeId: string,
  productId: string,
  anneeId: string,
  quantity: number
): Promise<ActionResponse<{ quantity: number }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (
      !Types.ObjectId.isValid(storeId) ||
      !Types.ObjectId.isValid(productId) ||
      !Types.ObjectId.isValid(anneeId)
    ) {
      return { success: false, message: "Boutique, produit ou exercice invalide." };
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      return { success: false, message: "La quantite doit etre un entier positif ou nul." };
    }

    const tenantOid = new Types.ObjectId(tenantId);
    const storeOid = new Types.ObjectId(storeId);
    const productOid = new Types.ObjectId(productId);
    const anneeOid = new Types.ObjectId(anneeId);
    const [store, product, annee] = await Promise.all([
      Store.findOne({ _id: storeOid, tenantId: tenantOid }).select("_id").lean(),
      Product.findOne({ _id: productOid, tenantId: tenantOid }).select("_id").lean(),
      Annee.findOne({
        _id: anneeOid,
        tenantId: tenantOid,
        status: { $in: ["ACTIVE", null] },
      })
        .select("_id")
        .lean(),
    ]);
    if (!store) return { success: false, message: "Boutique introuvable." };
    if (!product) return { success: false, message: "Produit introuvable." };
    if (!annee) return { success: false, message: "Seul un exercice actif peut etre modifie." };

    const result = await Stock.updateOne(
      {
        shopId: storeOid,
        anneeId: anneeOid,
        "stocks.product": productOid,
      },
      { $set: { "stocks.$.qte": quantity } }
    );
    if (result.matchedCount !== 1) {
      return { success: false, message: "Stock du produit introuvable." };
    }

    revalidatePath("/stores");
    return {
      success: true,
      message: "Quantite du stock mise a jour.",
      data: { quantity },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur mise a jour du stock." };
  }
}

/* ───── Récupération des produits disponibles du tenant ───── */

export async function getTenantProductsForSelect(): Promise<
  ActionResponse<Array<{ id: string; designation: string; code: string }>>
> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const products = await Product.find({
      tenantId: new Types.ObjectId(tenantId),
      status: "ACTIVE",
    })
      .select("_id designation code")
      .sort({ designation: 1 })
      .lean();

    return {
      success: true,
      message: "Produits recuperes.",
      data: products.map((p) => ({
        id: p._id.toString(),
        designation: p.designation,
        code: p.code,
      })),
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur produits." };
  }
}

/* ───── Récupération des exercices du tenant ───── */

export async function getTenantAnneesForSelect(): Promise<
  ActionResponse<Array<{ id: string; label: string }>>
> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const annees = await Annee.find({
      tenantId: new Types.ObjectId(tenantId),
      status: { $in: ["ACTIVE", null] },
    })
      .select("_id debut fin")
      .sort({ debut: -1 })
      .lean();

    return {
      success: true,
      message: "Exercices recuperes.",
      data: annees.map((a) => ({
        id: a._id.toString(),
        label: `${a.debut.getFullYear()} - ${a.fin.getFullYear()}`,
      })),
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur exercices." };
  }
}
