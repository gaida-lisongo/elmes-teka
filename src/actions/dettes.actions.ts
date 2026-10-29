"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Dette from "@/lib/models/Dette";
import Store from "@/lib/models/Store";
import Annee from "@/lib/models/Annee";
import { checkAndIncrementQuota } from "@/lib/utils/transaction-quota";
import type { DetteStatus } from "@/lib/models/Dette";

export type ActionResponse<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string> };

export interface DetteListItem {
  id: string;
  fournisseurNom: string;
  fournisseurTel: string;
  designation: string;
  montant: number;
  currency: string;
  dateEcheance: string;
  dateCreation: string;
  status: DetteStatus;
  reference: string;
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

export async function getDettes(
  anneeId: string,
  shopId?: string
): Promise<ActionResponse<DetteListItem[]>> {
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

    const items = await Dette.find(match).sort({ createdAt: -1 }).lean();

    return {
      success: true,
      message: "Liste recuperee.",
      data: items.map((d) => ({
        id: d._id.toString(),
        fournisseurNom: d.fournisseurNom,
        fournisseurTel: d.fournisseurTel ?? "",
        designation: d.designation,
        montant: d.montant,
        currency: d.currency,
        dateEcheance: d.dateEcheance.toISOString(),
        dateCreation: d.dateCreation.toISOString(),
        status: d.status,
        reference: d.reference,
        description: d.description ?? "",
        shopId: d.shopId.toString(),
        anneeId: d.anneeId.toString(),
        createdAt: d.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur liste dettes." };
  }
}

/* ───── Création ───── */

export async function createDette(data: {
  shopId: string;
  anneeId: string;
  fournisseurNom: string;
  fournisseurTel?: string;
  designation: string;
  montant: number;
  currency?: string;
  dateEcheance: string;
  description?: string;
}): Promise<ActionResponse<{ id: string; reference: string }>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    const scope = await resolveScope(tenantId, data.shopId, data.anneeId);
    if (!scope.success) return scope;

    const errors: Record<string, string> = {};
    if (!data.fournisseurNom?.trim()) errors.fournisseurNom = "Nom du fournisseur requis.";
    if (!data.designation?.trim()) errors.designation = "Designation requise.";
    if (!Number.isFinite(data.montant) || data.montant <= 0) errors.montant = "Montant invalide.";
    if (!data.dateEcheance || isNaN(new Date(data.dateEcheance).getTime()))
      errors.dateEcheance = "Date d'echeance invalide.";

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Champs invalides.", errors };
    }

    /* Vérification et incrément du quota */
    await checkAndIncrementQuota(data.shopId, data.anneeId);

    const reference = ref("DET");

    const dette = await Dette.create({
      tenantId: new Types.ObjectId(tenantId),
      shopId: scope.data.storeOid,
      anneeId: scope.data.anneeOid,
      fournisseurNom: data.fournisseurNom.trim(),
      fournisseurTel: data.fournisseurTel?.trim() ?? "",
      designation: data.designation.trim(),
      montant: data.montant,
      currency: data.currency?.toUpperCase() ?? "CDF",
      dateEcheance: new Date(data.dateEcheance),
      dateCreation: new Date(),
      status: "EN_COURS",
      reference,
      description: data.description?.trim() ?? "",
    });

    revalidatePath("/dettes");
    return {
      success: true,
      message: "Dette creee.",
      data: { id: dette._id.toString(), reference: dette.reference },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur creation dette." };
  }
}

/* ───── Modification ───── */

export async function updateDette(
  id: string,
  data: {
    fournisseurNom?: string;
    fournisseurTel?: string;
    designation?: string;
    montant?: number;
    currency?: string;
    dateEcheance?: string;
    status?: DetteStatus;
    description?: string;
  }
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const dette = await Dette.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    }).lean();
    if (!dette) return { success: false, message: "Dette introuvable." };

    const update: Record<string, unknown> = {};
    if (data.fournisseurNom) update.fournisseurNom = data.fournisseurNom.trim();
    if (data.fournisseurTel !== undefined) update.fournisseurTel = data.fournisseurTel.trim();
    if (data.designation) update.designation = data.designation.trim();
    if (Number.isFinite(data.montant) && data.montant! > 0) update.montant = data.montant;
    if (data.currency) update.currency = data.currency.toUpperCase();
    if (data.dateEcheance && !isNaN(new Date(data.dateEcheance).getTime()))
      update.dateEcheance = new Date(data.dateEcheance);
    if (data.status) update.status = data.status;
    if (data.description !== undefined) update.description = data.description.trim();

    await Dette.updateOne({ _id: id }, { $set: update });

    revalidatePath("/dettes");
    return { success: true, message: "Dette mise a jour.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur modification dette." };
  }
}

/* ───── Marquer remboursée ───── */

export async function marquerRemboursee(id: string): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const result = await Dette.updateOne(
      {
        _id: id,
        tenantId: new Types.ObjectId(tenantId),
        status: "EN_COURS",
      },
      { $set: { status: "REMBOURSEE" } }
    );

    if (result.modifiedCount !== 1) {
      return { success: false, message: "Dette introuvable ou non en cours." };
    }

    revalidatePath("/dettes");
    return { success: true, message: "Dette marquee comme remboursee.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur remboursement." };
  }
}

/* ───── Suppression ───── */

export async function deleteDette(id: string): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const result = await Dette.deleteOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });

    if (result.deletedCount !== 1) {
      return { success: false, message: "Dette introuvable." };
    }

    revalidatePath("/dettes");
    return { success: true, message: "Dette supprimee.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur suppression dette." };
  }
}
