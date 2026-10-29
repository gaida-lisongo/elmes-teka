"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Immobilisation from "@/lib/models/Immobilisation";
import Store from "@/lib/models/Store";
import Annee from "@/lib/models/Annee";
import type {
  ImmobilisationCategorie,
  ImmobilisationStatus,
} from "@/lib/models/Immobilisation";

export type ActionResponse<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors?: Record<string, string> };

export interface ImmobilisationListItem {
  id: string;
  designation: string;
  categorie: ImmobilisationCategorie;
  valeurAchat: number;
  valeurNette: number;
  dureeVieAns: number;
  dateAcquisition: string;
  reference: string;
  status: ImmobilisationStatus;
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

export async function getImmobilisations(
  anneeId: string,
  shopId?: string
): Promise<ActionResponse<ImmobilisationListItem[]>> {
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

    const items = await Immobilisation.find(match)
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();

    return {
      success: true,
      message: "Liste recuperee.",
      data: items.map((immo) => {
        const anneeEcoulees =
          (now.getTime() - new Date(immo.dateAcquisition).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25);
        const amortissement =
          (immo.valeurAchat / immo.dureeVieAns) * anneeEcoulees;
        const valeurNette = Math.max(0, immo.valeurAchat - amortissement);

        return {
          id: immo._id.toString(),
          designation: immo.designation,
          categorie: immo.categorie,
          valeurAchat: immo.valeurAchat,
          valeurNette: Math.round(valeurNette * 100) / 100,
          dureeVieAns: immo.dureeVieAns,
          dateAcquisition: immo.dateAcquisition.toISOString(),
          reference: immo.reference,
          status: immo.status,
          description: immo.description ?? "",
          shopId: immo.shopId.toString(),
          anneeId: immo.anneeId.toString(),
          createdAt: immo.createdAt.toISOString(),
        };
      }),
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur liste immobilisations." };
  }
}

/* ───── Création ───── */

export async function createImmobilisation(data: {
  shopId: string;
  anneeId: string;
  designation: string;
  categorie: ImmobilisationCategorie;
  valeurAchat: number;
  dureeVieAns: number;
  dateAcquisition: string;
  description?: string;
}): Promise<ActionResponse<{ id: string; reference: string }>> {
  try {
    const { tenantId, userId } = await requireTenantSession();
    await connectToDb();

    const scope = await resolveScope(tenantId, data.shopId, data.anneeId);
    if (!scope.success) return scope;

    const errors: Record<string, string> = {};
    if (!data.designation?.trim()) errors.designation = "Designation requise.";
    if (!data.categorie) errors.categorie = "Categorie requise.";
    if (!Number.isFinite(data.valeurAchat) || data.valeurAchat < 0)
      errors.valeurAchat = "Valeur d'achat invalide.";
    if (!Number.isInteger(data.dureeVieAns) || data.dureeVieAns < 1)
      errors.dureeVieAns = "Duree de vie invalide.";
    if (!data.dateAcquisition || isNaN(new Date(data.dateAcquisition).getTime()))
      errors.dateAcquisition = "Date d'acquisition invalide.";

    if (Object.keys(errors).length > 0) {
      return { success: false, message: "Champs invalides.", errors };
    }

    const reference = ref("IMM");

    const immo = await Immobilisation.create({
      tenantId: new Types.ObjectId(tenantId),
      shopId: scope.data.storeOid,
      anneeId: scope.data.anneeOid,
      agentId: new Types.ObjectId(userId),
      designation: data.designation.trim(),
      categorie: data.categorie,
      valeurAchat: data.valeurAchat,
      dureeVieAns: data.dureeVieAns,
      dateAcquisition: new Date(data.dateAcquisition),
      reference,
      status: "ACTIF",
      description: data.description?.trim() ?? "",
    });

    revalidatePath("/immobilisations");
    return {
      success: true,
      message: "Immobilisation creee.",
      data: { id: immo._id.toString(), reference: immo.reference },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur creation immobilisation." };
  }
}

/* ───── Modification ───── */

export async function updateImmobilisation(
  id: string,
  data: {
    designation?: string;
    categorie?: ImmobilisationCategorie;
    valeurAchat?: number;
    dureeVieAns?: number;
    dateAcquisition?: string;
    status?: ImmobilisationStatus;
    description?: string;
  }
): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const immo = await Immobilisation.findOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    }).lean();
    if (!immo) return { success: false, message: "Immobilisation introuvable." };

    const update: Record<string, unknown> = {};
    if (data.designation) update.designation = data.designation.trim();
    if (data.categorie) update.categorie = data.categorie;
    if (Number.isFinite(data.valeurAchat) && data.valeurAchat! >= 0)
      update.valeurAchat = data.valeurAchat;
    if (Number.isInteger(data.dureeVieAns) && data.dureeVieAns! >= 1)
      update.dureeVieAns = data.dureeVieAns;
    if (data.dateAcquisition && !isNaN(new Date(data.dateAcquisition).getTime()))
      update.dateAcquisition = new Date(data.dateAcquisition);
    if (data.status) update.status = data.status;
    if (data.description !== undefined) update.description = data.description.trim();

    await Immobilisation.updateOne({ _id: id }, { $set: update });

    revalidatePath("/immobilisations");
    return { success: true, message: "Immobilisation mise a jour.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur modification immobilisation." };
  }
}

/* ───── Suppression ───── */

export async function deleteImmobilisation(id: string): Promise<ActionResponse<null>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(id)) {
      return { success: false, message: "Identifiant invalide." };
    }

    const result = await Immobilisation.deleteOne({
      _id: id,
      tenantId: new Types.ObjectId(tenantId),
    });

    if (result.deletedCount !== 1) {
      return { success: false, message: "Immobilisation introuvable." };
    }

    revalidatePath("/immobilisations");
    return { success: true, message: "Immobilisation supprimee.", data: null };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur suppression immobilisation." };
  }
}
