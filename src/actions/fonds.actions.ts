"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Fonds from "@/lib/models/Fonds";
import Store from "@/lib/models/Store";
import Annee from "@/lib/models/Annee";
import type { FondsType, FondsStatus } from "@/lib/models/Fonds";

export type ActionResponse<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string> };

export interface FondsListItem {
  id: string;
  libelle: string;
  montant: number;
  currency: string;
  type: FondsType;
  reference: string;
  dateOperation: string;
  status: FondsStatus;
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

export async function getFonds(
  anneeId: string
): Promise<ActionResponse<FondsListItem[]>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(anneeId)) {
      return { success: false, message: "Exercice invalide." };
    }

    const items = await Fonds.find({
      tenantId: new Types.ObjectId(tenantId),
      anneeId: new Types.ObjectId(anneeId),
    })
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      message: "Liste recuperee.",
      data: items.map((f) => ({
        id: f._id.toString(),
        libelle: f.libelle,
        montant: f.montant,
        currency: f.currency,
        type: f.type,
        reference: f.reference,
        dateOperation: f.dateOperation.toISOString(),
        status: f.status,
        description: f.description ?? "",
        shopId: f.shopId.toString(),
        anneeId: f.anneeId.toString(),
        createdAt: f.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur liste fonds." };
  }
}

/* ───── Création ───── */

export async function createFonds(data: {
  shopId: string;
  anneeId: string;
  libelle: string;
  montant: number;
  currency?: string;
  type: FondsType;
  dateOperation: string;
  description?: string;
}): Promise<ActionResponse<{ id: string; reference: string }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const scope = await resolveScope(tenantId, data.shopId, data.anneeId);
    if (!scope.success) return scope;

    const errors: Record<string, string> = {};
    if (!data.libelle?.trim()) errors.libelle = "Libelle requis.";
    if (!Number.isFinite(data.montant) || data.montant <= 0) errors.montant = "Montant invalide.";
    if (!["APPORT", "RETRAIT"].includes(data.type)) errors.type = "Type invalide.";
    if (!data.dateOperation || isNaN(new Date(data.dateOperation).getTime()))
      errors.dateOperation = "Date d'operation invalide.";

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Champs invalides.", errors };
    }

    /* Pas de quota pour les fonds propres */

    const reference = ref("FND");

    const fonds = await Fonds.create({
      tenantId: new Types.ObjectId(tenantId),
      shopId: scope.data.storeOid,
      anneeId: scope.data.anneeOid,
      libelle: data.libelle.trim(),
      montant: data.montant,
      currency: data.currency?.toUpperCase() ?? "CDF",
      type: data.type,
      reference,
      dateOperation: new Date(data.dateOperation),
      status: "VALIDE",
      description: data.description?.trim() ?? "",
    });

    revalidatePath("/fonds");
    return {
      success: true,
      message: "Fonds cree.",
      data: { id: fonds._id.toString(), reference: fonds.reference },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur creation fonds." };
  }
}

/* ───── Modification ───── */

export async function updateFonds(
  id: string,
  data: {
    libelle?: string;
    montant?: number;
    currency?: string;
    type?: FondsType;
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

    const fonds = await Fonds.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    }).lean();
    if (!fonds) return { success: false, message: "Fonds introuvable." };
    if (fonds.status === "ANNULE") {
      return { success: false, message: "Impossible de modifier un fonds annule." };
    }

    const update: Record<string, unknown> = {};
    if (data.libelle) update.libelle = data.libelle.trim();
    if (Number.isFinite(data.montant) && data.montant! > 0) update.montant = data.montant;
    if (data.currency) update.currency = data.currency.toUpperCase();
    if (data.type) update.type = data.type;
    if (data.dateOperation && !isNaN(new Date(data.dateOperation).getTime()))
      update.dateOperation = new Date(data.dateOperation);
    if (data.description !== undefined) update.description = data.description.trim();

    await Fonds.updateOne({ _id: id }, { $set: update });

    revalidatePath("/fonds");
    return { success: true, message: "Fonds mis a jour.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur modification fonds." };
  }
}

/* ───── Suppression ───── */

export async function deleteFonds(id: string): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const result = await Fonds.deleteOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });

    if (result.deletedCount !== 1) {
      return { success: false, message: "Fonds introuvable." };
    }

    revalidatePath("/fonds");
    return { success: true, message: "Fonds supprime.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur suppression fonds." };
  }
}
