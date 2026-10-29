"use server";

import { Types } from "mongoose";

import { requireTenantSession } from "@/lib/auth/require-tenant";
import connectToDb from "@/lib/utils/db";
import Commande from "@/lib/models/Commande";
import Depense from "@/lib/models/Depense";
import Liquidite from "@/lib/models/Liquidite";
import Creance from "@/lib/models/Creance";
import Fonds from "@/lib/models/Fonds";
import Dette from "@/lib/models/Dette";

export type ActionResponse<T = undefined> =
  | { success: true; message: string; data: T }
  | { success: false; message: string };

/* ───── Journal unifié ───── */

export type JournalOperationType =
  | "COMMANDE"
  | "DEPENSE"
  | "LIQUIDITE"
  | "CREANCE"
  | "FONDS"
  | "DETTE";

export interface JournalEntry {
  type: JournalOperationType;
  date: string;
  libelle: string;
  montant: number;
  currency: string;
  reference: string;
  shopId: string;
}

export async function getJournalOperations(
  anneeId: string
): Promise<ActionResponse<JournalEntry[]>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(anneeId)) {
      return { success: false, message: "Exercice invalide." };
    }

    const tenantOid = new Types.ObjectId(tenantId);
    const anneeOid = new Types.ObjectId(anneeId);

    const [commandes, depenses, liquidites, creances, fonds, dettes] =
      await Promise.all([
        Commande.find({
          tenantId: tenantOid,
          anneeId: anneeOid,
          status: { $nin: ["CANCELLED", "DRAFT"] },
        })
          .select("totalAmount currency reference shopId createdAt")
          .lean(),

        Depense.find({
          tenantId: tenantOid,
          anneeId: anneeOid,
          status: { $nin: ["REJECTED", "CANCELLED"] },
        })
          .select("totalAmount currency reference shopId createdAt")
          .lean(),

        Liquidite.find({
          tenantId: tenantOid,
          anneeId: anneeOid,
          status: "VALIDE",
        })
          .select("montant currency libelle reference shopId dateOperation")
          .lean(),

        Creance.find({
          tenantId: tenantOid,
          anneeId: anneeOid,
        })
          .select("montant currency reference shopId dateCreation")
          .lean(),

        Fonds.find({
          tenantId: tenantOid,
          anneeId: anneeOid,
          status: "VALIDE",
        })
          .select("montant currency libelle reference shopId dateOperation")
          .lean(),

        Dette.find({
          tenantId: tenantOid,
          anneeId: anneeOid,
        })
          .select("montant currency designation reference shopId dateCreation")
          .lean(),
      ]);

    const entries: JournalEntry[] = [
      ...commandes.map((c) => ({
        type: "COMMANDE" as const,
        date: c.createdAt.toISOString(),
        libelle: `Vente ${c.reference}`,
        montant: c.totalAmount,
        currency: c.currency,
        reference: c.reference,
        shopId: c.shopId.toString(),
      })),
      ...depenses.map((d) => ({
        type: "DEPENSE" as const,
        date: d.createdAt.toISOString(),
        libelle: `Depense ${d.reference}`,
        montant: d.totalAmount,
        currency: d.currency,
        reference: d.reference,
        shopId: d.shopId.toString(),
      })),
      ...liquidites.map((l) => ({
        type: "LIQUIDITE" as const,
        date: l.dateOperation.toISOString(),
        libelle: l.libelle,
        montant: l.montant,
        currency: l.currency,
        reference: l.reference,
        shopId: l.shopId.toString(),
      })),
      ...creances.map((c) => ({
        type: "CREANCE" as const,
        date: c.dateCreation.toISOString(),
        libelle: `Creance ${c.reference}`,
        montant: c.montant,
        currency: c.currency,
        reference: c.reference,
        shopId: c.shopId.toString(),
      })),
      ...fonds.map((f) => ({
        type: "FONDS" as const,
        date: f.dateOperation.toISOString(),
        libelle: f.libelle,
        montant: f.montant,
        currency: f.currency,
        reference: f.reference,
        shopId: f.shopId.toString(),
      })),
      ...dettes.map((d) => ({
        type: "DETTE" as const,
        date: d.dateCreation.toISOString(),
        libelle: d.designation,
        montant: d.montant,
        currency: d.currency,
        reference: d.reference,
        shopId: d.shopId.toString(),
      })),
    ];

    /* Tri chronologique */
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      success: true,
      message: "Journal charge.",
      data: entries,
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur journal." };
  }
}

/* ───── Données de clôture ───── */

export interface ClosureStats {
  commandesEnAttente: number;
  depensesNonValidees: number;
  creancesEnCours: number;
  dettesEnCours: number;
}

export async function getClosureData(
  anneeId: string
): Promise<ActionResponse<ClosureStats>> {
  try {
    const { tenantId } = await requireTenantSession();
    await connectToDb();

    if (!Types.ObjectId.isValid(anneeId)) {
      return { success: false, message: "Exercice invalide." };
    }

    const tenantOid = new Types.ObjectId(tenantId);
    const anneeOid = new Types.ObjectId(anneeId);

    const [
      commandesEnAttente,
      depensesNonValidees,
      creancesEnCours,
      dettesEnCours,
    ] = await Promise.all([
      Commande.countDocuments({
        tenantId: tenantOid,
        anneeId: anneeOid,
        status: "PENDING",
      }),
      Depense.countDocuments({
        tenantId: tenantOid,
        anneeId: anneeOid,
        status: "PENDING",
      }),
      Creance.countDocuments({
        tenantId: tenantOid,
        anneeId: anneeOid,
        status: "EN_COURS",
      }),
      Dette.countDocuments({
        tenantId: tenantOid,
        anneeId: anneeOid,
        status: "EN_COURS",
      }),
    ]);

    return {
      success: true,
      message: "Donnees de cloture chargees.",
      data: {
        commandesEnAttente,
        depensesNonValidees,
        creancesEnCours,
        dettesEnCours,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Erreur donnees cloture." };
  }
}
