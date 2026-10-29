"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Liquidite from "@/lib/models/Liquidite";
import Store from "@/lib/models/Store";
import Annee from "@/lib/models/Annee";
import { checkAndIncrementQuota } from "@/lib/utils/transaction-quota";
import type { LiquiditeType, LiquiditeStatus } from "@/lib/models/Liquidite";

export type ActionResponse<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string> };

export interface LiquiditeListItem {
  id: string;
  libelle: string;
  montant: number;
  currency: string;
  type: LiquiditeType;
  reference: string;
  dateOperation: string;
  status: LiquiditeStatus;
  description: string;
  shopId: string;
  anneeId: string;
  createdAt: string;
}

const ref = (prefix: string) =>
  `${prefix}-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;

/* ───── Helpers ───── */

async function resolveScope(
  tenantId: string,
  shopId: string,
  anneeId: string
): Promise<ActionResponse<{ storeOid: Types.ObjectId; anneeOid: Types.ObjectId }>> {
  if (!Types.ObjectId.isValid(shopId) || !Types.ObjectId.isValid(anneeId)) {
    return { success: false, message: "Boutique ou exercice invalide." };
  }
  const tenantOid = new Types.ObjectId(tenantId);
  const storeOid = new Types.ObjectId(shopId);
  const anneeOid = new Types.ObjectId(anneeId);
  const [store, annee] = await Promise.all([
    Store.findOne({ _id: storeOid, tenantId: tenantOid }).select("_id").lean(),
    Annee.findOne({ _id: anneeOid, tenantId: tenantOid }).select("_id").lean(),
  ]);
  if (!store) return { success: false, message: "Boutique introuvable." };
  if (!annee) return { success: false, message: "Exercice introuvable." };
  return { success: true, message: "OK", data: { storeOid, anneeOid } };
}

/* ───── Liste ───── */

export async function getLiquidites(
  anneeId: string,
  shopId?: string
): Promise<ActionResponse<LiquiditeListItem[]>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(anneeId)) {
      return { success: false, message: "Exercice invalide." };
    }

    const match: Record<string, unknown> = {
      tenantId: new Types.ObjectId(tenantId),
      anneeId: new Types.ObjectId(anneeId),
    };
    if (shopId && Types.ObjectId.isValid(shopId)) {
      match.shopId = new Types.ObjectId(shopId);
    }

    const items = await Liquidite.find(match).sort({ createdAt: -1 }).lean();

    return {
      success: true,
      message: "Liste recuperee.",
      data: items.map((l) => ({
        id: l._id.toString(),
        libelle: l.libelle,
        montant: l.montant,
        currency: l.currency,
        type: l.type,
        reference: l.reference,
        dateOperation: l.dateOperation.toISOString(),
        status: l.status,
        description: l.description ?? "",
        shopId: l.shopId.toString(),
        anneeId: l.anneeId.toString(),
        createdAt: l.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur liste liquidites." };
  }
}

/* ───── Création ───── */

export async function createLiquidite(data: {
  shopId: string;
  anneeId: string;
  libelle: string;
  montant: number;
  currency?: string;
  type: LiquiditeType;
  dateOperation: string;
  description?: string;
}): Promise<ActionResponse<{ id: string; reference: string }>> {
  try {
    const { tenantId, userId } = await requireTenantSession();
    await connectToDb();

    const scope = await resolveScope(tenantId, data.shopId, data.anneeId);
    if (!scope.success) return scope;

    const errors: Record<string, string> = {};
    if (!data.libelle?.trim()) errors.libelle = "Libelle requis.";
    if (!Number.isFinite(data.montant) || data.montant <= 0) errors.montant = "Montant invalide.";
    if (!["ENTREE", "SORTIE"].includes(data.type)) errors.type = "Type invalide.";
    if (!data.dateOperation || isNaN(new Date(data.dateOperation).getTime()))
      errors.dateOperation = "Date d'operation invalide.";

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Champs invalides.", errors };
    }

    /* Vérification et incrément du quota */
    await checkAndIncrementQuota(data.shopId, data.anneeId);

    const reference = ref("LIQ");

    const liquidite = await Liquidite.create({
      tenantId: new Types.ObjectId(tenantId),
      shopId: scope.data.storeOid,
      anneeId: scope.data.anneeOid,
      agentId: new Types.ObjectId(userId),
      libelle: data.libelle.trim(),
      montant: data.montant,
      currency: data.currency?.toUpperCase() ?? "CDF",
      type: data.type,
      reference,
      dateOperation: new Date(data.dateOperation),
      status: "VALIDE",
      description: data.description?.trim() ?? "",
    });

    revalidatePath("/liquidites");
    return {
      success: true,
      message: "Liquidite creee.",
      data: { id: liquidite._id.toString(), reference: liquidite.reference },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur creation liquidite." };
  }
}

/* ───── Modification ───── */

export async function updateLiquidite(
  id: string,
  data: {
    libelle?: string;
    montant?: number;
    currency?: string;
    type?: LiquiditeType;
    dateOperation?: string;
    description?: string;
  }
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const liquidite = await Liquidite.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    }).lean();
    if (!liquidite) return { success: false, message: "Liquidite introuvable." };
    if (liquidite.status === "ANNULE") {
      return { success: false, message: "Impossible de modifier une liquidite annulee." };
    }

    const update: Record<string, unknown> = {};
    if (data.libelle) update.libelle = data.libelle.trim();
    if (Number.isFinite(data.montant) && data.montant! > 0) update.montant = data.montant;
    if (data.currency) update.currency = data.currency.toUpperCase();
    if (data.type) update.type = data.type;
    if (data.dateOperation && !isNaN(new Date(data.dateOperation).getTime()))
      update.dateOperation = new Date(data.dateOperation);
    if (data.description !== undefined) update.description = data.description.trim();

    await Liquidite.updateOne({ _id: id }, { $set: update });

    revalidatePath("/liquidites");
    return { success: true, message: "Liquidite mise a jour.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur modification liquidite." };
  }
}

/* ───── Suppression ───── */

export async function deleteLiquidite(id: string): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const result = await Liquidite.deleteOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });

    if (result.deletedCount !== 1) {
      return { success: false, message: "Liquidite introuvable." };
    }

    revalidatePath("/liquidites");
    return { success: true, message: "Liquidite supprimee.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur suppression liquidite." };
  }
}
