"use server";
import { Types } from "mongoose";
import { requireSalerSession } from "@/lib/auth/require-saler";
import Commande from "@/lib/models/Commande";
import { Tenant, User } from "@/lib/models/User";
import Store from "@/lib/models/Store";
import Annee from "@/lib/models/Annee";
import type { ActionResult } from "@/lib/utils/action-result";

export interface InvoiceLine {
  designation: string;
  code: string;
  qte: number;
  unitPrice: number;
  currency: string;
  reduction: number;
  total: number;
}

export interface InvoiceData {
  reference: string;
  tenantName: string;
  storeName: string;
  anneeSlug: string;
  salerPseudo: string;
  salerMatricule: string;
  customerName: string;
  customerPhone: string;
  lines: InvoiceLine[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  taux: number;
  createdAt: string;
}

export async function getInvoiceData(
  commandId: string,
): Promise<ActionResult<InvoiceData>> {
  try {
    const context = await requireSalerSession();
    if (!Types.ObjectId.isValid(commandId))
      return { success: false, message: "Facture invalide." };

    const sale = await Commande.findOne({
      _id: commandId,
      tenantId: context.tenantId,
      shopId: context.storeId,
    })
      .populate("clientId", "name phone email matricule")
      .lean();
    if (!sale) return { success: false, message: "Vente introuvable." };

    const [tenant, store, annee, saler] = await Promise.all([
      Tenant.findById(context.tenantId)
        .select("designation logo telephone email")
        .lean(),
      Store.findById(context.storeId)
        .select("designation reference coordonnes")
        .lean(),
      Annee.findById(sale.anneeId).select("slug").lean(),
      User.findById(context.userId).select("pseudo matricule").lean(),
    ]);

    const taux = Number(process.env.TAUX) || 0;

    return {
      success: true,
      message: "Donnees facture.",
      data: {
        reference: sale.reference,
        tenantName: tenant?.designation ?? "ELMES-TEKA",
        storeName: store?.designation ?? "",
        anneeSlug: annee?.slug ?? "",
        salerPseudo: saler?.pseudo ?? "",
        salerMatricule: saler?.matricule ?? "",
        customerName: (sale.clientId as any)?.name ?? "",
        customerPhone: (sale.clientId as any)?.phone ?? "",
        lines: sale.commandes.map((l) => ({
          designation: l.designation,
          code: l.code ?? "",
          qte: l.qte,
          unitPrice: l.unitPrice,
          currency: l.currency,
          reduction: l.reduction,
          total: l.total,
        })),
        subtotal: sale.subtotal,
        discountAmount: sale.discountAmount,
        totalAmount: sale.totalAmount,
        currency: sale.currency,
        taux,
        createdAt: sale.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Erreur generation facture.",
    };
  }
}
