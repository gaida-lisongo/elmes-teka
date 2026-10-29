"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Creance from "@/lib/models/Creance";
import Store from "@/lib/models/Store";
import Annee from "@/lib/models/Annee";
import Customer from "@/lib/models/Customer";
import { checkAndIncrementQuota } from "@/lib/utils/transaction-quota";
import type { CreanceStatus } from "@/lib/models/Creance";

export type ActionResponse<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string> };

export interface CreanceListItem {
  id: string;
  clientId: string;
  clientNom: string;
  commandeId: string | null;
  montant: number;
  currency: string;
  dateEcheance: string;
  dateCreation: string;
  status: CreanceStatus;
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

export async function getCreances(
  anneeId: string,
  shopId?: string
): Promise<ActionResponse<CreanceListItem[]>> {
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

    const items = await Creance.find(match)
      .populate("clientId", "name")
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      message: "Liste recuperee.",
      data: items.map((c) => ({
        id: c._id.toString(),
        clientId: c.clientId.toString(),
        clientNom: (c.clientId as any)?.name ?? "",
        commandeId: c.commandeId?.toString() ?? null,
        montant: c.montant,
        currency: c.currency,
        dateEcheance: c.dateEcheance.toISOString(),
        dateCreation: c.dateCreation.toISOString(),
        status: c.status,
        reference: c.reference,
        description: c.description ?? "",
        shopId: c.shopId.toString(),
        anneeId: c.anneeId.toString(),
        createdAt: c.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur liste creances." };
  }
}

/* ───── Création ───── */

export async function createCreance(data: {
  shopId: string;
  anneeId: string;
  clientId: string;
  commandeId?: string;
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
    if (!Types.ObjectId.isValid(data.clientId)) errors.clientId = "Client invalide.";
    if (!Number.isFinite(data.montant) || data.montant <= 0) errors.montant = "Montant invalide.";
    if (!data.dateEcheance || isNaN(new Date(data.dateEcheance).getTime()))
      errors.dateEcheance = "Date d'echeance invalide.";

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Champs invalides.", errors };
    }

    /* Vérifier que le client appartient au tenant */
    const customer = await Customer.findOne({
      _id: new Types.ObjectId(data.clientId),
      tenantId: new Types.ObjectId(tenantId),
    })
      .select("_id")
      .lean();
    if (!customer) return { success: false, message: "Client introuvable." };

    /* Vérification et incrément du quota */
    await checkAndIncrementQuota(data.shopId, data.anneeId);

    const reference = ref("CRE");

    const creance = await Creance.create({
      tenantId: new Types.ObjectId(tenantId),
      shopId: scope.data.storeOid,
      anneeId: scope.data.anneeOid,
      clientId: new Types.ObjectId(data.clientId),
      commandeId: data.commandeId && Types.ObjectId.isValid(data.commandeId)
        ? new Types.ObjectId(data.commandeId)
        : null,
      montant: data.montant,
      currency: data.currency?.toUpperCase() ?? "CDF",
      dateEcheance: new Date(data.dateEcheance),
      dateCreation: new Date(),
      status: "EN_COURS",
      reference,
      description: data.description?.trim() ?? "",
    });

    revalidatePath("/creances");
    return {
      success: true,
      message: "Creance creee.",
      data: { id: creance._id.toString(), reference: creance.reference },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur creation creance." };
  }
}

/* ───── Modification ───── */

export async function updateCreance(
  id: string,
  data: {
    montant?: number;
    currency?: string;
    dateEcheance?: string;
    status?: CreanceStatus;
    description?: string;
  }
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const creance = await Creance.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    }).lean();
    if (!creance) return { success: false, message: "Creance introuvable." };

    const update: Record<string, unknown> = {};
    if (Number.isFinite(data.montant) && data.montant! > 0) update.montant = data.montant;
    if (data.currency) update.currency = data.currency.toUpperCase();
    if (data.dateEcheance && !isNaN(new Date(data.dateEcheance).getTime()))
      update.dateEcheance = new Date(data.dateEcheance);
    if (data.status) update.status = data.status;
    if (data.description !== undefined) update.description = data.description.trim();

    await Creance.updateOne({ _id: id }, { $set: update });

    revalidatePath("/creances");
    return { success: true, message: "Creance mise a jour.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur modification creance." };
  }
}

/* ───── Marquer recouvrée ───── */

export async function marquerRecouvree(id: string): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const result = await Creance.updateOne(
      {
        _id: id,
        tenantId: new Types.ObjectId(tenantId),
        status: "EN_COURS",
      },
      { $set: { status: "RECOUVREE" } }
    );

    if (result.modifiedCount !== 1) {
      return { success: false, message: "Creance introuvable ou non en cours." };
    }

    revalidatePath("/creances");
    return { success: true, message: "Creance marquee comme recouvree.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur recouvrement." };
  }
}

/* ───── Suppression ───── */

export async function deleteCreance(id: string): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const result = await Creance.deleteOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });

    if (result.deletedCount !== 1) {
      return { success: false, message: "Creance introuvable." };
    }

    revalidatePath("/creances");
    return { success: true, message: "Creance supprimee.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur suppression creance." };
  }
}
